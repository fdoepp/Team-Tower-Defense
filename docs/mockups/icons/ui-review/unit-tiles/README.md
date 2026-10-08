# Einheiten-Kacheln

Mock only. Runtime: `syncUnitActionCards` — `unitIconPath` + `unitBuyCost` / Senden-Konstanten / `UNIT_UPGRADE_COST` + neueste Currency-Icons.

## Layout (Freigabe)

```
Titel ×Count
Figur-Icon (Level = Typ-Level)
[ KAUFEN  💰 n ]
[ SENDEN  💰 n ]   ← nur Ultras / Hooligans
[ UPGRADE 💰 n ]
```

Kosten stehen **im** Button (kein Extra-Chip). Soft-bound: Icons und Zahlen kommen live aus `types.ts` / `unitIconPath` / `currencyIconPath`.

Beispiel-Freigabe: [`examples/ultras-upgrade-cost-in-btn-blue.png`](examples/ultras-upgrade-cost-in-btn-blue.png)
