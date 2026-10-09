# Rail Action Cards — Personen & Gebäude (verbindlicher Kanon)

**Status:** freigegeben für alle Branches / Deployments  
**Stand:** 2026-10-08  
**Runtime:** `game/src/style.css` (`.rail-rows` + `.action-card.unit-card` / `.build-card`)  
**Markup:** `game/src/main.ts` — `.unit-rows.rail-rows` · `.build-rows.rail-rows`

Personen-Sidebar und Gebäude-Rail teilen **dieselbe** Kartendarstellung und **dieselbe** Skalierung. Flächen (Icon links, Buttons rechts, gleicher `--ur-inset`) bleiben; beim Schrumpfen darf sich **nichts in sich verzerren**.

## Skalierungsregel

1. Container `.rail-rows` hat `container-type: size` (stellt `cqw`/`cqh` für **Kinder** bereit).
2. Jedes Maß auf der Card als Länge (Ref-Box 220×480, Faktor 0.68…1.08):

   `clamp(N*0.68, min(100cqw*N/220, 100cqh*N/480), N*1.08)`

   **Nicht** `calc(Npx * (100cqw / 220px))` — Chromium verwirft das → Länge 0 →
   Köpfe fallen auf PNG-Intrinsisch **256px**.
3. Alle Tokens teilen dieselbe Ref-Box → Relationen bleiben (kein verzerrendes
   per-Property-clamp mit anderen Grenzen).
4. Icons: immer `aspect-ratio: 1 / 1`, `object-fit: contain` — nie gestreckt.
   `.ur-head` setzt `width` **und** `height` explizit (`min(--head-size, 34%)`).

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
