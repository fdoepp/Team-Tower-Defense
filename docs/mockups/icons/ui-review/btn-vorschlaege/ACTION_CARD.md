# Verknüpfung Objekt · Preis · Button

## Prinzip

**Der Button sagt nur die Aktion** (KAUFEN / SENDEN / BAUEN / UPGRADE).  
**Objekt und Preis stehen immer daneben/darüber in derselben Karte** — nie als Text *im* Button-Asset (sonst müssten wir für jede Kostenstufe neue PNGs machen).

```
┌─────────────────────────────────────┐
│  [Objekt-Icon]   Name        ×Count │
│                  [Währungs-Chip] 12 │
│  ┌───────────────────────────────┐  │
│  │         KAUFEN / SENDEN       │  │  ← Holz-Bar, nur Verb
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

Eine Karte = **ein Objekt**. Mehrere Aktionen am gleichen Objekt = mehrere Buttons in der Karten-Fußzeile (z. B. Ultras: KAUFEN + SENDEN).

## Warum so?

| Alternative | Problem |
|---|---|
| Preis im Button-Bild („KAUFEN 22“) | Jede Preisänderung = neues Asset; Upgrade-Kosten dynamisch |
| Nur Button, Objekt woanders | Unklar, *was* gekauft wird |
| Preis nur im Top-Wallet | Kein Bezug zur Zeile |
| **Action Card** | Klar, wiederverwendbare Buttons, Live-Kosten als Text/Chip |

## Regeln (einheitlich)

1. **Icon links** = was du bekommst (Figur Lv1 / Stand Lv1 bzw. Upgrade before→after).
2. **Name** direkt am Icon.
3. **Preis** als Chip: Währungs-Icon (`currency-*.png`) + Zahl — gleiche Chips wie im Top-HUD.
4. **Button unten** = nur Aktion; Farbe nach Typ (Grün/Blau/Amber/Violett).
5. **Disabled**: Button grau *und* Chip leicht abdunkeln, wenn Ressource fehlt.
6. **Kein zweites Popup**, wenn die Rail-Karte schon alles zeigt — Popup nur bei Tap auf freien Sitz (optional).

## Mapping Hof

| Kontext | Objekt | Preis | Button |
|---|---|---|---|
| Linke Rail · Fans | Fan-Icon | Sicherheit | KAUFEN |
| Linke Rail · Ultras | Ultra-Icon | Fanartikel | KAUFEN + SENDEN |
| Linke Rail · Hooligans | Hooligan-Icon | Bier | KAUFEN + SENDEN |
| Linke Rail · Ordner | Ordner-Icon | Gold | KAUFEN (Anheuern) |
| Rechte Rail · Neubau | Stand-Icon Lv1 | Gold | **BAUEN** (nicht Kaufen-Asset) |
| Rechte Rail · Upgrade | LvN → LvN+1 Icons | Gold (dynamisch) | **UPGRADE** |

## Touch

- Karte min. ~72 dp hoch; Button-Bar in der Karte min. ~44–48 dp.
- Ganze Karte darf *selektieren*, aber **kaufen/senden/bauen** nur über den Button (kein Fehlkauf).

## Implementierung (bestehend → Ziel)

Heute schon nah dran (`ur-row` / `build-card`). Ziel-Anpassung:

- Bau-Karten: `build-kaufen` → **BAUEN**-Asset (amber).
- Upgrade: `rail-upgrade` → **UPGRADE**-Asset + Chip mit Live-Kosten.
- Kostenzeile immer als Chip mit `currency-*.png`, nicht nur Text „12 Sicherheit“.

Siehe Mock: `preview-action-card.jpg` / `action-card-pattern` unter Artifacts.
