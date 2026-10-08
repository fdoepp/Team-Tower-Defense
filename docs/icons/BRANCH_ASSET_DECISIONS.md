# Branch-Grafiken — Gegenüberstellungen & Entscheidungen

Ziel: Pro Differenz **eine** Variante wählen, dann überall gleichziehen.

**Legende in den Sheets:** grün = gleich `currency` · orange = anders · rot = fehlt  

Sheets: `docs/mockups/icons/branch-compare/`  
(Spiegel: `/opt/cursor/artifacts/branch-compare/`)

---

## Übersicht der Sheets

| # | Datei | Inhalt |
|---|---|---|
| 01 | `01-currency-logos.jpg` | Währungen × Branches |
| 02 | `02-fx-hp.jpg` | FX + HP × Branches |
| 03 | `03-ui-chrome-buttons.jpg` | Slot, Buttons, Scoreboard, Wimpel |
| 04 | `04-stands-lv3.jpg` | Stände Lv3 × Branches |
| 05 | `05-units-lv3.jpg` | Units Lv3 × Branches |
| 06 | `06-stadium-tribunes.jpg` | BG + Tribünen |
| A | `A-currency-vs-game-ui.jpg` | **Paar:** Currency vs Game — nur Abweichungen |
| C | `C-currency-vs-game-units.jpg` | **Paar:** Currency vs Game — Units |
| D | `D-exclusive-assets.jpg` | Nur auf einer Seite (FX/HP vs Bauen/Stadium) |
| E | `E-currency-vs-icons-stands.jpg` | **Paar:** Currency vs Icons — Stände |
| F | `F-currency-vs-main-ui.jpg` | **Paar:** Currency vs Main — Logos/Slot |

Stände Lv3: **Currency = Game = Wallet = Main** (keine Pixel-Diff). Abweichung nur vs. ältere `matchday-icons`.

---

## Entscheidungen (bitte ankreuzen)

### 1. Währungs-Logos → Sheet A / 01 / F

Currency = logo-only Kanon · Game/Main/Icons = ältere Varianten (teils mit anderen Proportionen).

| Asset | Vorschlag | Entscheidung |
|---|---|---|
| `currency-gold.png` | ☐ Currency (Kanon) · ☐ Game · ☐ Main | |
| `currency-bier.png` | ☐ Currency · ☐ Game · ☐ Main | |
| `currency-fanartikel.png` | ☐ Currency · ☐ Game · ☐ Main | |
| `currency-sicherheit.png` | ☐ Currency · ☐ Game · ☐ Main | |

Empfehlung: **überall Currency** (logo-only, Rule/Canon).

### 2. Floating-FX + HP-Bars → Sheet 02 / D

Nur auf `currency` (FX auch auf `wallet`). Game/Main/Icons: fehlen.

| Asset-Set | Vorschlag | Entscheidung |
|---|---|---|
| `fx-gain\|spend-*` + `fx-gain-momentum` | ☐ überall Currency übernehmen · ☐ weglassen | |
| `hp-bar-unit-*` / `hp-bar-building-*` | ☐ überall Currency übernehmen · ☐ weglassen | |

Empfehlung: **überall Currency übernehmen** (verbindlicher Kanon).

### 3. Stadium + Tribünen → Sheet 06 / D

Identische Pixel auf `stadium` / `game` / `buildings-on-plots`. Fehlen auf Currency/Main/Icons/Wallet.

| Asset-Set | Vorschlag | Entscheidung |
|---|---|---|
| Derby-BG + tribune blue/grey/red | ☐ überall Stadium/Game übernehmen · ☐ weglassen | |

Empfehlung: **überall übernehmen**.

### 4. Buttons → Sheet 03 / D / A

| Asset | Wo | Vorschlag | Entscheidung |
|---|---|---|---|
| `btn-kaufen-green` (≠) | Currency vs Game | ☐ Currency · ☐ Game | |
| `btn-senden-green` | gleich | — behalten | |
| `btn-bauen-{amber\|grey}` | nur Game-Linien | ☐ überall Game · ☐ weglassen | |
| `btn-upgrade-{purple\|grey}` | nur Game-Linien | ☐ überall Game · ☐ weglassen | |
| `btn-senden-blue` | nur Game-Linien | ☐ überall · ☐ weglassen | |
| `btn-anwerben` | nirgends | ☐ neu erstellen · ☐ Kaufen reicht | |

Empfehlung: **Bauen/Upgrade von Game überall**; **Anwerben neu**; Kaufen-Pixel offen.

### 5. Slot & Wimpel → Sheet A / F

| Asset | Vorschlag | Entscheidung |
|---|---|---|
| `slot-empty.png` | ☐ Currency · ☐ Game · ☐ Main | |
| `pennant-ksc.png` / `pennant-vfb.png` | ☐ Currency · ☐ Game | |
| `scoreboard-momentum.png` | gleich Currency=Game → behalten | |

### 6. Stände → Sheet 04 / E

| Asset-Set | Vorschlag | Entscheidung |
|---|---|---|
| Bier / Fanshop / Ordner × Farben × Lv | ☐ Currency/Game (aktuell, identisch) · ☐ Icons (älter) | |

Empfehlung: **Currency/Game** überall; Icons-Branch nachziehen.

### 7. Units → Sheet 05 / C

Currency vs Game: **alle** Lv3-Samples weichen ab (andere Composites/Skalierung).

| Asset-Set | Vorschlag | Entscheidung |
|---|---|---|
| Fan / Ultra / Hooligan / Ordner × Farben | ☐ Currency (Ordner-Kanon) · ☐ Game | |

Empfehlung: **Currency** für Ordner-Kanon; Fan/Ultra/Hooligan nach Sichtentscheidung in Sheet C.

---

## Sync-Ziel nach Entscheidungen

Ein gemeinsamer Runtime-Satz auf mindestens:

- `currency-icons-clean-dba3`
- `matchday-game-a9b1` (bzw. dessen Nachfolger)
- `main` (wenn Deploy-Basis)

inkl. Helper: `game/src/assets/{currencyFx,hpBars,stands}.ts` + Rule `stadium-background.mdc`.
