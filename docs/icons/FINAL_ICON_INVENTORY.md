# Finale Icon-Inventarliste

**Stand:** 2026-10-08  
**Runtime-Wurzel:** `game/public/icons/`

Übersichten:

- Gebäude: [`final-buildings-overview.png`](./final-buildings-overview.png)
- Personen: [`final-units-overview.png`](./final-units-overview.png)
- Ressourcen-Vorschlag: [`proposal-resources-rail.png`](./proposal-resources-rail.png) · Varianten [`proposal-resources-variants.png`](./proposal-resources-variants.png)

## 1. Gebäude / Stände

Schema: `stands/{bier|fanshop|ordner}-{grey|blue|red}-{1..5}.png` → **45** Icons

| Typ | Bedeutung | Dateien |
| --- | --- | --- |
| Bierbude | Wirtschaft Bier | `bier-{grey\|blue\|red}-{1..5}.png` |
| Fanshop | Wirtschaft Fanartikel | `fanshop-{grey\|blue\|red}-{1..5}.png` |
| Ordnerposten | Sicherheit (Kanon: Stuhl→Pult→Büro) | `ordner-{grey\|blue\|red}-{1..5}.png` — siehe [`ORDNERPOSTEN_CANON.md`](./ORDNERPOSTEN_CANON.md) |

Farben: **grey** neutral · **blue** Heim · **red** Gast

Zusätzlich (Legacy ohne Farb-Suffix, falls vorhanden): `bier-1..5.png`, `fanshop-1..5.png`, `ordner-1..5.png` — für neue Deployments die **farbigen** Dateien bevorzugen.

## 2. Lehrplatz & Wimpel (Kanon aus `icon-ui-einzeln-3755`)

Stil Lehrplatz: **Pfosten + Seil** (Vorschlag C). Stil Wimpel: **Holzpfosten + Streifenfahne** (Vorschlag A). Register: `game/public/icons/ASSET_DB.json`.

| Element | Datei | Rolle |
| --- | --- | --- |
| Lehrplatz Default (parallel, grau) | `ui/slot-empty.png` (= `slot-empty-parallel.png`) | Bauplatz, Standarte aus |
| Lehrplatz Heim / Gast | `ui/slot-empty-parallel-blue.png` / `-red.png` | Teamkontrolle, Standarte ein |
| Lehrplatz Iso (Alt.) | `ui/slot-empty-iso*.png` | Orientierungs-Variante |
| Wimpel Heim | `ui/pennant-ksc.png` | Besitz/Front Heim |
| Wimpel Gast | `ui/pennant-vfb.png` | Besitz/Front Gast |

## 3. Personen

Schema: `units/{fan|ordner|hooligan|ultra}-{grey|blue|red}-{1..5}.png` → **60** Icons

| Typ | Kanon |
| --- | --- |
| Fan | [`FAN_CANON.md`](./FAN_CANON.md) |
| Ordner | [`ORDNER_CANON.md`](./ORDNER_CANON.md) |
| Hooligan | [`HOOLIGAN_CANON.md`](./HOOLIGAN_CANON.md) |
| Ultra | [`ULTRA_CANON.md`](./ULTRA_CANON.md) |

Teamfarben geteilt: Blau `(31,76,160)` · Rot `(151,27,32)`.

## 4. Top-HUD & UI (Kontext)

| Element | Datei |
| --- | --- |
| Scoreboard / Momentum | `ui/scoreboard-top.png` ([`HUD_TOP_CANON.md`](./HUD_TOP_CANON.md)) |
| Währungen | `ui/currency-{gold\|bier\|fanartikel\|sicherheit}.png` |
| Buttons | `ui/btn-kaufen-*.png`, `ui/btn-senden-*.png` |
| Menü-Rail | `ui/menu-rail-brown.png` |

## 5. Ressourcen-Leiste (offen — Vorschlag)

Platzierung: **oben links**, zwischen Personen-Sidebar und Stadionfläche, unterhalb/seitlich vom Top-HUD.

Empfehlung: **Variante A (Chip-Rail)** — brauner Rahmen im Bloons-Menü-Look, vier Chips (Gold, Bier, Fanartikel, Sicherheit) mit Icon + Wert. Details in den Proposal-Bildern.
