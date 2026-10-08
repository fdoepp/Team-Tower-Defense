# Ultra-Icons — verbindlicher Kanon

**Status:** freigegeben für alle neuen Spielversionen / Deployments  
**Stand:** 2026-10-08  
**Quelle der Wahrheit:** `game/public/icons/units/ultra-{grey|blue|red}-{1..5}.png`

Ältere Ultra-Varianten (andere Props-/Rauch-Leiter, Agent-Assets vor diesem Kanon) dürfen **nicht** mehr für neue Builds, Mockups oder Agent-Generierungen verwendet werden.

Maschinenlesbar: [`ultra-canon.json`](./ultra-canon.json)  
Übersicht: [`ultras-all-colors.png`](./ultras-all-colors.png)

## Dateipfade

| Farbe | Pfade |
| --- | --- |
| Grau (neutral) | `game/public/icons/units/ultra-grey-1.png` … `ultra-grey-5.png` |
| Blau (Heim) | `game/public/icons/units/ultra-blue-1.png` … `ultra-blue-5.png` |
| Rot (Gäste) | `game/public/icons/units/ultra-red-1.png` … `ultra-red-5.png` |

Spiegel: `unit-icons-agent/assets/units/ultra-*.png`  
Arbeitsnotizen: `unit-icons-agent/docs/ultra-progression/` (nur Doku).

## Teamfarben (geteilt)

Blau und Rot sind **dieselben** Midtones wie bei Fans, Hooligans, Ordnern und den farbigen Ständen:

| Farbe | Ziel-Midtone (RGB) | Referenz |
| --- | --- | --- |
| Blau | `(31, 76, 160)` | Fan-/Hooligan-Trikot/Hoodie |
| Rot | `(151, 27, 32)` | Fan-/Hooligan-Trikot/Hoodie |

Kein separates Ultra-Navy oder Ultra-Burgundy.

## Stil

- Chibi / Bloons-Comic: großer Kopf, kurze Beine, dicke Outlines
- **Ganzfigurig**, 256×256 PNG RGBA freigestellt, gleiche Figurgröße über alle Level
- Hoodie mit **Kapuze oben**, Nummer = Level auf der **linken Brust**
- **Pyro-Stab ab Level 1** immer

## Upgrade-Stufen

| Level | Look | Pyro / Rauch | Weitere Props |
| --- | --- | --- | --- |
| 1 | Gesicht offen | weißes Pyro, **sehr kleiner** Rauch | — |
| 2 | + Sonnenbrille | hell → Teamfarbe beginnend, Rauch etwas mehr | — |
| 3 | aggressiver | Teamfarbe-Rauch, mittel | + Bier |
| 4 | lauter | großer Team-Rauch + **Funken** | + Bier |
| 5 | max | **max** Team-Rauch + Funken | + **Megafon** |

Rauchfarbe: Lv1 weiß/hell → steigend in die **Teamfarbe** (grau / blau / rot).

## Regeln für Agents & Deployments

1. Nur die 15 Dateien unter `game/public/icons/units/ultra-{color}-{level}.png` laden.
2. Keine Regeneration der Ultras, solange dieser Kanon gilt — außer ausdrücklicher Revisions-Auftrag.
3. Neue Spielstände / Branches übernehmen diese Pfade.
4. Fans, Ordner, Hooligans haben eigene Kanons.
