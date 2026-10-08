# Test Build — integrierte spielbare Version

Branch: `cursor/test-build-dba3`  
Basis: `cursor/matchday-game-a9b1` (neueste Gameplay-Linie)

## Enthalten (Stand Abgleich mit anderen Agents, 2026-10-08)

- **Grafik-Kanon** (`currency-icons-clean-dba3` A/D): logo-only Währungen (Bier-Schaum weiß), FX, HP-Bars, Slot/Wimpel, Bauen/Upgrade, Stadium + Tribünen — Pixel-Hashes identisch
- **Personen-Heads** (`icon-ui-einzeln-3755`): neueste freigestellte Rail-Heads (60 PNGs)
- **Unit-/Stand-Bodies**: Matchday/Bauplatz/Unit-Icons-Linie (farbige Fans/Stände)
- **Personen-Animationen**: laufen / trinken / werfen / kämpfen / jubeln
- **Matchday-Gameplay**: Floor-Grid-Bauplätze, Tribune-Flush, Gang-Kampf, Ordnerposten, Scoreboard-Cutout

Andere Agents geprüft: `bauplatz-gang-main-4235` (Layout auf main, ältere Currency-Pixel), `icon-ui-einzeln-3755` (Heads + Scoreboard/UI), `currency-icons-clean-dba3` (Asset-Kanon), `matchday-icons-a9b1`, `unit-icons-agent-4235`, `team-td-konzept-dba3` (älter, kein Gameplay-Tip).

## Live

**Play:** https://principle-suggest-stages-rolls.trycloudflare.com

Handy quer / Vollbild empfohlen.

## Lokal

```bash
cd game && npm install && npm run build && npm run preview -- --host 0.0.0.0 --port 4176
```
