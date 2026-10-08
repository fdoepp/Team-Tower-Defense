# Fan-Icons — verbindlicher Kanon

**Status:** freigegeben für alle neuen Spielversionen  
**Stand:** 2026-10-08  
**Quelle der Wahrheit:** `game/public/icons/units/fan-{grey|blue|red}-{1..5}.png`

Ältere Fan-Oberkörper-Icons (z. B. aus früheren Matchday-Batches ohne Beine, ohne Cap-Leiter, andere Props) dürfen **nicht** mehr für neue Builds, Mockups oder Agent-Generierungen verwendet werden.

Maschinenlesbar: [`fan-canon.json`](./fan-canon.json)  
Übersicht: [`fans-all-colors.png`](./fans-all-colors.png)

## Dateipfade

| Farbe | Pfade |
| --- | --- |
| Grau (neutral) | `game/public/icons/units/fan-grey-1.png` … `fan-grey-5.png` |
| Blau (Heim) | `game/public/icons/units/fan-blue-1.png` … `fan-blue-5.png` |
| Rot (Gäste) | `game/public/icons/units/fan-red-1.png` … `fan-red-5.png` |

Spiegel/Kopie für den Icon-Agent: `unit-icons-agent/assets/units/fan-*.png`  
Arbeitsnotizen/History: `unit-icons-agent/docs/fan-progression/` (nur Dokumentation, nicht Runtime).

## Stil

- Bloons-/Ordner-Comic: großer Kopf, kurze Beine, dicke Outlines, flaches Cel-Shading
- **Ganzfigurig** inkl. Unterleib, Beine, Schuhe
- 256×256 PNG, RGBA freigestellt, Figur komplett im Frame (kein Crop an Rändern)
- Weniger „echt“, mehr Toy/Comic — wie Ordner/Ultras

## Outfit (immer, alle Level)

- kurzes Trikot + kurze Hose + Sneaker
- Bierkrug in einer Hand
- Trikot-Nummer = Level (`1` … `5`)
- Fahne/Fähnchen **einfarbig** in Fanlager-Farbe (kein Emblem nötig)
- Baseball-**Cap** (keine Strickmütze) in Fanlager-Farbe — ab Level 3

## Upgrade-Stufen

| Level | Gear | Stimmung / Pose |
| --- | --- | --- |
| 1 | Trikot #1 + Bier — **kein** Fähnchen, kein Schal, keine Cap | ruhig |
| 2 | + kleines Fähnchen · Trikot #2 | freudiger |
| 3 | + Schal + Baseball-Cap · Trikot #3 | singt / chantet |
| 4 | Fahne wird größer · Trikot #4 | jubelt |
| 5 | große Fahne · Trikot #5 | Eskalation / max. Stadionstimmung |

## Regeln für Agents & neue Versionen

1. Nur die 15 Dateien unter `game/public/icons/units/fan-{color}-{level}.png` laden.
2. Keine Regeneration der Fans, solange dieser Kanon gilt — außer ausdrücklicher Auftrag zur Revision.
3. Neue Spielstände / Branches übernehmen diese Pfade; unfarbige Legacy-Dateien `fan-1.png`…`fan-5.png` nicht als Ersatz nutzen.
4. Ultras, Hooligans, Ordner sind **andere** Units — dieses Dokument gilt nur für **Fans** (Hooligans: `HOOLIGAN_CANON.md`, Ordner: `ORDNER_CANON.md`).

## Kurz-Check

- [ ] Dateiname `fan-{grey|blue|red}-{1-5}.png`
- [ ] Ganzfigur sichtbar, nichts abgeschnitten
- [ ] Nummer auf dem Trikot = Level
- [ ] Lv1 ohne Fähnchen; Cap+Schal erst ab Lv3
- [ ] Bierkrug vorhanden
- [ ] Farbe von Trikot/Cap/Fahne = Fanlager
