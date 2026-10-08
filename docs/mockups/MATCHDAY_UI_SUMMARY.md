# Matchday Comic UI — Zusammenfassung

Zielrichtung: **Matchday Comic** (Stadion-Flair) + Toy-/Chibi-Figuren, Spielsysteme aus LaneLink.

## Gesamtscreen

`docs/mockups/matchday-gesamt-final.jpg`

| Bereich | Inhalt |
|---|---|
| Oben | Währungen **Gold · Bier · Fanartikel · Sicherheit** — alle auf **gleichen weißen** Chips; Scoreboard; Momentum/Torchance |
| Hintergrund | Flutlicht-Stadion, blau \| grau \| rot, Pyro/Stimmung sichtbar |
| Links | Command-Rail volle Höhe: Fans/Ultras/Hooligans **SEND + HIRE**; Ordner nur **HIRE** → Wachpatrouille |
| Mitte | Blöcke Heim/Neutral/Gäste (freie Menge); klare Ausgänge → Gang |
| Gang | Offener Straßenbereich; **~12 gleichmäßige Bau-Plots** (oft 2×6) als **umzäunte Rechtecke** mit `+`. Gebaute Buden stehen *in* diesen Plots; KSC/VfB-Wimpel markieren Besitz/Front. Figuren nur Block oder laufend auf dem Gang. |
| Rechts | **BAUEN**-Panel optisch wie linke Command-Rail (Holz, Header, Karten, Button-Paar), Inhalt nur Gebäude + Gold-Kosten — **keine Figuren** |

## Icons (Lv1–Lv5)

Pfad Spiel: `game/public/icons/` · Übersicht: `docs/mockups/icons/preview-all.jpg`

### Stände
- **Bierstand** `stands/bier-{blue\|red\|grey}-1`…`5` (Defaults freigegeben) — Lv4 Neon korrekt **BIER**; Fallback `bier-1`…`5` = grau
- **Fanshop** `stands/fanshop-{blue\|red\|grey}-1`…`5` (Defaults freigegeben; Fähnchen nur Lv2); Fallback `fanshop-1`…`5` = grau
- **Ordnerposten** `stands/ordner-{blue\|red\|grey}-1`…`5` (Defaults freigegeben / final — bei jedem Deployment nur diese; `ordnerStandPath`); Fallback `ordner-1`…`5` = grau

### Figuren
- **Fans** `units/fan-1`…`5` — offen, freundlich, **Fähnchen**
- **Ultras** `units/ultra-1`…`5` — Kapuze oben, Sonnenbrille, Bier, Bengalos, Megafon
- **Hooligans** `units/hooligan-1`…`5`
- **Ordner** `units/ordner-{blue\|red\|grey}-1`…`5` (Kanon); Fallback `ordner-1`…`5`

**35 Icons** total.
