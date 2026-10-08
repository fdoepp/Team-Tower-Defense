# Victory playthrough

Use when an active LaneLink QA Auftrag asks for playability through to a win.

## Preconditions

1. Call `resolve_game_target` first.
2. Boot or open the returned URL. Prefer local `game/` vite on the branch under test over Cloudflare tunnels or stale Pages.
3. Viewport: landscape, roughly 1200×700+.

## Path

1. Menu → **Solo vs KI** → valid Fan-Mix → **Anpfiff**.
2. Economy: build Bierstand / Ordnerposten / Fanshop when gold allows; hire fans (Sicherheit / Fanartikel / Bier).
3. Use HUD actions: **Gesang**, **Pyro**, **Pyro Wurf**, **Angriff**; Ordner hire/patrol when relevant.
4. Keep playing through regular time → ET → pens if needed.
5. Stop only when victory is reached or the run is blocked (crash, unwinnable soft-lock, missing build).

## Victory

- **Spielsieg (primary):** score win after Momentum/Tore; match `phase=ended`.
- **Blocksturm (rare):** 3 Ultras × 5s in enemy block.

## Evidence

Per step: note pass/fail. Screenshot paths if available. Call `record_qa_report` once at the end with `reachedVictory` and `victoryKind`.
