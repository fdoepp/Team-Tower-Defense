# Wallet-Bar — grafische Vorschläge

**Status:** Vorschlag (noch nicht Runtime)  
**Stand:** 2026-10-08  
**Review-Seite:** [index.html](./index.html)

## Aktuellste Währungs-Icons (Kanon)

Quelle der Wahrheit: Branch `cursor/currency-icons-clean-dba3` →  
`game/public/icons/ui/currency-{gold|bier|fanartikel|sicherheit}.png`

| Ressource | Datei | Motiv |
| --- | --- | --- |
| Gold | `currency-gold.png` | Münze mit Krone |
| Bier | `currency-bier.png` | Bierglas mit Schaum |
| Fanartikel | `currency-fanartikel.png` | blau-weißer Fan-Schal |
| Sicherheit | `currency-sicherheit.png` | blaues Schild mit Haken |

Ältere Varianten auf `icon-ui-einzeln-3755` / `matchday-icons-a9b1` sind **nicht** mehr der Deploy-Default.  
FX (+/−) bleiben laut [`CURRENCY_FX_CANON.md`](../../icons/CURRENCY_FX_CANON.md) getrennt; der HUD-Balken zeigt nur Logo + Live-Zahl.

## Die drei Vorschläge

| ID | Name | Idee |
| --- | --- | --- |
| **A** | Frosted Chips | Glas-Ring + einzelne Pills über dem Rasen (Ist-Zustand verfeinert) |
| **B** | Holz-Leiste | Eine Leiste in Rail-Holzoptik, vier gleich breite Slots |
| **C** | Scoreboard-Tray | Wallet direkt unter dem Scoreboard, Zellen mit Mini-Labels |

Reihenfolge im Spiel (Vorschlag): **Gold → Bier → Fanartikel → Sicherheit** (wie heutige `wallet-row`).

### Preview (echte Kanon-PNGs)

| A | B | C |
| --- | --- | --- |
| ![A](./vorschlag-a-stage.png) | ![B](./vorschlag-b-stage.png) | ![C](./vorschlag-c-stage.png) |

Interaktiv: `index.html` lokal öffnen oder über Static-Server.
