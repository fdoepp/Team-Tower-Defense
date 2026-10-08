# Ordner-Icons — verbindlicher Kanon

**Status:** freigegeben für alle neuen Spielversionen  
**Stand:** 2026-10-08  
**Quelle der Wahrheit:** `game/public/icons/units/ordner-{grey|blue|red}-{1..5}.png`

Ältere Ordner-Varianten (andere Props-/Helm-Leiter) dürfen **nicht** mehr für neue Builds, Mockups oder Agent-Generierungen verwendet werden.

Maschinenlesbar: [`ordner-canon.json`](./ordner-canon.json)  
Übersicht: [`ordners-all-colors.png`](./ordners-all-colors.png)

## Dateipfade

| Farbe | Pfade |
| --- | --- |
| Grau (neutral) | `game/public/icons/units/ordner-grey-1.png` … `ordner-grey-5.png` |
| Blau (Heim) | `game/public/icons/units/ordner-blue-1.png` … `ordner-blue-5.png` |
| Rot (Gäste) | `game/public/icons/units/ordner-red-1.png` … `ordner-red-5.png` |

Spiegel: `unit-icons-agent/assets/units/ordner-*.png`  
Arbeitsnotizen: `unit-icons-agent/docs/ordner-progression/` (nur Doku).

## Stil

- Wie die bisherigen blauen Ordner: Bloons-/Comic, großer Kopf, kurze Beine, dicke Outlines
- **Ganzfigurig**, 256×256 PNG RGBA freigestellt, Figur komplett im Frame
- **Warnweste** (gelb/neon, reflektierende Streifen) über allen Leveln über der Kleidung

## Kopfbedeckung & Nummer

| Level | Kopf | Nummer |
| --- | --- | --- |
| 1–2 | Baseball-Cap | Level-Ziffer auf der Cap |
| 3–4 | Sicherheits-/Polizeihelm (ohne Vollvisier) | Level-Ziffer auf dem Helm |
| 5 | Polizeihelm **mit Visier/Gesichtsschutz** | **5** auf dem Helm |

## Upgrade-Stufen (Bewaffnung / Schutz)

| Level | Bewaffnung | Schutz |
| --- | --- | --- |
| 1 | **Funkgerät / Mikro** | Warnweste, leichte Kleidung |
| 2 | **Schlagstock** | Cap, optional Handschuhe |
| 3 | **Schlagstock** | Helm + robust: Handschuhe, Knie-/Ellenbogenschützer |
| 4 | **Polizeischild + Pistole** | Helm, mind. so robust wie Lv3 |
| 5 | **Polizeischild + Maschinengewehr** | Helm+Visier, Vollschutz |

## Regeln für Agents & neue Versionen

1. Nur die 15 Dateien unter `game/public/icons/units/ordner-{color}-{level}.png` laden.
2. Keine Regeneration der Ordner, solange dieser Kanon gilt — außer ausdrücklicher Revisions-Auftrag.
3. Neue Spielstände / Branches übernehmen diese Pfade.
4. Fans haben einen eigenen Kanon (`FAN_CANON.md`); Ultras/Hooligans sind getrennt.

## Kurz-Check

- [ ] Dateiname `ordner-{grey|blue|red}-{1-5}.png`
- [ ] Ganzfigur, nichts abgeschnitten
- [ ] Warnweste sichtbar
- [ ] Nummer auf Cap/Helm = Level
- [ ] Props: Funk → Stock → Stock+Pads → Schild+Pistole → Schild+MG
