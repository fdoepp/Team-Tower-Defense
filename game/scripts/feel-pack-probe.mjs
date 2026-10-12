/**
 * Smoke: feel-pack helpers + Match half-time / choreo / personality wiring.
 * node --experimental-strip-types scripts/feel-pack-probe.mjs
 */
import {
  choreoTierFromUltras,
  CHOREO_LABEL,
  personalityMods,
  HALF_BOOSTS,
  clubChantProfile,
  AI_BEHAVIOR_LABEL,
} from "../src/game/feelPack.ts";
import { Match } from "../src/game/Match.ts";
import { defaultSetup, defaultSoloSettings } from "../src/game/util.ts";

const tiers = [
  [4, null],
  [5, "klein"],
  [10, "mittel"],
  [20, "gross"],
  [30, "gigantisch"],
];
const tierOk = tiers.every(
  ([n, expect]) => choreoTierFromUltras(n) === expect,
);

const pers = personalityMods("aggro");
const persOk = pers.sendMul > 1 && personalityMods("patient").sendMul < 1;

const chantA = clubChantProfile("leverkusen");
const chantB = clubChantProfile("liverpool");
const chantOk = chantA.baseHz !== chantB.baseHz;

const m = new Match({
  settings: {
    ...defaultSoloSettings(),
    playerClub: "leverkusen",
    aiClub: "liverpool",
    behavior: "aggro",
    difficulty: "easy",
  },
  playerSetup: defaultSetup(),
  aiSetup: { mix: { normalos: 2, ultras: 4, hooligans: 2 } },
});

// Force minute to half-time
m.realElapsed = (45 / 90) * 390;
m.update(0.05);
const halfOk = m.halfTimePending === true;
m.applyHalfBoost("gold");
const boostOk = !m.halfTimePending && m.halfBoost === "gold" && m.gold >= 45;

const ok =
  tierOk &&
  persOk &&
  chantOk &&
  halfOk &&
  boostOk &&
  HALF_BOOSTS.length === 5 &&
  !!AI_BEHAVIOR_LABEL.beer &&
  !!CHOREO_LABEL.gigantisch;

console.log(
  JSON.stringify(
    {
      ok,
      tierOk,
      persOk,
      chantOk,
      halfOk,
      boostOk,
      gold: m.gold,
      behavior: m.cfg.settings.behavior,
      labels: Object.keys(AI_BEHAVIOR_LABEL),
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
