#!/usr/bin/env python3
"""Bake stadium-floodlight-derby-neutral-bg.jpg from the colored derby plate."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public/assets/stadium-floodlight-derby-bg.jpg"
OUT = ROOT / "public/assets/stadium-floodlight-derby-neutral-bg.jpg"


def rgb_to_hsl(r, g, b):
    r, g, b = r / 255, g / 255, b / 255
    mx, mn = max(r, g, b), min(r, g, b)
    l = (mx + mn) / 2
    if mx == mn:
        return 0.0, 0.0, l
    d = mx - mn
    s = d / (2 - mx - mn) if l > 0.5 else d / (mx + mn)
    if mx == r:
        hh = ((g - b) / d + (6 if g < b else 0)) / 6
    elif mx == g:
        hh = ((b - r) / d + 2) / 6
    else:
        hh = ((r - g) / d + 4) / 6
    return hh * 360, s, l


def hsl_to_rgb(h, s, l):
    h = ((h % 360) + 360) % 360
    c = (1 - abs(2 * l - 1)) * s
    x = c * (1 - abs(((h / 60) % 2) - 1))
    m = l - c / 2
    if h < 60:
        rp, gp, bp = c, x, 0
    elif h < 120:
        rp, gp, bp = x, c, 0
    elif h < 180:
        rp, gp, bp = 0, c, x
    elif h < 240:
        rp, gp, bp = 0, x, c
    elif h < 300:
        rp, gp, bp = x, 0, c
    else:
        rp, gp, bp = c, 0, x
    return (
        int(round((rp + m) * 255)),
        int(round((gp + m) * 255)),
        int(round((bp + m) * 255)),
    )


def main() -> None:
    im = Image.open(SRC).convert("RGB")
    px = im.load()
    w, h = im.size
    for y in range(h):
        yn = y / h
        for x in range(w):
            r, g, b = px[x, y]
            H, S, L = rgb_to_hsl(r, g, b)
            if L > 0.82 and S < 0.35:
                continue
            if yn > 0.68 and L < 0.22 and S < 0.2:
                if S < 0.08:
                    continue
                strength = min(1.0, S / 0.25) * 0.7
            else:
                if S < 0.05:
                    continue
                blueish = 175 <= H <= 265
                redish = H <= 40 or H >= 320
                base = 0.92 if (blueish or redish) else 0.78
                strength = min(1.0, (S / 0.18) * base)
                if yn < 0.12:
                    strength *= 0.45
            nl = L * (0.96 if S > 0.25 else 1.0)
            nr, ng, nb = hsl_to_rgb(215, 0.03, max(0.02, min(0.9, nl)))
            px[x, y] = (
                int(round(r * (1 - strength) + nr * strength)),
                int(round(g * (1 - strength) + ng * strength)),
                int(round(b * (1 - strength) + nb * strength)),
            )
    im.save(OUT, quality=90, optimize=True)
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
