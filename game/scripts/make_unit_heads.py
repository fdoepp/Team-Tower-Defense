#!/usr/bin/env python3
"""Generate freigestellte unit head crops (chin → headwear) from full-body sprites.

Usage (from repo root):
  python3 game/scripts/make_unit_heads.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "icons" / "units"
DESTS = [
    ROOT / "public" / "icons" / "units" / "heads",
    ROOT.parent / "docs" / "mockups" / "icons" / "units-colored" / "heads",
]

HEAD_H = {
    ("fan", 1): 0.42,
    ("fan", 2): 0.42,
    ("fan", 3): 0.44,
    ("fan", 4): 0.44,
    ("fan", 5): 0.48,
    ("ultra", 1): 0.45,
    ("ultra", 2): 0.45,
    ("ultra", 3): 0.46,
    ("ultra", 4): 0.46,
    ("ultra", 5): 0.48,
    ("hooligan", 1): 0.40,
    ("hooligan", 2): 0.42,
    ("hooligan", 3): 0.42,
    ("hooligan", 4): 0.43,
    ("hooligan", 5): 0.44,
    ("ordner", 1): 0.42,
    ("ordner", 2): 0.42,
    ("ordner", 3): 0.44,
    ("ordner", 4): 0.45,
    ("ordner", 5): 0.46,
}
HALF_W = {"fan": 0.20, "ultra": 0.22, "hooligan": 0.20, "ordner": 0.20}
HALF_W_LV = {("fan", 5): 0.17, ("ultra", 5): 0.20, ("hooligan", 3): 0.18}
# Manual boxes for awkward poses (x0, y0, x1, y1)
MANUAL = {
    ("fan", 5): (102, 40, 156, 132),
}
OUT, PAD = 256, 0.10


def is_skin(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    r = rgb[:, :, 0].astype(np.int16)
    g = rgb[:, :, 1].astype(np.int16)
    b = rgb[:, :, 2].astype(np.int16)
    return (
        (alpha > 20)
        & (r > 120)
        & (g > 70)
        & (g < 200)
        & (b < 160)
        & (r > g - 10)
        & (r > b)
    )


def body_cx(alpha: np.ndarray, y0: int, y1: int) -> int:
    mid0 = y0 + int((y1 - y0) * 0.55)
    mid1 = y0 + int((y1 - y0) * 0.90)
    ys, xs = np.where(alpha[mid0:mid1] > 20)
    return int(np.median(xs)) if len(xs) else alpha.shape[1] // 2


def face_cx(a: np.ndarray, by0: int, by1: int, hint: int) -> int:
    ch = by1 - by0 + 1
    y0, y1 = by0 + int(ch * 0.02), by0 + int(ch * 0.40)
    x0, x1 = max(0, hint - int(ch * 0.30)), min(a.shape[1], hint + int(ch * 0.30))
    skin = is_skin(a[y0:y1, x0:x1, :3], a[y0:y1, x0:x1, 3])
    ys, xs = np.where(skin)
    return (x0 + int(np.median(xs))) if len(xs) >= 40 else hint


def head_top(alpha: np.ndarray, cx: int, y0: int, y1: int) -> int:
    for band in (12, 22, 40):
        x0, x1 = max(0, cx - band), min(alpha.shape[1], cx + band + 1)
        ys, xs = np.where(alpha[y0 : y1 + 1, x0:x1] > 20)
        if len(ys):
            return y0 + int(ys.min())
    return y0


def flood(mask: np.ndarray, sy: int, sx: int) -> np.ndarray:
    h, w = mask.shape
    if not (0 <= sy < h and 0 <= sx < w and mask[sy, sx]):
        ys, xs = np.where(mask)
        if len(ys) == 0:
            return np.zeros_like(mask)
        i = int(np.argmin((ys - sy) ** 2 + (xs - sx) ** 2))
        sy, sx = int(ys[i]), int(xs[i])
    out = np.zeros_like(mask)
    stack = [(sy, sx)]
    out[sy, sx] = True
    while stack:
        cy, cx = stack.pop()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not out[ny, nx]:
                out[ny, nx] = True
                stack.append((ny, nx))
    return out


def fit_square(crop: np.ndarray) -> Image.Image:
    aa = crop[:, :, 3]
    ys, xs = np.where(aa > 14)
    crop = crop[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
    chh, cww = crop.shape[:2]
    pad = int(OUT * PAD)
    avail = OUT - 2 * pad
    scale = min(avail / cww, avail / chh)
    nw = max(1, int(round(cww * scale)))
    nh = max(1, int(round(chh * scale)))
    pil = Image.fromarray(crop, "RGBA").resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (OUT, OUT), (0, 0, 0, 0))
    canvas.paste(pil, ((OUT - nw) // 2, (OUT - nh) // 2), pil)
    return canvas


def extract(src: Path, kind: str, lv: int) -> Image.Image:
    im = Image.open(src).convert("RGBA")
    a = np.asarray(im).copy()
    alpha = a[:, :, 3]
    ys, xs = np.where(alpha > 16)
    by0, by1 = int(ys.min()), int(ys.max())
    ch = by1 - by0 + 1

    if (kind, lv) in MANUAL:
        x0, y0, x1, y1 = MANUAL[(kind, lv)]
        crop = a[y0 : y1 + 1, x0 : x1 + 1].copy()
        seed_x_frac = 0.58
    else:
        cx = face_cx(a, by0, by1, body_cx(alpha, by0, by1))
        ht = head_top(alpha, cx, by0, by1)
        head_h = max(48, int(ch * HEAD_H[(kind, lv)]))
        hy0, hy1 = max(0, ht - 2), min(a.shape[0] - 1, ht + head_h)
        half = max(32, int(ch * HALF_W_LV.get((kind, lv), HALF_W[kind])))
        hx0, hx1 = max(0, cx - half), min(a.shape[1] - 1, cx + half)
        crop = a[hy0 : hy1 + 1, hx0 : hx1 + 1].copy()
        seed_x_frac = 0.5

    H, W = crop.shape[:2]
    mask = crop[:, :, 3] > 20
    skin = is_skin(crop[:, :, :3], crop[:, :, 3])
    if skin.any():
        sys, sxs = np.where(skin)
        sy = int(np.percentile(sys, 30))
        near = (sys >= sy - 6) & (sys <= sy + 14)
        sx = int(np.median(sxs[near])) if near.any() else int(np.median(sxs))
    else:
        sy, sx = min(H - 1, int(H * 0.33)), min(W - 1, max(0, int(W * seed_x_frac)))
    keep = flood(mask, sy, sx)
    if keep.sum() < mask.sum() * 0.2:
        keep = mask
    crop[~keep, 3] = 0

    mid = int(H * 0.40)
    mid_xs = np.where(crop[mid, :, 3] > 20)[0]
    fcx = (mid_xs.min() + mid_xs.max()) / 2 if len(mid_xs) else W / 2
    frx = ((mid_xs.max() - mid_xs.min()) / 2 + 2) if len(mid_xs) else W * 0.4
    for y in range(int(H * 0.80), H):
        t = (y - int(H * 0.80)) / max(1, H - 1 - int(H * 0.80))
        halfw = frx * (1.02 - 0.55 * t)
        dist = np.abs(np.arange(W) - fcx)
        fade = np.ones(W, np.float32)
        over = dist - halfw
        m = over > 0
        fade[m] = np.clip(1 - over[m] / 2.0, 0, 1)
        crop[y, :, 3] = (crop[y, :, 3].astype(np.float32) * fade).astype(np.uint8)

    return fit_square(crop)


def main() -> None:
    kinds = ["fan", "ultra", "hooligan", "ordner"]
    colors = ["blue", "red", "grey"]
    for dest in DESTS:
        dest.mkdir(parents=True, exist_ok=True)
    n = 0
    for kind in kinds:
        for color in colors:
            for lv in range(1, 6):
                src = SRC / f"{kind}-{color}-{lv}.png"
                canvas = extract(src, kind, lv)
                name = f"{kind}-{color}-{lv}.png"
                for dest in DESTS:
                    canvas.save(dest / name)
                n += 1
    print(f"wrote {n} heads → {DESTS[0]}")


if __name__ == "__main__":
    main()
