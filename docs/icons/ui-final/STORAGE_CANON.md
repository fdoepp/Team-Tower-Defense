# UI Final — Ablage-Kanon (Chrome vs Live)

**Status:** verbindlich für pending + neue Releases  
**Stand:** 2026-10-09

## Prinzip

**Kunst = Form. Spiel = Zahlen.**  
Alles, was sich ändert (Score, Minute, Momentum-%, Kosten, Level), gehört **nicht** ins Runtime-PNG.

| Rolle | Ablage | Inhalt |
| --- | --- | --- |
| **Chrome** | `pending/` → nach Freigabe `game/public/icons/ui-final/` | Rahmen, Icons, leere Mulden — ohne Zahlen/Füllstände |
| **Referenz/Demo** | nur Docs / Notes, **nicht** Runtime-Default | Vollbild mit Beispielwerten zur Optik-Freigabe |
| **Slots** | JSON neben dem Chrome | Normkoordinaten 0–1 für Live-Overlays |

## Pflichtregeln

1. **Native Aspect** — PNG in Original-Seitenverhältnis; Zeichnen nur uniform (`drawIcon` / `fitUniform`).
2. **Freigestellt** — RGBA, transparente Ecken (Ausnahme: `menu-rail-*` Hintergrund).
3. **Keine gebackenen Live-Werte** im Runtime-Asset (keine `0:0`, keine `75′`, keine festen %-Balken).
4. **Buttons** — nur Chrome-Farbe/Form (`btn-kaufen-green` …); Label + Kosten als **Live-Text** im Button (`.ar-cost-btn`).
5. **Währungen** — nur Symbol-PNG; Zahl daneben im DOM/Canvas.
6. **Scoreboard** — Runtime = `scoreboardChrome` + Slot-Map; Momentum/Orb-Demos sind Referenz, nicht Deploy-Default.
7. **Bauplatz-Slots** — leere Flaggen-Chrome OK (kein Live-Text nötig).

## Pending-Klassifikation (aktuell)

| IDs / Keys | Klasse | Aktion |
| --- | --- | --- |
| `btnKaufenGreen/Grey`, `btnSendenGrey` | Chrome-Buttons 320×96 (eine Fläche, kein Label) | Pending — Optik freigeben |
| `btnBauenAmber/Grey`, `btnUpgradePurple/Grey`, `btnSendenBlue` | Chrome **freigegeben** (Right-Rail / Baubutton 2026-10-09) | Live-Text im DOM |
| `btnSendenGreen` | **veraltet** | Entfernen — Kanon = `btnSendenBlue` (released) |
| `scoreboardChrome` | Chrome (released, Blank 2026-10-11) | Durchgängiger Holzrand, keine Logos; Runtime + `scoreboard-slots.json` |
| `scoreboardMomentum`, `scoreboardOrbHeim/Gast` | Referenz-Demos | Nicht als Runtime-Default; Notes setzen |
| `slotEmpty*` | Chrome (leer) | Freigabe OK wenn Optik stimmt |

## Personen-Karten (linke Rail — fertig)

**Quelle:** `docs/mockups/personen-action-card/` (Vorschlag A) + Chrome in `game/public/icons/ui-final/btn-{kaufen,upgrade,senden}-*.png` (byte-gleich zu Mockup `btn-*-chrome.png`).

| Regel | Wert |
| --- | --- |
| Layout | Titel `Fans (Lvl.1, xN)` · keine Unit-Icons · KAUF → UP → SEND |
| Dual-Grid | `1%·48%·2%·48%·1%` (Fans, Ordner) |
| Triple-Grid | `1%·32%·1%·32%·1%·32%·1%` (Ultras, Hooligans) |
| Rail-Inset | `1%` der Rail-Innenbreite (safe-area weitet die Rail, nicht den Inset) |
| Chrome | Holz + eine Fläche; Live-Text Holz-Innen + **2%** |
| Banner | Braun (`#6b4428`→`#4a2c18`), nicht blau |

Runtime: `.left-rail .person-card` + `.ar-cost-btn` — **nicht** neu nachbauen; Abstände und Chrome aus dieser Ablage.

### Vorschlag C — ohne Senden (pending Freigabe)

**Quelle:** `docs/mockups/personen-rail-no-senden/`

| Regel | Wert |
| --- | --- |
| Layout | Alle Karten nur KAUF → UP (kein SENDEN) |
| Dual-Grid | `1%·48%·2%·48%·1%` für Fans, Ultras, Hooligans, Ordner |
| Triple-Grid | entfällt |
| Angriff | separater Quadrat-Icon-Button (`btnIconAngriffRed`) |

### Quadrat-Icon-Buttons (freigegeben)

Holzrand + eine Face-Farbe, 256×256 AR 1:1, freigestellt. Icon füllt ~72–78 % der Face; Holz ~7,5 % der Kante. Runtime: `UI_ICONS.btnIcon*` / `iconAngriffBlocksturm`.

| ID | Motiv |
| --- | --- |
| `btnIconUltraBlue` | Blau · Ultra Lv5 |
| `btnIconBierAmber` | Bau-Amber · Bierstand Lv5 |
| `btnIconAngriffRed` | Rot · Angriff/Blocksturm |
| `btnIconSquareRed/Blue/Amber` | leere Face-Chrome |
| `iconAngriffBlocksturm` | Symbol allein (freigestellt) |

## Gebäude-Rail (rechts — freigegeben 2026-10-09)

| Asset | Rolle |
| --- | --- |
| `menuRail` / `menuRailTile` | Holz-Hintergrund der Right-Rail |
| `btnBauenAmber` / `btnBauenGrey` | BAUEN-Chrome (eine Fläche, Live-Text) |
| `btnUpgradePurple` / `btnUpgradeGrey` | UPGRADE-Chrome (eine Fläche, Live-Text) |
| `currencyGold` | Kosten-Icon im Button |

Runtime: `.build-rail .ar-cost-btn` — Holz + eine Face-Fläche; Live-Text Holz-Innen + **2%**; kein gestapeltes Overlay.

## Währungen (freigegeben 2026-10-09)

| Asset | Motiv |
| --- | --- |
| `currencyGold` | Münze mit Krone |
| `currencyBier` | Maßkrug |
| `currencyFanartikel` | Trikot blau/weiß |
| `currencySicherheit` | Schild mit Haken |

Nur Symbol-PNG; Zahl live im Wallet-Chip / Button-Pay-Zeile.

**Live-FX ± (pending Freigabe):** `currency*Plus` / `currency*Minus` je Währung, plus `moodPlus`/`moodMinus` und `waitAnger`/`waitAngerHot`. Nach Freigabe: Floats bei Erzeugen/Verbrauch nutzen diese Icons (statt nur Text). Bis Freigabe bleiben Floats Symbol+Text.

## Match-Rahmenlogik

Verbindliche %-Tokens für Rails, HUD, Tribünen, Gang:  
`docs/icons/ui-final/MATCH_LAYOUT_TOKENS.json` (Mirror: `game/public/icons/ui-final/MATCH_LAYOUT_TOKENS.json`).

| Bereich | Schlüssel | Wert |
| --- | --- | --- |
| Left / Right / Pitch | `rails.left_w` / `right_w` / `pitch_w` | 21% / 15% / 64% |
| Scoreboard | `hud.scoreboard.max_w_of_pitch` · `h_of_screen` | 59,8% Pitch · 17,25% Bild (×1,15 vs. Baseline) |
| Wallet | `hud.wallet.icon_h_of_screen` · `chip_h_of_screen` | ×1,15 vs. Baseline |
| Tribünen | `scene.tribune_y0`–`y1` · `tribune_gap_of_pitch` | 30–50% · 0,5% Pitch |
| Hintergrund | `background` | `stadium-floodlight-derby-bg.jpg` |

Scoreboard-Live-Slots bleiben in `scoreboard-slots.json`.

