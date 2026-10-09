# Personen-Action-Card — Vorschläge A & B

**Status:** Vorschlag zur Freigabe  
**Mocks:** [A — horizontal](./index.html) · [B — vertikal](./index-b.html) · [Vergleich](./compare.html)

## Ziel

Vier Personen-Karten (Fans, Ultras, Hooligans, Ordner) in der **linken Rail**, Handy-Querformat, **ohne Scroll**.  
Optik an **Holzrahmen-Buttons** und **Menu-Rail-Holz**. Keine „Einheiten gesamt“-Zeile.

---

## Vorschlag A — ohne Icons, Original-Buttons

```
┌─────────────────────────────────────┐
│ Ultras (Lvl.1, x3)                  │
│ ┌──────────┬──────────┬───────────┐ │
│ │ KAUFEN   │ UPGRADE  │ SENDEN*   │ │  ← Original-Holzbuttons
│ │   🪙 12  │   🪙 22  │   👕 6    │ │  ← Kosten live
│ └──────────┴──────────┴───────────┘ │
└─────────────────────────────────────┘
```

Reihenfolge: **Kauf → Upgrade → Send**. \* SENDEN nur Ultras + Hooligans.  
Keine Personen-Icons. Titel wie B.  
Button-Breiten %-anteilig in der beigen Box: Triple `3%·30%·2%·30%·2%·30%·3%`, Dual `3%·46%·2%·46%·3%`.

## Vorschlag B — Buttons untereinander

```
┌─────────────────────────────────────┐
│ Ultras (Lvl.1, x3)                  │
│ [Kopf]  ┌─────────────────────────┐ │
│         │ KAUFEN           🪙 12  │ │
│         ├─────────────────────────┤ │  ← Gap 2px
│         │ SENDEN           👕 6   │ │
│         ├─────────────────────────┤ │
│         │ UPGRADE          🪙 22  │ │
│         └─────────────────────────┘ │
└─────────────────────────────────────┘
```

Titel über dem Icon; Buttons rechts, volle Resthöhe, sehr kleine Abstände.

---

## Bewertung (Kurz)

| | A horizontal (ohne Icons) | B vertikal |
| --- | --- | --- |
| Labels | Original-PNG (KAUFEN/…) | Live-Wörter auf Chrome |
| Touch-Höhe | Sehr gut (≥56px) | Flacher, dafür breit |
| Portrait | keins | Icon links |
| Kosten vergleichen | Schnell nebeneinander | Eher von oben nach unten |
| Button-Reihenfolge | Kauf → Upgrade → Send | Kauf → Send → Upgrade |

**Empfehlung:** A wenn Original-Buttons + horizontales Scanning; B wenn Portrait + reine Live-Labels.  
Details: [compare.html](./compare.html).

### Sieht das im Spiel genauso aus?

- **A:** Original-Button-PNGs + Live-Kosten — sehr nah am Icon-UI, sofern die Rail breit genug bleibt.
- **B:** Chrome ohne gebackenes Label + Live-Verb — STORAGE_CANON-konform, geringes Layout-Risiko.

---

## Regeln (beide)

1. Kosten im Button (Verb + Währungs-Icon + Zahl) als Live-Text — nie im PNG gebacken.
2. Button-Chrome = Holzrahmen + **eine** Farbfläche (`btn-*-chrome.png`), ohne dunkle Lippe / zweites Feld.
3. Live-Overlay: `2%` Abstand zu allen Innenkanten des Holzrahmens (Breite für L/R, Höhe für T/B).
4. Icon = aktuelle Unit-Stufe (`unitIconPath`).
5. Zahlen aus `BUY_COST` / `PYRO_FIGHT_MERCH` / `HOOLIGAN_ORDER_BEER` / `unitUpgradeCost`.
6. Rail-Hintergrund = `menu-rail-brown-tile`.

Siehe [`docs/icons/ui-final/STORAGE_CANON.md`](../../icons/ui-final/STORAGE_CANON.md).
