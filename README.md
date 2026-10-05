# LaneLink — Stadion Team-TD

Kurzes **2D-Handy-Minigame** (~5 Min ≈ 90′): Fans auf den Rängen (TD) + Fußball auf dem Platz. Flavor: **KSC vs. VfB**.

## Spielen

```bash
cd game
npm install
npm run dev
```

Dann im Browser öffnen (Portrait/Handy-Breite ideal). **Solo vs KI** ist spielbar.

## Dokument

- **[Game Design Concept](docs/GAME_DESIGN.md)** — vollständiges Konzept

## Implementiert (Prototyp)

- Solo vs KI (Schwierigkeit + Verhalten einstellbar)
- Architect-Setup: Fan-Mix (10 Punkte) + Starttower
- Kurva-TD: Slots, Towers, Waves, Leaks
- Bier / Durst / Interesse / Stimmung / Pyro / Fremdtrinken
- Spielzüge → Tore, Kummerbier, Fieberphase
- Early Wins: Bier & Stimmung (reguläre Zeit); Curva-Kill bei HP 0
- 90′ → Verlängerung → Elfmeter (kein Unentschieden)

## Noch nicht

- Echter 2P-Koop / Versus-Online
- Sushi-Band-UI (Versus)
- Supplier-Rolle getrennt spielbar
