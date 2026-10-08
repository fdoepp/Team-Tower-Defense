# Bauplatz-Icons (kanonisch)

## Live-Kopplung an das Bodenraster (Deploy-Default)

Runtime (`FLOOR_GRID_COUPLE` in `floorGrid.ts`):

1. Plot-Zellen liegen auf dem Derby-BG-Bodenraster (Vanishing Point + Spaltenstrahlen + Tiefenlinien).
2. Quelle ist das **achsenparallele, fahnenlose** Icon `slot-empty-ortho*.png`.
3. Beim Screen-Draw wird es per `drawIconQuad` in die Zellen-Trapezoid geschnitten.
4. **Keine Fahne/Wimpel im Slot-Icon** — Teamfarbe nur über den Boden der Form (neutral / blau / rot). Standarten bleiben separate Runtime-Marker auf gebauten Buden.

| Kontrolle | Warp-Quelle (ortho, ohne Fahne) | Boden |
|---|---|---|
| Grau / Neutral | `slot-empty-ortho.png` | erdbraun |
| KSC / blau | `slot-empty-ortho-blue.png` | blau getönt |
| VfB / rot | `slot-empty-ortho-red.png` | rot getönt |

Statische Perspektiv-PNGs (`slot-empty-persp*` / `slot-empty-parallel*`) sind dieselben fahnenlosen Varianten als Preview/Fallback.
Iso-Raute: `slot-empty-iso*.png`.

Siehe `game/src/game/floorGrid.ts` · `drawBaustelle` in `render.ts`.
