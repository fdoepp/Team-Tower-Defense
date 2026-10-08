#!/usr/bin/env python3
"""Bake stand icons into per-Bau-slot depth perspective (VP-aligned).

Source: game/public/icons/stands/{kind}-{color}-{lv}.png (iso canon)
Output: game/public/icons/stands/persp/{kind}-{color}-{lv}-b{block}i{index}.png

Each slot gets its own foreshortening + lean toward FLOOR_VP so buildings
sit in the stadium floor grid without a flat drawIconQuad squash.
"""

from __future__ import annotations

import math
import os
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "public" / "icons" / "stands"
OUT_DIR = SRC_DIR / "persp"

# Must match game/src/game/floorGrid.ts
FLOOR_VP = (0.5027, 0.0897)
FLOOR_COL_XS_NEAR = [0.1, 0.233333, 0.366667, 0.5, 0.633333, 0.766667, 0.9]
FLOOR_Y_NEAR = 0.985
FLOOR_ROW_YS = [0.78, 0.86, 0.925, 0.988]
BAU_ROW_LINE = [0, 2]
BLOCK_COL0 = [0, 2, 4]

KINDS = ("bier", "fanshop", "ordner")
COLORS = ("blue", "red", "grey")
LEVELS = (1, 2, 3, 4, 5)
CANVAS = 512


def inv_depth(y: float) -> float:
    return 1.0 / (y - FLOOR_VP[1])


def y_from_inv(i: float) -> float:
    return FLOOR_VP[1] + 1.0 / i


def floor_row_ys() -> list[float]:
    raw = FLOOR_ROW_YS
    ids = [inv_depth(y) for y in raw]
    cell_far = ids[0] - ids[1]
    gang = ids[1] - ids[2]
    cell_near = ids[2] - ids[3]
    cell = (cell_far + cell_near) / 2.0
    id_near = ids[3]
    id_near_top = id_near + cell
    id_far_bot = id_near_top + gang
    id_far_top = id_far_bot + cell
    return [
        y_from_inv(id_far_top),
        y_from_inv(id_far_bot),
        y_from_inv(id_near_top),
        y_from_inv(id_near),
    ]


def x_at_depth(x_near: float, y: float) -> float:
    return FLOOR_VP[0] + ((y - FLOOR_VP[1]) * (x_near - FLOOR_VP[0])) / (
        FLOOR_Y_NEAR - FLOOR_VP[1]
    )


def booth_quad(block_id: int, index: int) -> dict[str, tuple[float, float]]:
    b = max(0, min(2, block_id))
    i = max(0, min(3, index))
    c0 = BLOCK_COL0[b]
    dc = i % 2
    r = 0 if i < 2 else 1
    c = c0 + dc
    rows = floor_row_ys()
    li = BAU_ROW_LINE[r]
    y_top, y_bot = rows[li], rows[li + 1]
    xl, xr = FLOOR_COL_XS_NEAR[c], FLOOR_COL_XS_NEAR[c + 1]
    return {
        "tl": (x_at_depth(xl, y_top), y_top),
        "tr": (x_at_depth(xr, y_top), y_top),
        "br": (x_at_depth(xr, y_bot), y_bot),
        "bl": (x_at_depth(xl, y_bot), y_bot),
    }


def content_bbox(im: Image.Image, alpha_thr: int = 12) -> tuple[int, int, int, int]:
    a = np.array(im.split()[-1])
    ys, xs = np.where(a > alpha_thr)
    if len(xs) == 0:
        return (0, 0, im.width, im.height)
    return (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)


def find_coeffs(pa: list[tuple[float, float]], pb: list[tuple[float, float]]):
    """Map pb → pa (PIL PERSPECTIVE)."""
    matrix = []
    for p1, p0 in zip(pa, pb):
        matrix.append([p1[0], p1[1], 1, 0, 0, 0, -p0[0] * p1[0], -p0[0] * p1[1]])
        matrix.append([0, 0, 0, p1[0], p1[1], 1, -p0[1] * p1[0], -p0[1] * p1[1]])
    A = np.array(matrix, dtype=np.float64)
    B = np.array(pb, dtype=np.float64).reshape(8)
    res = np.linalg.solve(A, B)
    return tuple(res.tolist())


def slot_metrics(q: dict[str, tuple[float, float]]) -> dict[str, float]:
    near_w = math.hypot(q["br"][0] - q["bl"][0], q["br"][1] - q["bl"][1])
    far_w = math.hypot(q["tr"][0] - q["tl"][0], q["tr"][1] - q["tl"][1])
    foot_cx = (q["bl"][0] + q["br"][0]) / 2.0
    lean = foot_cx - FLOOR_VP[0]
    depth = (q["bl"][1] + q["br"][1]) / 2.0  # near y
    return {
        "near_w": near_w,
        "far_w": far_w,
        "ratio": far_w / max(1e-6, near_w),
        "lean": lean,
        "depth": depth,
    }


def dest_prism(m: dict[str, float], size: int = CANVAS) -> list[tuple[float, float]]:
    """Building trapezoid in local PNG space (y down). Feet near bottom.

    Amplifies slot lean/taper so left/right + far/near Bauslots read clearly
    different (stadium VP), not just a subtle iso nudge.
    """
    # Far row (smaller near_w) → smaller footprint; near row fills more
    depth_scale = 0.72 + 0.38 * ((m["near_w"] - 0.11) / 0.03)
    depth_scale = max(0.68, min(1.12, depth_scale))

    near_w = size * 0.82 * depth_scale
    # Exaggerate far/near taper beyond raw cell ratio for readable depth
    ratio = m["ratio"] ** 1.35
    far_w = near_w * ratio
    top_y = size * (0.06 if depth_scale > 0.95 else 0.14)
    bot_y = size * 0.93

    # Strong lean toward VP: left slots (lean<0) → top shifts right
    shear = -m["lean"] * size * 1.15
    # Also skew the foot slightly (ground plane yaw)
    foot_skew = -m["lean"] * size * 0.18

    cx = size * 0.5
    bl = (cx - near_w / 2 + foot_skew * 0.35, bot_y)
    br = (cx + near_w / 2 + foot_skew * 0.35, bot_y)
    tl = (cx - far_w / 2 + shear, top_y)
    tr = (cx + far_w / 2 + shear, top_y)
    return [tl, tr, br, bl]


def bake_one(src: Image.Image, block_id: int, index: int) -> Image.Image:
    q = booth_quad(block_id, index)
    m = slot_metrics(q)
    dest = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))

    # Soft contact ellipse under feet (matches runtime shadow)
    from PIL import ImageDraw

    draw = ImageDraw.Draw(dest)
    foot_y = int(CANVAS * 0.90)
    rw = int(CANVAS * 0.28 * (0.9 + 0.2 * ((m["near_w"] - 0.11) / 0.03)))
    rh = int(CANVAS * 0.055)
    shear = int(-m["lean"] * CANVAS * 0.08)
    draw.ellipse(
        [CANVAS // 2 - rw + shear, foot_y - rh, CANVAS // 2 + rw + shear, foot_y + rh],
        fill=(15, 23, 42, 90),
    )

    x0, y0, x1, y1 = content_bbox(src)
    # Pad content slightly so transform edges aren't clipped
    pad = 2
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(src.width, x1 + pad)
    y1 = min(src.height, y1 + pad)
    crop = src.crop((x0, y0, x1, y1))
    cw, ch = crop.size

    # Source quad (axis-aligned content)
    src_quad = [(0, 0), (cw, 0), (cw, ch), (0, ch)]
    dst_quad = dest_prism(m)

    coeffs = find_coeffs(dst_quad, src_quad)
    warped = crop.transform(
        (CANVAS, CANVAS),
        Image.Transform.PERSPECTIVE,
        coeffs,
        resample=Image.Resampling.BICUBIC,
    )
    dest.alpha_composite(warped)

    # Trim empty margins then pad back to square so runtime drawIcon
    # doesn't letterbox a tiny building inside a huge transparent atlas.
    bx0, by0, bx1, by1 = content_bbox(dest, alpha_thr=8)
    trimmed = dest.crop((bx0, by0, bx1, by1))
    tw, th = trimmed.size
    side = max(tw, th) + 16
    out = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    # Keep feet near bottom of square
    ox = (side - tw) // 2
    oy = side - th - 6
    out.alpha_composite(trimmed, (ox, oy))
    return out.resize((CANVAS, CANVAS), Image.Resampling.LANCZOS)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    n = 0
    for kind in KINDS:
        for color in COLORS:
            for lv in LEVELS:
                src_path = SRC_DIR / f"{kind}-{color}-{lv}.png"
                if not src_path.exists():
                    print("MISSING", src_path)
                    continue
                src = Image.open(src_path).convert("RGBA")
                for b in range(3):
                    for i in range(4):
                        out = bake_one(src, b, i)
                        name = f"{kind}-{color}-{lv}-b{b}i{i}.png"
                        out.save(OUT_DIR / name, optimize=True)
                        n += 1
    # Manifest for runtime / docs
    manifest = OUT_DIR / "MANIFEST.md"
    manifest.write_text(
        "# Standicons — Tiefenperspektive je Bauslot\n\n"
        f"Generated `{n}` files from iso canon → VP-aligned prism per slot.\n\n"
        "Naming: `{kind}-{color}-{lv}-b{block}i{index}.png`\n\n"
        "- `block` 0=Heim · 1=Neutral · 2=Gäste\n"
        "- `index` 0..3 (far-left, far-right, near-left, near-right)\n"
        "- Colors: blue / red / grey\n"
        "- Levels: 1..5\n\n"
        "Runtime: `standIconPath(..., blockId, index)` → `icons/stands/persp/...`\n"
        "Sidebar/UI previews keep the iso canon (`icons/stands/{kind}-{color}-{lv}.png`).\n",
        encoding="utf-8",
    )
    print(f"Wrote {n} icons → {OUT_DIR}")


if __name__ == "__main__":
    main()
