# UI Final — freigegebene UI-Elemente

**Einzige Quelle für finales UI.** Alle Branches und Agents laden freigegebene UI-Icons aus dieser Datenbank — nicht aus Arbeitskopien, Reviews oder Agent-Outputs.

| | Pfad |
|---|---|
| Source of Truth | `docs/icons/ui-final/UI_FINAL_DB.json` |
| Runtime-Spiegel + Dateien | `game/public/icons/ui-final/` |
| Warteschlange (nicht freigegeben) | `docs/icons/ui-final/pending/` |
| TS-Resolver | `game/src/game/uiFinal.ts` |

## Pflicht-Anforderungen (vor Freigabe)

1. **Freigestellt** — PNG mit Alpha, transparenter Hintergrund (kein Karten-/Sheet-BG). Ausnahme nur dokumentierte Chrome-Hintergründe (`menu-rail-*`).
2. **Proportionen** — natives `width`/`height` in der DB; Runtime zeichnet **nur uniform** (`drawIcon` / `fitUniform` / Contain). Stauchen/Strecken verboten.
3. **Manuelle Freigabe** — kein Icon kommt nach `released`, bevor du es freigibst.

## Workflow

```bash
# 1) Kandidat vorschlagen (kopiert nach pending/ + validiert)
node scripts/ui-final/propose.mjs path/to/icon.png --id pennantKsc

# 2) Validierung (Freistellung + Metadaten)
python3 scripts/ui-final/validate.py docs/icons/ui-final/pending/pennant-ksc.png

# 3) Nach deiner Freigabe in die DB ablegen
node scripts/ui-final/approve.mjs pennantKsc --by fdoepp

# 4) Spiegel + TS-Resolver aktualisieren
node scripts/ui-final/sync.mjs
```

`approve.mjs` verweigert Ablage ohne `--by <name>` und ohne bestandene Validierung.

## Status

| Status | Bedeutung |
|---|---|
| `pendingApproval` | In `pending/`, wartet auf dich |
| `released` | In `game/public/icons/ui-final/`, alle Branches dürfen/müssen es nutzen |

Aktuell: alle bekannten UI-Kandidaten liegen in **pending** — `released` ist absichtlich leer, bis du freigibst.
