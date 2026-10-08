# UI-Icons einzeln — Optimierungs-Review

Ziel: **Buttons**, **Wimpel** und **Gebäudeleerplatz** aus den bisherigen freigeschnittenen Icons einzeln sichtbar machen, damit wir sie gezielt optimieren können.

## Öffnen

Lokal: `docs/mockups/icons/ui-review/index.html` im Browser öffnen.

## Assets (7)

| Kategorie | Datei | Content-Box | Fill |
|---|---|---|---|
| Button | `../ui/btn-kaufen-grey.png` | 172×139 | 35.3% |
| Button | `../ui/btn-kaufen-green.png` | 172×139 | 35.3% |
| Button | `../ui/btn-senden-grey.png` | 172×140 | 35.4% |
| Button | `../ui/btn-senden-green.png` | 172×139 | 35.2% |
| Wimpel | `../ui/pennant-ksc.png` | 187×196 | 26.9% |
| Wimpel | `../ui/pennant-vfb.png` | 185×196 | 27.2% |
| Gebäudeleerplatz | `../ui/slot-empty.png` | 196×169 | 26.7% |

Alle liegen als 256×256 RGBA in `docs/mockups/icons/ui/` und `game/public/icons/ui/`.

## Darstellung

- `solo/*-solo.png` — groß auf Checkerboard inkl. Content-Bounding-Box (rot)
- `solo/*-tight.png` — nur der undurchsichtige Inhalt (für Format-Vergleich)
- `preview-ui-grid.jpg` — Kompaktübersicht
- `preview-ui-einzeln.jpg` — gestapelte Einzelansicht
- `review-meta.json` — gemessene Padding-/Fill-Werte

## Bekannte Optimierungshebel

1. **Buttons:** Inhalt ~172×139 in 256² → viel Transparenz; für Bloons-UI oft besser als breite Bar (~3:1) statt Quadrat.
2. **Standarten:** Vorschlag A festgelegt → final blau+rot unter [`pennant-final/`](pennant-final/); Deploy-Pflicht in [`../ASSET_DB.json`](../ASSET_DB.json) und [`../../A2c-RULES.md`](../../A2c-RULES.md).
3. **Bauplatz:** Design C (Pfosten+Seil) gewählt → beide Orientierungen unter [`slot-final/`](slot-final/) (`iso` / `parallel`).
4. **Buttons:** benötigte Hof-Aktionen + Holz-Bar-Vorschläge unter [`btn-vorschlaege/`](btn-vorschlaege/) (Kaufen/Senden/Bauen/Upgrade).
5. **Gebäude-Kacheln:** Neubau + Upgrade Action Cards unter [`building-tiles/`](building-tiles/) (Runtime soft via `standIconPath` + Live-Kosten).
6. **Einheiten-Kacheln:** Personen Action Cards unter [`unit-tiles/`](unit-tiles/) — Kosten im Button, soft via `unitIconPath` + `currencyIconPath` + Live-Preise; alle Typen mit **UPGRADE**.
