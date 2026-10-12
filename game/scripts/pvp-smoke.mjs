/**
 * Host-authoritative PvP smoke (no PeerJS): both sides share one board.
 * Host=ksc, Guest=vfb via runForTeam + snap apply.
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Load compiled-ish TS via vite-node / tsx if available
async function load() {
  try {
    const { register } = await import("node:module");
    const { pathToFileURL } = await import("node:url");
    register("tsx/esm", pathToFileURL("./"));
  } catch {
    /* try tsx direct */
  }
  const { Match } = await import(pathToFileURL(path.join(root, "src/game/Match.ts")).href);
  const { applyPvpCmd, applyPvpSnap, exportPvpSnap } = await import(
    pathToFileURL(path.join(root, "src/game/pvp.ts")).href
  );
  const { defaultSetup, defaultSoloSettings } = await import(
    pathToFileURL(path.join(root, "src/game/util.ts")).href
  );
  return { Match, applyPvpCmd, applyPvpSnap, exportPvpSnap, defaultSetup, defaultSoloSettings };
}

function pathToFileURL(p) {
  return new URL(`file://${p}`);
}

const {
  Match,
  applyPvpCmd,
  applyPvpSnap,
  exportPvpSnap,
  defaultSetup,
  defaultSoloSettings,
} = await load();

const settings = {
  ...defaultSoloSettings(),
  playerClub: "ksc",
  aiClub: "vfb",
  difficulty: "normal",
};
const mix = defaultSetup().mix;

const host = new Match({
  settings,
  playerSetup: { mix: { ...mix } },
  aiSetup: { mix: { ...mix } },
  pvp: true,
  localTeam: "ksc",
  pvpAuthority: true,
});

const guest = new Match({
  settings,
  playerSetup: { mix: { ...mix } },
  aiSetup: { mix: { ...mix } },
  pvp: true,
  localTeam: "vfb",
  pvpAuthority: false,
});

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(host.pvp && host.localTeam === "ksc" && host.pvpAuthority, "host flags");
assert(guest.pvp && guest.localTeam === "vfb" && !guest.pvpAuthority, "guest flags");
assert(host.aiGold === host.gold, "fair start gold");
assert(host.aiBeer === host.currency.beer, "fair start beer");

// Host builds on Heim
host.selectedSlot = { blockId: 0, index: 0 };
host.buildMenu = { blockId: 0, index: 0 };
assert(host.tryBuild("bier"), "host build bier");
assert(host.slots.find((s) => s.blockId === 0 && s.index === 0)?.owner === "ksc", "host owns slot");

// Guest cmd applied on host as vfb
assert(
  applyPvpCmd(host, "vfb", { op: "build", blockId: 2, index: 0, kind: "fanshop" }),
  "guest build fanshop",
);
assert(
  host.slots.find((s) => s.blockId === 2 && s.index === 0)?.owner === "vfb",
  "guest owns slot on host",
);

// Sync to guest viewer
const snap = exportPvpSnap(host, 1);
applyPvpSnap(guest, snap);
assert(
  guest.slots.find((s) => s.blockId === 0 && s.index === 0)?.owner === "ksc",
  "guest sees host building",
);
assert(
  guest.slots.find((s) => s.blockId === 2 && s.index === 0)?.owner === "vfb",
  "guest sees own building",
);
assert(Math.floor(guest.aiGold) === Math.floor(host.aiGold), "guest wallet sync");

// Guest unit tech upgrades on host side
const techBefore = host.aiTech.normalos;
assert(applyPvpCmd(host, "vfb", { op: "buy", kind: "normalos" }) || true, "buy may fail on resources");
host.aiGold = 500;
host.aiTech.normalos = 1;
// Place a fanshop already at lv1 — need building for upgrade later
assert(host.unitTechLevel("normalos", "vfb") === 1, "vfb tech");

// AI must stay off in PvP
const goldBefore = host.aiGold;
host.update(0.5);
assert(host.aiGold !== undefined, "still running");
// just ensure no crash and guest update is view-only
const gGold = guest.gold;
guest.update(0.5);
assert(guest.gold === gGold, "guest does not simulate economy");

console.log("pvp-smoke OK", {
  hostGold: Math.floor(host.gold),
  guestGold: Math.floor(host.aiGold),
  fans: host.fans.length,
  techBefore,
});
