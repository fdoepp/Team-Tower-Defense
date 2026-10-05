# Team Tower Defense — Game Design Concept

**Working title:** LaneLink  
**Platform:** Mobile (portrait-first, landscape optional later)  
**Art:** Flat 2D, geometric shapes, readable silhouettes — no fancy VFX needed  
**Session length:** ~4–6 minutes per match  
**Players:** 2 (local pass-and-play later; online 2-player as primary target)

---

## 1. One-sentence pitch

A tiny 2-player tower defense where you either **hold one shared lane together** or **duel on mirror lanes fed by a sushi-belt of towers and send-packs** — finished in five minutes.

**Design focus right now:** Versus is being optimized first (sushi belt, 90% parallel / 10% exclusive). Co-op stays as drafted below and gets its own belt pass later.

---

## 2. Design pillars

1. **Short and decisive** — A match has a clear start, middle, and end. No grinding waves forever.
2. **Readable at a glance** — Few tower types, strong colors, big touch targets.
3. **Teamplay that matters** — Co-op roles are complementary, not “two solo players on one map.”
4. **Fair versus** — Same map, same belt sequence; skill = what you buy, when you save, and when you snipe the rare exclusive plate.
5. **Simple looks, sharp feel** — Circles, squares, arrows; juice comes from timing and feedback, not polygons.

---

## 3. What works in other TDs (and what we steal)

### Co-op collaboration that feels good

| Pattern | Games that nail it | How we use it |
|---|---|---|
| **Split roles (damage / control / economy)** | *Orcs Must Die*, *Dungeon Defenders*, *Sanctum 2* | Each player picks a **Loadout** before the match (3 towers). Overlap is allowed but inefficient. |
| **Shared life, shared loss** | Most co-op TDs | One HP pool. No blaming the “other lane” — you win or lose together. |
| **Ping / callouts** | *Deep Rock*, co-op shooters | One-tap pings: “Need slow here”, “Upgrade this”, “Save gold”. |
| **Combo towers** | *Bloons* buffs, *Kingdom Rush* synergies | Towers gain a small bonus when placed next to a partner’s tower (adjacency buff). |
| **Shared emergency button** | *Orcs Must Die* traps / cooldowns | One shared **Panic Skill** per match (freeze / clear small pack) — both must agree or one spends team meter. |

Avoid: free-for-all building with no communication, and complex inventory crafting.

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

### Co-op (unchanged for now — belt pass later)

```
Build / upgrade from loadout shop → Scripted wave → Spend gold →
Coordinate with partner → Survive timer
```

**Touch UX (mobile):**
- **Versus:** Bottom sushi belt — tap plate to buy (if gold enough); tower goes to hand → tap slot to place; send plate fires immediately
- Tap own tower → Upgrade / Sell (upgrades are **not** on the belt)
- **Co-op:** Tap empty slot → tower menu from loadout; Ping + Panic on top strip

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

| ID | Name | Role | Cost | Notes |
|---|---|---|---|---|
| T1 | **Bolt** | Single-target DPS | 50 | Default workhorse |
| T2 | **Spray** | AoE splash | 75 | Weak vs single tanks |
| T3 | **Glue** | Slow aura | 60 | Essential for co-op combos |
| T4 | **Sniper** | High damage, slow fire | 90 | Anti-tank |
| T5 | **Beacon** | Aura: +damage to adjacent ally towers | 80 | Co-op star; still useful in versus |
| T6 | **Mines** | Ground trap, charges | 55 | Good for chokepoints |

Each tower has **2 upgrades** (not 4+). Upgrade path is linear: L1 → L2 → L3.

### Enemies (minimal set — 5)

| ID | Name | HP | Speed | Leak | Role |
|---|---|---|---|---|---|
| E1 | Runner | Low | Fast | 1 | Early pressure |
| E2 | Grunt | Med | Med | 1 | Filler |
| E3 | Tank | High | Slow | 2 | Needs sniper/glue |
| E4 | Swarm | Very low | Med | 1 (×6 pack) | Needs splash |
| E5 | Bosslet | Very high | Med | 4 | Mid/late spike |

---

## 6. Mode A — Co-op (shared map)

### Layout

- One vertical lane (portrait): spawn top → base bottom
- **8 build slots** along the path (4 left / 4 right), clearly numbered
- Both players can build on any free slot
- Optional soft claim: placing a tower “owns” the slot for upgrades (partner can still sell if agreed via ping — or allow partner upgrade with 10% tax to reduce griefing)

**Recommendation for v1:** Anyone can upgrade any tower. Trust + short matches. Add ownership later if griefing appears.

### Match structure (~5 min)

| Phase | Time | What happens |
|---|---|---|
| Loadout | 20s | Each picks 3 tower types from the 6 |
| Calm | 0:00–0:40 | Build, first income |
| Waves 1–4 | ~0:40–3:30 | Scripted escalating waves |
| Spike | ~3:30–4:30 | Bosslet + mixed pack |
| Final hold | until HP 0 or timer | Survive until **4:30** clock → victory |

**Win:** Survive until the timer ends with HP > 0.  
**Lose:** HP hits 0.

### Collaboration systems (the fun part)

1. **Loadout asymmetry** — If both take only Bolt, you lack AoE/slow. Natural pressure to diversify.
2. **Adjacency bonus** — Partner tower within 1 slot: **+10% damage** (Beacon stacks once more).
3. **Shared Panic Meter** — Fills from kills. At full, either player can trigger **Freeze 2.5s**. Once per ~90s effective use.
4. **Pings (no voice required)** — 4 icons: Need Slow / Need Splash / Upgrade Here / Save Gold.
5. **Combo challenge (optional score)** — Bonus stars if you win with ≥3 adjacency links active — soft goal for replay.

### Co-op difficulty

- One difficulty for v1: **Standard**
- Later: Elite (less income, faster swarms)

---

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

## 7b. Co-op note (deferred)

Co-op keeps §6 loadout shop for now. A later pass will decide whether co-op uses a **shared contested belt**, a **parallel belt**, or stays shop-based. Do not mix unfinished co-op belt rules into Versus.
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

## 9. UI wireframe (portrait) — Versus

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

Co-op UI remains shop + ping/panic until the co-op pass.
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

**Must have (Versus-first MVP)**
- 1 versus mirror map + sushi belt (90% parallel / 10% exclusive cadence)
- Tower + send plates, hand placement, upgrades on-tower
- Sudden death + basic bot or local 2P
- 30s versus tip (parallel vs ★ exclusive)

**Still in full MVP later**
- Co-op map + loadout/pings/panic (belt undecided)

**Explicitly cut from MVP**
- 2v2, ranked ladder, hero units, card drafts, 3D, seasonal battle pass, every-plate click races

---

## 13. Success criteria for the design

A good session feels like:

- Co-op: “We barely held because you glued and I sniped the tanks.”
- Versus: “I skipped two Lights to bank the ★ Heavy — they still had Glue ready.”
- Either way: rematch button is tempting within 10 seconds of the result screen.

---

## 14. Open polish (not blockers)

- Ranked MMR later
- Spectate / share replay GIF
- Weekly challenge seed (same waves for all co-op pairs)

---

*Document status: Versus sushi-belt pass drafted (90/10). Co-op belt pass pending. Ready for design feedback on Versus before co-op optimization.*
