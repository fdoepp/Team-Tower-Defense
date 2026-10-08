# HUD-Vorschläge — Spielstand · Uhr · Momentum · Stimmung

Drei Richtungen für die Top-HUD-Darstellung im Matchday-Comic-Look
(Nachtstadion, Teamfarben KSC-Blau / VfB-Rot, Bloons-artiger Toy-Chrome).

Übersicht: [`proposals-abc-strip.jpg`](./proposals-abc-strip.jpg)

## Was dargestellt wird

| Element | Inhalt |
| --- | --- |
| Spielstand | `KSC 3 : 2 VfB` |
| Spieluhrzeit | Minute `39'` |
| Momentumzeiger | Heim-/Gast-Anteil + **Torchance** |
| Stimmung | Heim / Gast getrennt sichtbar |

Farben wie im Spiel: `--ksc #2563eb`, `--vfb #dc2626`, Holz/Cream der Command-Rails, Flutlicht-Nacht.

## A — Stadion-Tafel

[`proposal-a.jpg`](./proposal-a.jpg)

- Hängende Stadion-Anzeigetafel (Holzrahmen + Cream-Fläche)
- Gelbe Minuten-Bubble oben rechts
- Dual-Stimmung links/rechts (Flammen-Icons)
- Momentum-Balken darunter mit gelbem **Torchance**-Diamant in der Mitte

**Passt wenn:** klassische Stadion-Tafel, alles in einem Block unter der Flutlichtzone.

## B — Broadcast Bubble

[`proposal-b.jpg`](./proposal-b.jpg)

- Eine horizontale Cream-Kapsel mit dickem Holzrahmen (wie Command-Rails)
- Minuten als grüner Ball/Timer oben aufgesetzt
- Team-Badges als runde Schilde
- Ein kompakter Momentum-Balken + goldener Torchance-Orb; Stimmung nur als kleine Pyro-Chips an den Enden

**Passt wenn:** maximal Bloons/Mobile, wenig Höhe, klar lesbar über dem Spielfeld.

## C — Mood Wings

[`proposal-c.jpg`](./proposal-c.jpg)

- Kompaktes dunkles Scoreboard in der Mitte + Minuten-Ticket darunter
- Links/rechts hohe **Stimmungs-Säulen** (Heim blau / Gast rot) — Flutlicht/Pyro-Feeling
- Momentum-Leiste spannend zwischen den Flügeln mit Torchance-Chip

**Passt wenn:** Stimmung soll dominant und symmetrisch zu den Fanblöcken wirken.

## Nächste Schritte

Einen Buchstaben wählen (A / B / C) — dann als Runtime-Asset + `drawScoreboard`-Layout umsetzen.
