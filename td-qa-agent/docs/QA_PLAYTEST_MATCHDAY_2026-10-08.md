# LaneLink QA — Matchday-Build (2026-10-08)

**Getestete Version:** Branch `cursor/matchday-game-a9b1` @ `7300154` (PR #4)  
**Quelle:** Agent [Computerspiel UI methoden](https://cursor.com/agents/bc-01a11622-49d8-7659-8d85-63a0def9a9b1)  
**Lauf:** lokal `cd game && npm run dev` → `http://127.0.0.1:5173/` · Difficulty Easy · Mix 3/3/2  
**Ergebnis Playtest:** Niederlage **2:9** nach 90′

Screenshots: `/opt/cursor/artifacts/screenshots/01_menu.webp` … `07_end_result_niederlage.webp`

---

## 1. Bugs & nicht funktionierende Dinge

### Kritisch / hoch

| Fund | Detail |
| --- | --- |
| **Anpfiff schwer klickbar** | Im automatisierten Playtest reagierte `#start` nicht auf Pointer-Klicks; Console-`.click()` startete das Match. Code-Listener ist vorhanden — vermutl. Hit-Target / Layout (Portrait-Card trotz Querformat-Hinweis) oder Overlay. |
| **Stimmung-UI tot, Code halb tot** | Gesang/Pyro-Buttons entfernt. `tryMoodAction` + `MOOD_CD` existieren noch, werden aber nicht verdrahtet. KI-Kommentar: „Gesang/Pyro actions removed“. |
| **`moodHeim`/`moodGaeste` überschrieben** | `tickJubelMomentum` setzt Mood jeden Tick aus Personen-Count; Shop-Mood, Tor-Mood und Gesang-Impulse gehen verloren. |
| **`jubel`-Stats wirkungslos** | `FAN_STATS.*.jubel` und `jubelMul*` fließen nicht in Momentum/Tore. |
| **KI-Soft-Cheat + flache KI** | KI startet mit +20 Gold, regeneriert `aiMerch/Beer/Security` ~ohne Gebäude; kauft keine Fans über denselben Loop; `AiBehavior` immer `"balanced"`. |
| **Easy trotzdem Blowout** | Playtest Easy → **2:9**. Gegner-Panel zeigte deutliche Überzahl; Momentum/Torchance driftete zu Gast. |

### Mittel

| Fund | Detail |
| --- | --- |
| **Copy „max. 12“ vs Code `MIX_TOTAL=8`** | Setup-Text lügt; Summe hart auf 8. |
| **Toast „zu wenig Ressourcen“ ohne welche** | Kein Hinweis Bier vs Fanartikel vs Sicherheit. |
| **HUD-Dopplung / Widerspruch** | Scoreboard zeigte z.B. Heim 95 % vs Leiste Heim 22 % / Gast 78 % — unklar was Prozent bedeutet (Torchance vs Momentum vs Besitz). |
| **Float-Spam** | Viele `+1 Bier/+1 Shop`-Labels überlappen sich. |
| **Family-Flight** | Bei Ultra-Invasion können Normalos im „sicheren“ Block auf `hp=0` gesetzt werden → Eco-Einbruch. |
| **Hooligan→Fanshop-Pfad** | `shopUntil=1e9` initial; Shop-Besuch kaum erreichbar. |
| **Cement-Stall** | Ordnerposten-HP 360+(lv−1)×90 blockiert Gang hart → Late-Game-Stau ohne klare Breakthrough-Option. |
| **Design-Doc ≠ Build** | Early-Wins Bier/Stimmung/Curva-HP, Fever-Mul auf Fans, Portrait-Layout: nicht wie dokumentiert. |

### Niedrig / Cosmetik

- Kaufen/Senden-Buttons stilistisch schwer vs. flaches Scoreboard.
- Neutral-Block oft von Gast besetzt, während Heim-Sitze leer wirken (Playtest-Screenshot 37′: Heim 2 Figuren, Neutral voll Rot).

---

## 2. Wie Rechen- & Spielmechanik funktioniert

### Wirtschaft

- Startgold Spieler **75**, KI **95**.
- Passiv Gold ≈ `(1 + Normalos×0.2)/s` (Spieler); KI etwas höher.
- Gebäude (nur eigene): Rate `0.7 + lv×0.5`, multipliziert mit `PROD_BEER=0.2` / `PROD_SECURITY=0.3` / `PROD_MERCH=0.34`.
- **Kaufen:** Fan 12 Sicherheit · Ultra 14 Fanartikel · Hooligan 14 Bier · Ordner 22 Gold (Cap 2/Posten).
- **Senden:** Hooligan-Angriff 6 Bier · Ultra-Pyro-Wurf 6 Fanartikel (kein CD).
- **Bauen:** Bier 65 · Ordner 45 · Shop 35 Gold; Claim grau ×0.7. Upgrades 40/75/120/180 bis Lv5.

### Kampf & Territorium

- 3 Blöcke (Heim / Neutral / Gäste), Gang dazwischen, Frontlinie aus Besitz + Cement + vordersten Angreifern.
- Stats (HP / Atk / Fight): Fan 150/0.45/0.55 · Ultra 140/0.9/1.1 · Hooligan **300/1.35/1.45** · Ordner ~315/0.85.
- Schaden ≈ `22×0.7×atk…/def`; Melee-Range 0.14, Ranged 0.70; Pyro-Ultra bekommt **×0.45 HP**.
- **Blocksturm:** ≥3 Ultras ×5s im Gegnerblock → Sofortsieg.

### Momentum → Tore → Sieg

- Momentum `[-1,1]` aus Sitz-/Personen-Druck pro Block (nicht aus Gesang/Pyro).
- Tor-Tick ~alle 16s (Fieber kürzer): `pTor = 0.28+0.35|M|`, `pHeim = 0.5+0.5M`.
- Regulär 390s ≈ 90′, ET 70s, dann Elfmeter (beide Seiten parallel).
- Sieg: Blocksturm **oder** Torstand nach Zeit / Elfmeter.

### Kernschleife (intendiert)

Bauen → Währungen → Kaufen → Senden/Kämpfen → Sitze/Territorium → Momentum → Tore.  
Stimmungsaktionen sind im Matchday-HUD **entfernt**; „Stimmung“ ist faktisch Personen-Count + Fake-Mood-Felder.

---

## 3. Balance-Einschätzung

**Nicht ausbalanciert** — zugunsten Aggression, Sitzkontrolle und (im Playtest) der KI.

1. **Hooligans zu stark** relativ zu Ultras (doppelte HP, deutlich mehr DPS).
2. **Senden teuer / Produktion ungleich** — Playtest: Bier-Overflow (230) bei 0 Sicherheit → Fans kaum kaufbar, Hools selten sendbar trotz Bier-Berg wenn Timing/UI unklar.
3. **Fußball-Spur zu laut** — viele Tore möglich; Easy endete 2:9, Spielgefühl „Momentum entscheidet das Spiel, Kurva nur Futter“.
4. **Snowball:** Frontlinie → Buden → Produktion → mehr Sends → mehr Sitze → mehr Momentum.
5. **Blocksturm** (3×5s) als Hard-Win ist stark, wenn Cement überwunden wird — sonst Stall.
6. **KI** mit Soft-Regen und +20 Gold erklärt Blowouts auf Easy mit.

Dominante Gefühlstrategie: früh Buden → Ressourcen → Hools pushen / Cement halten. Fans/Gesang tragen kaum.

---

## 4. Verbesserungsvorschläge

### Sofort (Bugs)

1. Anpfiff-Hit-Target / Landscape-Setup fixen; Text „max. 12“ → „8“.
2. Mood entweder **wieder UI-verdrahten** oder Dead-Code (`tryMoodAction`, jubel) entfernen.
3. `tickJubelMomentum`: Mood als **Bonus mit Decay**, nicht Full-Overwrite.
4. Toasts: welche Währung fehlt.
5. HUD: eine klare Metrik (Momentum-Bar **oder** Torchance, nicht widersprüchliche Doppel-Prozente).

### Zahlen (Kampf / Kosten)

| Hebel | Vorschlag |
| --- | --- |
| Hooligan | HP 300→240 **oder** attack 1.35→1.05 |
| Pyro-Ultra | `PYRO_FIGHT_HP_MUL` 0.45→0.65 |
| Ordnerposten | Basis-HP 360→280 **oder** Ultra-vs-Post-Mul hoch |
| Torfrequenz | `pTor`-Basis 0.28→0.14 **oder** Intervall 16→22s |
| Blocksturm | Count 3→4 **oder** Sec 5→8 |
| Fan-Kauf | Sicherheit 12→10; Bier-Prod 0.2→0.28 **oder** Hool-Kauf 14→10 |
| Senden | 6→8 gegen Spam **oder** kurze CD |
| KI Easy | Start +20→+5; Soft-Regen 1.0→0.4; Fan-Käufe spiegeln |

### Design

- Cement: Slow/Damage-Gate statt Hard-Block, oder 1 Breakthrough-Charge.
- Normalo-Abwanderung: Delay + Flucht statt Instant-Death.
- Momentum stärker an Gang-Druck/Cement koppeln, damit Tore zur Kurva-Lage passen.
- Elfmeter abwechselnd, Sudden Death — kein Coin-Flip bei Remis.
- Kurzes In-Match-Hint: „Erst Buden, dann Senden“.

---

## Fazit

Der Matchday-Build ist **durchspielbar** (90′-Match, Gebäude, Kampf, Endscreen), aber **Stimmung/Gesang sind Fake**, die **HUD-Metriken widersprechen sich**, und die **Balance kippt** (Easy 2:9, Hool/Cement/Tor-RNG dominant). Nächster sinnvoller Schritt: Anpfiff+HUD-Klarheit fixen, Mood ehrlich machen, dann die Zahlentabelle oben in einem Balance-Pass.
