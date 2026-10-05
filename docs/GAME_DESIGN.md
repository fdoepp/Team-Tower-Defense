# Team Tower Defense — Game Design Concept

**Working title:** LaneLink  
**Platform:** Mobile (portrait-first, landscape optional later)  
**Art:** Flat 2D, geometric shapes, readable silhouettes — no fancy VFX needed  
**Session length:** ~4–6 minutes per match  
**Players:** 2 (local pass-and-play later; online 2-player as primary target)

---

## 1. One-sentence pitch

A tiny 2-player tower defense where you either **hold one shared lane together** or **race mirror lanes by sending units at each other** — finished in five minutes.

---

## 2. Design pillars

1. **Short and decisive** — A match has a clear start, middle, and end. No grinding waves forever.
2. **Readable at a glance** — Few tower types, strong colors, big touch targets.
3. **Teamplay that matters** — Co-op roles are complementary, not “two solo players on one map.”
4. **Fair versus** — Same map layout, same economy rules; skill = timing of sends + build order.
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
| **Send units (eco → pressure)** | *BTD Battles*, *GemCraft*-ish send fantasy | Spend income to send a pack to the opponent’s lane; stronger sends cost more and have cooldowns. |
| **Eco vs rush tension** | *BTD Battles*, RTS | Saving for big sends vs building defense now — the core decision loop. |
| **Sudden death / last lives** | Fighting games, *Clash* overtime | After timer, sudden death: leaks hurt more, or first leak loses. |
| **No permanent snowball map control** | — | No destroying the opponent’s towers. You only pressure via sends and their leaks. |

Avoid: shared-map sabotage (too chaotic for 5-minute mobile), steal towers, RNG loot mid-match.

---

## 4. Core loop (both modes)

```
Build / upgrade → Wave or send arrives → Spend gold / income →
Decide: eco, defense, or pressure → Repeat until win condition
```

**Touch UX (mobile):**
- Tap empty slot → tower menu (3 choices max)
- Tap own tower → Upgrade / Sell
- Versus only: bottom strip = Send buttons (3 pack sizes)
- Co-op only: top strip = Ping + shared Panic meter

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

## 7. Mode B — Versus (mirror lanes + send units)

### Layout

- Split screen **or** tabbed “my lane / their lane” (mobile-friendly: **your lane full screen**, peek button for opponent)
- Identical path & 6 build slots each
- Opponent HP and last-sent pack visible as a thin status bar

**Recommendation for v1:** Full-screen own lane + status bar (enemy HP, eco, last send). Peek is polish.

### Match structure (~5 min)

| Phase | Time | What happens |
|---|---|---|
| Build | 0:00–0:25 | No sends allowed (fair setup) |
| Open | 0:25–2:00 | Small sends unlocked |
| Mid | 2:00–4:00 | Medium/heavy sends unlock |
| Late | 4:00–5:00 | Eco ramps; big sends |
| Sudden death | 5:00+ | First leak loses **or** leaks deal ×2 until someone dies |

**Win:** Opponent HP → 0.  
**Draw prevention:** Sudden death after 5:00; if both die same second, higher remaining eco wins (tiebreak).

### Send Units system

Sending is the versus identity.

| Send | Contents | Cost | Cooldown | Unlock |
|---|---|---|---|---|
| Light | 6× Runner | 40 | 4s | 0:25 |
| Mid | 4× Grunt + 2× Swarm | 90 | 8s | 1:30 |
| Heavy | 2× Tank + 1× Bosslet | 180 | 14s | 3:00 |

Rules:
- You cannot send while a send pack from you is still entering (queue max 1).
- **Eco tax:** Each send temporarily reduces passive income by 20% for 3s (prevents pure all-in spam without defense).
- Leaked units give the defender a small gold consolation (10–20) so a lost life isn’t pure brick.

### Versus strategy space

- **Rush:** Early Light spam, force panic builds
- **Eco:** Skip early sends, hit Heavy timing
- **Tech defense:** Glue + Beacon + Sniper, punish their Heavy
- **Bait:** Sell and rebuild after they overcommit sends

This is enough depth for a minigame without card collections.

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

## 9. UI wireframe (portrait)

```
┌─────────────────────┐
│ HP ❤ 16   ⏱ 2:41   │
│ Gold 184  Income+9  │
├─────────────────────┤
│                     │
│     [path / units]  │
│   □ slot   □ slot   │
│                     │
│   □ slot   □ slot   │
│                     │
│        BASE         │
├─────────────────────┤
│ [Tower] [Upgrade]   │  ← context actions
│ COOP: [Ping][Panic] │
│ PVP:  [L][M][H] Send│
└─────────────────────┘
```

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

- Authority: **server-authoritative** for online (anti-cheat on gold/sends)
- Tick: 10–20 Hz is enough
- Deterministic-ish combat for replays optional later
- Offline: vs easy bot using scripted send timings

---

## 12. MVP scope (when building starts)

**Must have**
- 1 co-op map, 1 versus mirror map
- 6 towers / 5 enemies as above
- Send system + sudden death
- Basic online or local 2P (pick one first)
- Tutorials: 30s co-op tip, 30s versus tip

**Explicitly cut from MVP**
- 2v2, ranked ladder, hero units, card drafts, 3D, seasonal battle pass

---

## 13. Success criteria for the design

A good session feels like:

- Co-op: “We barely held because you glued and I sniped the tanks.”
- Versus: “I eco’d into Heavy and broke their glue line.”
- Either way: rematch button is tempting within 10 seconds of the result screen.

---

## 14. Open polish (not blockers)

- Ranked MMR later
- Spectate / share replay GIF
- Weekly challenge seed (same waves for all co-op pairs)

---

*Document status: Concept complete for design sign-off. Ready to prototype after approval.*
