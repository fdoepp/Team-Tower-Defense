/**
 * Verify own-team visits spread across multiple stands of the same type.
 */
import { Match } from "../src/game/Match.ts";
import { HEIM_BLOCK, GAST_BLOCK } from "../src/game/layout.ts";

const m = new Match({
  settings: { playerTeam: "ksc", difficulty: "normal", speed: 1, behavior: "balanced" },
  playerSetup: { mix: { normalos: 4, ultras: 2, hooligans: 3 } },
  aiSetup: { mix: { normalos: 3, ultras: 2, hooligans: 2 } },
});

const placeAll = (kind, blockId, n) => {
  let placed = 0;
  for (const s of m.slots) {
    if (placed >= n) break;
    if (s.building || s.blockId !== blockId) continue;
    if (!m.inPlayerTerritory(s.blockId, s.index) && blockId === HEIM_BLOCK) continue;
    m.buildMenu = { blockId: s.blockId, index: s.index };
    m.selectedSlot = m.buildMenu;
    if (m.tryBuild(kind)) placed++;
  }
  return placed;
};

// Force multiple own fanshops + biers on heim side
placeAll("fanshop", HEIM_BLOCK, 2);
// give gold for more builds
m.goldKsc = 500;
m.goldVfb = 500;
placeAll("fanshop", HEIM_BLOCK, 3);
placeAll("bier", HEIM_BLOCK, 2);

// AI also places so match progresses
for (const s of m.slots) {
  if (s.building || s.blockId !== GAST_BLOCK) continue;
  m.buildMenu = { blockId: s.blockId, index: s.index };
  m.selectedSlot = m.buildMenu;
  m.tryBuild("fanshop");
  break;
}

const dt = 0.05;
let t = 0;
const visits = {}; // standKey -> count of arrivals (stand state enter)

while (t < 180 && !m.result) {
  if (t > 15) {
    m.tryBuyFanQuick("normalos");
    m.tryBuyFanQuick("hooligans");
    m.tryBuyFanQuick("ultras");
  }
  m.update(dt);
  t += dt;
}

for (const f of m.fans) {
  if (f.hp <= 0 || f.isSteward || f.team !== "ksc") continue;
  if (!f.standKey) continue;
  if (f.state !== "stand" && f.state !== "moving") continue;
  visits[f.standKey] = (visits[f.standKey] || 0) + 1;
}

const ownShops = m.slots
  .filter((s) => s.owner === "ksc" && (s.building === "fanshop" || s.building === "bier"))
  .map((s) => ({
    key: `${s.blockId}:${s.index}`,
    building: s.building,
    queue: m.fans.filter(
      (f) =>
        f.hp > 0 &&
        !f.isSteward &&
        f.standKey === `${s.blockId}:${s.index}` &&
        (f.state === "stand" || f.state === "moving"),
    ).length,
  }));

console.log(
  JSON.stringify(
    {
      ownStands: ownShops,
      distinctStandTargets: ownShops.filter((s) => s.queue > 0).length,
      totalQueued: ownShops.reduce((a, s) => a + s.queue, 0),
      maxQueue: Math.max(0, ...ownShops.map((s) => s.queue)),
    },
    null,
    2,
  ),
);
