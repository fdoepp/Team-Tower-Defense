# Bauplatz-Icons (kanonisch)

## Live-Kopplung an das Bodenraster (Deploy-Default)

Runtime (`FLOOR_GRID_COUPLE` in `floorGrid.ts`):

1. Plot-Zellen liegen auf dem Derby-BG-Bodenraster (Vanishing Point + Spaltenstrahlen + Tiefenlinien).
2. Quelle ist das **achsenparallele** Icon `slot-empty-ortho*.png`.
3. Beim Screen-Draw wird es per `drawIconQuad` in die Zellen-Trapezoid **geschnitten/verzerrt**.

| Kontrolle | Warp-Quelle (ortho) |
|---|---|
| Grau / Neutral | `slot-empty-ortho.png` |
| KSC / blau | `slot-empty-ortho-blue.png` |
| VfB / rot | `slot-empty-ortho-red.png` |

Statische Perspektiv-PNGs (`slot-empty-persp*` / `slot-empty-parallel*`) bleiben als Preview/Fallback.
Iso-Raute: `slot-empty-iso*.png`.

Siehe `game/src/game/floorGrid.ts` · `drawBaustelle` in `render.ts`.
