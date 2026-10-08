# HUD — Spielstand · Uhr · Momentum · Stimmung

## Freigegeben: B — Broadcast Bubble (final)

**Kanon für alle Deployments:** [`docs/icons/HUD_TOP_CANON.md`](../../icons/HUD_TOP_CANON.md)  
**Runtime:** `game/public/icons/ui/scoreboard-top.png` (Alias: `scoreboard-momentum.png`)

**Status:** Richtung freigegeben (mit Feedback)  
**Asset (freigestellt):** [`proposal-b-final.png`](./proposal-b-final.png) · [`b-final-cutout.png`](./b-final-cutout.png)

### Verhalten

| Element | Darstellung |
| --- | --- |
| Spielstand | `KSC 3 : 2 VfB` in Cream-Kapsel mit Holzrahmen |
| Spieluhrzeit | Grüner Timer-Badge oben: `39'` |
| Momentum | Blau/Rot-Balken `Heim %` / `Gast %` |
| **Torchance-Orb** | Goldener Knopf **wandert** auf dem Balken nach links/rechts je nach Momentum-Anteil |

**Nicht enthalten:** äußere Stimmungs-Chips / Sternchen links und rechts vom Balken (entfernt).  
Stimmung steckt im Momentum-Balken + Orb-Position — keine zweite Anzeige.

### Orb-Positionen (Demo)

[`b-orb-positions-strip.png`](./b-orb-positions-strip.png)

| Datei | Situation |
| --- | --- |
| [`b-orb-heim-cutout.png`](./b-orb-heim-cutout.png) | starkes Heim-Momentum → Orb links |
| [`b-final-cutout.png`](./b-final-cutout.png) | Beispiel ~70∶30 |
| [`b-orb-gast-cutout.png`](./b-orb-gast-cutout.png) | starkes Gast-Momentum → Orb rechts |

Hintergrund: **keiner** (RGBA freigestellt) — Stadion kommt separat.

## Frühere Richtungsvergleiche

| | Datei | Status |
| --- | --- | --- |
| A Stadion-Tafel | [`proposal-a.jpg`](./proposal-a.jpg) | verworfen für Runtime |
| B Broadcast Bubble (mit Stadion-BG) | [`proposal-b.jpg`](./proposal-b.jpg) | Vorstufe |
| C Mood Wings | [`proposal-c.jpg`](./proposal-c.jpg) | verworfen für Runtime |
| Übersicht A/B/C | [`proposals-abc-strip.jpg`](./proposals-abc-strip.jpg) | Historie |

## Runtime-Hinweis

Als nächstes: Asset in `game/public/icons/ui/` legen und `drawScoreboard` so anpassen, dass der Torchance-Orb horizontal an `pHeim`/`pGast` gebunden wird.
