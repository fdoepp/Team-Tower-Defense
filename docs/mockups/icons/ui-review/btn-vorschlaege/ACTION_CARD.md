# Verknüpfung Objekt · Preis · Button

## Prinzip

**Personen-Karten:** Aktion **und** Live-Kosten im Button (`KAUFEN 14`, `SENDEN 6`, `UPGRADE 35`) — spart Zeilen bei drei Aktionen.  
**Gebäude-Karten:** Button sagt nur die Aktion; Preis als Chip darüber (dynamische Upgrade-Stufen).

```
┌─────────────────────────────────────┐
│           Name              ×Count  │
│         [Objekt-Icon]               │
│  ┌───────────────────────────────┐  │
│  │  KAUFEN / SENDEN / UPGRADE  n │  │  ← Verb + Währungs-Icon + Zahl
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

Eine Karte = **ein Objekt**. Mehrere Aktionen am gleichen Objekt = mehrere Buttons (z. B. Ultras: KAUFEN + SENDEN + UPGRADE).

## Warum so?

| Alternative | Problem |
|---|---|
| Preis als gebackenes Button-PNG | Jede Preisänderung = neues Asset |
| Nur Button, Objekt woanders | Unklar, *was* gekauft wird |
| Preis nur im Top-Wallet | Kein Bezug zur Zeile |
| **Action Card + Live-Text im Button** | Klar, dynamische Kosten ohne neue PNGs |

## Regeln (einheitlich)

1. **Icon links** = was du bekommst (Figur Lv1 / Stand Lv1 bzw. Upgrade before→after).
2. **Name** direkt am Icon.
3. **Preis:** Personen → Währungs-Icon + Zahl *im* Button; Gebäude → Chip über dem Button.
4. **Button unten** = Aktion (+ Kosten bei Personen); Farbe nach Typ (Grün/Blau/Amber/Violett).
5. **Disabled**: Button grau, wenn Ressource fehlt.
6. **Kein zweites Popup**, wenn die Rail-Karte schon alles zeigt — Popup nur bei Tap auf freien Sitz (optional).

## Mapping Hof

| Kontext | Objekt | Preis | Button |
|---|---|---|---|
| Linke Rail · Fans | Fan-Icon | im Button | KAUFEN + UPGRADE |
| Linke Rail · Ultras | Ultra-Icon | im Button | KAUFEN + SENDEN + UPGRADE |
| Linke Rail · Hooligans | Hooligan-Icon | im Button | KAUFEN + SENDEN + UPGRADE |
| Linke Rail · Ordner | Ordner-Icon | im Button | KAUFEN + UPGRADE |
| Rechte Rail · Neubau | Stand-Icon Lv1 | Gold | **BAUEN** (nicht Kaufen-Asset) |
| Rechte Rail · Upgrade | LvN → LvN+1 Icons | Gold (dynamisch) | **UPGRADE** |

## Touch

- Karte min. ~72 dp hoch; Button-Bar in der Karte min. ~44–48 dp.
- Ganze Karte darf *selektieren*, aber **kaufen/senden/bauen** nur über den Button (kein Fehlkauf).

## Soft-Binding (Pflicht) — Icons **und** Balance-Werte live

Action Cards **backen weder Icons noch Kosten ein**. Sync liest immer aus `types.ts` / Pfad-Helpern.

### Gebäude

| Schicht | Quelle |
|---|---|
| Icon | `standIconPath` → `icons/stands/…` |
| Name | `BUILDING_FULL_LABEL` |
| Stats (Upgrade) | `productionPerMinute` / `productionUnitLabel` |
| Kosten | `BUILD_COST` / `UPGRADE_COST` |
| Button | `btnBauen*` / `btnUpgrade*` |

### Einheiten

| Schicht | Quelle |
|---|---|
| Icon | `unitIconPath` → `icons/units/…` (Level = zentraler Typ-Level) |
| Name | `UNIT_FULL_LABEL` (+ `LvN` ab Stufe 2) |
| Kaufkosten | `unitBuyCost` ← `BUY_COST` / `STEWARD_HIRE_GOLD` (im Button) |
| Senden-Kosten | `PYRO_FIGHT_MERCH` / `HOOLIGAN_ORDER_BEER` (im Button) |
| Upgrade-Kosten | `UNIT_UPGRADE_COST` / `unitUpgradeCost` (Gold, im Button) |
| Währung | `currencyIconPath` → neueste `currency-*.png` |
| Typ-Level | `Match.unitLevels` · `tryUpgradeUnit` |
| Button | CSS `.ar-cost-btn` (Grün/Blau/Violett) — Live-Text, keine gebackenen Kosten-PNGs |

Balance-Änderungen an Gold/Sicherheit/Bier/Fanartikel oder Produktionsraten erscheinen in der UI ohne neue Kachel-PNGs.

Runtime: `syncPendingBuildUi` / `syncUpgradeActionCard` / `syncUnitActionCards` in `main.ts`.

## Implementierung

- Linke Rail · Personen: `.action-card.unit-card` + `.ar-cost-btn` **KAUFEN** (+ **SENDEN**) + **UPGRADE**
- Rechte Rail · Neubau/Upgrade: `.action-card.build-card` / `.upgrade-card`
