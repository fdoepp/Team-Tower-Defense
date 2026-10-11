/**
 * Smoke: club catalog + branding helpers.
 * Run from game/: node --experimental-strip-types scripts/derby-clubs-probe.mjs
 */
import {
  allClubs,
  applyClubCssVars,
  CLUBS,
  clubPrimary,
  clubShort,
  currentBranding,
  DERBIES,
  derbiesByCountry,
  ensureRequiredClubsPresent,
  setSideBranding,
} from "../src/game/clubs.ts";

const req = ensureRequiredClubsPresent();
const ranked = DERBIES.filter((d) => d.rank != null);
const byCountry = derbiesByCountry();
const all = allClubs();

const styleProps = {};
applyClubCssVars({
  style: {
    setProperty(k, v) {
      styleProps[k] = v;
    },
  },
});

setSideBranding("leverkusen", "liverpool");
applyClubCssVars({
  style: {
    setProperty(k, v) {
      styleProps[k] = v;
    },
  },
});

const brand = currentBranding();
const ok =
  req.liverpool &&
  req.leverkusen &&
  ranked.length === 50 &&
  !!CLUBS.leverkusen &&
  !!CLUBS.liverpool &&
  brand.heim.short === "B04" &&
  brand.gast.short === "LIV" &&
  clubPrimary("ksc") === CLUBS.leverkusen.primary &&
  clubPrimary("vfb") === CLUBS.liverpool.primary &&
  clubShort("ksc") === "B04" &&
  clubShort("vfb") === "LIV" &&
  styleProps["--ksc"] === CLUBS.leverkusen.primary &&
  styleProps["--vfb"] === CLUBS.liverpool.primary &&
  byCountry.length >= 10 &&
  all.length >= 90 &&
  all.some((x) => x.id === "leverkusen") &&
  all.some((x) => x.id === "liverpool");

console.log(
  JSON.stringify(
    {
      ok,
      liverpool: req.liverpool,
      leverkusen: req.leverkusen,
      rankedDerbies: ranked.length,
      totalDerbies: DERBIES.length,
      totalClubs: all.length,
      countries: byCountry.map((g) => `${g.country}:${g.derbies.length}`),
      brandHeim: brand.heim.id,
      brandGast: brand.gast.id,
      css: styleProps,
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
