# Test Build — integrierte spielbare Version

Branch: `cursor/test-build-dba3`  
Basis: `cursor/matchday-game-a9b1` (neueste Gameplay-Linie)

## Enthalten (Stand Abgleich mit anderen Agents)

- **Grafik-Kanon** (Currency A/D Entscheidungen): logo-only Währungen (Bier-Schaum weiß), FX, HP-Bars, Slot/Wimpel von Game, Bauen/Upgrade-Buttons, Stadium + Tribünen
- **Personen-Animationen**: laufen / trinken / werfen / kämpfen / jubeln
- **Matchday-Gameplay**: Floor-Grid-Bauplätze, Tribune-Flush, Gang-Kampf, Ordnerposten

Andere Agents geprüft: `bauplatz-gang-main-4235` (Layout-Ports auf main-Linie, ohne vollständigen FX/HP-Kanon), `icon-ui-einzeln-3755` (UI/Scoreboard), `currency-icons-clean-dba3` (Asset-Kanon — Pixel hier identisch).

## Lokal

```bash
cd game && npm install && npm run build && npm run preview -- --host 0.0.0.0 --port 4173
```
