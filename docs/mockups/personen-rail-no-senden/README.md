# Personen-Rail ohne Senden + Quadrat-Icon-Buttons

**Status:** Vorschlag C — wartet auf Freigabe  
**Mock:** [index.html](./index.html)

## 1. Personen-Rail ohne „Senden“

Alle Karten (Fans, Ultras, Hooligans, Ordner) nur noch:

| Aktion | Chrome |
| --- | --- |
| KAUFEN | `btn-kaufen-*` |
| UPGRADE | `btn-upgrade-*` |

- Dual-Grid überall: `1% · 48% · 2% · 48% · 1%`
- Kein Triple-Grid / kein SENDEN in der linken Rail
- Angriff/Blocksturm → eigener Quadrat-Button (rot)

## 2. Quadrat-Icon-Buttons (Holzrand)

| ID | Datei | Face | Zentrum |
| --- | --- | --- | --- |
| `btnIconUltraBlue` | `btn-icon-ultra-blue.png` | Blau (#3184ca) | Ultra Lv5 |
| `btnIconBierAmber` | `btn-icon-bier-amber.png` | Bau-Amber (#e08f22) | Bierstand Lv5 |
| `btnIconAngriffRed` | `btn-icon-angriff-red.png` | Rot (#c42a2a) | Angriff-Symbol |
| `btnIconSquareRed` | `btn-icon-square-red.png` | Rot | leer (Chrome) |
| `iconAngriffBlocksturm` | `icon-angriff-blocksturm.png` | — | freigestelltes Symbol |

**Maßregeln (skalierbar):**

| Token | Wert |
| --- | --- |
| Native | 256×256, AR 1:1 |
| Holzrand | ~7,5 % der Kantenlänge |
| Icon-Fill | ~72–78 % der Face |
| Live-Inset | n/a (Emblem ist das Chrome-Motiv) |
| Freigestellt | RGBA, transparente Ecken |

Generator: `scripts/ui-final/make-square-icon-btns.py`

## Freigabe

Pending in `docs/icons/ui-final/pending/`. Approve einzeln mit:

```bash
node scripts/ui-final/approve.mjs <id> --by <name>
```
