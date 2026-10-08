# LaneLink — Stadion Team-TD

Kurzes **2D-Handy-Minigame** (~5 Min ≈ 90′): Fans auf den Rängen (TD) + Fußball auf dem Platz. Flavor: **KSC vs. VfB**.

## Spielen (Handy-Link)

**Live:** https://menus-burton-valium-progressive.trycloudflare.com  

### Vollbild (wichtig)

Im normalen Safari/Chrome-Tab bleiben Adressleiste und Tabs — das Spielfeld wird unbrauchbar klein.

1. Link öffnen → **Vollbild** tippen (oder beim Match-Start **Vollbild starten**)
2. Handy **quer** halten
3. **iPhone:** Teilen → **Zum Home-Bildschirm** → LaneLink von dort starten (echtes Vollbild ohne Tabs)

Hard-Refresh, falls noch die alte Version cached ist.

Lokal:

```bash
cd game
npm install
npm run dev
```

Dann http://localhost:5173/ (Portrait/Handy-Breite ideal). **Solo vs KI** ist spielbar.

Dauerhaftes Hosting: Branch `gh-pages` ist vorbereitet. In GitHub → Settings → Pages → Source **Deploy from a branch** → `gh-pages` / `/` speichern. Danach: `https://fdoepp.github.io/Team-Tower-Defense/`

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
