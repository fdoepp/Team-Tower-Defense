import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  UNIT_COLORS,
  UNIT_LEVELS,
  UNIT_TYPES,
  colorLabel,
  typeLabel,
  type CutoutUnitIcon,
  type UnitIconInventory,
} from "./unitIcons.js";

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function toDataUri(absolutePath: string): string {
  const buf = readFileSync(absolutePath);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

function iconSrc(
  icon: CutoutUnitIcon,
  options: { embedImages: boolean; outPath?: string },
): string {
  if (options.embedImages) return toDataUri(icon.absolutePath);
  if (options.outPath) {
    const rel = relative(dirname(options.outPath), icon.absolutePath);
    return escapeHtml(rel.split("\\").join("/"));
  }
  return escapeHtml(`../../assets/units/${icon.filename}`);
}

export function buildGalleryHtml(
  inventory: UnitIconInventory,
  options: {
    embedImages?: boolean;
    title?: string;
    outPath?: string;
  } = {},
): string {
  const embed = options.embedImages === true;
  const title =
    options.title ??
    "Personen-Icons freigeschnitten — Grau / Blau / Rot · Stufen 1–5";

  const byKey = new Map<string, CutoutUnitIcon>();
  for (const icon of inventory.icons) {
    byKey.set(`${icon.type}|${icon.color}|${icon.level}`, icon);
  }

  const sections = UNIT_TYPES.map((type) => {
    const rows = UNIT_COLORS.map((color) => {
      const cells = UNIT_LEVELS.map((level) => {
        const icon = byKey.get(`${type}|${color}|${level}`);
        if (!icon) {
          return `<td class="missing"><div class="slot empty"><span>fehlt</span><code>${escapeHtml(
            `${type}-${color}-${level}.png`,
          )}</code></div></td>`;
        }
        const src = iconSrc(icon, {
          embedImages: embed,
          outPath: options.outPath,
        });
        return `<td><div class="slot"><img src="${src}" alt="${escapeHtml(
          icon.filename,
        )}" width="128" height="128" loading="lazy" /><code>${escapeHtml(
          icon.filename,
        )}</code></div></td>`;
      }).join("");
      return `<tr><th scope="row">${colorLabel(color)}</th>${cells}</tr>`;
    }).join("\n");

    return `
<section class="unit">
  <h2>${escapeHtml(typeLabel(type))} <code>${type}</code></h2>
  <table>
    <thead>
      <tr>
        <th>Farbe</th>
        ${UNIT_LEVELS.map((l) => `<th>Lv ${l}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</section>`;
  }).join("\n");

  const missingList =
    inventory.missing.length === 0
      ? "<p class=\"ok\">Alle 60 erwarteten freigeschnittenen Farb-Icons sind vorhanden.</p>"
      : `<details open><summary>${inventory.missing.length} fehlend</summary><ul>${inventory.missing
          .map(
            (m) =>
              `<li><code>${escapeHtml(m.filename)}</code></li>`,
          )
          .join("")}</ul></details>`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --ink: #1a1c1e;
      --muted: #5c6570;
      --line: #c9d0d8;
      --paper: #eef1f4;
      --accent: #0b6e4f;
      --warn: #9b2226;
      --checker-a: #d9dee5;
      --checker-b: #f4f6f8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
      color: var(--ink);
      background:
        radial-gradient(1200px 500px at 10% -10%, #d7e8ff 0%, transparent 55%),
        radial-gradient(900px 420px at 100% 0%, #ffd6d2 0%, transparent 50%),
        var(--paper);
      line-height: 1.35;
    }
    header {
      padding: 1.5rem clamp(1rem, 3vw, 2.5rem) 0.75rem;
      border-bottom: 1px solid var(--line);
      background: color-mix(in srgb, white 70%, transparent);
      backdrop-filter: blur(6px);
    }
    h1 { margin: 0 0 0.35rem; font-size: clamp(1.4rem, 2.4vw, 2rem); }
    .meta { color: var(--muted); margin: 0; font-size: 0.95rem; }
    main { padding: 1rem clamp(1rem, 3vw, 2.5rem) 3rem; }
    .unit { margin-top: 1.75rem; }
    .unit h2 {
      margin: 0 0 0.6rem;
      font-size: 1.15rem;
      display: flex;
      gap: 0.5rem;
      align-items: baseline;
    }
    .unit h2 code {
      font-size: 0.8rem;
      color: var(--muted);
      font-weight: 500;
    }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0.45rem;
    }
    th, td { text-align: center; vertical-align: top; }
    thead th {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--muted);
      font-weight: 600;
    }
    tbody th {
      text-align: left;
      padding-top: 2.4rem;
      font-size: 0.9rem;
      width: 4.5rem;
    }
    .slot {
      display: grid;
      gap: 0.35rem;
      justify-items: center;
      padding: 0.55rem;
      border: 1px solid var(--line);
      border-radius: 10px;
      background:
        linear-gradient(45deg, var(--checker-a) 25%, transparent 25%),
        linear-gradient(-45deg, var(--checker-a) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, var(--checker-a) 75%),
        linear-gradient(-45deg, transparent 75%, var(--checker-a) 75%);
      background-size: 16px 16px;
      background-position: 0 0, 0 8px, 8px -8px, -8px 0;
      background-color: var(--checker-b);
    }
    .slot img {
      display: block;
      width: min(128px, 18vw);
      height: auto;
      image-rendering: auto;
    }
    .slot code {
      font-size: 0.65rem;
      color: var(--muted);
      word-break: break-all;
    }
    .slot.empty {
      min-height: 150px;
      place-content: center;
      color: var(--warn);
      background: #fff5f5;
    }
    .slot.empty span { font-weight: 700; text-transform: uppercase; font-size: 0.75rem; }
    .ok { color: var(--accent); font-weight: 600; }
    details { margin-top: 1rem; }
    summary { cursor: pointer; font-weight: 600; color: var(--warn); }
    @media (max-width: 720px) {
      table, thead, tbody, th, td, tr { display: block; }
      thead { display: none; }
      tbody th {
        padding: 0.75rem 0 0.25rem;
        width: auto;
      }
      .slot img { width: 96px; }
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(title)}</h1>
    <p class="meta">
      Erwartet: <strong>${inventory.expectedTotal}</strong>
      · Gefunden: <strong>${inventory.foundTotal}</strong>
      · Fehlt: <strong>${inventory.missingTotal}</strong>
      · Quelle: <code>${escapeHtml(inventory.root)}</code>
    </p>
    ${missingList}
  </header>
  <main>
    ${sections}
  </main>
</body>
</html>
`;
}

export function writeGalleryFile(
  inventory: UnitIconInventory,
  outPath: string,
  options: { embedImages?: boolean; title?: string } = {},
): { outPath: string; bytes: number } {
  const html = buildGalleryHtml(inventory, { ...options, outPath });
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, "utf8");
  return { outPath, bytes: Buffer.byteLength(html, "utf8") };
}

export function defaultGalleryPath(): string {
  return join(
    dirname(fileURLToPath(import.meta.url)),
    "../../docs/gallery/unit-icons-cutouts.html",
  );
}
