# Top-HUD — verbindlicher Kanon (Scoreboard-Leiste)

**Status:** freigegeben für alle neuen Spielversionen / Deployments  
**Stand:** 2026-10-08  
**Richtung:** Broadcast Bubble (Vorschlag B)

## Quelle der Wahrheit

| Rolle | Pfad |
| --- | --- |
| Runtime-Asset (freigestellt) | `game/public/icons/ui/scoreboard-top.png` |
| Orb-Demo Heim-stark | `game/public/icons/ui/scoreboard-top-orb-heim.png` |
| Orb-Demo Gast-stark | `game/public/icons/ui/scoreboard-top-orb-gast.png` |
| Mockup / Historie | `docs/mockups/hud-scoreboard/` |
| Maschinenlesbar | [`hud-top-canon.json`](./hud-top-canon.json) |

Älteres Asset `scoreboard-momentum.png` (Broadcast-Tech-Look) **nicht** mehr für neue Builds verwenden — durch `scoreboard-top.png` ersetzen bzw. Alias darauf legen.

## Bestandteile (statische Kunst + dynamische Werte)

| Element | Kunst | Dynamisch |
| --- | --- | --- |
| Holz/Cream-Kapsel | Asset | — |
| Team-Badges KSC / VfB | Asset (oder farbige Chips) | — |
| Spielstand | Platzhalter im Asset | Overlay `scoreHeim : scoreGast` |
| Spieluhrzeit | Grüner Badge | Overlay `minute′` |
| Momentum-Balken | Blau/Rot-Segmente | Breite = Heim-% / Gast-% |
| **Torchance-Orb** | Goldener Knopf | **X-Position wandert** mit Momentum (links = Heim stark, rechts = Gast stark); optional Label `Torchance {n}%` |

**Nicht darstellen:** äußere Stimmungs-Chips / Sternchen links und rechts vom Balken.

## Regeln für Agents & Deployments

1. Jedes neue Match-/Spieldeployment nutzt diese Top-Leiste.
2. Werte (Score, Minute, Momentum, Torchance, Orb-Position) werden zur Laufzeit gesetzt — nicht ins Asset eingebrannt.
3. Hintergrund des Assets bleibt transparent; Stadion kommt aus der Szene.
4. Stil: Bloons-Toy, Holzrahmen wie Command-Rails, Teamfarben `#2563eb` / `#dc2626`.
