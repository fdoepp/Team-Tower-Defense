# QA-Retest — Balance-Pass (2026-10-08)

**Build:** `cursor/matchday-balance-939c` @ `f21eded` ([PR #9](https://github.com/fdoepp/Team-Tower-Defense/pull/9))  
**Basis:** mood-free (Stimmung→Momentum, uncapped crowds) + Balance-Agent  
**Lauf:** Easy · Mix 3/3/2 · lokal `:5173`  
**Ergebnis:** Niederlage **2:3** (vorher ohne Balance: **2:9**)

Screenshots: `/opt/cursor/artifacts/balance_01_menu.webp` … `balance_05_end.webp`

---

## Ergebnis kompakt

| Bereich | Urteil |
| --- | --- |
| Gesamt-Balance | **Deutlich besser** — enges 2:3 statt Blowout 2:9 |
| Stimmung→Momentum | Wirkt; Match blieb lange spannend (u.a. 2:2 spät) |
| Uncapped Crowds | Funktioniert; Neutral teils eng überfüllt |
| Kampf/Cement | Kampf ok; Cement-Slow wenig spürbar/feedbackarm |
| Eco/Toasts | Fehlende Währung benannt (`Zu wenig Bier (−14)`) — gut |
| Anpfiff | **Weiterhin** oft nicht per Pointer startbar (Console-Click nötig) |

---

## Bugs / Reibung

1. **Anpfiff-Hit-Target** — unverändert kritisch für Automatisierung/Touch.
2. **Sicherheit nur über Ordnerposten** — ohne Posten bleibt Fan-Kauf bei 0; im Lauf leicht als „Produktion fehlt“ missverstanden.
3. **HUD** — teils noch doppelte Prozent-Lesarten (Scoreboard vs. Momentum-Leiste).
4. **Cement** — Mechanik da, wenig UI-Feedback („verlangsamt“).
5. **Crowd-Overlap** in Neutral bei vielen Figuren — uncapped wirkt voll, aber unruhig.

---

## Gegen vorherigen Playtest

| | Vorher (Matchday) | Jetzt (Balance) |
| --- | --- | --- |
| Easy-Endstand | 2:9 | **2:3** |
| Tor-Spam | stark | spürbar gedämpft |
| KI-Dominanz | früh klar | lange ausgeglichen |

---

## Offene Fragen (an Produkt)

Siehe Antwort an den User — gesondert.
