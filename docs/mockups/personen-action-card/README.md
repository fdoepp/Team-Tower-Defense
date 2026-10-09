# Personen-Action-Card — Vorschläge A & B

**Status:** Vorschlag zur Freigabe  
**Mocks:** [A — horizontal](./index.html) · [B — vertikal](./index-b.html) · [Vergleich](./compare.html)

## Ziel

Vier Personen-Karten (Fans, Ultras, Hooligans, Ordner) in der **linken Rail**, Handy-Querformat, **ohne Scroll**.  
Optik an **Holzrahmen-Buttons** und **Menu-Rail-Holz**. Keine „Einheiten gesamt“-Zeile.

---

## Vorschlag A — Buttons nebeneinander

```
┌─────────────────────────────────────┐
│ [Kopf]  Name LvN              ×n    │
│         ┌────────┬────────┬───────┐ │
│         │ KAUF   │ SEND*  │  UP   │ │
│         │ 🪙 12  │ 👕 6   │ 🪙 22 │ │
│         └────────┴────────┴───────┘ │
└─────────────────────────────────────┘
```

\* SENDEN nur Ultras + Hooligans. Kurzlabels in der engen Rail.

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

| | A horizontal | B vertikal |
| --- | --- | --- |
| Label-Lesbarkeit | Kurzlabels nötig bei 3 Buttons | Volle Wörter gut möglich |
| Touch-Höhe | Sehr gut (≥58px) | Flacher (~28–36px bei 3 Actions), aber breit |
| Holz-Chrome | Risiko zu stauchen | Näher an 320×96-Querformat |
| Kosten vergleichen | Schnell nebeneinander | Eher von oben nach unten |
| Rail-Breite | Braucht ~40% | Kommt mit ~36% klar |

**Empfehlung:** B für Alltag / Holz-Look; A wenn horizontales Kosten-Scanning wichtiger ist.  
Details: [compare.html](./compare.html).

### Sieht das im Spiel genauso aus?

- **Ja für Assets & Live-Text** — beide nutzen `btn-*-chrome` + Rail-Tile; Kosten/Labels bleiben Live (STORAGE_CANON).
- **B:** geringeres Abweichungsrisiko (breite Zeilen verzeihen Font/Padding).
- **A:** mittleres Risiko, wenn die echte Rail schmaler wird — dann wieder Stauchen/Kurzlabels.

---

## Regeln (beide)

1. Kosten im Button (Verb + Währungs-Icon + Zahl) als Live-Text.
2. Button-Chrome = Holzrahmen + Fläche (`btn-*-chrome.png`).
3. Icon = aktuelle Unit-Stufe (`unitIconPath`).
4. Zahlen aus `BUY_COST` / `PYRO_FIGHT_MERCH` / `HOOLIGAN_ORDER_BEER` / `unitUpgradeCost`.
5. Rail-Hintergrund = `menu-rail-brown-tile`.

Siehe [`docs/icons/ui-final/STORAGE_CANON.md`](../../icons/ui-final/STORAGE_CANON.md).
