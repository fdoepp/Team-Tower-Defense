/**
 * Kit clash + DE white primary + all clubs have primary/secondary.
 */
import {
  allClubsHaveKitPair,
  awayKitClashActive,
  clubFxColor,
  clubPrimary,
  clubSecondary,
  CLUBS,
  kitPrimariesClash,
  setSideBranding,
} from "../src/game/clubs.ts";

setSideBranding("leverkusen", "koeln");
const b04vKoe = {
  heim: clubPrimary("ksc"),
  gast: clubPrimary("vfb"),
  gastSec: clubSecondary("vfb"),
  clash: awayKitClashActive(),
};

setSideBranding("koeln", "leverkusen");
const koeVB04 = {
  heim: clubPrimary("ksc"),
  gast: clubPrimary("vfb"),
  clash: awayKitClashActive(),
};

setSideBranding("ger", "ned");
const deNl = {
  dePrim: clubPrimary("ksc"),
  deSec: clubSecondary("ksc"),
  deFx: clubFxColor("ksc"),
  nedPrim: clubPrimary("vfb"),
  clash: awayKitClashActive(),
};

setSideBranding("ksc", "vfb");
const noClash = awayKitClashActive();

const ok =
  allClubsHaveKitPair() &&
  kitPrimariesClash(CLUBS.leverkusen.primary, CLUBS.koeln.primary) &&
  b04vKoe.clash &&
  b04vKoe.gast.toLowerCase() === CLUBS.koeln.secondary.toLowerCase() &&
  koeVB04.clash &&
  koeVB04.gast.toLowerCase() === CLUBS.leverkusen.secondary.toLowerCase() &&
  deNl.dePrim.toLowerCase() === "#ffffff" &&
  deNl.deSec.toLowerCase() === "#000000" &&
  deNl.deFx.toLowerCase() === "#000000" &&
  !deNl.clash &&
  !noClash &&
  CLUBS.ger.primary.toLowerCase() === "#ffffff";

console.log(
  JSON.stringify(
    {
      ok,
      allKitsPaired: allClubsHaveKitPair(),
      b04vKoe,
      koeVB04,
      deNl,
      noClash,
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
