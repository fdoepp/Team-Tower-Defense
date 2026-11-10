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

## Deploy (Vercel — preferred auto-deploy path)

Cursor Cloud Agents can publish this folder via **Vercel**. After the first link, **commits to the default branch auto-deploy** (no per-update Publish confirm in Cursor Apps).

Official steps: [Cloud Agent setup → Publish to a live URL](https://cursor.com/docs/cloud-agent/setup#publish-to-a-live-url)

1. In Cursor, open the **Agents Window** for this cloud agent.
2. Connect a **Vercel** account (Add Vercel / plugin if prompted). Team plans need a Vercel team above Hobby.
3. Choose **Publish** above the agent input.
4. Set the Vercel project **Root Directory** to `companion` (monorepo; `vercel.json` lives there).
5. Deploy. Later merges/pushes to the **default branch** (`main`) redeploy automatically.

SPA routing is covered by `companion/vercel.json` rewrites to `index.html`.

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
| Unit icons | Official CDN (`cdn.legiontd2.com/icons/{Name}.png`) + glyph fallback; **private use only** |

## Data & icons

- **Seed JSON/TS** under `src/data/` with source comments. Prefer official API (`https://apiv2.legiontd2.com/`) when an API key is available — none is bundled.
- **Icons (private companion):** Loads official art from `https://cdn.legiontd2.com/icons/{Name}.png` © AutoAttack Games. **Private use only** — do not publicly redistribute assets. On 404/offline, original SVG role glyphs are shown as fallback.
- Mechanics that are uncertain are labeled with `confidence` / `incomplete`.

### Private-use notice

This app is intended as a **personal / private** companion. CDN icons remain copyrighted by AutoAttack; this repo must not be treated as a public icon mirror or asset host.

## Stack

Vite + React + TypeScript + React Router. Mobile-first CSS, PWA manifest included (no service worker yet).
