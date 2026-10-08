# Einheiten-Kacheln

Mock only. Runtime: `syncUnitActionCards` — `unitIconPath` + `unitBuyCost` / Senden-Konstanten / `UNIT_UPGRADE_COST` + neueste Currency-Icons.

## Layout (Freigabe)

```
Titel                              ×Count
[Figur]  [ KAUFEN  💰 n ]
         [ SENDEN  💰 n ]   ← nur Ultras / Hooligans
         [ UPGRADE 💰 n ]
```

Icon links neben den Buttons (kompakt, alle 4 Typen untereinander sichtbar).  
Keine Gegner-Fanbase in der linken Rail.  
Kosten **im** Button. Soft-bound: `unitIconPath` / `currencyIconPath` / Live-Preise.
