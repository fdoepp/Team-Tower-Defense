# Screen-Layout A2c — festgehaltene Regeln (noch nicht implementiert)

## Ansicht
- Kleines halbes Spielfeld oben (Score, Minute, Momentum L/Mitte/R)
- 5 Blöcke im Bogen, **zum Spielfeld hin ausgerichtet**
  - Links: Heim (blau/weiß)
  - Mitte: 3× Neutral (grau)
  - Rechts: Gäste (rot/weiß)
- Pro Block: **4 Bauslots** — **2 oberhalb** und **2 unterhalb** des Gangs (je Seite der Tür)
- Durchgehender **Gang** = Hauptkampfzone
- Stimmungsmeter 4 Segmente an den Außenkanten

## Einheiten (Männchen)
- Optisch klar getrennt: **Ultra** / **Normal** / **Familie**
- Start: im **eigenen Block** genau die **10 gewählten** Einheiten
- Einheiten wandern zwischen **Block ↔ Bierstand ↔ Kampf**

## Verhalten
1. **Durst** → laufen automatisch zum (eigenen/besetzten) Bierstand
2. Am Stand: **verteidigen** automatisch ODER versuchen, sich zum **nächsten bestückten Stand** durchzukämpfen
3. **Aktiv:** Ultra-Trupps aus dem Stadion/Block in den **Gang beordern**

## Wachstum
- Mit der Zeit: neue Einheiten im Block **erhalten oder kaufen**

## Standarten (Besitz / Front) — kanonisch

Festgelegt (Vorschlag A): **Holzpfosten + einfache Streifenfahne** im Stand-Stil.
Kein Team-Schriftzug, kein metallischer Ständer.

| Team | Farbe | Asset (Deploy-Quelle) |
|---|---|---|
| Heim / KSC | blau-weiß | `game/public/icons/ui/pennant-ksc.png` |
| Gäste / VfB | rot-weiß | `game/public/icons/ui/pennant-vfb.png` |

**Pflicht für jedes neue Spiel / jeden Deploy:**
- Besitz und Front am Gang **nur** über diese beiden Standarten zeichnen.
- Runtime-Binding: `UI_ICONS.pennantKsc` / `UI_ICONS.pennantVfb` in `game/src/game/assets.ts`.
- Register: `docs/mockups/icons/ASSET_DB.json` (`locked: true`).
- Alte Logo-/Chrom-Wimpel dürfen nicht mehr geladen oder neu generiert werden.

## Bauplatz (leer / eigener) — kanonisch + Auto-Swap

Design: **vier Holzpfosten + Seil**, Steinrand, Erde, `+` (Vorschlag C).  
Deploy-Default-Orientierung: **parallel** zum Bildrand (`SLOT_EMPTY_ORIENTATION`).

| Zustand | Bedeutung | Asset (parallel-Default) |
|---|---|---|
| Grau / Neutral | Bereich nicht team-kontrolliert — **keine** Standarte | `slot-empty-parallel.png` (= `slot-empty.png`) |
| Team blau (KSC) | Eigener/kontrollierter Bauplatz — bauen erlaubt | `slot-empty-parallel-blue.png` |
| Team rot (VfB) | Eigener/kontrollierter Bauplatz — bauen erlaubt | `slot-empty-parallel-red.png` |

### Pflicht für jedes neue Spiel / jeden Deploy
1. Diese Bauplatz-Assets aus `game/public/icons/ui/` laden (Preload über `preloadIcons()` / `slotEmptyIconPath`).
2. **Automatischer Austausch zur Laufzeit** (kein manuelles Icon-Setzen im Match-Code außer über die Helper):
   - Kontrolle **Team** (Slot-Owner oder Blockkontrolle + Frontlinie/`inPlayerTerritory`/`inAiTerritory`) → Icon **mit** Standarte in Teamfarbe.
   - Kontrolle **grau/neutral** (`greyNeutral`, `owner === "neutral"`, oder Block wieder grau) → Standarte **fällt weg**, wieder neutrales Plot-Icon.
3. Implementierung:
   - `slotEmptyIconPath(control)` in `game/src/game/assets.ts`
   - `slotControlForPlot(m, s)` + `drawBaustelle(...)` in `game/src/game/render.ts`
4. Register: `docs/mockups/icons/ASSET_DB.json` · Spiegel: `game/public/icons/ASSET_DB.json`.
5. Alte gelbe Bauzaun-Optik nicht mehr neu generieren; `slot-empty.png` zeigt auf die parallele Neutrale.

## Action Cards (Gebäude + Einheiten) — soft-bound & live balance

Linke und rechte Rail komponieren Karten zur Laufzeit — **keine** eingebackenen Icon- oder Kosten-Sprites.

### Gebäude
1. Icon: `standIconPath` → `game/public/icons/stands/`
2. Stats: `productionPerMinute` / `productionUnitLabel`
3. Kosten: `BUILD_COST` / `UPGRADE_COST` (Live im Sync)
4. Buttons: `btn-bauen-*` / `btn-upgrade-*`

### Einheiten
1. Icon: `unitIconPath` → `game/public/icons/units/` (Level = zentraler Typ-Level)
2. Kauf-/Senden-/Upgrade-Kosten **im** Button (Live aus `unitBuyCost` / Senden-Konstanten / `UNIT_UPGRADE_COST`)
3. Währung: `currencyIconPath` → `game/public/icons/ui/currency-*.png`
4. Upgrade: `Match.tryUpgradeUnit` (alle Personentypen)
5. Buttons: CSS `.ar-cost-btn` (Grün/Blau/Violett)

Icon- oder Balance-Updates greifen automatisch beim nächsten Deploy/Match-Preload.  
Spec: `docs/mockups/icons/ui-review/btn-vorschlaege/ACTION_CARD.md`.
