# LaneLink — Stadion Team-TD

Kurzes **2D-Handy-Minigame** (~5 Min ≈ 90′): Fans auf den Rängen (TD) + Fußball auf dem Platz. Flavor: **KSC vs. VfB**.

## Spielen (Handy-Link)

**Live:** https://larry-truth-wings-creatures.trycloudflare.com  

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

## Visuelles Match-Layout (verbindlich)

Ab sofort für Implementierungen:

- **Hintergrund:** `game/public/assets/stadium-floodlight-derby-bg.jpg` (volle Ränge, Flutlicht, blanke Anzeigetafel oben)
- **Tribünen darauf:** `tribune-block-blue.png` / `tribune-block-grey.png` / `tribune-block-red.png` in der richtigen Skalierung einbetten (ohne Figuren im Asset — Units rendert das Spiel)
- **Währungen:** Logo-only Icons `docs/mockups/icons/ui/currency-{gold,bier,fanartikel,sicherheit}.png` (Anzahl nur im HUD-Text)
- **Bierstand:** final — immer `game/public/icons/stands/bier-{blue\|red\|grey}-{1..5}.png` (bei jeder weiteren Spielcode-Änderung diese Assets laden)
- **Fanshop:** final — immer `game/public/icons/stands/fanshop-{blue\|red\|grey}-{1..5}.png` (Fähnchen nur Lv2; ebenfalls bei jeder Code-Änderung verbindlich)
- **Ordnerposten:** final — immer `game/public/icons/stands/ordner-{blue\|red\|grey}-{1..5}.png` via `ordnerStandPath` in `game/src/assets/stands.ts` (Kanon: `docs/icons/ORDNERPOSTEN_CANON.md`; bei jedem Deployment / Spielaufsetzen nur diese Gebäude)
- **Gesundheitsbalken:** final — immer `ui/hp-bar-unit-*.png` / `ui/hp-bar-building-*.png` via `game/src/assets/hpBars.ts` (Kanon: `docs/icons/HP_BARS_CANON.md`; bei jedem Deployment nur diese Bars)
- **Währungs-/Momentum-FX:** final — `ui/fx-gain|spend-{gold,bier,fanartikel,sicherheit}.png` + `ui/fx-gain-momentum.png` via `game/src/assets/currencyFx.ts` (Kanon: `docs/icons/CURRENCY_FX_CANON.md`)
- **Noch fehlende Freisteller:** Audit `docs/icons/ASSET_GAP_AUDIT.md` (Tribünen/BG auf diesem Branch, ANWERBEN/BAUEN-Buttons, Status-Icons Durst/Interesse/Stimmung/Pyro/Fremdtrinken)

Siehe auch `.cursor/rules/stadium-background.mdc` (`alwaysApply`).

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
