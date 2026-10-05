# Team Tower Defense — Game Design Concept

**Working title:** LaneLink  
**Platform:** Mobile (portrait-first, landscape optional later)  
**Art:** Flat 2D, geometric shapes, readable silhouettes — no fancy VFX needed  
**Session length:** ~4–6 minutes per match  
**Players:** 2 (local pass-and-play later; online 2-player as primary target)

---

## 1. One-sentence pitch

A tiny 2-player tower defense where you either **hold one shared lane together** or **duel on mirror lanes fed by a sushi-belt of towers and send-packs** — finished in five minutes.

**Design focus:** Versus sushi belt is locked (§7). This pass optimizes **Co-op roles + alternate victories** (§6).

---

## 2. Design pillars

1. **Short and decisive** — A match has a clear start, middle, and end. No grinding waves forever.
2. **Readable at a glance** — Few tower types, strong colors, big touch targets.
3. **Teamplay that matters** — Co-op splits labor (supply vs. build); either role can clutch an alternate win, but most runs just hold the line together.
4. **Fair versus** — Same map, same belt sequence; skill = what you buy, when you save, and when you snipe the rare exclusive plate.
5. **Simple looks, sharp feel** — Circles, squares, arrows; juice comes from timing and feedback, not polygons.

---

## 3. What works in other TDs (and what we steal)

### Co-op collaboration that feels good

| Pattern | Games that nail it | How we use it |
|---|---|---|
| **True job split** | *Deep Rock* (class kits), *Overcooked* (stations), *Orcs Must Die* | Fixed roles: **Supplier** gathers mats, **Architect** spends them on towers. |
| **Pipeline dependency** | Factory/crafting co-op, *Factorio*-lite fantasy | Architect cannot place mid/late towers without Supplier deliveries. |
| **Shared life, shared loss** | Most co-op TDs | One HP pool — alt-wins still require the lane to stay alive. |
| **Multiple victory paths** | *Civilization* (domination / science / culture…) | ~80% **Hold** wins; ~20% flashy role breakthroughs (**Stockpile** / **Bastion**). |
| **Ping / callouts** | *Deep Rock*, co-op shooters | Need Parts / Need Slow / Upgrade Here / Push Alt-Win. |
| **Shared emergency button** | *Orcs Must Die* | Shared **Panic Freeze** filled by both roles’ actions. |

Avoid: both players doing the same job, crafting trees too deep for 5 minutes, alt-wins that ignore the partner.

### Versus that feels fair

| Pattern | Games that nail it | How we use it |
|---|---|---|
| **Mirror lanes** | *Bloons TD Battles*, *Clash Royale*-adjacent pacing | Identical path, identical build slots, mirrored UI. |
| **Conveyor / draft under time** | Sushi-belt fantasy, auto-chess timed shops, *BTD Battles* eco timing | Shared **sushi belt** of tower plates + send plates scrolls past both players. |
| **Mostly parallel shops** | — | **~90% of plates are parallel** — both can buy the same offer. Fairness first. |
| **Rare exclusives** | Limited drops, contested objectives | **~10% exclusive plates** — first who can afford and taps gets it (spice, not core). |
| **Send units (eco → pressure)** | *BTD Battles* | Send plates on the belt replace static L/M/H buttons. |
| **Sudden death** | Fighting games, *Clash* overtime | After timer, leaks hurt more / first leak can decide. |

Avoid: every plate being a click-race, shared-map sabotage, steal towers, pay-to-win belt contents.

---

## 4. Core loop

### Versus (optimized)

```
Belt plate appears → Buy tower OR buy send OR skip/save →
Place tower / opponent receives send → Defend leaks → Repeat
```

### Co-op (roles + pipeline)

```
Supplier harvests / refines materials → delivers to shared crate →
Architect spends mats (+gold) to place/upgrade towers →
Both keep HP alive → Hold timer OR hit a role breakthrough win
```

**Touch UX (mobile):**
- **Versus:** Bottom sushi belt — tap plate to buy; tower → hand → slot; send fires immediately; upgrades on-tower
- **Co-op Supplier:** Tap resource nodes / refine UI / “Deliver” to crate; cannot place combat towers
- **Co-op Architect:** Tap crate-funded tower menu → place/upgrade on slots; cannot harvest nodes

---

## 5. Shared rules (economy & combat)

### Economy

- Start gold: **120**
- Passive income: **+8 gold / second** (ramps slightly over time: +1 every 60s, cap +12)
- Kill bounty: small (keeps focus on income + sends, not farming)
- Sell refund: **70%** of spent gold on that tower

### Lives / HP

- Base HP: **20**
- Leak damage depends on unit size (1 / 2 / 4)
- At 0 HP → defeat (co-op: both lose; versus: that player loses)

### Towers (minimal set — 6 total)

Players never need more than these:

| ID | Name | Role | Gold | Co-op mats | Notes |
|---|---|---|---|---|---|
| T1 | **Bolt** | Single-target DPS | 50 | 2 Scrap | Default workhorse |
| T2 | **Spray** | AoE splash | 75 | 3 Scrap | Weak vs single tanks |
| T3 | **Glue** | Slow aura | 60 | 1 Core | Essential control |
| T4 | **Sniper** | High damage, slow fire | 90 | 2 Core | Anti-tank |
| T5 | **Beacon** | Aura: +damage adjacent | 80 | 2 Core | Buffs neighbors |
| T6 | **Mines** | Ground trap, charges | 55 | 2 Scrap | Chokepoints |

Versus uses gold only (via belt). Co-op gates with mats + gold.  
Each tower has **2 upgrades** (L1 → L2 → L3), paying the same mat type again at higher amounts.

### Enemies (minimal set — 5)

| ID | Name | HP | Speed | Leak | Role |
|---|---|---|---|---|---|
| E1 | Runner | Low | Fast | 1 | Early pressure |
| E2 | Grunt | Med | Med | 1 | Filler |
| E3 | Tank | High | Slow | 2 | Needs sniper/glue |
| E4 | Swarm | Very low | Med | 1 (×6 pack) | Needs splash |
| E5 | Bosslet | Very high | Med | 4 | Mid/late spike |

---

## 6. Mode A — Co-op (shared map, role split) — OPTIMIZED PASS

### Design intent

Co-op should feel like **two jobs on one machine**, not “two builders sharing slots.”  
Inspiration: *Civilization*-style multiple ways to win, tuned for a 5-minute mobile run.

**Opinion (locked into this design):** Alternate victories are a great fit **if** we keep exactly **one default path + one breakthrough per role**, make breakthroughs harder/rarer (~20% of wins), and keep them as **team wins** (both celebrate). Too many Civ-style paths would muddy a minigame; greed tunnels that ignore HP should still lose.

### Roles (picked in lobby, 10s)

| Role | Fantasy | Can do | Cannot do |
|---|---|---|---|
| **Supplier** | Beschafft Materialien | Harvest nodes, refine, deliver to crate, spend gold on logistics | Place/upgrade combat towers |
| **Architect** | Baut die Verteidigung | Place/upgrade towers from crate stock, sell towers, aim Panic | Harvest or refine materials |

Roles are asymmetric on purpose. Swap next match is encouraged.

### Layout

- One vertical lane (portrait): spawn top → base bottom
- **6 combat slots** along the path (Architect only)
- **3 resource nodes** off-path (left/right edges) — Supplier only
- **Shared Crate** UI near the base (material counts both can see)
- **Refine bench** next to crate (Supplier mini-loop)

```
   NODE        spawn
     \           |
   NODE ---- [ path + slots ] ---- NODE
                 |
            CRATE / REFINE
               BASE
```

### Materials (keep to 2 types)

| Mat | How Supplier gets it | Architect spends it on |
|---|---|---|
| **Scrap** | Tap nodes (cooldown), small bonus from kills near nodes | Bolt, Spray, Mines + their upgrades |
| **Core** | Refine 3 Scrap → 1 Core at bench (2.5s channel) | Glue, Sniper, Beacon + their upgrades |

Why only two: readable on a phone, clear midgame pivot (Cores unlock control/tech).

**Starter kit:** Crate begins with Scrap 8 / Core 1 so Architect can place an opener without waiting idle.

**Gold in co-op:** Shared team gold (same income numbers as §5).  
- Supplier: gold speeds node cooldown / pays for **Surge Extract** (burst harvest).  
- Architect: gold is a second cost next to mats (towers still have a gold price, but **mats are the gate**).

Example: Sniper = **90 gold + 2 Core**. If mats missing, button shows “need Core” not “broke.”

### Supplier loop (detail)

1. Tap a ready node → +2 Scrap (node CD ~3.5s; Surge Extract: 25g → instant +4 Scrap, 12s CD)
2. Optional: at bench, convert 3 Scrap → 1 Core (channel; cancelable)
3. Tap **Deliver** if carrying (Supplier has a pocket of max 6 Scrap + 2 Core). Delivery is instant into crate.
4. Optional late tool: **Overclock Node** (40g) — one node runs 30% faster for 20s (feeds Stockpile path)

Pocket + Deliver keeps the “I bring you parts” fantasy instead of auto-deposit magic.

### Architect loop (detail)

1. Watch crate + wave status
2. Buy tower if crate + gold allow → place on free slot
3. Upgrade towers (costs Scrap/Core + gold)
4. Ping Supplier for missing mat type
5. Fire Panic when meter full

**Adjacency:** Towers on neighboring slots gain **+10% damage** (Beacon adds one more stack). Still rewards smart placement, not a second builder.

### Match structure (~5 min)

| Phase | Time | What happens |
|---|---|---|
| Role pick | 10s | Supplier / Architect |
| Calm | 0:00–0:40 | First deliveries + opener towers |
| Waves 1–3 | 0:40–2:30 | Scrap-heavy defense |
| Pivot | 2:30–3:30 | Cores matter (Glue/Sniper/Beacon) |
| Spike | 3:30–4:30 | Bosslet + mixed pack |
| Resolve | ≤4:30 | Hold timer **or** breakthrough already triggered |

**Lose:** HP hits 0 (always overrides alt-win progress).

### Victory paths (Civ-lite)

Target mix over many matches: **~80% Hold**, **~10% Stockpile**, **~10% Bastion**.

| Victory | Who drives it | Condition | Feel |
|---|---|---|---|
| **Hold** (default) | Both | Survive until **4:30** with HP > 0 | “We gritted it out.” |
| **Stockpile** (Supplier breakthrough) | Supplier | Shared crate reaches **Stockpile 100** (Scrap×1 + Core×4 toward score) **and** HP > 0 | “Logistics clutched the contract early.” |
| **Bastion** (Architect breakthrough) | Architect | Fortification score **≥ 40** while HP ≥ 12, held for **8 continuous seconds** | “The wall became unbeatable.” |

**Fortification score (simple):**  
`sum over towers (tier × weight)` with weights Bolt/Mines 1, Spray/Glue 2, Sniper/Beacon 3; tier L1/L2/L3 = ×1/2/3.  
Example: Sniper L3 (9) + Glue L2 (4) + Beacon L2 (6) + Bolt L2 (2) = 21 — needs a strong, upgraded grid to hit 40.

**Breakthrough rules (important):**
1. Alt-wins are **team victories** — both get the win screen; MVP banner names the driving role.
2. Alt-wins are **opt-in greed**: chasing Stockpile/Bastion means fewer Panic dumps / greedier refine — if the lane breaks, you still lose.
3. Partner is never useless: Stockpile needs Architect to keep HP up; Bastion needs Supplier feeding Cores.
4. Only one victory can fire; first condition met ends the match (Hold checked at timer).
5. UI shows two thin breakthrough meters (Stockpile / Bastion) so the team can choose to contest them or ignore them.

### Collaboration tools

1. **Pings:** Need Scrap / Need Core / Upgrade Here / Push Breakthrough / Save Panic  
2. **Shared Panic Meter:** +from deliveries AND kills. Freeze 2.5s when full.  
3. **Crate visibility:** Architect always sees incoming pocket contents when Supplier is carrying.

### Co-op difficulty

- v1: **Standard** only  
- Later: Elite (node CDs longer, Stockpile 120, Bastion 48)

### Why not a sushi belt in co-op (for now)

Versus already owns the belt fantasy. Co-op’s fantasy is **pipeline + roles**. Mixing both would blur modes. Revisit only if Supplier harvesting feels dull in playtests.

## 7. Mode B — Versus (mirror lanes + sushi belt) — OPTIMIZED PASS

This section is the active design focus. Co-op still uses the loadout shop until its own pass.

### Layout

- Full-screen **own lane** (portrait)
- Thin status bar: opponent HP, opponent gold band (approx), last send they bought
- **Sushi belt** along the bottom (~20–24% of screen height) — always visible
- Identical path & **6 build slots** each
- Peek-at-opponent lane = polish later

### The sushi belt (core versus fantasy)

One shared sequence of **plates** scrolls left→right (or top of belt strip).  
Each plate is either a **Tower** or a **Send**.

```
… → [Bolt 50] → [Light Send 40] → [Glue 60] → [★ Sniper 90] → [Mid Send 90] → …
                 parallel              parallel     EXCLUSIVE          parallel
```

#### Plate types

| Kind | What you get on buy | Default share mode |
|---|---|---|
| Tower plate | 1× tower token in hand → place on free slot | Parallel (~90%) |
| Send plate | Pack immediately enters opponent lane | Parallel (~90%) |
| Exclusive of either | Same, but only **one** player may buy it | Exclusive (~10%) |

#### 90 / 10 share rule

| Mode | Share of plates | Behavior |
|---|---|---|
| **Parallel** | ~90% | Both players see the same plate. Either can buy it **independently** while it is on the belt. One buying does **not** remove it for the other. |
| **Exclusive** | ~10% | Marked with a clear star / thick rim / “1×”. **First valid purchase** (server: enough gold + tap) claims it; plate vanishes for the other. |

**Cadence (readable, not pure RNG):** every **10th** plate is exclusive (plates 10, 20, 30…).  
That is exactly 10%, easy to learn, easy to balance. Optional later: weighted RNG ±1 around that slot.

**Telegraph for exclusives:** Exclusive plates pulse for **0.6s** before they become buyable. Reduces pure ping-snipe; rewards watching the belt.

**Dwell time:** Each plate stays claimable for **~4.5s**, then slides off. Missed = gone (no backlog clutter).

**Hand limit:** Max **1** unplaced tower token. Must place or sell-back (90% refund) before buying another tower plate. Sends do not use the hand.

### Belt composition by phase

Belt contents shift so early/mid/late have different decisions. Same seed for both players.

| Phase | Time | Towers weighted toward | Sends weighted toward | Notes |
|---|---|---|---|---|
| Open | 0:00–0:25 | Cheap (Bolt, Mines, Glue) | None | Fair setup; no sends yet |
| Pressure | 0:25–2:00 | Mixed cheap/mid | Light | First exclusives appear |
| Mid | 2:00–4:00 | Spray, Beacon, Sniper | Mid | Eco vs defense bites |
| Late | 4:00–5:00 | Sniper, upgraded-value repeats | Heavy + Mid | Big swings |
| Sudden death | 5:00+ | Defense-leaning | Light spam + Mid | Faster belt (+20% scroll) |

Rough mix on the belt overall: **~55% tower / ~45% send** after Open.

### Send plates (replace old L/M/H buttons)

| Send | Contents | Cost | Earliest on belt |
|---|---|---|---|
| Light | 6× Runner | 40 | 0:25 |
| Mid | 4× Grunt + 2× Swarm | 90 | 1:30 |
| Heavy | 2× Tank + 1× Bosslet | 180 | 3:00 |

Rules:
- Buying a send plate = send fires (queue max **1** outgoing pack; if busy, plate purchase is rejected with a short buzz).
- **Eco tax:** After any send, passive income −20% for 3s.
- Defender consolation gold on leak: 10–20.
- Parallel send plates mean both can rush the same timing — mirror skill check.
- Exclusive Heavy is a match-swing moment (rare, telegraphed).

### Tower plates & placement

- Costs match the tower table in §5.
- After buy: token sits in hand (ghost icon); tap a free slot to place.
- **Upgrades stay off-belt:** tap your tower → Upgrade (same gold costs as before). Keeps the belt about *access*, not every micro decision.
- Duplicate tower plates can appear; you may build multiples.
- If no free slot: tower purchase blocked (or auto-offers sell prompt) — prefer **block + shake** for clarity.

### Economy tweaks for belt pacing

Belt gates opportunity, so income stays as in §5, with one change:

- **Miss-pity:** If a player buys nothing for 12s while having ≥ cost of the cheapest on-screen plate, the next parallel plate they can afford gets a **10% discount** once. Soft anti-starve for new players; does not apply to exclusives.

### Match structure (~5 min)

| Phase | Time | What happens |
|---|---|---|
| Open belt | 0:00–0:25 | Towers only; place core defense |
| Pressure | 0:25–2:00 | Light sends enter belt |
| Mid | 2:00–4:00 | Mid sends + stronger towers |
| Late | 4:00–5:00 | Heavy sends; exclusives matter more |
| Sudden death | 5:00+ | Faster belt; leaks deal ×2 until someone dies |

**Win:** Opponent HP → 0.  
**Tiebreak:** Same-second mutual death → higher current gold wins.

### Fairness & netcode (versus belt)

- Server owns belt index, plate IDs, and gold.
- **Parallel buys:** both can succeed; no race.
- **Exclusive buys:** server resolves first valid request; loser gets “sniped” toast + gold untouched.
- Client may show optimistic gray-out only after server ACK on exclusives.

### Versus strategy space (with belt)

- **Rush:** Spend early parallel Lights; force opponent onto defense plates
- **Eco bank:** Skip mid plates, cash Exclusive Heavy or stacked Mid timing
- **Tech line:** Prioritize Glue/Beacon/Sniper parallels; ignore early sends
- **Snipe discipline:** Save ~90–180 gold before exclusive windows (every 10th plate)
- **Hand discipline:** Don’t hold a tower token while a must-have send is coming

### Versus success feel

> “I banked for the exclusive Heavy, but they glued in time — next rematch I’m sniping the Beacon.”

---

## 7b. Mode separation

| Mode | Acquisition fantasy |
|---|---|
| **Versus** | Sushi belt (90/10) |
| **Co-op** | Supplier → Crate → Architect pipeline |

Do not mix belt rules into co-op unless playtests demand it.
---

## 8. Meta progression (keep tiny)

For a phone minigame, progression should not gate fairness.

**Cosmetics only (recommended):**
- Lane themes (colors)
- Tower skins (recolors)
- Win stickers / emotes (2–3)

**Unlock via:** play matches, not pay-to-win towers.

No tower unlock tree that changes balance between players.

---

## 9. UI wireframes (portrait)

### Versus

```
┌─────────────────────────┐
│ HP ❤ 16  ⏱ 2:41  VS HP 11│
│ Gold 184  Income +9     │
├─────────────────────────┤
│                         │
│      [path / units]     │
│    □ slot    □ slot     │
│                         │
│    □ slot    □ slot     │
│           BASE          │
├─────────────────────────┤
│ hand: [Bolt?]  sell     │
│ 〰 sushi belt 〰〰〰〰〰  │
│ [Glue] [Light] [★Heavy] │  ← ★ = exclusive
└─────────────────────────┘
```

### Co-op

```
┌─────────────────────────────┐
│ HP ❤ 14  ⏱ 2:41  Panic ▮▮▮ │
│ Stockpile 62/100  Bastion 28│
├─────────────────────────────┤
│ NODE·        [path]     ·NODE│
│           □     □            │
│ NODE·     □     □            │
│         CRATE S:12 C:3       │
│           BASE               │
├─────────────────────────────┤
│ Supplier: [Harvest][Refine]  │
│           [Deliver][Surge]   │
│ Architect:[Bolt][Glue][…]    │
│ Pings: Scrap|Core|Push|Panic │
└─────────────────────────────┘
```

(Each client highlights only their role’s controls; partner actions still visible as ghosts.)
---

## 10. Art & audio direction (cheap)

- **Background:** soft vertical gradient + simple path stripe
- **Towers:** distinct geometric icons (triangle bolt, circle spray, hex glue…)
- **Units:** colored pills / blobs with size = threat
- **FX:** hit flash, slow tint, send whoosh
- **Audio:** 3 SFX + 1 short loop; mute toggle mandatory

---

## 11. Technical shape (for later build)

Out of scope for this concept doc, but constraints that keep the design honest:

- Authority: **server-authoritative** for online (gold, belt index, exclusive claims)
- Exclusive resolve: first valid server request wins; parallel buys never contend
- Tick: 10–20 Hz is enough
- Offline: bot follows scripted buy priorities on the same belt seed

---

## 12. MVP scope (when building starts)

**Must have**
- Versus: mirror map + sushi belt (90/10), sudden death, bot or local 2P
- Co-op: shared map, Supplier/Architect roles, Scrap/Core crate, three victory paths
- Tutorials: 30s versus tip, 40s co-op role tip

**Explicitly cut from MVP**
- 2v2, ranked ladder, hero units, card drafts, 3D, battle pass, co-op sushi belt, 4+ Civ victory types

---

## 13. Success criteria for the design

A good session feels like:

- Co-op Hold: “You kept Cores coming while I glued the Bosslet.”
- Co-op breakthrough: “Stockpile hit 100 with eight seconds left — logistics win.”
- Versus: “I skipped two Lights to bank the ★ Heavy — they still had Glue ready.”
- Rematch tempting within 10 seconds of the result screen.

---

## 14. Open polish (not blockers)

- Ranked MMR later
- Spectate / share replay GIF
- Weekly challenge seed (same waves for all co-op pairs)

---

*Document status: Versus belt (90/10) + Co-op roles/pipeline/Civ-lite victories drafted. Ready for feedback, then prototype.*
