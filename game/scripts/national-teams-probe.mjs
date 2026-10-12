/**
 * Smoke: national teams + kit/flag separation.
 * Run from game/: node --experimental-strip-types scripts/national-teams-probe.mjs
 */
import {
  allClubs,
  allNationals,
  brandingIsNational,
  clubFlag,
  clubPrimary,
  clubSecondary,
  CLUBS,
  currentBranding,
  DEFAULT_AI_NATION,
  DEFAULT_NATIONAL_FIXTURE_ID,
  DEFAULT_PLAYER_NATION,
  findNationalFixture,
  isNational,
  NATIONAL_FIXTURES,
  nationalsByRegion,
  setSideBranding,
} from "../src/game/clubs.ts";

const nationals = allNationals();
const clubs = allClubs();
const fix = findNationalFixture(DEFAULT_NATIONAL_FIXTURE_ID);
setSideBranding(DEFAULT_PLAYER_NATION, DEFAULT_AI_NATION);
const brand = currentBranding();

const ger = CLUBS.ger;
const ned = CLUBS.ned;

const ok =
  nationals.length >= 16 &&
  clubs.every((c) => c.kind === "club") &&
  nationals.every((c) => c.kind === "national" && !!c.flag) &&
  !!fix &&
  fix.a === "ger" &&
  fix.b === "ned" &&
  NATIONAL_FIXTURES.length >= 10 &&
  nationalsByRegion().length >= 3 &&
  isNational("ger") &&
  !isNational("ksc") &&
  !clubs.some((c) => c.id === "ger") &&
  ger.primary === "#FFFFFF" &&
  ger.secondary === "#000000" &&
  ger.flag?.style === "h" &&
  ned.primary.toLowerCase().includes("ff") && // orange-ish
  brand.heim.id === "ger" &&
  brand.gast.id === "ned" &&
  brandingIsNational("ksc") &&
  brandingIsNational("vfb") &&
  !!clubFlag("ksc") &&
  !!clubFlag("vfb") &&
  clubPrimary("ksc") === ger.primary &&
  clubSecondary("ksc") === ger.secondary;

console.log(
  JSON.stringify(
    {
      ok,
      nationals: nationals.length,
      clubs: clubs.length,
      fixtures: NATIONAL_FIXTURES.length,
      regions: nationalsByRegion().map((g) => `${g.region}:${g.nations.length}`),
      gerKit: [ger.primary, ger.secondary],
      gerFlag: ger.flag,
      nedKit: [ned.primary, ned.secondary],
      brand: [brand.heim.id, brand.gast.id],
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
