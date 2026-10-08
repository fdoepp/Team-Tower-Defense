# Asset-Lücken — Spielverständnis & Gameplay

Stand: Audit gegen `MATCHDAY_UI_SUMMARY`, `UI_ASSETS`, `GAME_DESIGN` (Konzept), Mockup `matchday-gesamt-final.jpg`, Runtime auf `matchday-game`, und den freigegebenen Kanons (Stände / Units / HP / FX).  
**Branch-Abgleich** (erneut): relevante Branches ziehen **nicht** denselben Grafik-Satz heran — siehe Abschnitt unten.  
**Gegenüberstellungen:** `docs/mockups/icons/branch-compare/` · **Entscheidungen LOCKED:** `docs/icons/BRANCH_ASSET_DECISIONS.md` · Pack: `BRANCH_SYNC_CANON.json`.

Ziel: Welche **freigestellten Einzel-Assets** fehlen noch, damit Match-UI und Systeme ohne Ad-hoc-Canvas-Zeichnung klar lesbar umsetzbar sind.

---

## Schon da (freigestellt / final)

| Bereich | Pfad | Status |
|---|---|---|
| Bierstand / Fanshop / Ordnerposten × blau/rot/grau × Lv1–5 | `game/public/icons/stands/` | final |
| Fan / Ultra / Hooligan / Ordner × Farben × Lv1–5 | `game/public/icons/units/` | final (Ordner-Kanon) |
| Währungs-Logos (ohne Zahl) | `ui/currency-{gold,bier,fanartikel,sicherheit}.png` | final |
| Floating ±FX + Momentum | `ui/fx-gain\|spend-*.png`, `ui/fx-gain-momentum.png` | final |
| HP-Bars Person + Gebäude | `ui/hp-bar-{unit\|building}-*.png` | final |
| Bauplatz leer, Kaufen, Senden, Rail, Wimpel, Scoreboard | `ui/slot-empty`, `btn-kaufen-*`, `btn-senden-*`, `menu-rail-*`, `pennant-*`, `scoreboard-momentum` | vorhanden |

---

## Hoch — für Lesbarkeit / Deployment blockierend

### 1. Stadion-Hintergrund + Tribünen-Blöcke

In der Rule und README verbindlich. **Identische Pixel** liegen auf `stadium-floodlight-bg-dba3`, `matchday-game-a9b1`, `buildings-on-plots-4235` — **fehlen** u. a. auf `currency-icons-clean-dba3`, `main`, `matchday-icons-a9b1`, `wallet-bar-vorschlaege-3755`.

| Asset | Zweck |
|---|---|
| `stadium-floodlight-derby-bg.jpg` | Match-Backdrop |
| `tribune-block-blue.png` | Heim-Block (ohne Figuren) |
| `tribune-block-grey.png` | Neutral-Block |
| `tribune-block-red.png` | Gäste-Block |
| `tribune-blocks-sheet.png` | Übersicht (optional; nur Stadium-Branch) |

**Aktion:** In jeden spielrelevanten Branch einspielen (kein Neuzeichnen).

### 2. Aktions-Buttons laut Gesamtmockup

Mockup-Rail: **SEND + HIRE**; Build-Panel: **BAUEN**.

| Button | Wo vorhanden | Lücke |
|---|---|---|
| `btn-senden-{green\|grey}` | fast überall mit Icons | OK |
| `btn-kaufen-{green\|grey}` | fast überall mit Icons | OK (Pixel teils ≠ currency) |
| `btn-bauen-{amber\|grey}` | `matchday-game`, `buildings-on-plots`, `icon-ui-einzeln`, `wallet-bar` | fehlt auf currency / main / icons |
| `btn-upgrade-{purple\|grey}` | dieselben Game-Branches | fehlt auf currency / main |
| `btn-senden-blue` | dieselben Game-Branches | extra Variante |
| `btn-anwerben` / `btn-hire` | **nirgends** | noch erstellen |

Ohne `btn-anwerben` bleibt HIRE nur als Kaufen-Label; BAUEN existiert schon auf Game-Branches, ist aber nicht überall synchron.

### 3. Status- / System-Icons (Logo-only, wie Währungen)

Im Prototyp und Design zentral, bisher **nur Text/CSS/Canvas**, keine freigestellten Logos:

| Icon | System | Warum spielentscheidend |
|---|---|---|
| `status-durst.png` | Durst → Bierstand / Frust | Early-Win & Fan-Verhalten |
| `status-interesse.png` | Interesse → Abwanderung / Neutral | Fan-Cap, Overrun |
| `status-stimmung.png` | Stimmung / Stadionpegel | Early-Win Stimmung, Momentum |
| `status-pyro.png` | Pyro-Aktion / Mats | Ultra-Tool, Ref-Stress, Interesse |
| `status-fremdtrinken.png` | Fremdtrinken / Neutral-Stand | Liter-Score, Koop-Pipeline |

Optional dazupacken (HUD schon als Text): `status-torchance.png` (Torchance %-Chip am Momentum).

---

## Mittel — Umsetzung deutlich schöner / klarer

### 4. Stimmungs-Aktionschips (A2d)

Neben dem Stimmungsmeter: **Gesang / Pyro / Klatschen** (CD, kein Gold). Aktuell CSS-Chips + Emoji/Canvas-Partikel.

Vorschlag freigestellt:

- `action-gesang.png` (+ grey/CD-Variante oder Overlay)
- `action-pyro.png`
- `action-klatschen.png`

### 5. Auswahl- / Fokus-Marker

Bauplatz und Gebäude werden per Code selektiert; kein freigestelltes Highlight.

| Asset | Zweck |
|---|---|
| `marker-slot-selected.png` | aktiver Bauplatz |
| `marker-building-selected.png` | Gebäude-Fokus / Upgrade-Ziel |
| `marker-unit-selected.png` (optional) | Figur/Patrouille |

### 6. Upgrade-Pfeil / Lv-Badge

Upgrade-Panel zeigt From→To per Text. Hilfreich:

- `ui/arrow-upgrade.png`
- `ui/badge-lv-{1..5}.png` (oder ein generisches Lv-Schild)

### 7. Gang- / Lane-Hinweise

Mockup: weiße Bodenpfeile Block → Gang. Derzeit oft nur Layout/Code.

- `ui/lane-arrow.png` (freigestellt, drehbar)

---

## Niedrig — nice-to-have / später

| Thema | Hinweis |
|---|---|
| Pyro-Rauch / Flare-Sprites | Canvas-Partikel reichen für v1 |
| Confetti / Noten (Gesang) | procedural OK |
| Leak- / Wave-Warnbanner | Text-Banner existiert; Icon optional |
| Sushi-Band-Platten (Versus) | Modus noch nicht |
| Familie als 4. Fan-Typ | Design-Alt; aktueller Matchday-Mix = Fan/Ultra/Hooligan |
| Momentum-Logo allein | schon in Scoreboard + `fx-gain-momentum` |

---

## Empfohlene Reihenfolge

1. **Einen Kanon-Satz syncen:** Stadium/Tribünen + currency FX/HP/Logos + Game-`btn-bauen`/`btn-upgrade` auf alle spielrelevanten Branches  
2. **`btn-anwerben`** neu erstellen (fehlt überall)  
3. **Fünf Status-Icons** (Durst, Interesse, Stimmung, Pyro, Fremdtrinken)  
4. Danach: Aktionschips Gesang/Pyro/Klatschen, Selection-Marker  

---

## Branch-Abgleich — ziehen alle denselben Grafik-Satz?

**Nein.** Stand Runtime `game/public/` (Vergleichsbasis: `currency-icons-clean-dba3`).

| Branch | stadium/tribune | FX | HP | currency logos | stands | units | btn-bauen/upgrade | Anmerkung |
|---|---|---|---|---|---|---|---|---|
| `currency-icons-clean-dba3` | ✗ | ✓ (9) | ✓ (12) | ✓ logo-only Kanon | ✓ 60 | ✓ 80 | ✗ | FX/HP nur hier (+ Wallet-FX) |
| `stadium-floodlight-bg-dba3` | ✓ (7) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | nur BG/Tribünen |
| `matchday-game-a9b1` | ✓ (4, **gleiche Hashes**) | ✗ | ✗ | vorhanden, **andere Pixel** | ✓, teils ≠ | 140, **andere Pixel** | ✓ | Spiel-Branch, nicht kanon-FX/HP |
| `buildings-on-plots-4235` | ✓ wie game | ✗ | ✗ | ≠ currency | ✓ | 140 ≠ | ✓ | wie game |
| `wallet-bar-vorschlaege-3755` | ✗ | ✓ (**gleiche Hashes** wie currency) | ✗ | ✓ = currency | ✓ | 140 ≠ | ✓ | FX übernommen, kein HP/Stadium |
| `matchday-icons-a9b1` | ✗ | ✗ | ✗ | ≠ | teils ältere stands | 80 | ✗ | Icon-Basis vor FX/HP |
| `icon-ui-einzeln-3755` | ✗ | ✗ | ✗ | ≠ | ✓ | 140 | ✓ | UI-Varianten |
| `main` / `matchday-logic-main-939c` / `scoreboard-cutout-main-a9b1` | ✗ | ✗ | ✗ | ≠ | ✓ | 60 (ohne Unit-Fallbacks) | ✗ | älterer Satz + Slot-Iso-Varianten |
| `block-spacing-ultra-combat-dba3` / `team-td-konzept-dba3` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | keine Runtime-Grafiken |

### Inhaltliche Abweichungen (gleicher Pfad, andere Datei)

Gegen `currency-icons-clean-dba3` weichen u. a. ab:

- **Währungs-Logos** auf `main` / `matchday-game` / `matchday-icons` (nicht die logo-only-Kanons)
- **Ordnerposten / Units** auf Game- und Main-Linien (ältere oder andere Composites)
- **`btn-kaufen-green`**, **`slot-empty`** auf Game vs Currency
- **Scoreboard** ist auf mehreren Branches **identisch** mit Currency (`scoreboard-momentum.png`)
- **Stadium/Tribünen** auf Game = Stadium-Branch (Hashes gleich)

### Binding-Code / Rules

| Artefakt | Nur auf … |
|---|---|
| `docs/icons/*_CANON.md`, `ASSET_GAP_AUDIT.md` | vor allem `currency-icons-clean-dba3` (FX-Canon auch auf `wallet-bar`) |
| `game/src/assets/{currencyFx,hpBars,stands}.ts` | **nur** `currency-icons-clean-dba3` |
| `game/src/game/assets.ts` | Game-/Main-Linien (nicht Currency) |
| `.cursor/rules/stadium-background.mdc` | Currency, Stadium, Matchday-Game, … — **nicht** überall |

---

## Kurzfazit

Kern-Figuren, Buden, Währungen, FX und HP sind als Kanon auf dem Currency-Branch abgedeckt — **aber die relevanten Branches sind nicht synchron.** Game hat Stadium/BAUEN/Upgrade, Currency hat FX/HP/logo-only; Main und Icons fehlen beides teilweise. Überall noch offen: **`btn-anwerben`** und die **fünf Status-Icons**.
