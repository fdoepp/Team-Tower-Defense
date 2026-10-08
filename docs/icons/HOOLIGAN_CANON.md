# Hooligan-Icons — verbindlicher Kanon

**Status:** freigegeben für alle neuen Spielversionen  
**Stand:** 2026-10-08  
**Quelle der Wahrheit:** `game/public/icons/units/hooligan-{grey|blue|red}-{1..5}.png`

Ältere Hooligan-Varianten (andere Waffen-/Vermummungs-Leiter, Vorschläge A/B/C unter `unit-icons-agent/docs/hooligan-progression/proposals/`) dürfen **nicht** mehr für neue Builds, Mockups oder Agent-Generierungen verwendet werden.

Maschinenlesbar: [`hooligan-canon.json`](./hooligan-canon.json)  
Übersicht: [`hooligans-all-colors.png`](./hooligans-all-colors.png)

## Dateipfade

| Farbe | Pfade |
| --- | --- |
| Grau (neutral) | `game/public/icons/units/hooligan-grey-1.png` … `hooligan-grey-5.png` |
| Blau (Heim) | `game/public/icons/units/hooligan-blue-1.png` … `hooligan-blue-5.png` |
| Rot (Gäste) | `game/public/icons/units/hooligan-red-1.png` … `hooligan-red-5.png` |

Spiegel: `unit-icons-agent/assets/units/hooligan-*.png`  
Arbeitsnotizen: `unit-icons-agent/docs/hooligan-progression/` (nur Doku).

## Stil

- Alte Chibi-Hooligan-Vorlage: großer Kopf, kurze Beine, dicke Outlines, Cel-Shading
- **Ganzfigurig**, 256×256 PNG RGBA freigestellt, Figur komplett im Frame
- Teamfarbe auf Hoodie/Jacke, Beanie und Mundschutz; Waffen behalten Materialfarbe (Holz/Metall)

## Vermummung

| Level | Look |
| --- | --- |
| 1 | eher offen (Hoodie, Kapuze runter, Gesicht sichtbar) |
| 2–3 | Beanie + Mundschutz/Gaiter |
| 4 | + Sonnenbrille |
| 5 | max: Kapuze hoch + Beanie + Brille + Gaiter |

## Upgrade-Stufen (Hände / Waffen)

| Level | Ausstattung |
| --- | --- |
| 1 | **Boxhaltung** (Fäuste hoch, Guard) — keine Waffe |
| 2 | **Fingerschlagringe** |
| 3 | **Baseballschläger** |
| 4 | **Stemmeisen** |
| 5 | **Eisenkette + Schloss** |

## Regeln für Agents & neue Versionen

1. Nur die 15 Dateien unter `game/public/icons/units/hooligan-{color}-{level}.png` laden.
2. Keine Regeneration der Hooligans, solange dieser Kanon gilt — außer ausdrücklicher Revisions-Auftrag.
3. Neue Spielstände / Branches übernehmen diese Pfade.
4. Fans und Ordner haben eigene Kanons (`FAN_CANON.md`, `ORDNER_CANON.md`); Ultras sind getrennt.

## Kurz-Check

- [ ] Dateiname `hooligan-{grey|blue|red}-{1-5}.png`
- [ ] Ganzfigur, nichts abgeschnitten
- [ ] Lv1 Boxhaltung ohne Waffe
- [ ] Props: Schlagring → Baseball → Stemmeisen → Kette+Schloss
- [ ] Vermummung eskaliert bis Lv5
