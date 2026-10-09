# Personen-Action-Card — Vorschlag

**Status:** Vorschlag zur Freigabe  
**Preview:** [index.html](./index.html) · Artifacts `personen-card-proposal.png`

## Ziel

Vier Personen-Karten (Fans, Ultras, Hooligans, Ordner) in der **linken Rail**, Handy-Querformat, **ohne Scroll**.

## Layout (pro Karte)

```
┌─────────────────────────────────────┐
│ [Kopf]  Name LvN              ×n    │
│         ┌────────┬────────┬───────┐ │
│         │KAUFEN  │SENDEN* │UPGRADE│ │
│         │ 🪙 12  │ 👕 6   │ 🪙 22 │ │
│         └────────┴────────┴───────┘ │
└─────────────────────────────────────┘
```

\* SENDEN nur Ultras + Hooligans.

## Eng vs. breit

In der schmalen Rail (~194px): Kurzlabels **KAUF / SEND / UP** + Icon + Zahl.
Detail/breitere Karten: volle Wörter **KAUFEN / SENDEN / UPGRADE**.

## Regeln

1. **Kosten im Button** — Verb + Währungs-Icon + Zahl (Live-Text).
2. **Keine Extra-Preiszeile** unter dem Namen (spart ~14px × 4 Karten).
3. Button-Mindesthöhe **44px** (Touch).
4. Farben: Kaufen grün · Senden blau · Upgrade violett · disabled grau.
5. Icon links = aktuelle Unit-Stufe (Soft-Bind aus `unitIconPath`).
6. Zahlen aus `BUY_COST` / `PYRO_FIGHT_MERCH` / `HOOLIGAN_ORDER_BEER` / `unitUpgradeCost` — nicht ins PNG backen.

## Maß (844×390 Querformat)

| Element | Maß |
| --- | --- |
| Linke Rail | ~23% ≈ 194px |
| Banner + „Einheiten“ | ~34px |
| Pro Karte | ~78px |
| Buttons | ≥ 44px hoch |

## Bezug Ablage

Siehe [`docs/icons/ui-final/STORAGE_CANON.md`](../../icons/ui-final/STORAGE_CANON.md) — Button-PNGs sind nur Chrome; Kosten = Live.
