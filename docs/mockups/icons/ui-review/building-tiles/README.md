# Gebäude-Kacheln — Freigabe

Action Cards nach Muster: **Objekt · Name · Kosten · Handlungsbutton**.

## Umfang

| Typ | Anzahl | Dateien |
|---|---|---|
| Neubau Lv1 | 6 | `build/{bier\|fanshop\|ordner}-{blue\|red}.png` |
| Upgrade | 24 | `upgrade/{kind}-{color}-{from}to{to}.png` (1→2 … 4→5) |
| **Summe** | **30** | |

Teamfarbe = Stand-Icons (`blue` Heim / `red` Gäste).

## Kosten (aus `game/src/game/types.ts`)

**Neubau:** Bierstand 65 · Fanshop 35 · Ordnerposten 45 Gold  

**Upgrade auf Level:** 2→40 · 3→75 · 4→120 · 5→180 Gold  

## Aufbau

1. Badge NEUBAU / UPGRADE  
2. Icon Lv1 (Neubau) bzw. LvN → LvN+1 (Upgrade)  
3. Name + Level-Zeile  
4. Gold-Chip mit Zahl  
5. Button **BAUEN** (amber) / **UPGRADE** (violett)

## Previews

- `preview-build-all.jpg` — alle 6 Baukacheln  
- `preview-upgrade-blue.jpg` / `preview-upgrade-red.jpg` — je 12 Upgrades  
- Einzeln: `solo/*-solo.jpg`  
- Manifest: `manifest.json`

Noch **nicht** in Runtime verdrahtet — zur Freigabe vorgelegt.
