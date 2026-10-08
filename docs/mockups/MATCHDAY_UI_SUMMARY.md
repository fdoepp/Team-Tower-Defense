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
| Gang | Offener Straßenbereich; **~12 gleichmäßige Bau-Plots** (oft 2×6) als **umzäunte Rechtecke** mit `+`. Gebaute Buden stehen *in* diesen Plots; **Standarten** (`pennant-ksc` blau-weiß / `pennant-vfb` rot-weiß, Holz+Streifenfahne) markieren Besitz/Front. Figuren nur Block oder laufend auf dem Gang. |
| Rechts | **BAUEN**-Panel optisch wie linke Command-Rail (Holz, Header, Karten, Button-Paar), Inhalt nur Gebäude + Gold-Kosten — **keine Figuren** |

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

### Standarten (UI, kanonisch)
- **Heim / KSC** `ui/pennant-ksc.png` — blau-weiße Streifenfahne an Holzpfosten
- **Gäste / VfB** `ui/pennant-vfb.png` — rot-weiße Streifenfahne an Holzpfosten
- Register & Deploy-Pflicht: `docs/mockups/icons/ASSET_DB.json` · Regel: `docs/mockups/A2c-RULES.md` → Standarten
- Preview: `docs/mockups/icons/ui-review/pennant-final/preview-pennants-final.jpg`

### Bauplatz (UI, kanonisch + Auto-Swap)
- Neutral/grau: `ui/slot-empty.png` (= parallel ohne Standarte)
- Eigen blau/rot: `ui/slot-empty-parallel-blue.png` / `-red.png` (iso-Varianten analog)
- **Jedes neue Spiel:** Icons preloaded; Runtime tauscht bei Teamkontrolle Standarte ein, bei Grau wieder aus (`slotEmptyIconPath` / `slotControlForPlot`).
- Regel: `docs/mockups/A2c-RULES.md` → Bauplatz

**35 Icons** Stände/Figuren + kanonische UI-Standarten.
