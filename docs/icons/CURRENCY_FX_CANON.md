# Währungs- & Momentum-FX — verbindlicher Kanon

**Status:** freigegeben / final für alle neuen Spielversionen und Deployments  
**Stand:** 2026-10-08  

Wenn eine Währung **dazukommt** oder **verbraucht** wird, immer diese freigestellten Floating-FX zeigen (Logo + grünes `+` / rotes `−`).  
Fan-Blöcke, die Momentum erzeugen: immer `fx-gain-momentum` aufsteigend über dem Block.

Runtime: `game/src/assets/currencyFx.ts`  
Regel: `.cursor/rules/stadium-background.mdc` (alwaysApply)

## Währungs-FX

| Event | Pfad |
| --- | --- |
| + Gold | `game/public/icons/ui/fx-gain-gold.png` |
| − Gold | `game/public/icons/ui/fx-spend-gold.png` |
| + Bier | `game/public/icons/ui/fx-gain-bier.png` |
| − Bier | `game/public/icons/ui/fx-spend-bier.png` |
| + Fanartikel | `game/public/icons/ui/fx-gain-fanartikel.png` |
| − Fanartikel | `game/public/icons/ui/fx-spend-fanartikel.png` |
| + Sicherheit | `game/public/icons/ui/fx-gain-sicherheit.png` |
| − Sicherheit | `game/public/icons/ui/fx-spend-sicherheit.png` |

Beispiel Kauf am Bierstand: gleichzeitig `fx-spend-bier` (über Person) + `fx-gain-gold` (über Stand, aufsteigend).  
Fanshop: `fx-spend-fanartikel` + `fx-gain-gold`.

## Momentum-FX (Fan-Block)

| Event | Pfad |
| --- | --- |
| + Momentum | `game/public/icons/ui/fx-gain-momentum.png` |

Immer **aufsteigend** vom Fan-Block animieren (Trail/Fade nach oben), analog zum +Gold-Trail am Stand.

## Regeln

1. Bei jedem Deployment / Match-HUD nur diese FX für Ressourcenänderungen.
2. Keine ad-hoc Text-Popups (`+5 Gold`) ohne diese Icons, solange der Kanon gilt.
3. HUD-Zähler bleiben getrennt (logo-only Currencies + Live-Zahl).
