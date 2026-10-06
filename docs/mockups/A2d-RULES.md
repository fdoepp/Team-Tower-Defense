# Screen-Layout A2d — festgehaltene Regeln (noch nicht implementiert)

Erweitert A2c.

## Ansicht
- Kleines halbes Spielfeld oben (Score, Minute, Momentum L/Mitte/R)
- 5 Blöcke im Bogen, zum Spielfeld ausgerichtet
  - Links: Heim (blau/weiß)
  - Mitte: 3× Neutral (grau)
  - Rechts: Gäste (rot/weiß)
- Pro Block: **4 Bauslots** — 2 oberhalb / 2 unterhalb des Gangs
- Durchgehender **Gang** = Hauptkampfzone
- **Stimmungsmeter** 4 Segmente am Außenrand

## Stimmungs-Aktionen (neben dem Barometer)
Buttons neben dem Stimmungsmeter (Heim-Seite; Gäste gespiegelt später):

| Aktion | Fan-Typ | Kosten | Abklingzeit |
|---|---|---|---|
| **Gesang** | Normalos | kein Gold | CD |
| **Pyro** | Ultras | kein Gold | CD |
| **Klatschen** | Familie | kein Gold | CD |

**Effekt** skaliert mit der **Anzahl** des jeweiligen Fan-Typs **im eigenen Block**  
(z.B. `Effekt = Basis × Anzahl_Typ_im_Block`).

Gesänge später zusätzlich an **Stimmungs-Segment** gekoppelt (nur wählbar, wenn Meter im passenden Segment).

## Ultra-Befehl am Gang
- Links am Gang (beim Heim-Ausgang): Button **„Ultras → Gang“**
- Beordert Ultras aus dem Block aktiv in den Gang zum Kämpfen
- Ebenfalls eher CD / Verfügbarkeit statt Gold (Feinabstimmung offen)

## Einheiten
- Start: 10 gewählte Männchen im Heimblock (Ultra/Normal/Familie klar unterschiedlich)
- Wandern: Block ↔ Bierstand ↔ Kampf
- Auto: Durst → Stand; Stand verteidigen oder zum nächsten bestückten Stand durchkämpfen
- Wachstum: Einheiten im Block erhalten/kaufen
