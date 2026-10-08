#!/usr/bin/env python3
"""Validate a UI icon for Final-DB: freigestellt (RGBA cutout) + native AR."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image
import numpy as np


def validate(path: Path) -> dict:
    im = Image.open(path)
    w, h = im.size
    mode = im.mode
    rgba = im.convert("RGBA")
    a = np.asarray(rgba)[:, :, 3]
    alpha_frac = float((a < 250).mean())
    corners = [a[:8, :8], a[:8, -8:], a[-8:, :8], a[-8:, -8:]]
    corner_opaque = float(np.mean([(c > 250).mean() for c in corners]))
    ys, xs = np.where(a > 16)
    if len(xs):
        bbox = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
    else:
        bbox = [0, 0, w - 1, h - 1]

    exception = None
    name = path.name
    if name.startswith("menu-rail"):
        exception = "menu-rail-background"

    freigestellt = mode in ("RGBA", "LA", "PA") and alpha_frac > 0.02 and corner_opaque < 0.85
    ok = bool(freigestellt or exception)

    reasons: list[str] = []
    if not ok:
        if mode not in ("RGBA", "LA", "PA"):
            reasons.append(f"not RGBA (mode={mode})")
        if alpha_frac <= 0.02:
            reasons.append("almost no transparency — likely not freigestellt")
        if corner_opaque >= 0.85:
            reasons.append("opaque corners — likely sheet/card background")

    return {
        "ok": ok,
        "file": str(path),
        "mode": mode,
        "native": {"w": w, "h": h},
        "aspectRatio": round(w / max(1, h), 6),
        "alphaCoverage": round(alpha_frac, 4),
        "opaqueCornerRatio": round(corner_opaque, 4),
        "contentBBox": bbox,
        "freigestellt": bool(freigestellt),
        "exception": exception,
        "preserveAspectRequired": True,
        "reasons": reasons,
        "checkedAt": datetime.now(timezone.utc).isoformat(),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("path", type=Path)
    ap.add_argument("--json", action="store_true", help="print JSON only")
    args = ap.parse_args()
    if not args.path.is_file():
        print(f"missing file: {args.path}", file=sys.stderr)
        return 2
    result = validate(args.path)
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        status = "PASS" if result["ok"] else "FAIL"
        print(f"{status}  {args.path.name}")
        print(f"  mode={result['mode']}  native={result['native']['w']}x{result['native']['h']}  AR={result['aspectRatio']}")
        print(f"  freigestellt={result['freigestellt']}  alphaCoverage={result['alphaCoverage']}  opaqueCorners={result['opaqueCornerRatio']}")
        if result["exception"]:
            print(f"  exception={result['exception']}")
        for r in result["reasons"]:
            print(f"  ! {r}")
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
