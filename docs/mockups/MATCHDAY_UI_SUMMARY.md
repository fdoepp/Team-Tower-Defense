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
| Gang | Offener unterer Straßenbereich (~12 Buden-Positionen). Gebaute Buden stehen frei am Gang; leere Slots mit flachem **Bauzaun** + `+`. Figuren nur in Blöcken oder laufend (Block ↔ Stand ↔ Kampf), nicht in einer Icon-Leiste. |
| Rechts | **Baumenü-Popup** nur Gebäude (Bierstand / Fanshop / Ordnerposten) inkl. Gold-Kosten — **keine Figuren** |

## Icons (Lv1–Lv5)

Pfad Spiel: `game/public/icons/` · Übersicht: `docs/mockups/icons/preview-all.jpg`

### Stände
- **Bierstand** `stands/bier-1`…`5` — Lv4 Neon korrekt **BIER**
- **Fanshop** `stands/fanshop-1`…`5`
- **Ordnerposten** `stands/ordner-1`…`5`

### Figuren
- **Fans** `units/fan-1`…`5` — offen, freundlich, **Fähnchen**
- **Ultras** `units/ultra-1`…`5` — Kapuze oben, Sonnenbrille, Bier, Bengalos, Megafon
- **Hooligans** `units/hooligan-1`…`5`
- **Ordner** `units/ordner-1`…`5`

**35 Icons** total.
