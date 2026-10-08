# Rail Action Cards — Personen & Gebäude (verbindlicher Kanon)

**Status:** freigegeben für alle Branches / Deployments  
**Stand:** 2026-10-08  
**Runtime:** `game/src/style.css` (`.rail-rows` + `.action-card.unit-card` / `.build-card`)  
**Markup:** `game/src/main.ts` — `.unit-rows.rail-rows` · `.build-rows.rail-rows`

Personen-Sidebar und Gebäude-Rail teilen **dieselbe** Kartendarstellung und **dieselbe** Skalierung. Flächen (Icon links, Buttons rechts, gleicher `--ur-inset`) bleiben; beim Schrumpfen darf sich **nichts in sich verzerren**.

## Skalierungsregel

1. Container `.rail-rows` hat `container-type: size`.
2. Ein einziger Faktor:

   `--rail-scale = clamp(0.68, min(100cqw/220px, 100cqh/480px), 1.08)`

3. Alle Card-Maße = Design-Basis × `--ur-scale` (`--ur-scale` = `--rail-scale`).
4. **Keine** getrennten `clamp()`-Min/Max pro Property (die würden Relationen brechen).
5. Icons: immer `aspect-ratio: 1 / 1`, `object-fit: contain` — nie gestreckt.

## Design-Basen (@ scale = 1)

| Token | Basis |
| --- | --- |
| `--ur-inset` | 8px (links = rechts zur braunen Kante) |
| `--ur-btn-h` | 30px |
| `--ur-btn-font` | 0.68rem |
| `--ur-btn-ico` | 14px |
| `--head-base` | 54px (Lv+ über `--head-step`) |
| `--head-max-frac` | 0.34 der Kartenbreite |

## Soft-Bind Icons

| Rail | Pfad-Helper |
| --- | --- |
| Personen | `unitHeadIconPath` / `currencyIconPath` |
| Gebäude | `standIconPath` / `currencyIconPath` |

Datei-Updates unter `game/public/icons/` greifen ohne Markup-Hardcode.

## Checkliste für Agents

- [ ] Neue UI-Änderungen an Personen **und** Gebäude über dieselben `--ur-*` Tokens
- [ ] Keine Media-Query-Overrides, die nur eine der beiden Rails anders skalieren
- [ ] Icon-Boxen bleiben quadratisch
- [ ] Links/rechts Inset gleich (`--ur-inset`)
