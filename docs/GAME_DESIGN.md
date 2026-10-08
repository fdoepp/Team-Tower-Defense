# LaneLink / Stadion-TD — Game Design Concept

**Working title:** LaneLink (Arbeitstitel; Flavor: KSC vs. VfB / Badisches Stadion-Duell)  
**Platform:** Mobile, Portrait-first  
**Art:** Flaches 2D, klare Silhouetten, wenig VFX — so simpel wie möglich  
**Session:** ~5 Minuten ≈ 90 Spielminuten (+ ggf. Verlängerung / Elfmeter)  
**Spieler:** 2 (Koop oder Versus) + **Solo mit KI** (Default einfach & lesbar, Verhalten/Schwierigkeit anpassbar)

---

## 1. Pitch

Kurzes Handy-Minigame: Ihr seid Fans im Stadion. Auf den **Rängen** läuft Tower-Defense (Bier, Pyro, Ordner, Randale). Auf dem **Platz** läuft ein Fußballspiel (Momentum, Tore, Karten).  

- **Versus:** KSC-Kurve vs. VfB-Kurve, Sushi-Band für Towers/Sends (90 % parallel / 10 % exklusiv).  
- **Koop:** Beide dieselbe Kurve; **Supplier** liefert, **Architect** baut.  
- **Solo:** dieselben Systeme gegen eine einstellbare KI — zum Lernen, Testen, Verbessern.

Am Ende gibt es **immer einen Sieger** (kein Unentschieden).

---

## 2. Design-Säulen

1. **Entscheidungsspiel** — 90′ → VL → Effen; Early Wins nur in der regulären Zeit.  
2. **Zwei Spuren** — Kurva (TD) und Spielfeld (Match) beeinflussen sich gegenseitig.  
3. **Aufgabenteilung im Koop** — Supplier / Architect, echte Pipeline.  
4. **Fairer Versus-Druck** — Spiegel-Lanes + Band mit 90/10.  
5. **Lesbarkeit** — wenige Fan-Typen, große Touch-Targets, simple Optik.  
6. **Solo-first testbar** — jede Mechanik ohne zweiten Menschen übbar.

---

## 3. Setting & Fantasy

- Rivalität **Karlsruher SC vs. VfB Stuttgart** (Baden-Flavor, Humor, Bier, Fans).  
- Kein realistisches Hooligan-Sim; Arcade-Überzeichnung.  
- Towers = Fan-Infrastruktur (Chor, Bierstand, Gitter, Pyro, Schmäh, Ordner…).  
- Wellen / Sends = rivalisierende Fans, Chaos, Sicherheitsdruck.  

Civ-Anleihe nur bei **mehreren Siegpfaden**, nicht beim Look.

---

## 4. Doppelspur: Kurva + Platz

| Spur | Kern | Scheitern |
|---|---|---|
| **Kurva (TD)** | Fans/Towers halten den Block; Bier & Stimmung managen | Curva-HP → 0 |
| **Spielfeld** | Momentum → Spielzüge → Tore; Karten/Platzverweise | Matchverlust nach 90′/VL/Effen |

**Kopplung (Beispiele):**
- Anfeuern / Pyro / voller Block → Momentum↑  
- Leaks / Chaos → Momentum↓, Ref-Stress↑  
- Aggression auf den Rängen → mehr Karten auf dem Platz  
- Platzverweise → Mannschaftsschwächer + Fan-Reaktionen nach Typ  
- Tore → Durst/Interesse/Stimmung (siehe Fan-Systeme)  
- **Fieberphase** (ab ~80′, stärker ab ~85′, VL dauerhaft): alle Fan-/Stimmungs-Effekte ×1.5–×2  

---

## 5. Fan-Systeme

### 5.1 Drei Fan-Typen (Architect-Build)

| Typ | Will | Aggressiv bei | Gelangweilt / geht bei |
|---|---|---|---|
| **Normalos** | Spiel, Bier, gute Kulisse | Randale zu nah | Langeweile, Kantern, leere Stände, kein Chor |
| **Ultras** | Stimmung, Pyro, Gegenkurve | Gegentor, Schmäh, leere eigene Fässer, einseitige Gegner-Show | Friedhofsphase, nur Ordner, kein Pyro/Chor |
| **Familie** | Sicherheit | Pyro-Spam, Chaos | Dauerchaos (eher Abwanderung als Mitprügeln) |

Pro Kurva sichtbare **Mischungsbalken** (keine 50 Einzelagenten). Ereignisse verschieben die Balken.

### 5.2 Lobby-Setup (Architect, ~15–20 s)

**10 Punkte** auf Fan-Typen (Summe immer 10):

| Block | Min | Max |
|---|---|---|
| Normalos | 2 | 6 |
| Ultras | 1 | 5 |
| Familie | 1 | 4 |

**Zusätzlich 1 Starttower**, z. B. Chor / Bierstand / Gitter / Pyro-Kit / Schmäh.  
Synergie-Bonus wenn Tower zur Mischung passt (nicht Pflicht).

Versus: gleiche Regeln für beide; Wahl sichtbar (Rivalitäts-Lesbarkeit).  
Koop: Architect wählt; Supplier sieht mit und drückt Ready (Veto-Ping optional).

### 5.3 Durst & Interesse

| Meter | Steigt | Sinkt / Folge |
|---|---|---|
| **Durst** | Zeit, eigenes Tor, Führung; **Kummerbier** bei Gegentor | Trinken; ohne Bier + hohem Durst → Frust |
| **Interesse** | Eigenes Tor, Chor, Pyro, knapper Spielstand, hoher **Stadionpegel** | Gegentor, Langeweile, Solo-Eskalation der Gegenseite |

**Kummerbier:** Gegentor → Durst↑, aber **Interesse↓**. Trinken stillt Durst mit schlechterem Momentum-Ertrag.

**Abwanderung:** Interesse niedrig → Fans in die **Neutralzone**; kritisch → **Heimweg** (Fan-Cap weg).

### 5.4 Bierstände

Zonen: **eigene Curva** | **Neutral** | **Gegner** (Koop: KI-VfB-Stände).

- Gut = möglichst viele **Liter getrunken** (inkl. Neutral + Fremd).  
- Eigene Stände: Auto-Zapfen nach Durst.  
- Neutral/Gegner: **Trinkkommandos** (Koop-Fremdtrinken gewollt).  
- Leeres Gegner-Fass bei deren Jubel → deren Durst ohne Bier → Frust.

### 5.5 Stadionpegel vs. Frust

```
Stimmung_A / Stimmung_B  (Chor, Pyro, volle Curva, …)
Pegel     = min(S_a, S_b)
Vorsprung = abs(S_a - S_b)
```

- **Ähnliche Performance (Vorsprung klein):** hoher möglicher Gesamtpegel → **Interesse beider** profitiert („geile Kulisse“).  
- **Ein Lager allein Stimmung/Pyro:** Führender voller Bonus; Zurückliegende **frustriert** (Interesse↓, Abwanderung; in Koop eher **mehr Randale** der KI-Kurve).

**Pyro** ist positiv (Interesse, Momentum, holt Neutrale zurück), kontextabhängig:
- bei Parität → Pegel für alle  
- bei klarer Dominanz → Demoralisierung der anderen  

Soft-Limit gegen Spam (Mats/CD; selten Ordnungsamt-Auge), Hauptgefühl bleibt positiv.

### 5.6 Ränge → Karten → Platzverweise

Rang-Aggression (Ultra-Frust, Schmäh, Pyro-Dominanz, Randale) erhöht **Ref-Stress** → Gelb / Gelb-Rot / Rot.

**Platzverweis:**
- Mannschaft: schlechtere Torchancen / Effen-Qualität  
- Ultras: Aggression↑  
- Normalos: Interesse↓  
- Familie: Ordner-Bedarf, sonst Heimweg  

---

## 6. Siegmatrix

### 6.1 Kein Unentschieden

```
Reguläre Zeit (90′ ≈ 5:00)
  ├─ Early Win? → Sofort Gesamtsieger (Spielstand irrelevant)
  ├─ Tor-Vorsprung nach 90′ → Gesamtsieger
  └─ Gleichstand → Verlängerung → ggf. Elfmeterschießen → immer Sieger

VL / Effen: keine Early Wins mehr
Curva-HP 0: Abbruch-Niederlage (auch in VL/Effen)
```

### 6.2 Early Wins (nur bis Ende der regulären Spielzeit)

Mehrere parallele Pfade; erster erfüllter gewinnt sofort.

| Pfad | Modus | Idee |
|---|---|---|
| **Bier / Hausbar** | Koop + Versus | Liter-Score (eigen + Neutral + Fremd) ≥ Schwelle, eigene Curva lebend |
| **Stimmung / Übernahme** | Koop + Versus | Stimmungsdominanz lange gehalten + Fan-Cap/Interesse stark genug |
| **Curva-Kill** | **Versus only** | Gegner-Curva-HP → 0 (= integrierte Early-Win-Übernahme durch Chaos) |

Koop hat keinen Curva-Kill-Early-Win (gemeinsame Curva).  
Breakthroughs sind **Team-Siege** im Koop.

### 6.3 Hauptpfad: Fußballspiel gewinnen

Ohne Early Win entscheidet ab Abpfiff 90′ nur noch das Spiel auf dem Platz (inkl. VL/Effen).  
Fieberphase macht späte Tore extrem folgenreich für die Ränge.

---

## 7. Modus A — Koop (geteilte Kurva)

### Rollen

| Rolle | Kann | Kann nicht |
|---|---|---|
| **Supplier** | Nodes/Fässer versorgen, raffinieren/liefern, Trinkkommandos, Pyro-Mats | Combat-Towers platzieren |
| **Architect** | Towers/Stände bauen & upgraden, Fan-Setup, Panic | Ernten / Fremdtrinken selbst |

### Materialien (2 Typen, Theme-Skin über Scrap/Core)

| Mat | Lieferant | Typische Verwendung |
|---|---|---|
| **Bier / Fass** (Scrap-Äquivalent) | Supplier | Bierstände, Normalos-Utility, günstige Towers |
| **Pyro / Special** (Core-Äquivalent) | Supplier (Refine) | Pyro, Chor-High-End, Ultra-Tools |

Shared Team-Gold + Mat-Gate für Architect-Käufe.  
Startkiste mit Mindestvorrat, damit Architect nicht idle startet.

### Map-Sketch

```
 NODE/FASS     Spawn (Gegner-Fans)
     \            |
  NEUTRAL ---- [ Kurva-Slots ] ---- FASS
                  |
            KISTE / REFINE
               TORWAND / BASE (Curva-HP)
```

### Panic

Shared Meter (Lieferungen + Kills) → Freeze / Ordnungsamt-Fenster.

---

## 8. Modus B — Versus (Spiegel-Kurven + Sushi-Band)

### Layout

- Volle eigene Kurva + Statusleiste (Gegner-HP, grobes Gold, letzter Send)  
- Identische Slots; Band unten  

### Sushi-Band (90 / 10)

| Anteil | Regel |
|---|---|
| **~90 % parallel** | Beide können dieselbe Plate unabhängig kaufen |
| **~10 % exklusiv (★)** | Jede 10. Plate; erster gültiger Kauf; kurz telegraphed |

Platten: **Tower** oder **Send/Druck** (inkl. Trinkkommando / Randale-Packs).  
Hand-Limit 1 Tower; Upgrades per Tower-Tap, nicht über Band.  
Phasen, Eco-Tax, Dwell ~4.5 s wie zuvor spezifiziert.

### Versus-Siege

Early Wins inkl. **Curva-Kill**; sonst Fußball-Entscheidung KSC vs. VfB (ein Spielstand, beide beeinflussen Momentum).

---

## 9. Solo / Singleplayer

Pflicht für Testen und Verbessern.

### Menü

```
Solo
├── Match vs KI          (Versus-Systeme, eine Kurva)
└── Koop mit KI-Partner  (v1: Spieler = Architect, KI = Supplier)
```

Dev optional: Sandbox (Meter setzen, Pause, Instant-Tor/Karte).

### KI-Default

**Einfach & lesbar** — erkennbare Absichten, keine unfairen Snipes, telegraphierte Schwerpunkte.

### Anpassbar (Spieler-Einstellungen)

| Achse | Beispiele |
|---|---|
| **Schwierigkeit** | Einfach (Default) / Normal / Schwer |
| **Verhalten** | Geduldig · Ausgewogen · Aggro-Stimmung · Bier-Gier · Early-Win-Hunter |

Verhalten steuert Prioritäten (Pegel halten vs. Vorsprung suchen, Fremdtrinken, Pyro-Timing, Curva-Druck).  
Schwierigkeit skaliert Tempo, Genauigkeit, Schwellen-Druck — nicht „mehr HP-Cheats“.

### KI-Minimum-Fähigkeiten

1. Durst/Bier bedienen  
2. Stimmung halten oder Vorsprung suchen (je Verhalten)  
3. Auf Tor/Gegentor reagieren (Jubel / Kummerbier / Pyro)  
4. Early-Win-Meter mitverfolgen  
5. Versus: Sends/Trinkkommandos/Curva-Druck  

Seedbare Matches für Regressionstests.

---

## 10. Matchfluss (Zeit)

| Phase | Spielzeit | Echtzeit (Richtwert) |
|---|---|---|
| Lobby-Setup | — | ~15–20 s |
| Regulär | 0′–90′ | ~5:00 |
| Fieber | ab ~80′ | letzte Minute+ |
| Verlängerung | 2× kurz | ~2×0:35 |
| Elfmeter | — | kurze Sequenz, Ränge laufen weiter |

---

## 11. Content-Minimum (MVP)

**Towers / Stände (Beispiele):** Chor, Bierstand, Gitter/Ordner, Spray/Absperrung, Pyro-Kit, Schmäh/Tröte, Beacon-Äquivalent (Block-Buff).  
**Gegner-Fans:** Runner, Grunt, Tank-Block, Swarm, Bosslet-Gastblock.  
**1 Koop-Map, 1 Versus-Spiegelmap.**  
**Solo Match vs KI + Koop mit Supplier-KI.**

Explizit später: Ranked, 2v2, Season Pass, 3D, tiefe Kampagne.

---

## 12. UI-Skizzen

### Versus

```
┌─────────────────────────────┐
│ KSC 1:1 VfB   ⏱ 78′  FIEBER │
│ HP ❤12   Gold …   Early-Meter│
├─────────────────────────────┤
│         [Kurva / Path]       │
│      □ slots □               │
├─────────────────────────────┤
│ Hand: […]                    │
│ 〰 Band: [Chor][Send][★Pyro]  │
└─────────────────────────────┘
```

### Koop

```
┌─────────────────────────────┐
│ KSC 2:1   ⏱ 64′   Panic ▮▮  │
│ Bier-Win …  Stimmung-Win …   │
│ Fans: N▮▮ U▮▮ F▮▮  Durst/Int.│
├─────────────────────────────┤
│ FASS    [path]    NEUTRAL    │
│         CRATE Bier/Pyro      │
├─────────────────────────────┤
│ Supplier / Architect Actions │
└─────────────────────────────┘
```

---

## 13. Erfolgskriterien

- Solo-Default: Neue Spieler verstehen nach 1 Match Durst/Interesse/Early-Meter.  
- Koop: „Du hast Pyro gebracht, ich hab die Neutrale leergetrunken.“  
- Versus: „Curva-Kill knapp verhindert — Effen entschieden.“  
- Rematch innerhalb von Sekunden attraktiv.  
- Nie Remis-Endscreen.

---

## 14. Offene Balance-Zahlen (Feintuning in Solo)

Schwellen für Bier-Win / Stimmung-Win, exakte Fieber-Multiplikatoren, Karten-Raten und KI-Parameter werden **primär im Solo-Modus** iteriert; dieses Dokument hält die Regeln fest, nicht jeden Endwert.

---

*Status: Konzeptstand nach Stadion-Pass (Setting, Fans, Siegmatrix, Solo). Bereit für Prototyp-Planung.*
