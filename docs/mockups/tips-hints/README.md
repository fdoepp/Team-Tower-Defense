# Live-Ticker unter der Momentum-Leiste

Freigabe: prominenter **LIVE**-Ticker direkt unter der Torwahrscheinlichkeits-/Momentum-Leiste auf dem Scoreboard.

## Kanäle (Textfarbe)

| Kanal | Farbe | Inhalt |
|-------|-------|--------|
| `match` | weiß | Spielnachrichten (Anpfiff, TOR, Verlängerung, Schlussphase…) |
| `combat` | rot | Kampfmeldungen & Hinweise (Angriff, Verteidigung, Ordner unter Druck…) |
| `crowd` | blau | Personen- & Stimmungshinweise (Momentum, Kurve, Käufe…) |
| `build` | orange | Bau- & Ressourcenhinweise (Bier knapp, Ausverkauft, gebaut…) |

Runtime: `Match.pushTicker` / `Match.activeTicker` → `drawLiveTicker` in `render.ts`.
