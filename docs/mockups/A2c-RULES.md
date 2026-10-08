# Screen-Layout A2c — festgehaltene Regeln (noch nicht implementiert)

## Ansicht
- Kleines halbes Spielfeld oben (Score, Minute, Momentum L/Mitte/R)
- 5 Blöcke im Bogen, **zum Spielfeld hin ausgerichtet**
  - Links: Heim (blau/weiß)
  - Mitte: 3× Neutral (grau)
  - Rechts: Gäste (rot/weiß)
- Pro Block: **4 Bauslots** — **2 oberhalb** und **2 unterhalb** des Gangs (je Seite der Tür)
- Durchgehender **Gang** = Hauptkampfzone
- Stimmungsmeter 4 Segmente an den Außenkanten

## Einheiten (Männchen)
- Optisch klar getrennt: **Ultra** / **Normal** / **Familie**
- Start: im **eigenen Block** genau die **10 gewählten** Einheiten
- Einheiten wandern zwischen **Block ↔ Bierstand ↔ Kampf**

## Verhalten
1. **Durst** → laufen automatisch zum (eigenen/besetzten) Bierstand
2. Am Stand: **verteidigen** automatisch ODER versuchen, sich zum **nächsten bestückten Stand** durchzukämpfen
3. **Aktiv:** Ultra-Trupps aus dem Stadion/Block in den **Gang beordern**

## Wachstum
- Mit der Zeit: neue Einheiten im Block **erhalten oder kaufen**

## Standarten (Besitz / Front) — kanonisch

Festgelegt (Vorschlag A): **Holzpfosten + einfache Streifenfahne** im Stand-Stil.
Kein Team-Schriftzug, kein metallischer Ständer.

| Team | Farbe | Asset (Deploy-Quelle) |
|---|---|---|
| Heim / KSC | blau-weiß | `game/public/icons/ui/pennant-ksc.png` |
| Gäste / VfB | rot-weiß | `game/public/icons/ui/pennant-vfb.png` |

**Pflicht für jedes neue Spiel / jeden Deploy:**
- Besitz und Front am Gang **nur** über diese beiden Standarten zeichnen.
- Runtime-Binding: `UI_ICONS.pennantKsc` / `UI_ICONS.pennantVfb` in `game/src/game/assets.ts`.
- Register: `docs/mockups/icons/ASSET_DB.json` (`locked: true`).
- Alte Logo-/Chrom-Wimpel dürfen nicht mehr geladen oder neu generiert werden.

## Bauplatz (leer / eigener)

Design: **vier Holzpfosten + Seil**, Steinrand, Erde, `+` (Vorschlag C).

| Zustand | Bedeutung | Assets |
|---|---|---|
| Ohne Standarte | Plot vorhanden, noch nicht als eigener Bau-Slot markiert | `slot-empty-iso.png` / `slot-empty-parallel.png` |
| Mit Standarte blau | **Eigener** Heim-Bauplatz — hier darf KSC bauen | `slot-empty-*-blue.png` |
| Mit Standarte rot | **Eigener** Gäste-Bauplatz — hier darf VfB bauen | `slot-empty-*-red.png` |

Orientierung (`iso` vs `parallel`) noch wählbar; Besitz-Varianten liegen für beide vor.
