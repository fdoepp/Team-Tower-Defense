import { defineTool } from "@cursor/bdk/tools";
import { z } from "zod";
import {
  UNIT_COLORS,
  UNIT_LEVELS,
  UNIT_TYPES,
  colorLabel,
  defaultIconRoots,
  scanCutoutUnitIcons,
  typeLabel,
} from "../lib/unitIcons.js";

export default defineTool({
  description:
    "Scan deposited freigeschnittene Personen-Icons (cutout RGBA PNGs) in grey/blue/red for levels 1–5. Returns inventory for fan, ultra, hooligan, ordner.",
  effect: "read",
  inputSchema: z.object({
    extraRoots: z
      .array(z.string())
      .optional()
      .describe(
        "Optional extra directories to scan (in addition to assets/units and game/public/icons/units).",
      ),
  }),
  async execute({ extraRoots }) {
    const roots = defaultIconRoots(extraRoots ?? []);
    const inventory = scanCutoutUnitIcons(roots);

    return {
      schema: {
        types: [...UNIT_TYPES],
        colors: UNIT_COLORS.map((c) => ({ id: c, label: colorLabel(c) })),
        levels: [...UNIT_LEVELS],
        filenamePattern: "{type}-{color}-{level}.png",
        notes: [
          "Nur freigeschnittene Farbvarianten (grey/blue/red × Lv1–5).",
          "Basis-Icons ohne Farb-Suffix (z.B. fan-1.png) werden ignoriert.",
          "Fans: Kanon docs/icons/FAN_CANON.md — game/public/icons/units/fan-*.png",
          "Ordner: Kanon docs/icons/ORDNER_CANON.md — game/public/icons/units/ordner-*.png",
        ],
      },
      rootsScanned: roots,
      summary: {
        expectedTotal: inventory.expectedTotal,
        foundTotal: inventory.foundTotal,
        missingTotal: inventory.missingTotal,
        complete: inventory.missingTotal === 0,
      },
      byType: Object.fromEntries(
        UNIT_TYPES.map((type) => [
          type,
          {
            label: typeLabel(type),
            found: inventory.byType[type].found,
            missing: inventory.byType[type].missing,
            files: inventory.byType[type].icons.map((i) => ({
              filename: i.filename,
              color: i.color,
              level: i.level,
              bytes: i.bytes,
              path: i.absolutePath,
            })),
          },
        ]),
      ),
      missing: inventory.missing,
      icons: inventory.icons.map((i) => ({
        type: i.type,
        color: i.color,
        level: i.level,
        filename: i.filename,
        path: i.absolutePath,
        bytes: i.bytes,
      })),
    };
  },
});
