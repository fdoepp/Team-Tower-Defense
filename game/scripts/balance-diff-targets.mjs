/**
 * Balance probe for "solid" (competent, not optimal) play.
 * Target WR: easy ~70%, normal ~45%, hard ~25%.
 */
import { Match } from "../src/game/Match.ts";
import * as T from "../src/game/types.ts";

const DT = 1 / 12;
const MAX_REAL = 430;
const REPS = Number(process.env.BAL_REPS || 16);
const DIFFS = ["easy", "normal", "hard"];

function place(m, kind) {
  const s = m.slots.find(
    (x) => !x.building && m.inPlayerTerritory(x.blockId, x.index),
  );
  if (!s) return false;
  m.buildMenu = { blockId: s.blockId, index: s.index };
  m.selectedSlot = m.buildMenu;
  return m.tryBuild(kind);
}

function claim(m) {
  const s = m.slots.find(
    (x) =>
      x.building &&
      (x.owner === "neutral" || x.greyNeutral) &&
      m.inPlayerTerritory(x.blockId, x.index),
  );
  if (!s) return false;
  m.buildMenu = { blockId: s.blockId, index: s.index };
  m.selectedSlot = m.buildMenu;
  return m.tryBuild(s.building);
}

function upgradeBuildings(m) {
  const upSlot = m.slots.find(
    (x) =>
      x.owner === "ksc" &&
      x.building &&
      !x.greyNeutral &&
      m.upgradeCost(x) != null &&
      m.gold >= (m.upgradeCost(x) || 999) + 20,
  );
  if (!upSlot) return false;
  m.buildMenu = { blockId: upSlot.blockId, index: upSlot.index };
  return m.tryUpgrade();
}

/** Deterministic-ish solid play (tick parity instead of Math.random). */
function runRound(diff, i) {
  const m = new Match({
    settings: {
      playerTeam: "ksc",
      difficulty: diff,
      speed: 1,
      behavior: "balanced",
    },
    playerSetup: { mix: { normalos: 3, ultras: 3, hooligans: 2 } },
    aiSetup: { mix: { ...T.difficultyProfile(diff).aiMix } },
  });

  place(m, "bier");
  place(m, "fanshop");
  place(m, "ordner");

  let unitUp = 0;
  let acc = 0;
  let sendCd = 0;
  let step = i * 17;
  while (!m.result && m.realElapsed < MAX_REAL) {
    if (m.halfTimePending) m.applyHalfBoost("gold");
    if (m.highlight) m.highlight = null;
    m.update(DT);
    acc += DT;
    sendCd = Math.max(0, sendCd - DT);
    if (acc < 3.2) continue;
    acc = 0;
    step++;
    const min = m.minute;

    if (m.gold >= 45) place(m, "ordner") || place(m, "bier") || place(m, "fanshop");
    if (min > 10) claim(m);
    if (min > 14) m.tryHireStewardQuick?.();

    // moderate recruiting on a fixed cadence
    if (min > 8 && step % 2 === 0) m.tryBuyFanQuick("normalos");
    if (min > 12 && step % 3 === 0) m.tryBuyFanQuick("ultras");
    if (min > 12 && step % 3 === 1) m.tryBuyFanQuick("hooligans");

    if (min > 20 && m.gold > 70 && unitUp < 8) {
      for (const kind of ["ultras", "hooligans", "normalos"]) {
        if (m.canUpgradeUnit(kind) && m.tryUpgradeUnit(kind)) {
          unitUp++;
          break;
        }
      }
    }
    if (min > 16) upgradeBuildings(m);

    if (min > 24 && sendCd <= 0) {
      if (m.currency.merch >= 20 && step % 2 === 0) {
        m.tryPyroFight(1);
        sendCd = 6;
      } else if (m.currency.beer >= 20) {
        m.tryHooliganOrder(1);
        sendCd = 6;
      }
    }
  }

  const r = m.result;
  const out = {
    diff,
    i,
    winner: r?.winner ?? null,
    reason: r?.reason ?? "timeout",
    score: [m.scoreKsc, m.scoreVfb],
    minute: +m.minute.toFixed(1),
    unitUp,
  };
  console.error(
    `${diff}-${i + 1} ${out.winner ?? "timeout"}/${out.reason} ${out.score.join(":")} @${out.minute}' up=${unitUp}`,
  );
  return out;
}

const rows = [];
for (const d of DIFFS) {
  for (let i = 0; i < REPS; i++) rows.push(runRound(d, i));
}

const summary = DIFFS.map((d) => {
  const g = rows.filter((r) => r.diff === d);
  const wins = g.filter((r) => r.winner === "ksc").length;
  const losses = g.filter((r) => r.winner === "vfb").length;
  const draws = g.filter((r) => !r.winner).length;
  const invade = g.filter((r) => r.reason === "invade").length;
  const decisive = wins + losses;
  const reasons = {};
  for (const r of g) reasons[r.reason] = (reasons[r.reason] || 0) + 1;
  const scoreDiff =
    g.reduce((a, r) => a + ((r.score?.[0] ?? 0) - (r.score?.[1] ?? 0)), 0) /
    g.length;
  return {
    diff: d,
    n: g.length,
    winRate: Math.round((wins / g.length) * 100),
    decisiveWR: decisive
      ? Math.round((wins / decisive) * 100)
      : null,
    wins,
    losses,
    draws,
    invadeRate: Math.round((invade / g.length) * 100),
    avgScoreDiff: +scoreDiff.toFixed(2),
    reasons,
    target: d === "easy" ? 70 : d === "normal" ? 45 : 25,
  };
});

console.log(JSON.stringify({ summary, rows }, null, 2));
for (const s of summary) {
  const delta = s.winRate - s.target;
  console.error(
    `→ ${s.diff}: ${s.winRate}% overall / ${s.decisiveWR ?? "—"}% decisive (target ${s.target}%, Δ${delta >= 0 ? "+" : ""}${delta}) W${s.wins}/L${s.losses}/D${s.draws} invade ${s.invadeRate}% scoreΔ ${s.avgScoreDiff}`,
  );
}
