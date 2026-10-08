# Buttons — benötigte Aktionen & Vorschläge

## Braucht man überhaupt einen Button?

| Aktion | Button? | Warum |
|---|---|---|
| Bauplatz wählen | **Nein** | Tap auf Plot (`+` / Standarte) |
| Figur/Sitz wählen | **Nein** | Tap auf Figur |
| Fan **kaufen** / Ordner **anheuern** | **Ja** | Explizite Ausgabe — Ready/CD | 
| Ultra/Hooligan **senden** | **Ja** | Angriffsaktion — Ready/CD |
| Gebäude **bauen** | **Ja** | Bisher fälschlich KAUFEN-Asset; eigene Farbe/Label |
| Stand **upgraden** | **Ja** | Bisher nur Text-HTML; gleiches Icon-Set |
| Menü Solo / Anpfiff / Zurück | CSS-Buttons | Außerhalb Matchday-Hof |
| Abbrechen (Popup) | Text/CSS ok | Selten, nicht Icon-kritisch |

**Fazit Matchday-Hof:** 4 Icon-Aktionen mit je Ready + Disabled.

## Farbcode (eindeutig)

| Aktion | Farbe aktiv | Disabled |
|---|---|---|
| KAUFEN | Grün | Grau |
| SENDEN | Blau | Grau |
| BAUEN | Amber/Gold | Grau |
| UPGRADE | Violett | Grau |

Stil: Holzrahmen wie Stände (Bloons/Toy), **breite Bar 320×96** für Handy-Touch (≥ ~48 dp Höhe skaliert).

## Dateien (Vorschläge)

| Datei | Einsatz |
|---|---|
| `btn-kaufen-green.png` / `btn-kaufen-grey.png` | Linke Rail + Quick-Buy |
| `btn-senden-blue.png` / `btn-senden-grey.png` | Senden Ultra/Hooligan |
| `btn-bauen-amber.png` / `btn-bauen-grey.png` | Rechte Bau-Rail (statt Kaufen-Reuse) |
| `btn-upgrade-purple.png` / `btn-upgrade-grey.png` | Upgrade an Stand |

Noch **nicht** als Deploy gelockt — nach Freigabe → `game/public/icons/ui/` + `UI_ICONS`.

Previews: `preview-btn-vorschlaege.jpg`, `preview-alt-vs-neu.jpg`

## Objekt + Preis + Button

Siehe [`ACTION_CARD.md`](ACTION_CARD.md) — einheitliche Action-Card.
Preview: `preview-action-card.jpg`.
