# Standicons — Tiefenperspektive je Bauslot

Naming: `{kind}-{color}-{lv}-b{block}i{index}.png`

- `block` 0=Heim · 1=Neutral · 2=Gäste
- `index` 0..3 (far-left, far-right, near-left, near-right)
- Colors: blue / red / grey · Levels 1..5
- Generator: `game/scripts/gen_stand_persp.py` (procedural VP prism)
- AI overrides: stadium-facing GenerateImage per slot (bier-blue complete; other packs via parallel agents)

Runtime: `standIconPath(kind, color, lv, blockId, index)` → this folder  
UI/Sidebar: iso canon `icons/stands/{kind}-{color}-{lv}.png`
