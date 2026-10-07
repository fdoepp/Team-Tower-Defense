# td-qa-agent

BDK-QA-Agent für **LaneLink** (Repo Team-Tower-Defense).

## Abgestimmter Pfad (mit anderen Agents)

| Quelle | Rolle |
| --- | --- |
| Gameplay-Branch `cursor/block-spacing-ultra-combat-dba3` | Spielbarer Vite/TS-Build unter `game/` |
| Icons-Branch `cursor/matchday-icons-a9b1` | Matchday-UI-Assets (Kaufen/Senden) |
| Konzept-Branch `cursor/team-td-konzept-dba3` | Design + frühere Prototypen |
| Frühere Playtests | Landscape, Hard-Refresh, keine stale Tunnel-URLs |

**Frage „welche URL?“** bedeutet: wo läuft das Spiel für den Test — lokal `npm run dev` in `game/`, Preview-Deploy, oder Pages. Default hier: lokaler Vite-Port **5173**, Fallback Pages.

## Trigger

| Event | Verhalten |
| --- | --- |
| PR opened / reopened / ready_for_review | Nur **Nachfrage**, ob QA laufen soll |
| PR-Kommentar `/qa` (oder klarer QA-Auftrag) | Voller Lauf bis Sieg + UI-Audit |
| Playground-Auftrag | Voller Lauf |

## Lokal

```bash
cd td-qa-agent
npm install
bdk validate --dir .
bdk info --dir . --json
bdk call resolve_game_target --dir . --input '{}'
bdk eval --dir . --list
```

GitHub-Events (mit Cursor-Login):

```bash
bdk serve --dir . --cursor-events --repo fdoepp/Team-Tower-Defense
```

PR opened → Kommentar mit QA-Nachfrage. Antwort `/qa` → voller Lauf bis Sieg + UI-Audit.
