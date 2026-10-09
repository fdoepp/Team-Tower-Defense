# Personen-Action-Card — Vorschlag A

**Status:** Vorschlag zur Freigabe  
**Preview:** [index.html](./index.html) · `preview-rail.png` · `preview-ultras.png`

## Ziel

Vier Personen-Karten (Fans, Ultras, Hooligans, Ordner) in der **linken Rail**, Handy-Querformat, **ohne Scroll**.  
Optik an den **Holzrahmen-Buttons** (Kaufen/Senden/Upgrade) und dem **Menu-Rail-Holz** — nicht an Flat-CSS-Buttons.

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
Keine „Einheiten gesamt“-Zeile mehr — Platz geht an Karten/Buttons.

## Eng vs. breit

In der schmalen Rail (~194px): Kurzlabels **KAUF / SEND / UP** + Icon + Zahl.  
Detail/breitere Karten: volle Wörter **KAUFEN / SENDEN / UPGRADE**.

## Regeln

1. **Kosten im Button** — Verb + Währungs-Icon + Zahl (Live-Text).
2. **Button-Chrome** = Holzrahmen + Flächenfarbe (Assets `btn-*-chrome.png` im Mockup; Originale aus Icon-UI mit gebackenem Label → für Live-UI nur Chrome).
3. **Keine Extra-Preiszeile** unter dem Namen.
4. Button-Mindesthöhe **46px** (Touch).
5. Farben: Kaufen grün · Senden blau · Upgrade violett · disabled grau.
6. Icon links = aktuelle Unit-Stufe (`unitIconPath`).
7. Zahlen aus `BUY_COST` / `PYRO_FIGHT_MERCH` / `HOOLIGAN_ORDER_BEER` / `unitUpgradeCost` — nicht ins PNG backen.
8. Rail-Hintergrund = `menu-rail-brown-tile` (`rail-tile.png`).

## Maß (844×390 Querformat)

| Element | Maß |
| --- | --- |
| Linke Rail | ~23% ≈ 194px |
| Banner „Personen“ | ~28px |
| Pro Karte | ~84px (ohne Gesamt-Zeile) |
| Buttons | ≥ 46px hoch |

## Bezug Ablage

Siehe [`docs/icons/ui-final/STORAGE_CANON.md`](../../icons/ui-final/STORAGE_CANON.md) — Button-PNGs sind nur Chrome; Label + Kosten = Live.
