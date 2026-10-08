# Handoff an Matchday-/Game-Agent — nächste Version

**Basis:** Branch `cursor/matchday-mood-free-939c` (von `cursor/matchday-game-a9b1` @ 7300154).

## Bereits vom QA-Agent umgesetzt (nicht rückgängig machen)

1. **Gesang/Pyro-Mood-Dead-Code entfernt** (`tryMoodAction`, `MOOD_CD`, `MoodAction`, jubelMul, moodKick, aiCd/aiSecurity-Mood).
2. **Keine Block-Personen-Kapazität** mehr (unbounded seats + Scatter-Positionen).
3. **Momentum nur über Stimmung** (`moodHeim`/`moodGaeste` aus Fan-`jubel` + Shop/Tore; Momentum folgt Mood-Diff).

Pyro-Kampf / Senden (`tryPyroFight`, `#btn-pyro-fight`) bleibt.

## Bitte in neuer Version umsetzen (Balance-Vorschläge)

### Kampf
- Hooligan: HP 300→~240 **oder** attack 1.35→~1.05
- Pyro-Ultra: `PYRO_FIGHT_HP_MUL` 0.45→~0.65
- Ordnerposten: Basis-HP 360→~280 **oder** Ultra-vs-Post-Mul hoch
- Cement: eher Slow/Damage-Gate statt Hard-Wall, optional 1 Breakthrough

### Kosten / Eco
- Fan-Kauf Sicherheit 12→~10; Bier-Prod 0.2→~0.28 **oder** Hool-Kauf 14→~10
- Senden-Kosten 6→~8 gegen Spam **oder** kurze CD
- Toasts: welche Währung fehlt

### Spielergebnis / Momentum (Tor-Spur)
- Torfrequenz dämpfen: `pTor`-Basis 0.28→~0.14 **oder** Intervall 16→~22s
- Blocksturm: Count 3→4 **oder** Sec 5→8
- Elfmeter abwechselnd / Sudden Death, kein Coin-Flip-Remis

### KI
- Startgold +20→~+5; Soft-Regen ~1.0→~0.4
- Fan-Käufe spiegeln; Difficulty auch auf Schaden/Send-Rate
- Easy darf kein 2:9-Blowout sein

### UX (falls noch offen)
- Anpfiff-Hit-Target / Landscape-Setup prüfen
- HUD: eine klare Metrik (Stimmung vs Torchance nicht widersprüchlich doppelprozentig)
- Float-Spam reduzieren

## Deliverable

Neuen Branch + Draft-PR von `cursor/matchday-mood-free-939c` (oder Tip davon), spielbar lokal (`cd game && npm run dev`). Kurz in PR-Body listen, welche Zahlen geändert wurden.
