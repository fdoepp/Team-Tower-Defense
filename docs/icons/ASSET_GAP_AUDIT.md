# Asset-Lücken — Spielverständnis & Gameplay

Stand: Audit gegen `MATCHDAY_UI_SUMMARY`, `UI_ASSETS`, `GAME_DESIGN` (Konzept), Mockup `matchday-gesamt-final.jpg`, Runtime auf `matchday-game`, und den freigegebenen Kanons (Stände / Units / HP / FX).

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

In der Rule und README verbindlich, **auf diesem Branch aber nicht vorhanden** (`game/public/assets/` fehlt). Liegen fertig auf `cursor/stadium-floodlight-bg-dba3`:

| Asset | Zweck |
|---|---|
| `stadium-floodlight-derby-bg.jpg` | Match-Backdrop |
| `tribune-block-blue.png` | Heim-Block (ohne Figuren) |
| `tribune-block-grey.png` | Neutral-Block |
| `tribune-block-red.png` | Gäste-Block |
| `tribune-blocks-sheet.png` | Übersicht (optional) |

**Aktion:** Einspielen auf den Icon-/Currency-Branch (kein Neuzeichnen nötig).

### 2. Aktions-Buttons laut Gesamtmockup

Mockup-Rail: **SEND + HIRE**; Build-Panel: **BAUEN**. Vorhanden sind nur:

- `btn-senden-{green\|grey}.png` ≈ SEND  
- `btn-kaufen-{green\|grey}.png` ≈ generisches Kaufen  

Fehlt als freigestelltes Paar (ready / disabled):

| Vorgeschlagen | Verwendung |
|---|---|
| `btn-anwerben-{green\|grey}.png` bzw. `btn-hire-*` | Figuren / Ordner anheuern (Mockup-HIRE) |
| `btn-bauen-{green\|grey}.png` | Rechte Rail / Gebäude platzieren |

Ohne eigene Buttons bleibt die Rail sprachlich uneinheitlich (Kaufen überall) und weicht vom freigegebenen Gesamtscreen ab.

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

1. **Tribünen + Derby-BG** vom Stadium-Branch einspielen  
2. **`btn-anwerben` + `btn-bauen`** (green/grey)  
3. **Fünf Status-Icons** (Durst, Interesse, Stimmung, Pyro, Fremdtrinken)  
4. Danach: Aktionschips Gesang/Pyro/Klatschen, Selection-Marker  

---

## Kurzfazit

Kern-Figuren, Buden, Währungen, FX und HP sind abgedeckt. Für eine schöne, verständliche Match-Umsetzung fehlen vor allem noch: **Stadion/Tribünen auf diesem Branch**, **HIRE/BAUEN-Buttons**, und die **fünf System-Status-Icons** — ohne die bleiben die zentralen Meter (Durst/Interesse/Stimmung/Pyro/Fremdtrinken) nur Text und schwerer zu scannen.
