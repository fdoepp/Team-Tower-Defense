# Visual UI audit

Use with every LaneLink QA Auftrag alongside the victory playthrough.

## Inventory

Call `list_expected_controls`. For each control that should appear in the current screen:

1. **Visible** — in viewport, not clipped, not covered by another layer.
2. **Labeled** — German copy readable (Gesang / Pyro / Pyro Wurf / Angriff; Matchday may use Kaufen/Senden).
3. **Clickable** — enabled when the flow says so; click hits the control; no dead zone from transparent overlays.
4. **Feedback** — disabled state is obvious when currency/mix blocks it (e.g. Anpfiff until mix valid).

## Screens

| Screen | Must check |
| --- | --- |
| Menu | Solo vs KI, Vollbild |
| Setup | ± mix, Zurück, Anpfiff |
| Match HUD | currency chips, command rail (+ / actions), Vollbild starten |
| Seat popup | Fan / Ultra / Hooligan / Abbrechen |
| Build popup | Bierstand / Ordnerposten / Fanshop / Upgrade / Ordner anheuern |

## Do not

- Fail a run only because Matchday comic icons are not yet wired on the combat branch — note as cosmetic/`skipped` if procedural art still works.
- Treat a tunnel URL mismatch (old 5-block layout vs current) as a game design bug; mark `env` blocked and re-resolve the target.
