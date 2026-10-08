# unit-icons-agent

BDK-Agent für **freigeschnittene Personen-Icons** (LaneLink / Team-Tower-Defense).

Zieht die abgelegten Unit-Cutouts und zeigt alle Varianten in **Grau / Blau / Rot** für die Stufen **1–5**.

## Fan-Kanon

Fans sind freigegeben — Regeln im Repo-Root:

- [`docs/icons/FAN_CANON.md`](../docs/icons/FAN_CANON.md)
- Assets: `../game/public/icons/units/fan-*.png` (Spiegel: `assets/units/fan-*.png`)

## Icon-Quelle

| Quelle | Rolle |
| --- | --- |
| `../game/public/icons/units/` | **Runtime / Kanon** für Fans |
| `assets/units/` | Bundled Spiegel für den Agent |
| `../docs/icons/FAN_CANON.md` | Verbindliche Fan-Regeln |

Schema: `{fan\|ultra\|hooligan\|ordner}-{grey\|blue\|red}-{1..5}.png` → **60** Icons.

## Tools

| Tool | Zweck |
| --- | --- |
| `list_cutout_unit_icons` | Inventar scannen |
| `build_unit_icon_gallery` | HTML-Galerie schreiben |
| `record_icon_inventory` | Kurzbericht speichern |

## Lokal

```bash
cd unit-icons-agent
npm install
npx @cursor/bdk validate --dir .
npx @cursor/bdk info --dir . --json
npx @cursor/bdk call list_cutout_unit_icons --dir . --input '{}'
npx @cursor/bdk call build_unit_icon_gallery --dir . --input '{}'
npx @cursor/bdk eval --dir . --list
```

Galerie öffnen: `docs/gallery/unit-icons-cutouts.html`
