# Test Build — integrierte spielbare Version

Branch: `cursor/test-build-dba3`  
Basis: `cursor/matchday-game-a9b1` + Fixes aus Agent-Abgleich

## Enthalten

- **Personen-Sidebar (icon-ui):** Kopf links, Kaufen / Senden / Upgrade rechts daneben
- **Grafik-Kanon:** Currency A/D, FX/HP, Slot/Wimpel, Stadium + Tribünen, freigestellte Heads
- **Gebäude:** fest gepflanzt (kein Idle-Bob / keine Bewegungs-Animation)
- **Gang-Personen:** deutlich größer (Gang-Band + Bewegung)
- **Tribünen:** tieferer Abschluss (Floor-Grid nach unten, Shelf über Far-Bau)
- **Neutrale:** keine Capture-Ringe / keine teamfarbenen Sitz-Pads
- **Matchday-Gameplay:** Floor-Grid, Tribune-Flush, Gang, Animationen, Unit-Upgrades

## Live

**Play:** https://column-mia-instruments-volt.trycloudflare.com

Handy quer / Vollbild empfohlen. Hard-Refresh bei Cache.

## Lokal

```bash
cd game && npm install && npm run build && npm run preview -- --host 0.0.0.0 --port 4177
```
