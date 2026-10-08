# UI Final DB

Zentrale Freigabe-Datenbank für **alle** Runtime-Grafiken (Personen, Gebäude, UI, Tribünen).

| | |
|---|---|
| Source of Truth | `docs/icons/ui-final/UI_FINAL_DB.json` |
| Runtime-Spiegel + Dateien | `game/public/icons/ui-final/` |
| Warteschlange | `docs/icons/ui-final/pending/` |
| Nummerierte Liste | [`PENDING_INDEX.md`](./PENDING_INDEX.md) |
| TS-Resolver | `game/src/game/uiFinal.ts` |

## Regeln

1. **Freigabe Pflicht** — Ablage in `released` nur nach manueller Freigabe (`approve --by`).
2. **Freigestellt** — PNG RGBA-Cutout (Ausnahme: dokumentierte Rails).
3. **preserveAspect** — Runtime nur mit uniformer Skalierung (`drawIcon`), nie verzerren.

## Bestand (pending)

Siehe [`PENDING_INDEX.md`](./PENDING_INDEX.md) und `FINAL_ICON_INVENTORY.md`.

Abgestimmt mit: unit-icons-agent, icon-ui-einzeln, matchday-icons, Konzept-Agent.

## Befehle

```bash
node scripts/ui-final/propose.mjs path/to/icon.png --id camelId --role unit|stand|ui|scene
node scripts/ui-final/approve.mjs <id> --by <name>
node scripts/ui-final/sync.mjs
node scripts/ui-final/check.mjs
```
