import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const UNIT_TYPES = ["fan", "ultra", "hooligan", "ordner"] as const;
export const UNIT_COLORS = ["grey", "blue", "red"] as const;
export const UNIT_LEVELS = [1, 2, 3, 4, 5] as const;

export type UnitType = (typeof UNIT_TYPES)[number];
export type UnitColor = (typeof UNIT_COLORS)[number];
export type UnitLevel = (typeof UNIT_LEVELS)[number];

export type CutoutUnitIcon = {
  type: UnitType;
  color: UnitColor;
  level: UnitLevel;
  filename: string;
  relativePath: string;
  absolutePath: string;
  bytes: number;
};

export type UnitIconInventory = {
  root: string;
  expectedTotal: number;
  foundTotal: number;
  missingTotal: number;
  byType: Record<
    UnitType,
    {
      found: number;
      missing: Array<{ color: UnitColor; level: UnitLevel; filename: string }>;
      icons: CutoutUnitIcon[];
    }
  >;
  icons: CutoutUnitIcon[];
  missing: Array<{
    type: UnitType;
    color: UnitColor;
    level: UnitLevel;
    filename: string;
  }>;
};

const FILENAME_RE =
  /^(?<type>fan|ultra|hooligan|ordner)-(?<color>grey|blue|red)-(?<level>[1-5])\.png$/i;

function projectRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "../..");
}

/** Candidate roots that may hold freigeschnittene Personen-Icons. */
export function defaultIconRoots(extraRoots: string[] = []): string[] {
  const root = projectRoot();
  const candidates = [
    ...extraRoots,
    // Canonical game path first (Fan canon lives here)
    join(root, "../game/public/icons/units"),
    join(process.cwd(), "game/public/icons/units"),
    join(root, "assets/units"),
    join(root, "bot/sandbox/workspace/icons/units"),
    join(process.cwd(), "assets/units"),
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of candidates) {
    const abs = resolve(c);
    if (seen.has(abs)) continue;
    seen.add(abs);
    if (existsSync(abs)) out.push(abs);
  }
  return out;
}

export function expectedFilename(
  type: UnitType,
  color: UnitColor,
  level: UnitLevel,
): string {
  return `${type}-${color}-${level}.png`;
}

export function parseCutoutFilename(
  filename: string,
):
  | { type: UnitType; color: UnitColor; level: UnitLevel }
  | null {
  const m = FILENAME_RE.exec(filename);
  if (!m?.groups) return null;
  return {
    type: m.groups.type.toLowerCase() as UnitType,
    color: m.groups.color.toLowerCase() as UnitColor,
    level: Number(m.groups.level) as UnitLevel,
  };
}

export function scanCutoutUnitIcons(roots: string[]): UnitIconInventory {
  const byKey = new Map<string, CutoutUnitIcon>();

  for (const root of roots) {
    if (!existsSync(root)) continue;
    let entries: string[] = [];
    try {
      entries = readdirSync(root);
    } catch {
      continue;
    }
    for (const filename of entries) {
      const parsed = parseCutoutFilename(filename);
      if (!parsed) continue;
      const absolutePath = join(root, filename);
      let bytes = 0;
      try {
        bytes = statSync(absolutePath).size;
      } catch {
        continue;
      }
      const key = `${parsed.type}|${parsed.color}|${parsed.level}`;
      // Prefer the first root that has the file (bundled assets first).
      if (byKey.has(key)) continue;
      byKey.set(key, {
        ...parsed,
        filename,
        relativePath: join("units", filename),
        absolutePath,
        bytes,
      });
    }
  }

  const icons = [...byKey.values()].sort((a, b) => {
    const ti = UNIT_TYPES.indexOf(a.type) - UNIT_TYPES.indexOf(b.type);
    if (ti !== 0) return ti;
    const ci = UNIT_COLORS.indexOf(a.color) - UNIT_COLORS.indexOf(b.color);
    if (ci !== 0) return ci;
    return a.level - b.level;
  });

  const missing: UnitIconInventory["missing"] = [];
  const byType = {} as UnitIconInventory["byType"];

  for (const type of UNIT_TYPES) {
    const typeIcons = icons.filter((i) => i.type === type);
    const typeMissing: UnitIconInventory["byType"][UnitType]["missing"] = [];
    for (const color of UNIT_COLORS) {
      for (const level of UNIT_LEVELS) {
        const key = `${type}|${color}|${level}`;
        if (!byKey.has(key)) {
          const filename = expectedFilename(type, color, level);
          typeMissing.push({ color, level, filename });
          missing.push({ type, color, level, filename });
        }
      }
    }
    byType[type] = {
      found: typeIcons.length,
      missing: typeMissing,
      icons: typeIcons,
    };
  }

  const expectedTotal =
    UNIT_TYPES.length * UNIT_COLORS.length * UNIT_LEVELS.length;

  return {
    root: roots[0] ?? "(none)",
    expectedTotal,
    foundTotal: icons.length,
    missingTotal: missing.length,
    byType,
    icons,
    missing,
  };
}

export function colorLabel(color: UnitColor): string {
  switch (color) {
    case "grey":
      return "Grau";
    case "blue":
      return "Blau";
    case "red":
      return "Rot";
  }
}

export function typeLabel(type: UnitType): string {
  switch (type) {
    case "fan":
      return "Fan / Normalo";
    case "ultra":
      return "Ultra";
    case "hooligan":
      return "Hooligan";
    case "ordner":
      return "Ordner";
  }
}
