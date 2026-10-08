# Ultra-Icons — verbindlicher Kanon

**Status:** fertig / freigegeben — für **alle** neuen Spielversionen, Deployments und Agent-Arbeit  
**Stand:** 2026-10-08  
**Quelle der Wahrheit:** `game/public/icons/units/ultra-{grey|blue|red}-{1..5}.png`

Ältere Ultra-Varianten (Proposals, Anschnitte, anderes Blau/Rot, Agent-Assets vor diesem Kanon) dürfen **nicht** mehr für neue Builds, Mockups oder Agent-Generierungen verwendet werden.

Maschinenlesbar: [`ultra-canon.json`](./ultra-canon.json)  
Übersicht: [`ultras-all-colors.png`](./ultras-all-colors.png)

## Dateipfade (Runtime)

| Farbe | Pfade |
| --- | --- |
| Grau (neutral) | `game/public/icons/units/ultra-grey-1.png` … `ultra-grey-5.png` |
| Blau (Heim) | `game/public/icons/units/ultra-blue-1.png` … `ultra-blue-5.png` |
| Rot (Gäste) | `game/public/icons/units/ultra-red-1.png` … `ultra-red-5.png` |

**Spiegel für Agents:** `unit-icons-agent/assets/units/ultra-*.png`  
Progression/Historie: `unit-icons-agent/docs/ultra-progression/` (nur Doku, nicht Runtime).

## Teamfarben (geteilt — Pflicht)

Blau und Rot sind **dieselben** Midtones wie bei Fans, Hooligans, Ordnern und den farbigen Ständen/Gebäuden:

| Farbe | Ziel-Midtone (RGB) | Referenz |
| --- | --- | --- |
| Blau | `(31, 76, 160)` | Fan-/Gebäude-Blau |
| Rot | `(151, 27, 32)` | Fan-/Gebäude-Rot |

Kein separates Ultra-Navy oder Ultra-Burgundy.

## Stil

- Chibi / Bloons-Comic: großer Kopf, kurze Beine, dicke Outlines
- **Ganzfigurig**, 256×256 PNG RGBA freigestellt
- **Kein Anschnitt:** Hood, Rauch, Megafon und Füße vollständig und rund (mind. ~20 px Innenabstand)
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

1. **Ort finden:** immer `game/public/icons/units/ultra-{grey\|blue\|red}-{1..5}.png` — das sind die echten Ultras.
2. Agents: Kanon unter `docs/icons/ULTRA_CANON.md` + Spiegel `unit-icons-agent/assets/units/ultra-*.png`.
3. Keine Regeneration und kein anderes Blau/Rot, solange dieser Kanon gilt — außer ausdrücklicher Revisions-Auftrag.
4. Neue Spielstände, Branches und Deployments übernehmen **ausschließlich** diese 15 Dateien.
5. Teamfarben bleiben an Fan/Hooligan/Ordner/Stände gekoppelt (`(31,76,160)` / `(151,27,32)`).
6. Fans, Ordner, Hooligans haben eigene Kanons; Figurgröße: [`UNITS_SCALE_CANON.md`](./UNITS_SCALE_CANON.md).
