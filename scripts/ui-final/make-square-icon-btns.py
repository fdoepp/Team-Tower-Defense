#!/usr/bin/env python3
"""Compose square wood-rim icon buttons (UI Final proposals)."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "icons" / "ui-final" / "pending"
MOCK = ROOT / "docs" / "mockups" / "personen-rail-no-senden"
ART = Path("/opt/cursor/artifacts/screenshots")
SIZE = 256

# Face colors matching existing chrome
BLUE = (49, 132, 202, 255)
AMBER = (224, 143, 34, 255)
RED = (196, 42, 42, 255)

WOOD_OUTER = (53, 38, 27, 255)
WOOD_MID = (154, 91, 47, 255)
WOOD_INNER = (116, 62, 28, 255)
WOOD_DEEP = (57, 27, 6, 255)
HIGHLIGHT = (210, 170, 110, 90)


def rounded_mask(size: int, radius: float) -> Image.Image:
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return m


def make_square_chrome(face_rgba: tuple[int, int, int, int], size: int = SIZE) -> Image.Image:
    """Wood rim + single colored face, freigestellt corners — square sibling of 320×96 chrome."""
    # Relative to existing 320×96: wood ~6.5% of width, face inset ~6.8%
    wood_frac = 0.075
    face_inset = int(round(size * wood_frac))
    radius = size * 0.14
    face_radius = size * 0.10

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # Soft outer shadow under wood
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        (2, 3, size - 2, size - 1),
        radius=radius,
        fill=(20, 12, 6, 70),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(1.4))
    canvas.alpha_composite(shadow)

    # Wood plate
    wood = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    wd = ImageDraw.Draw(wood)
    wd.rounded_rectangle((1, 1, size - 2, size - 2), radius=radius, fill=WOOD_OUTER)
    # Mid wood band
    inset1 = max(2, int(size * 0.018))
    wd.rounded_rectangle(
        (inset1, inset1, size - 1 - inset1, size - 1 - inset1),
        radius=radius * 0.92,
        fill=WOOD_MID,
    )
    # Inner wood
    inset2 = max(3, int(size * 0.035))
    wd.rounded_rectangle(
        (inset2, inset2, size - 1 - inset2, size - 1 - inset2),
        radius=radius * 0.85,
        fill=WOOD_INNER,
    )
    # Deep lip before face
    inset3 = max(4, face_inset - 2)
    wd.rounded_rectangle(
        (inset3, inset3, size - 1 - inset3, size - 1 - inset3),
        radius=face_radius * 1.05,
        fill=WOOD_DEEP,
    )
    # Top highlight on wood
    hi = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hi)
    hd.rounded_rectangle(
        (inset1, inset1, size - 1 - inset1, inset1 + int(size * 0.12)),
        radius=radius * 0.5,
        fill=HIGHLIGHT,
    )
    wood = Image.alpha_composite(wood, hi)
    canvas.alpha_composite(wood)

    # Colored face
    face = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    fd = ImageDraw.Draw(face)
    fi = face_inset
    fd.rounded_rectangle(
        (fi, fi, size - 1 - fi, size - 1 - fi),
        radius=face_radius,
        fill=face_rgba,
    )
    # Soft top gloss on face
    gloss = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gloss)
    gh = int((size - 2 * fi) * 0.42)
    gd.rounded_rectangle(
        (fi + 2, fi + 2, size - 3 - fi, fi + gh),
        radius=face_radius * 0.7,
        fill=(255, 255, 255, 38),
    )
    face = Image.alpha_composite(face, gloss)
    canvas.alpha_composite(face)

    # Apply outer rounded alpha so corners stay freigestellt
    mask = rounded_mask(size, radius)
    arr = np.array(canvas)
    m = np.array(mask)
    arr[:, :, 3] = (arr[:, :, 3].astype(np.float32) * (m.astype(np.float32) / 255.0)).astype(
        np.uint8
    )
    return Image.fromarray(arr, "RGBA")


def opaque_bbox(im: Image.Image, thr: int = 12):
    a = np.array(im.split()[-1])
    ys, xs = np.where(a > thr)
    if len(xs) == 0:
        return 0, 0, im.width, im.height
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def paste_icon_centered(
    chrome: Image.Image,
    icon: Image.Image,
    fill_frac: float = 0.72,
) -> Image.Image:
    """Place freigestelltes icon in the colored face, % of face size."""
    out = chrome.copy()
    size = out.width
    wood_frac = 0.075
    fi = int(round(size * wood_frac))
    face = size - 2 * fi
    target = max(8, int(round(face * fill_frac)))

    ic = icon.convert("RGBA")
    x0, y0, x1, y1 = opaque_bbox(ic)
    cropped = ic.crop((x0, y0, x1, y1))
    cw, ch = cropped.size
    scale = target / max(cw, ch)
    nw = max(1, int(round(cw * scale)))
    nh = max(1, int(round(ch * scale)))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)

    ox = (size - nw) // 2
    oy = (size - nh) // 2
    # Slight optical lift (icons sit a tad high in face)
    oy -= int(size * 0.01)
    out.alpha_composite(resized, (ox, oy))
    return out


def checker(w: int, h: int, s: int = 16) -> Image.Image:
    img = Image.new("RGBA", (w, h), (240, 240, 240, 255))
    d = ImageDraw.Draw(img)
    for y in range(0, h, s):
        for x in range(0, w, s):
            if ((x // s) + (y // s)) % 2 == 0:
                d.rectangle([x, y, x + s - 1, y + s - 1], fill=(220, 220, 220, 255))
    return img


# Upgrade arrow — thick purple, no white tip dot, no dark outline
PURPLE_L = (186, 120, 255, 255)
PURPLE_R = (132, 58, 220, 255)


def make_upgrade_arrow(size: int = SIZE) -> Image.Image:
    """Freigestellter Upgrade-Pfeil: ohne Spitzenpunkt, ohne dunklen Rand."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cx = size / 2
    top = size * 0.12
    bot = size * 0.88
    head_bot = size * 0.46
    head_half = size * 0.38
    shaft_half = size * 0.16
    tip_x, tip_y = cx, top
    r = shaft_half

    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    pts_s = [
        (tip_x + 2, tip_y + 5),
        (cx - head_half + 2, head_bot + 5),
        (cx - shaft_half + 2, head_bot + 5),
        (cx - shaft_half + 2, bot + 5),
        (cx + shaft_half + 2, bot + 5),
        (cx + shaft_half + 2, head_bot + 5),
        (cx + head_half + 2, head_bot + 5),
    ]
    sd.polygon(pts_s, fill=(40, 10, 60, 85))
    sd.ellipse(
        (cx - r + 2, bot - r + 5, cx + r + 2, bot + r * 0.15 + 5),
        fill=(40, 10, 60, 85),
    )
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(3.2)))

    body = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bd = ImageDraw.Draw(body)
    pts = [
        (tip_x, tip_y),
        (cx - head_half, head_bot),
        (cx - shaft_half, head_bot),
        (cx - shaft_half, bot),
        (cx + shaft_half, bot),
        (cx + shaft_half, head_bot),
        (cx + head_half, head_bot),
    ]
    bd.polygon(pts, fill=PURPLE_R)
    bd.ellipse((cx - r, bot - r, cx + r, bot + r * 0.15), fill=PURPLE_R)

    left = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ld = ImageDraw.Draw(left)
    ld.polygon(pts, fill=PURPLE_L)
    ld.ellipse((cx - r, bot - r, cx + r, bot + r * 0.15), fill=PURPLE_L)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rectangle((0, 0, int(cx), size), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(2))
    body = Image.composite(left, body, mask)

    hi = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hi)
    hd.line(
        [(tip_x, tip_y + 6), (cx - head_half * 0.5, head_bot - 6)],
        fill=(255, 230, 255, 65),
        width=3,
    )
    body = Image.alpha_composite(body, hi.filter(ImageFilter.GaussianBlur(1.2)))
    canvas.alpha_composite(body)

    arr = np.array(canvas)
    dark = (arr[:, :, :3].max(axis=2) < 50) & (arr[:, :, 3] > 0)
    arr[dark, 3] = 0
    return Image.fromarray(arr, "RGBA")


def paste_arrow_upper_right(
    btn: Image.Image,
    arrow: Image.Image,
    face_frac: float = 0.34,
) -> Image.Image:
    """Arrow centered in upper-right face quadrant, foreground over build icon."""
    out = btn.copy().convert("RGBA")
    size = out.width
    fi = int(round(size * 0.075))
    face0, face1 = fi, size - fi
    face = face1 - face0
    qx0, qy0 = face0 + face // 2, face0
    qw = qh = face // 2
    qcx, qcy = qx0 + qw // 2, qy0 + qh // 2

    ar = arrow.convert("RGBA")
    x0, y0, x1, y1 = opaque_bbox(ar)
    cropped = ar.crop((x0, y0, x1, y1))
    target = max(8, int(round(face * face_frac)))
    cw, ch = cropped.size
    scale = target / max(cw, ch)
    nw = max(1, int(round(cw * scale)))
    nh = max(1, int(round(ch * scale)))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    ox = qcx - nw // 2
    oy = qcy - nh // 2 - int(qh * 0.03)

    a = resized.split()[-1]
    sh = Image.new("RGBA", resized.size, (30, 10, 50, 0))
    sh.putalpha(a.point(lambda v: int(v * 0.4)))
    out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(2.2)), (ox + 2, oy + 3))
    out.alpha_composite(resized, (ox, oy))
    return out


def make_upgrade_menu_buttons() -> None:
    """Pending Freigabe: person/building upgrade squares + freigestellter Pfeil."""
    OUT.mkdir(parents=True, exist_ok=True)
    MOCK.mkdir(parents=True, exist_ok=True)
    ART.mkdir(parents=True, exist_ok=True)

    arrow = make_upgrade_arrow()
    arrow.save(OUT / "icon-upgrade-arrow.png")

    # Same center icons as the released Bau-buttons
    person_base = Image.open(ROOT / "game/public/icons/ui-final/btn-icon-ultra-blue.png")
    building_base = Image.open(ROOT / "game/public/icons/ui-final/btn-icon-bier-amber.png")
    btn_person = paste_arrow_upper_right(person_base, arrow)
    btn_building = paste_arrow_upper_right(building_base, arrow)
    btn_person.save(OUT / "btn-icon-upgrade-person.png")
    btn_building.save(OUT / "btn-icon-upgrade-building.png")

    pad, cell, label_h = 18, 200, 30
    cols = 3
    W = pad + cols * (cell + pad)
    H = 36 + pad + cell + label_h + pad
    sheet = Image.new("RGBA", (W, H), (40, 42, 48, 255))
    d = ImageDraw.Draw(sheet)
    d.text(
        (pad, 8),
        "Upgrade: Bau-Icon mittig · Pfeil UR-Quadrant · o. Punkt/Rand",
        fill=(255, 255, 255, 255),
    )
    y0 = 36
    for i, (im, lab) in enumerate(
        [
            (btn_person, "Personen-Upgrade"),
            (btn_building, "Gebäude-Upgrade"),
            (arrow, "Pfeil freigestellt"),
        ]
    ):
        x = pad + i * (cell + pad)
        if im is arrow:
            bg = checker(cell, cell, 10)
            sheet.paste(bg, (x, y0))
            ic = im.resize((cell, cell), Image.Resampling.LANCZOS)
            sheet.paste(ic, (x, y0), ic)
        else:
            ic = im.resize((cell, cell), Image.Resampling.LANCZOS)
            sheet.paste(ic, (x, y0), ic)
        d.text((x + 2, y0 + cell + 6), lab, fill=(230, 230, 230, 255))
    sheet.save(ART / "upgrade-menu-buttons-sheet.png")
    sheet.save(MOCK / "upgrade-menu-buttons-sheet.png")
    print("upgrade buttons →", OUT)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    MOCK.mkdir(parents=True, exist_ok=True)
    ART.mkdir(parents=True, exist_ok=True)

    ultra = Image.open(ROOT / "game/public/icons/ui-final/ultra-blue-5.png")
    bier = Image.open(ROOT / "game/public/icons/ui-final/bier-blue-5.png")
    # Prefer blue bier for team color; stands also have team variants — use blue Lv5

    blue_empty = make_square_chrome(BLUE)
    amber_empty = make_square_chrome(AMBER)
    red_empty = make_square_chrome(RED)

    btn_ultra = paste_icon_centered(blue_empty, ultra, fill_frac=0.78)
    btn_bier = paste_icon_centered(amber_empty, bier, fill_frac=0.74)

    # Chrome-only (empty face) variants for stacking live icons later
    paths = {
        "btn-icon-ultra-blue.png": btn_ultra,
        "btn-icon-bier-amber.png": btn_bier,
        "btn-icon-square-blue.png": blue_empty,
        "btn-icon-square-amber.png": amber_empty,
        "btn-icon-square-red.png": red_empty,
    }
    for name, im in paths.items():
        dest = OUT / name
        im.save(dest)
        print("wrote", dest, im.size)

    # Sheet for Freigabe
    pad, cell, label_h = 16, 180, 28
    cols = 5
    W = pad + cols * (cell + pad)
    H = pad + cell + label_h + pad
    sheet = checker(W, H)
    d = ImageDraw.Draw(sheet)
    labels = [
        ("btn-icon-ultra-blue.png", "Blau · Ultra Lv5"),
        ("btn-icon-bier-amber.png", "Bau · Bier Lv5"),
        ("btn-icon-square-red.png", "Rot · leer (Angriff)"),
        ("btn-icon-square-blue.png", "Blau Chrome"),
        ("btn-icon-square-amber.png", "Amber Chrome"),
    ]
    for i, (name, lab) in enumerate(labels):
        x = pad + i * (cell + pad)
        y = pad
        icon = Image.open(OUT / name).resize((cell, cell), Image.Resampling.LANCZOS)
        sheet.paste(icon, (x, y), icon)
        d.text((x + 4, y + cell + 6), lab, fill=(30, 30, 30, 255))
    sheet_path = ART / "square-icon-buttons-sheet.png"
    sheet.save(sheet_path)
    sheet.save(MOCK / "square-icon-buttons-sheet.png")
    print("sheet", sheet_path)

    make_upgrade_menu_buttons()


if __name__ == "__main__":
    main()
