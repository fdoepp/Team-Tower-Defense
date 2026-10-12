/**
 * Host-authoritative PvP smoke (no PeerJS).
 * Guest view is mirrored: own team left (ksc locally).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function pathToFileURL(p) {
  return new URL(`file://${p}`);
}

async function load() {
  try {
    const { register } = await import("node:module");
    register("tsx/esm", pathToFileURL("./"));
  } catch {
    /* try tsx direct */
  }
  const { Match } = await import(pathToFileURL(path.join(root, "src/game/Match.ts")).href);
  const {
    applyPvpCmd,
    applyPvpSnap,
    exportPvpSnap,
    mirrorPvpCmdToHost,
    mirrorPvpSnapForGuest,
  } = await import(pathToFileURL(path.join(root, "src/game/pvp.ts")).href);
  const { defaultSetup, defaultSoloSettings } = await import(
    pathToFileURL(path.join(root, "src/game/util.ts")).href
  );
  const { settingsFromLive } = await import(
    pathToFileURL(path.join(root, "src/game/liveChallenge.ts")).href
  );
  return {
    Match,
    applyPvpCmd,
    applyPvpSnap,
    exportPvpSnap,
    mirrorPvpCmdToHost,
    mirrorPvpSnapForGuest,
    defaultSetup,
    defaultSoloSettings,
    settingsFromLive,
  };
}

const {
  Match,
  applyPvpCmd,
  applyPvpSnap,
  exportPvpSnap,
  mirrorPvpCmdToHost,
  mirrorPvpSnapForGuest,
  defaultSetup,
  defaultSoloSettings,
  settingsFromLive,
} = await load();

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const cfg = {
  playerClub: "ksc",
  aiClub: "vfb",
  difficulty: "normal",
  hostName: "Host",
  guestName: "Gast",
  pvp: true,
};
const mix = defaultSetup().mix;

const hostSettings = settingsFromLive(cfg, "host");
const guestSettings = settingsFromLive(cfg, "guest");
assert(hostSettings.playerClub === "ksc" && hostSettings.aiClub === "vfb", "host clubs");
assert(guestSettings.playerClub === "vfb" && guestSettings.aiClub === "ksc", "guest clubs swapped");

const host = new Match({
  settings: hostSettings,
  playerSetup: { mix: { ...mix } },
  aiSetup: { mix: { ...mix } },
  pvp: true,
  localTeam: "ksc",
  pvpAuthority: true,
});

const guest = new Match({
  settings: guestSettings,
  playerSetup: { mix: { ...mix } },
  aiSetup: { mix: { ...mix } },
  pvp: true,
  localTeam: "ksc",
  pvpAuthority: false,
});

assert(host.localTeam === "ksc" && guest.localTeam === "ksc", "both local left");
assert(host.aiGold === host.gold, "fair start gold");

// Host builds on Heim (left)
host.selectedSlot = { blockId: 0, index: 0 };
host.buildMenu = { blockId: 0, index: 0 };
assert(host.tryBuild("bier"), "host build bier");

// Guest local build on left → remapped to host Gast (2)
const guestBuild = mirrorPvpCmdToHost({
  op: "build",
  blockId: 0,
  index: 0,
  kind: "fanshop",
});
assert(guestBuild.blockId === 2, "guest left → host right");
assert(applyPvpCmd(host, "vfb", guestBuild), "guest build on host");
assert(
  host.slots.find((s) => s.blockId === 2 && s.index === 0)?.owner === "vfb",
  "guest owns host-right slot",
);

// Snap mirrored: guest sees own building on left (0)
const snap = mirrorPvpSnapForGuest(exportPvpSnap(host, 1));
applyPvpSnap(guest, snap);
assert(
  guest.slots.find((s) => s.blockId === 0 && s.index === 0)?.owner === "ksc",
  "guest sees own building left",
);
assert(
  guest.slots.find((s) => s.blockId === 2 && s.index === 0)?.owner === "vfb",
  "guest sees host building right",
);
assert(Math.floor(guest.gold) === Math.floor(host.aiGold), "guest wallet is left/gold");

// Guest does not simulate
const gGold = guest.gold;
guest.update(0.5);
assert(guest.gold === gGold, "guest does not simulate economy");

console.log("pvp-smoke OK", {
  hostGold: Math.floor(host.gold),
  guestGold: Math.floor(guest.gold),
  mirrored: true,
});
