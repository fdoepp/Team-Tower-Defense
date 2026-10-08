# Test Build — integrierte spielbare Version

Branch: `cursor/test-build-dba3`  
Basis: `cursor/matchday-game-a9b1` + 14 UI/Gameplay-Fixes

## Enthalten

- **Baumenü:** Perspektiv-Quad Hit-Test (inflate), Plots vor Sitz-Hits
- **Personen-Sidebar:** ohne Gegner / ohne Freie-Plätze (kein Seat-Cap)
- **Scoreboard live:** 0:0 · Minute · Momentum (Blank-Chrome + Overlays)
- **Währungsbar:** fix rechts der Sidebar, 2× Größe
- **FX-Logos:** gain/spend Währungen + Momentum
- **Gang:** obere Hälfte weg, Frontlinien perspektivisch
- **Kampf:** langsamer + rote Damage-Pops
- **Gebäude:** Floor-Grid-Perspektive; Neutral = 2× Ordnerposten
- **Personen:** Tribünen-Deck, Ultras −10% / Rest +30%

## Live

**Play:** https://nil-ambassador-location-saskatchewan.trycloudflare.com

Handy quer / Vollbild empfohlen. Hard-Refresh bei Cache.

## Lokal

```bash
cd game && npm install && npm run build && npm run preview -- --host 0.0.0.0 --port 4177
```
