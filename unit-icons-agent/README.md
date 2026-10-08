# unit-icons-agent

BDK-Agent für **freigeschnittene Personen-Icons** (LaneLink / Team-Tower-Defense).

Zieht die abgelegten Unit-Cutouts und zeigt alle Varianten in **Grau / Blau / Rot** für die Stufen **1–5**.

## Icon-Kanons

| Unit | Regeln | Assets |
| --- | --- | --- |
| Fans | [`FAN_CANON.md`](../docs/icons/FAN_CANON.md) | `../game/public/icons/units/fan-*.png` |
| Ordner | [`ORDNER_CANON.md`](../docs/icons/ORDNER_CANON.md) | `../game/public/icons/units/ordner-*.png` |
| Hooligans | [`HOOLIGAN_CANON.md`](../docs/icons/HOOLIGAN_CANON.md) | `../game/public/icons/units/hooligan-*.png` |
| Ultras (fertig) | [`ULTRA_CANON.md`](../docs/icons/ULTRA_CANON.md) | `../game/public/icons/units/ultra-*.png` — Teamblau/Rot wie Fans |

Spiegel für den Agent: `assets/units/`.

## Icon-Quelle

| Quelle | Rolle |
| --- | --- |
| `../game/public/icons/units/` | **Runtime / Kanon** (Fans + Ordner + Hooligans + Ultras) |
| `assets/units/` | Bundled Spiegel für den Agent |
| `../docs/icons/*_CANON.md` | Verbindliche Regeln |

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
