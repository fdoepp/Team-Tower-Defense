# Gebäude-Kacheln

Freigabe-Vorschau für **Neubau** + **Upgrade** (Bierstand / Fanshop / Ordnerposten).

## Soft-Binding (Runtime)

Die PNGs hier sind **nur Mockups**. Im Spiel werden Karten zur Laufzeit gebaut:

- Icons: `standIconPath(kind, teamColor, level)` → `game/public/icons/stands/…`
- Stats: `productionPerMinute` / `productionUnitLabel`
- Kosten: `BUILD_COST` / `UPGRADE_COST`
- Buttons: `UI_ICONS.btnBauen*` / `btnUpgrade*`

Icon-Updates an den Buden greifen automatisch — keine neuen Kachel-Assets nötig.

## Layout (freigegeben)

**Upgrade:** Titel · Icons vorher→nachher · Stats /min · Kosten auf Holz · UPGRADE  
**Neubau:** Titel · Lv1-Icon · Kosten · BAUEN  

Siehe `upgrade-alt/` und `ACTION_CARD.md`.
