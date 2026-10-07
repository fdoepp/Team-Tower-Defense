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
