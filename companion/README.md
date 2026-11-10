# Legions Begleitapp (MVP)

Responsive **mobile website** companion for [Legion TD 2](https://www.legiontd2.com/) — Live assist + Wiki + Training. **Not** a native iOS/Android app.

Lives in this monorepo under `companion/` (sibling to the Derby Time `game/` project). Product concept: project store `docs/begleitapp-konzept.md`.

## Run

```bash
cd companion
npm install
npm run dev
```

Open the printed local URL (default `http://127.0.0.1:5173`).

```bash
npm run build
npm run preview
```

## What’s in the MVP

| Area | Status |
| --- | --- |
| App shell + bottom tabs (Home / Match / Wiki / Training / Roster) | Done |
| Owned roster + 6 picks, DE↔EN names | Done (localStorage) |
| Match setup: Mastermind vs Legion, strategy chips, focus push | Done |
| 9×14 lane grid + opener placement suggestions | Done (heuristic) |
| Live assist: wave tip + leak/mythium + opponent/send chips | Done (rule-based) |
| Wiki: Legions, strategies, Mastermind fit, build orders, **Campaign per mission** | Seed + stubs |
| Training mini-game | Done (short sessions) |
| Official CDN icons | Tried with fallback placeholders |

## Data & icons

- **Seed JSON/TS** under `src/data/` with source comments. Prefer official API (`https://apiv2.legiontd2.com/`) when an API key is available — none is bundled.
- **Icons:** `https://cdn.legiontd2.com/icons/{Name}.png` with on-error initials fallback. Assets © AutoAttack Games. Fan-tool use with attribution; **confirm license** with AutoAttack before a public release (`press@autoattack.net` / press kit).
- Mechanics that are uncertain are labeled with `confidence` / `incomplete`.

## Stack

Vite + React + TypeScript + React Router. Mobile-first CSS, PWA manifest included (no service worker yet).
