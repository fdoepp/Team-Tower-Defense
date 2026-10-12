import "./style.css";
import { Match } from "./game/Match";
import {
  enterFullscreen,
  isFullscreen,
  isIos,
  isStandalone,
  lockLandscape,
  needsFullscreenGate,
  onFullscreenChange,
} from "./game/fullscreen";
import { drawMatch, hitSlot } from "./game/render";
import { syncTribuneLayout } from "./game/layout";
import {
  UI_ICONS,
  applyCssIconUrls,
  preloadIcons,
  standIconPath,
  teamColor,
  unitIconPath,
} from "./game/assets";
import {
  BUILD_COST,
  BUY_COST,
  FAN_STATS,
  HOOLIGAN_ORDER_BEER,
  MIX_MAX,
  MIX_MIN,
  PROD_BEER,
  PROD_MERCH,
  PROD_SECURITY,
  PYRO_FIGHT_HP_MUL,
  PYRO_FIGHT_MERCH,
  RANGED_DAMAGE_SCALE,
  STEWARD_HIRE_GOLD,
  UPGRADE_COST,
  UPGRADE_MAX,
  canVisit,
  productionRate,
  stewardHealPerSec,
  unitLevelMul,
  visitGoldPayout,
  visitInterval,
  difficultyProfile,
  type AiBehavior,
  type BuildingKind,
  type FanKind,
  type FanMix,
  type SoloSettings,
  type TeamId,
} from "./game/types";
import {
  defaultSetup,
  defaultSoloSettings,
  formatMinute,
  isValidMix,
  mixSum,
  teamLabel,
} from "./game/util";
import {
  applyClubCssVars,
  awayKitClashActive,
  clubPrimary,
  clubSecondary,
  clubsByCountry,
  currentBranding,
  DEFAULT_AI_CLUB,
  DEFAULT_AI_NATION,
  DEFAULT_DERBY_ID,
  DEFAULT_NATIONAL_FIXTURE_ID,
  DEFAULT_PLAYER_CLUB,
  DEFAULT_PLAYER_NATION,
  derbiesByCountry,
  allNationals,
  findDerby,
  findNationalFixture,
  getClub,
  isNational,
  NATIONAL_FIXTURES,
  setSideBranding,
  type Club,
  type ClubId,
} from "./game/clubs";
import {
  applyLiveTintToDomImages,
  getLiveTintedCanvas,
} from "./game/liveTint";
import { clubLogoDataUrl } from "./game/clubLogos";
import { getRawIcon } from "./game/assets";

/** Set team icon src once, then live-tint to current club kit. */
function setLiveTintImg(ico: HTMLImageElement | null, src: string): void {
  if (!ico) return;
  if (
    ico.dataset.liveTintSrc === src &&
    ico.dataset.liveTint === "1" &&
    (ico.getAttribute("src") || "").startsWith("data:")
  ) {
    return;
  }
  ico.dataset.liveTintSrc = src;
  const paint = (raw: HTMLImageElement) => {
    const canvas = getLiveTintedCanvas(raw, src);
    if (!canvas) {
      ico.setAttribute("src", src);
      ico.dataset.liveTint = "0";
      return;
    }
    try {
      const url = canvas.toDataURL("image/png");
      ico.setAttribute("src", url);
      ico.src = url;
      ico.dataset.liveTint = "1";
    } catch {
      ico.setAttribute("src", src);
      ico.dataset.liveTint = "0";
    }
  };
  const cached = getRawIcon(src);
  if (cached) {
    paint(cached);
    return;
  }
  const raw = new Image();
  raw.decoding = "async";
  raw.onload = () => paint(raw);
  raw.src = src;
}
import {
  bierValue,
  blocksturmValue,
  clubCode,
  difficultyLabel,
  entryClubPrimary,
  ergebnisValue,
  fetchSharedHighscores,
  freezeEntryClubs,
  loadHighscores,
  loadPersonalHighscores,
  matchupLabel,
  resolveEntryClubId,
  tryInsertHighscoreShared,
  wouldEnterTop10Shared,
  type HighscoreEntry,
  type HighscoreScope,
  type ScoreBoardKind,
} from "./game/highscores";
import {
  audioDebugState,
  bindAudioGestures,
  isMuted,
  setAmbienceFromMatch,
  setClubSoundIdentity,
  sfx,
  startAmbience,
  toggleMuted,
  unlockAudio,
} from "./game/sound";
import {
  AI_BEHAVIOR_BLURB,
  AI_BEHAVIOR_LABEL,
  CHOREO_LABEL,
  HALF_BOOSTS,
  type HalfBoostId,
} from "./game/feelPack";
import {
  attemptFromMatch,
  challengeFromLocation,
  challengeOutcomeForMe,
  challengeOutcomeLabel,
  challengeSetupLine,
  challengeShareUrl,
  challengeStats,
  challengeVerdictLabel,
  CHALLENGE_GOAL_BLURB,
  CHALLENGE_GOAL_LABEL,
  clearChallengeFromUrl,
  compareChallengeAttempts,
  createChallenge,
  decodeChallenge,
  loadChallengeHistory,
  markPlayedChallengeRole,
  openChallengeRole,
  upsertChallengeHistory,
  type Challenge,
  type ChallengeGoal,
} from "./game/challenge";

void preloadIcons();
bindAudioGestures();
(window as unknown as { __audio?: typeof audioDebugState }).__audio =
  audioDebugState;

function muteButtonLabel(): string {
  return isMuted() ? "Ton: aus" : "Ton: an";
}

function buildingYieldCurrency(kind: BuildingKind): string {
  if (kind === "bier") return UI_ICONS.currencyBier;
  if (kind === "fanshop") return UI_ICONS.currencyFanartikel;
  return UI_ICONS.currencySicherheit;
}

/** Tatsächliche Produktion / Sekunde (PROD_* × productionRate). */
function buildingYieldPerSec(kind: BuildingKind, level: number): number {
  const base =
    kind === "bier" ? PROD_BEER : kind === "fanshop" ? PROD_MERCH : PROD_SECURITY;
  return Math.round(base * productionRate(level) * 100) / 100;
}

function formatYieldPerSec(n: number): string {
  return n.toFixed(2);
}

/** Symbol + Betrag/s — Einheit steckt im Währungs-Icon. */
function yieldChipHtml(
  kind: BuildingKind,
  perSec: number,
  opts?: { delta?: boolean; id?: string },
): string {
  const sign = opts?.delta ? (perSec >= 0 ? "+" : "") : "";
  const id = opts?.id ? ` id="${opts.id}"` : "";
  const deltaCls = opts?.delta ? " yield-delta" : "";
  return `<span class="yield-chip${deltaCls}"${id}><img src="${buildingYieldCurrency(kind)}" alt=""><span class="yield-amt">${sign}${formatYieldPerSec(perSec)}/s</span></span>`;
}

/**
 * Amortisierte Besuch-Einnahmen (€/s) bzw. Ordner-Heilung (HP/s).
 * Basis für Kauf-Ertrag und Upgrade-Delta.
 */
function personYieldPerSec(kind: FanKind | "ordner", level: number): number {
  const lv = Math.max(1, Math.min(UPGRADE_MAX, Math.floor(level) || 1));
  if (kind === "ordner") return stewardHealPerSec(lv);
  let gold = 0;
  if (canVisit(kind, "beer")) {
    const iv = visitInterval(kind, "beer", lv);
    if (iv) gold += visitGoldPayout("beer", lv) / iv;
  }
  if (canVisit(kind, "shop")) {
    const iv = visitInterval(kind, "shop", lv);
    if (iv) gold += visitGoldPayout("shop", lv) / iv;
  }
  return Math.round(gold * 100) / 100;
}

function personYieldCurrency(kind: FanKind | "ordner"): string {
  return kind === "ordner" ? UI_ICONS.currencySicherheit : UI_ICONS.currencyGold;
}

function personYieldChipHtml(
  kind: FanKind | "ordner",
  perSec: number,
  opts?: { delta?: boolean; id?: string },
): string {
  const sign = opts?.delta ? (perSec >= 0 ? "+" : "") : "";
  const id = opts?.id ? ` id="${opts.id}"` : "";
  const deltaCls = opts?.delta ? " yield-delta" : "";
  const unit = kind === "ordner" ? "" : "";
  void unit;
  return `<span class="yield-chip${deltaCls}"${id}><img src="${personYieldCurrency(kind)}" alt=""><span class="yield-amt">${sign}${formatYieldPerSec(perSec)}/s</span></span>`;
}

/**
 * Rail Kauf/Bau/UP (Alt D):
 * Icon links, Ertrag darunter; Kosten groß rechts daneben.
 * Abstände %-relativ zur Button-Face (skalierbar).
 */
function railActionBtnHtml(opts: {
  kind: "kaufen" | "bauen" | "upgrade" | "senden";
  unitSrc: string;
  unitId: string;
  amount: number | string;
  currencySrc: string;
  payId: string;
  yieldHtml: string;
  asButton?: boolean;
  btnId?: string;
  btnAttrs?: string;
  extraClass?: string;
}): string {
  const payId = opts.payId ? ` id="${opts.payId}"` : "";
  const unitId = opts.unitId ? ` id="${opts.unitId}"` : "";
  const cls = `ar-cost-btn ${opts.kind} rail-action${opts.extraClass ? ` ${opts.extraClass}` : ""}`;
  const inner = `<span class="inner person-btn-inner"><span class="unit-col"><img class="unit-ico"${unitId} src="${opts.unitSrc}" alt="">${opts.yieldHtml}</span><span class="pay pay-lg"${payId}><img src="${opts.currencySrc}" alt=""><span class="amt">${opts.amount}</span></span></span>`;
  if (opts.asButton !== false) {
    const id = opts.btnId ? ` id="${opts.btnId}"` : "";
    const attrs = opts.btnAttrs ? ` ${opts.btnAttrs}` : "";
    return `<button type="button" class="${cls}"${id}${attrs}>${inner}</button>`;
  }
  return `<span class="${cls}" aria-hidden="true">${inner}</span>`;
}

/** Combat stats for Angriff buttons (count scales HP/ATK totals). */
function attackCombatStats(
  kind: "ultras" | "hooligans",
  level: number,
  count: number,
): { count: number; hp: number; atk: number; atkIcon: string } {
  const n = Math.max(0, Math.floor(count));
  const mul = unitLevelMul(level);
  const ranged = kind === "ultras";
  let hpEach = FAN_STATS[kind].maxHp * mul;
  if (ranged) hpEach *= PYRO_FIGHT_HP_MUL;
  hpEach = Math.max(40, Math.floor(hpEach));
  const atkEach = Math.round(
    FAN_STATS[kind].attack * mul * (ranged ? RANGED_DAMAGE_SCALE : 1) * 10,
  );
  return {
    count: n,
    hp: hpEach * n,
    atk: atkEach * n,
    atkIcon: ranged ? UI_ICONS.iconAngriffPyro : UI_ICONS.iconAngriffFaust,
  };
}

function attackStatsHtml(
  kind: "ultras" | "hooligans",
  level: number,
  count: number,
  idPrefix: string,
): string {
  const s = attackCombatStats(kind, level, count);
  const nLabel = s.count > 0 ? `x${s.count}` : "x0";
  return `<span class="atk-stats" id="${idPrefix}">` +
    `<span class="atk-stat atk-count"><span class="yield-amt">${nLabel}</span></span>` +
    `<span class="atk-stat atk-hp"><span class="atk-lbl">HP</span><span class="yield-amt">${s.hp}</span></span>` +
    `<span class="atk-stat atk-dmg"><img src="${s.atkIcon}" alt=""><span class="yield-amt">${s.atk}</span></span>` +
    `</span>`;
}

/** Angriff: 1× senden | alle senden (Kosten skaliert). */
function attackSendPairHtml(
  m: Match,
  kind: "ultras" | "hooligans",
  color: ReturnType<typeof teamColor>,
): string {
  const unitCost = kind === "ultras" ? PYRO_FIGHT_MERCH : HOOLIGAN_ORDER_BEER;
  const currencySrc =
    kind === "ultras" ? UI_ICONS.currencyFanartikel : UI_ICONS.currencyBier;
  const level = m.unitTechLevel(kind);
  const src = unitIconPath(kind, color, level);
  const effect = kind === "ultras" ? "Fernkampf" : "Nahkampf";
  const prefix = kind === "ultras" ? "ultra" : "hool";
  const oneId = kind === "ultras" ? "btn-pyro-fight" : "btn-hooligan";
  const allId = kind === "ultras" ? "btn-pyro-fight-all" : "btn-hooligan-all";
  const ready = m.attackReadyCount(kind);
  return (
    railActionBtnHtml({
      kind: "senden",
      extraClass: "senden-red",
      unitSrc: src,
      unitId: `atk-ico-${prefix}-one`,
      amount: unitCost,
      currencySrc,
      payId: `atk-pay-${prefix}-one`,
      yieldHtml: attackStatsHtml(kind, level, 1, `atk-stats-${prefix}-one`),
      btnId: oneId,
      btnAttrs: `data-attack-kind="${kind}" data-attack-count="1" title="1× ${effect}"`,
    }) +
    railActionBtnHtml({
      kind: "senden",
      extraClass: "senden-red",
      unitSrc: src,
      unitId: `atk-ico-${prefix}-all`,
      amount: unitCost * Math.max(0, ready),
      currencySrc,
      payId: `atk-pay-${prefix}-all`,
      yieldHtml: attackStatsHtml(kind, level, ready, `atk-stats-${prefix}-all`),
      btnId: allId,
      btnAttrs: `data-attack-kind="${kind}" data-attack-count="all" title="Alle · ${effect}"`,
    })
  );
}

function personBuyCost(
  kind: FanKind | "ordner",
): { amount: number; currencySrc: string } {
  if (kind === "ordner") {
    return { amount: STEWARD_HIRE_GOLD, currencySrc: UI_ICONS.currencyGold };
  }
  const c = BUY_COST[kind];
  if (c.security > 0) {
    return { amount: c.security, currencySrc: UI_ICONS.currencySicherheit };
  }
  if (c.merch > 0) {
    return { amount: c.merch, currencySrc: UI_ICONS.currencyFanartikel };
  }
  return { amount: c.beer, currencySrc: UI_ICONS.currencyBier };
}

/** Kauf + UP (Icon/Kosten/Ertrag) für eine Personen-Kategorie. */
function personBuyUpHtml(
  m: Match,
  kind: FanKind | "ordner",
  color: ReturnType<typeof teamColor>,
  opts?: { hireBtnId?: string },
): string {
  const tech = m.unitTechLevel(kind);
  const next = Math.min(UPGRADE_MAX, tech + 1);
  const buy = personBuyCost(kind);
  const buyYield = personYieldPerSec(kind, tech);
  const upCost = m.unitUpgradeCostFor(kind);
  const upDelta =
    tech < UPGRADE_MAX
      ? personYieldPerSec(kind, next) - personYieldPerSec(kind, tech)
      : 0;
  const buyIcon = unitIconPath(kind === "ordner" ? "ordner" : kind, color, tech);
  const upIcon = unitIconPath(kind === "ordner" ? "ordner" : kind, color, next);
  const buyAttrs =
    kind === "ordner"
      ? 'title="Kaufen"'
      : `data-quick-buy="${kind}" title="Kaufen"`;
  const buyBtnId = kind === "ordner" ? opts?.hireBtnId ?? "btn-hire-ordner" : undefined;
  return (
    railActionBtnHtml({
      kind: "kaufen",
      unitSrc: buyIcon,
      unitId: `buy-ico-${kind}`,
      amount: buy.amount,
      currencySrc: buy.currencySrc,
      payId: `buy-pay-${kind}`,
      yieldHtml: personYieldChipHtml(kind, buyYield, { id: `buy-yield-${kind}` }),
      btnId: buyBtnId,
      btnAttrs: buyAttrs,
    }) +
    railActionBtnHtml({
      kind: "upgrade",
      unitSrc: upIcon,
      unitId: `up-ico-${kind}`,
      amount: upCost != null ? upCost : "—",
      currencySrc: UI_ICONS.currencyGold,
      payId: `up-pay-${kind}`,
      yieldHtml: personYieldChipHtml(kind, upDelta, {
        delta: true,
        id: `up-yield-${kind}`,
      }),
      btnAttrs: `data-unit-up="${kind}" title="Upgrade (Gebäude ≥ Lv${next})"`,
    })
  );
}

/** Personen-Titel-Meta: "(Lvl.1, x5)" — Lvl = Tech-Stufe (ändert sich bei UP) */
function personMetaLabel(
  m: Match,
  kind: FanKind | "ordner",
  count: number,
): string {
  return `(Lvl.${m.unitTechLevel(kind)}, x${count})`;
}

function ownedBuildingSlots(m: Match, kind: BuildingKind) {
  return m.slots.filter(
    (s) =>
      s.building === kind &&
      s.owner === m.playerTeam &&
      !s.greyNeutral,
  );
}

/**
 * Upgrade-Ziel einer Gebäude-Art.
 * - preferredOnly: genau dieses Gebäude (Gebäude-Klick / Fokus-Panel)
 * - sonst immer das niedrigste eigene (allgemeines Baumenü)
 */
function pickBuildingUpgradeSlot(
  m: Match,
  kind: BuildingKind,
  preferred?: { blockId: number; index: number } | null,
  preferredOnly = false,
) {
  const owned = ownedBuildingSlots(m, kind);
  if (preferred && preferredOnly) {
    return (
      owned.find(
        (s) =>
          s.blockId === preferred.blockId &&
          s.index === preferred.index &&
          s.level < UPGRADE_MAX,
      ) ?? null
    );
  }
  let best: (typeof owned)[number] | null = null;
  for (const s of owned) {
    if (s.level >= UPGRADE_MAX) continue;
    if (!best || s.level < best.level) best = s;
  }
  return best;
}

function buildingMetaLabel(m: Match, kind: BuildingKind): string {
  const owned = ownedBuildingSlots(m, kind);
  const lv = owned.length
    ? Math.min(...owned.map((s) => s.level || 1))
    : 1;
  return owned.length
    ? `(niedrigstes Lvl.${lv}, x${owned.length})`
    : `(Lvl.${lv}, x0)`;
}

/** Bau + UP (Icon/Kosten/Ertrag) — gleiche Alt-D-Logik wie Personen. */
function buildingBuyUpHtml(
  m: Match,
  kind: BuildingKind,
  color: ReturnType<typeof teamColor>,
): string {
  const owned = ownedBuildingSlots(m, kind);
  const refLv = owned.length
    ? Math.min(...owned.map((s) => s.level || 1))
    : 1;
  const next = Math.min(UPGRADE_MAX, refLv + 1);
  const buyYield = buildingYieldPerSec(kind, 1);
  const upDelta =
    refLv < UPGRADE_MAX
      ? buildingYieldPerSec(kind, next) - buildingYieldPerSec(kind, refLv)
      : 0;
  const upCost =
    owned.length > 0 && refLv < UPGRADE_MAX
      ? (UPGRADE_COST[next] ?? null)
      : null;
  const buyIcon = standIconPath(kind, color, 1);
  const upIcon = standIconPath(kind, color, next);
  return (
    railActionBtnHtml({
      kind: "bauen",
      unitSrc: buyIcon,
      unitId: `build-ico-${kind}`,
      amount: BUILD_COST[kind],
      currencySrc: UI_ICONS.currencyGold,
      payId: `build-pay-${kind}`,
      yieldHtml: yieldChipHtml(kind, buyYield, { id: `build-yield-${kind}` }),
      btnAttrs: `data-build-bau="${kind}" title="Bauen"`,
    }) +
    railActionBtnHtml({
      kind: "upgrade",
      unitSrc: upIcon,
      unitId: `build-up-ico-${kind}`,
      amount: upCost != null ? upCost : "—",
      currencySrc: UI_ICONS.currencyGold,
      payId: `build-up-pay-${kind}`,
      yieldHtml: yieldChipHtml(kind, upDelta, {
        delta: true,
        id: `build-up-yield-${kind}`,
      }),
      btnAttrs: `data-build-up="${kind}" title="Upgrade"`,
    })
  );
}

function setPayAmt(root: ParentNode, payId: string, amount: number | string): void {
  const el = root.querySelector(`#${payId} .amt`) ?? root.querySelector(`#${payId}`);
  if (el) el.textContent = String(amount);
}

const app = document.querySelector<HTMLDivElement>("#app")!;

type Screen =
  | "menu"
  | "soloMatchup"
  | "tutorial"
  | "setup"
  | "match"
  | "result"
  | "highscores"
  | "challengeHub"
  | "challengeCreate"
  | "challengeLobby"
  | "challengeResult";

/** Top-level: clubs vs national teams */
type TeamScope = "clubs" | "nations";
/** Sub-mode within scope */
type PickMode = "derby" | "free" | "fixture";

const state = {
  screen: "menu" as Screen,
  settings: defaultSoloSettings() as SoloSettings,
  setup: defaultSetup(),
  match: null as Match | null,
  raf: 0,
  last: 0,
  /** Build-rail place mode: kind chosen while a plot is targeted */
  pendingBuild: null as BuildingKind | null,
  /** Plot selected for place/upgrade (build rail open) */
  buildTarget: null as { blockId: number; index: number } | null,
  /** place = Bau-Karten · upgrade = nur Upgrade-Card für geklicktes Gebäude */
  buildRailMode: "place" as "place" | "upgrade",
  highscoreDiff: "normal" as SoloSettings["difficulty"],
  highscoreScope: "gesamt" as HighscoreScope,
  /** Matchup: first Vereine/National, then Derby/Frei or Klassiker/Frei */
  teamScope: "clubs" as TeamScope,
  pickMode: "derby" as PickMode,
  menuCountry: "Deutschland",
  menuDerbyId: DEFAULT_DERBY_ID,
  menuNationRegion: "Europa",
  menuNationalFixtureId: DEFAULT_NATIONAL_FIXTURE_ID,
  /** In derby / national fixture mode: play as side a (true) or b (false) */
  menuPlayAsA: true,
  menuPlayerClub: DEFAULT_PLAYER_CLUB as ClubId,
  menuAiClub: DEFAULT_AI_CLUB as ClubId,
  menuDifficulty: "normal" as SoloSettings["difficulty"],
  menuBehavior: "balanced" as AiBehavior,
  /** Active challenge (create / accept / compare) */
  challenge: null as Challenge | null,
  /** Which slot this device fills for the active challenge */
  challengeRole: null as "a" | "b" | null,
  /** Draft goal on create screen */
  challengeGoal: "ergebnis" as ChallengeGoal,
};

function syncMenuBrandingPreview(): void {
  let player: ClubId;
  let ai: ClubId;
  if (state.teamScope === "clubs" && state.pickMode === "derby") {
    const d = findDerby(state.menuDerbyId);
    if (d) {
      player = state.menuPlayAsA ? d.a : d.b;
      ai = state.menuPlayAsA ? d.b : d.a;
    } else {
      player = state.menuPlayerClub;
      ai = state.menuAiClub;
    }
  } else if (state.teamScope === "nations" && state.pickMode === "fixture") {
    const fix = findNationalFixture(state.menuNationalFixtureId);
    if (fix) {
      player = state.menuPlayAsA ? fix.a : fix.b;
      ai = state.menuPlayAsA ? fix.b : fix.a;
    } else {
      player = isNational(state.menuPlayerClub)
        ? state.menuPlayerClub
        : DEFAULT_PLAYER_NATION;
      ai = isNational(state.menuAiClub) ? state.menuAiClub : DEFAULT_AI_NATION;
    }
  } else if (state.teamScope === "nations") {
    player = isNational(state.menuPlayerClub)
      ? state.menuPlayerClub
      : DEFAULT_PLAYER_NATION;
    ai = isNational(state.menuAiClub) ? state.menuAiClub : DEFAULT_AI_NATION;
    if (ai === player) {
      ai = player === DEFAULT_AI_NATION ? DEFAULT_PLAYER_NATION : DEFAULT_AI_NATION;
    }
  } else {
    player = state.menuPlayerClub;
    ai = state.menuAiClub;
    if (ai === player) {
      const other = clubsByCountry()
        .flatMap((g) => g.clubs)
        .find((c) => c.id !== player);
      if (other) ai = other.id;
    }
  }
  state.menuPlayerClub = player!;
  state.menuAiClub = ai!;
  setSideBranding(player!, ai!);
  applyClubCssVars();
}

function clubOptionsGroupedHtml(selected: ClubId, selectId: string): string {
  const groups = clubsByCountry();
  return `<select id="${selectId}">${groups
    .map(
      (g) =>
        `<optgroup label="${escapeHtml(g.country)}">${g.clubs
          .map(
            (c) =>
              `<option value="${c.id}" ${c.id === selected ? "selected" : ""}>${escapeHtml(c.short)} — ${escapeHtml(c.name)}</option>`,
          )
          .join("")}</optgroup>`,
    )
    .join("")}</select>`;
}

function nationOptionsGroupedHtml(selected: ClubId, selectId: string): string {
  const top = allNationals().filter((c) => (c.fifaRank ?? 999) <= 25);
  const extras = allNationals().filter((c) => (c.fifaRank ?? 999) > 25);
  const opt = (c: Club) => {
    const rank = c.fifaRank != null ? `#${c.fifaRank} · ` : "";
    return `<option value="${c.id}" ${c.id === selected ? "selected" : ""}>${rank}${escapeHtml(c.short)} — ${escapeHtml(c.name)}</option>`;
  };
  return `<select id="${selectId}">
    <optgroup label="FIFA Top 25">${top.map(opt).join("")}</optgroup>
    ${extras.length ? `<optgroup label="Weitere">${extras.map(opt).join("")}</optgroup>` : ""}
  </select>`;
}

function nationalFixtureOptionsHtml(selected: string): string {
  return `<select id="nation-fixture">${NATIONAL_FIXTURES.map((f) => {
    const a = getClub(f.a);
    const b = getClub(f.b);
    return `<option value="${f.id}" ${f.id === selected ? "selected" : ""}>${escapeHtml(f.name)} (${escapeHtml(a.short)}–${escapeHtml(b.short)})</option>`;
  }).join("")}</select>`;
}

function derbyOptionsGroupedHtml(
  country: string,
  selected: string,
): string {
  const groups = derbiesByCountry();
  const inCountry = groups.find((g) => g.country === country)?.derbies ?? [];
  const list = inCountry.length
    ? inCountry
    : groups.flatMap((g) => g.derbies);
  return `<select id="derby">${list
    .map((d) => {
      const a = getClub(d.a);
      const b = getClub(d.b);
      const rank = d.rank != null ? `#${d.rank} · ` : "";
      return `<option value="${d.id}" ${d.id === selected ? "selected" : ""}>${rank}${escapeHtml(d.name)} (${escapeHtml(a.short)}–${escapeHtml(b.short)})</option>`;
    })
    .join("")}</select>`;
}

function countryOptionsHtml(selected: string): string {
  const countries = derbiesByCountry().map((g) => g.country);
  return `<select id="country">${countries
    .map(
      (c) =>
        `<option value="${escapeHtml(c)}" ${c === selected ? "selected" : ""}>${escapeHtml(c)}</option>`,
    )
    .join("")}</select>`;
}

function kitSwatchHtml(clubId: ClubId): string {
  const c = getClub(clubId);
  // Match preview: show effective kit (away may be secondary on clash)
  const brand = currentBranding();
  const side =
    clubId === brand.heim.id ? "ksc" : clubId === brand.gast.id ? "vfb" : null;
  const prim = side ? clubPrimary(side) : c.primary;
  const sec = side ? clubSecondary(side) : c.secondary;
  const logo = clubLogoDataUrl(clubId, 72);
  const mark = logo
    ? `<img class="kit-logo" src="${logo}" alt="">`
    : `<i></i>`;
  const clash =
    side === "vfb" && awayKitClashActive() ? " · Auswärtsfarbe" : "";
  return `<span class="kit-swatch" title="${escapeHtml(c.name)}${clash}" style="--kit-a:${prim};--kit-b:${sec}">${mark}<b>${escapeHtml(c.short)}</b></span>`;
}

applyCssIconUrls();
document.documentElement.classList.toggle("standalone", isStandalone());

async function goFullscreen(): Promise<boolean> {
  const ok = await enterFullscreen(document.documentElement);
  await lockLandscape();
  document.documentElement.classList.toggle("is-fs", isFullscreen());
  return ok;
}

function syncFsClass(): void {
  document.documentElement.classList.toggle("is-fs", isFullscreen());
  document.documentElement.classList.toggle("standalone", isStandalone());
}

onFullscreenChange(syncFsClass);
syncFsClass();

function go(screen: Screen): void {
  state.screen = screen;
  render();
}

function render(): void {
  cancelAnimationFrame(state.raf);
  if (state.screen === "menu") renderMenu();
  else if (state.screen === "soloMatchup") renderSoloMatchup();
  else if (state.screen === "tutorial") renderTutorial();
  else if (state.screen === "setup") renderSetup();
  else if (state.screen === "match") renderMatchScreen();
  else if (state.screen === "highscores") renderHighscores();
  else if (state.screen === "challengeHub") renderChallengeHub();
  else if (state.screen === "challengeCreate") renderChallengeCreate();
  else if (state.screen === "challengeLobby") renderChallengeLobby();
  else if (state.screen === "challengeResult") renderChallengeResult();
  else renderResult();
}

/** Apply frozen challenge clubs/diff into solo settings (player always heim/ksc). */
function applyChallengeSettings(c: Challenge): void {
  state.settings = {
    playerTeam: "ksc",
    playerClub: c.playerClub,
    aiClub: c.aiClub,
    difficulty: c.difficulty,
    behavior: c.behavior || "balanced",
  };
  setClubSoundIdentity(c.playerClub, c.aiClub);
  syncMenuBrandingPreview();
}

function readMenuDifficulty(): SoloSettings["difficulty"] {
  const el = app.querySelector("#diff") as HTMLSelectElement | null;
  if (el?.value) {
    state.menuDifficulty = el.value as SoloSettings["difficulty"];
  }
  return state.menuDifficulty;
}

function readMenuBehavior(): AiBehavior {
  const el = app.querySelector("#ai-behavior") as HTMLSelectElement | null;
  if (el?.value) {
    state.menuBehavior = el.value as AiBehavior;
  }
  return state.menuBehavior;
}

function menuClubsFromState(): { playerClub: string; aiClub: string } {
  syncMenuBrandingPreview();
  return {
    playerClub: state.menuPlayerClub,
    aiClub: state.menuAiClub,
  };
}

/** Shared Vereine/National → Unterwahl + optional Diff/Verhalten (Solo & Challenge). */
function matchupPickHtml(opts: {
  showDiff?: boolean;
  showBehavior?: boolean;
}): string {
  const derby = findDerby(state.menuDerbyId);
  const fix = findNationalFixture(state.menuNationalFixtureId);
  let pickControls = "";
  if (state.teamScope === "clubs" && state.pickMode === "derby") {
    pickControls = `
        <label class="field">Land
          ${countryOptionsHtml(state.menuCountry)}
        </label>
        <label class="field">Derby
          ${derbyOptionsGroupedHtml(state.menuCountry, state.menuDerbyId)}
        </label>
        <label class="field">Deine Seite
          <select id="side">
            <option value="a" ${state.menuPlayAsA ? "selected" : ""}>${derby ? escapeHtml(getClub(derby.a).name) : "Heim"}</option>
            <option value="b" ${!state.menuPlayAsA ? "selected" : ""}>${derby ? escapeHtml(getClub(derby.b).name) : "Gast"}</option>
          </select>
        </label>`;
  } else if (state.teamScope === "nations" && state.pickMode === "fixture") {
    pickControls = `
        <label class="field">Länderspiel-Derby
          ${nationalFixtureOptionsHtml(state.menuNationalFixtureId)}
        </label>
        <label class="field">Deine Seite
          <select id="side">
            <option value="a" ${state.menuPlayAsA ? "selected" : ""}>${fix ? escapeHtml(getClub(fix.a).name) : "Heim"}</option>
            <option value="b" ${!state.menuPlayAsA ? "selected" : ""}>${fix ? escapeHtml(getClub(fix.b).name) : "Gast"}</option>
          </select>
        </label>`;
  } else if (state.teamScope === "nations") {
    pickControls = `
        <label class="field">Dein Land
          ${nationOptionsGroupedHtml(
            isNational(state.menuPlayerClub)
              ? state.menuPlayerClub
              : DEFAULT_PLAYER_NATION,
            "player-club",
          )}
        </label>
        <label class="field">Gegner (KI)
          ${nationOptionsGroupedHtml(
            isNational(state.menuAiClub) ? state.menuAiClub : DEFAULT_AI_NATION,
            "ai-club",
          )}
        </label>`;
  } else {
    pickControls = `
        <label class="field">Dein Verein
          ${clubOptionsGroupedHtml(
            isNational(state.menuPlayerClub)
              ? DEFAULT_PLAYER_CLUB
              : state.menuPlayerClub,
            "player-club",
          )}
        </label>
        <label class="field">Gegner (KI)
          ${clubOptionsGroupedHtml(
            isNational(state.menuAiClub) ? DEFAULT_AI_CLUB : state.menuAiClub,
            "ai-club",
          )}
        </label>`;
  }
  const subRow =
    state.teamScope === "clubs"
      ? `<div class="pick-mode-row" role="group" aria-label="Vereinsmodus">
          <button type="button" class="pick-mode ${state.pickMode === "derby" ? "on" : ""}" data-pick="derby">Derby</button>
          <button type="button" class="pick-mode ${state.pickMode === "free" ? "on" : ""}" data-pick="free">Frei</button>
        </div>`
      : `<div class="pick-mode-row" role="group" aria-label="Nationalmodus">
          <button type="button" class="pick-mode ${state.pickMode === "fixture" ? "on" : ""}" data-pick="fixture">Klassiker</button>
          <button type="button" class="pick-mode ${state.pickMode === "free" ? "on" : ""}" data-pick="free">Frei</button>
        </div>`;
  const diff = opts.showDiff
    ? `<label class="field">KI
          <select id="diff">
            <option value="easy" ${state.menuDifficulty === "easy" ? "selected" : ""}>Einfach</option>
            <option value="normal" ${state.menuDifficulty === "normal" ? "selected" : ""}>Mittel</option>
            <option value="hard" ${state.menuDifficulty === "hard" ? "selected" : ""}>Schwer</option>
          </select>
        </label>`
    : "";
  const behavior = opts.showBehavior
    ? `<label class="field">Rivalen-Charakter
          <select id="ai-behavior">
            ${(
              [
                "balanced",
                "patient",
                "aggro",
                "beer",
                "earlywin",
              ] as AiBehavior[]
            )
              .map(
                (b) =>
                  `<option value="${b}" ${state.menuBehavior === b ? "selected" : ""}>${AI_BEHAVIOR_LABEL[b]} — ${AI_BEHAVIOR_BLURB[b]}</option>`,
              )
              .join("")}
          </select>
        </label>`
    : "";
  return `
      <div class="card stack team-pick">
        <div class="pick-mode-row" role="group" aria-label="Mannschaftsart">
          <button type="button" class="pick-mode ${state.teamScope === "clubs" ? "on" : ""}" data-scope="clubs">Vereine</button>
          <button type="button" class="pick-mode ${state.teamScope === "nations" ? "on" : ""}" data-scope="nations">Nationalmannschaften</button>
        </div>
        ${subRow}
        ${pickControls}
        ${diff}
        ${behavior}
      </div>`;
}

function bindMatchupPickHandlers(rerender: () => void): void {
  app.querySelectorAll<HTMLButtonElement>("[data-scope]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sfx("ui");
      const next = btn.dataset.scope as TeamScope;
      state.teamScope = next;
      if (next === "nations") {
        state.pickMode = "fixture";
        const fix = findNationalFixture(state.menuNationalFixtureId);
        if (fix) {
          state.menuPlayerClub = fix.a;
          state.menuAiClub = fix.b;
        } else {
          state.menuPlayerClub = DEFAULT_PLAYER_NATION;
          state.menuAiClub = DEFAULT_AI_NATION;
        }
        state.menuPlayAsA = true;
      } else {
        state.pickMode = "derby";
        if (isNational(state.menuPlayerClub)) {
          state.menuPlayerClub = DEFAULT_PLAYER_CLUB;
        }
        if (isNational(state.menuAiClub)) {
          state.menuAiClub = DEFAULT_AI_CLUB;
        }
        state.menuPlayAsA = true;
      }
      rerender();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-pick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sfx("ui");
      const next = btn.dataset.pick as PickMode;
      state.pickMode = next;
      if (state.teamScope === "nations") {
        if (next === "fixture") {
          const fix = findNationalFixture(state.menuNationalFixtureId);
          if (fix) {
            state.menuPlayerClub = fix.a;
            state.menuAiClub = fix.b;
          }
          state.menuPlayAsA = true;
        } else {
          if (!isNational(state.menuPlayerClub)) {
            state.menuPlayerClub = DEFAULT_PLAYER_NATION;
          }
          if (
            !isNational(state.menuAiClub) ||
            state.menuAiClub === state.menuPlayerClub
          ) {
            state.menuAiClub = DEFAULT_AI_NATION;
          }
        }
      } else if (next === "derby" || next === "free") {
        if (isNational(state.menuPlayerClub)) {
          state.menuPlayerClub = DEFAULT_PLAYER_CLUB;
        }
        if (isNational(state.menuAiClub)) {
          state.menuAiClub = DEFAULT_AI_CLUB;
        }
      }
      rerender();
    });
  });
  const countryEl = app.querySelector("#country") as HTMLSelectElement | null;
  if (countryEl) {
    countryEl.addEventListener("change", () => {
      state.menuCountry = countryEl.value;
      const first = derbiesByCountry().find((g) => g.country === state.menuCountry)
        ?.derbies[0];
      if (first) {
        state.menuDerbyId = first.id;
        state.menuPlayAsA = true;
      }
      rerender();
    });
  }
  const derbyEl = app.querySelector("#derby") as HTMLSelectElement | null;
  if (derbyEl) {
    derbyEl.addEventListener("change", () => {
      state.menuDerbyId = derbyEl.value;
      state.menuPlayAsA = true;
      rerender();
    });
  }
  const nationFixEl = app.querySelector(
    "#nation-fixture",
  ) as HTMLSelectElement | null;
  if (nationFixEl) {
    nationFixEl.addEventListener("change", () => {
      state.menuNationalFixtureId = nationFixEl.value;
      const fix = findNationalFixture(state.menuNationalFixtureId);
      if (fix) {
        state.menuPlayerClub = fix.a;
        state.menuAiClub = fix.b;
        state.menuPlayAsA = true;
      }
      rerender();
    });
  }
  const sideEl = app.querySelector("#side") as HTMLSelectElement | null;
  if (sideEl) {
    sideEl.addEventListener("change", () => {
      state.menuPlayAsA = sideEl.value === "a";
      rerender();
    });
  }
  const playerClubEl = app.querySelector(
    "#player-club",
  ) as HTMLSelectElement | null;
  if (playerClubEl) {
    playerClubEl.addEventListener("change", () => {
      state.menuPlayerClub = playerClubEl.value;
      if (state.menuAiClub === state.menuPlayerClub) {
        const pool =
          state.teamScope === "nations"
            ? allNationals()
            : clubsByCountry().flatMap((g) => g.clubs);
        const alt = pool.find((c) => c.id !== state.menuPlayerClub);
        if (alt) state.menuAiClub = alt.id;
      }
      rerender();
    });
  }
  const aiClubEl = app.querySelector("#ai-club") as HTMLSelectElement | null;
  if (aiClubEl) {
    aiClubEl.addEventListener("change", () => {
      state.menuAiClub = aiClubEl.value;
      rerender();
    });
  }
  const diffEl = app.querySelector("#diff") as HTMLSelectElement | null;
  if (diffEl) {
    diffEl.addEventListener("change", () => {
      state.menuDifficulty = diffEl.value as SoloSettings["difficulty"];
    });
  }
  const behEl = app.querySelector("#ai-behavior") as HTMLSelectElement | null;
  if (behEl) {
    behEl.addEventListener("change", () => {
      state.menuBehavior = behEl.value as AiBehavior;
    });
  }
}

function applySoloSettingsFromMenu(): void {
  syncMenuBrandingPreview();
  const playerClub = state.menuPlayerClub;
  const aiClub = state.menuAiClub;
  state.settings = {
    playerTeam: "ksc",
    playerClub,
    aiClub,
    derbyId:
      state.teamScope === "clubs" && state.pickMode === "derby"
        ? state.menuDerbyId
        : state.teamScope === "nations" && state.pickMode === "fixture"
          ? state.menuNationalFixtureId
          : undefined,
    difficulty: readMenuDifficulty(),
    behavior: readMenuBehavior(),
  };
  setClubSoundIdentity(playerClub, aiClub);
}

function askChallengeName(defaultName = "Spieler"): string | null {
  const raw = window.prompt("Dein Name für die Challenge:", defaultName);
  if (raw == null) return null;
  return raw.trim().slice(0, 20) || defaultName;
}

function renderMenu(): void {
  const iosHint = isIos() && !isStandalone();
  app.innerHTML = `
    <div class="screen menu menu-home menu-derby">
      <div class="menu-atmosphere" aria-hidden="true">
        <span class="menu-beam menu-beam-l"></span>
        <span class="menu-beam menu-beam-r"></span>
        <span class="menu-ember"></span>
      </div>
      <header class="menu-hero">
        <p class="menu-eyebrow">Matchday TD</p>
        <h1 class="brand">Derby Time</h1>
        <p class="sub match-line">Blöcke · Gang · Stimmung</p>
        <div class="menu-sides" aria-hidden="true">
          <span class="menu-side menu-side-heim">Heim</span>
          <span class="menu-side-vs">vs</span>
          <span class="menu-side menu-side-gast">Gast</span>
        </div>
      </header>
      <div class="menu-actions stack">
        <button class="btn secondary" id="tutorial">Tutorial</button>
        <div class="menu-group">
          <p class="menu-group-label">Spielen</p>
          <button class="btn ksc menu-cta" id="solo">Solo vs KI</button>
          <button class="btn secondary" id="challenge">Challenge</button>
        </div>
        <button class="btn secondary" id="highscores">Highscores</button>
        <details class="menu-settings">
          <summary class="btn secondary menu-settings-summary">Einstellungen</summary>
          <div class="menu-util-row">
            <button class="btn secondary util" id="mute-audio">${muteButtonLabel()}</button>
            <button class="btn secondary util" id="fs-menu">Vollbild</button>
          </div>
        </details>
      </div>
      ${
        iosHint
          ? `<p class="tiny fs-hint">iPhone: Teilen → <b>Zum Home-Bildschirm</b> — dann ohne Tabs/Adressleiste.</p>`
          : `<p class="tiny fs-hint">Tipp: Vollbild für volle Spielfläche (ohne Browser-Leisten).</p>`
      }
      <p class="tiny fs-hint">Ton: einmal tippen — Browser starten Audio erst nach der ersten Geste.</p>
    </div>`;
  app.querySelector("#fs-menu")!.addEventListener("click", () => {
    unlockAudio();
    void goFullscreen();
  });
  app.querySelector("#mute-audio")!.addEventListener("click", () => {
    unlockAudio();
    toggleMuted();
    if (!isMuted()) sfx("ui");
    (app.querySelector("#mute-audio") as HTMLButtonElement).textContent =
      muteButtonLabel();
  });
  app.querySelector("#highscores")!.addEventListener("click", () => {
    sfx("ui");
    state.highscoreDiff = state.menuDifficulty;
    go("highscores");
  });
  app.querySelector("#tutorial")!.addEventListener("click", () => {
    unlockAudio();
    sfx("ui");
    go("tutorial");
  });
  app.querySelector("#challenge")!.addEventListener("click", () => {
    unlockAudio();
    sfx("ui");
    state.challenge = null;
    state.challengeRole = null;
    go("challengeHub");
  });
  app.querySelector("#solo")!.addEventListener("click", () => {
    unlockAudio();
    sfx("ui");
    startAmbience("menu");
    void goFullscreen();
    state.challenge = null;
    state.challengeRole = null;
    go("soloMatchup");
  });
}

/** After Solo: choose matchup, difficulty, AI character → Aufstellung */
function renderSoloMatchup(): void {
  syncMenuBrandingPreview();
  const brand = currentBranding();
  const derby = findDerby(state.menuDerbyId);
  const nationFix = findNationalFixture(state.menuNationalFixtureId);
  const matchLine = `${brand.heim.short} vs ${brand.gast.short}`;
  let derbyHint =
    state.teamScope === "clubs" && state.pickMode === "derby" && derby
      ? derby.rank != null
        ? `Derby #${derby.rank} · ${derby.name}`
        : derby.name
      : state.teamScope === "nations" && state.pickMode === "fixture"
        ? nationFix
          ? `Länderspiel · ${nationFix.name}`
          : "Nationalmannschaften"
        : state.teamScope === "nations"
          ? "Freie Nationalwahl (FIFA Top 25+)"
          : "Freie Vereinswahl";
  if (awayKitClashActive()) {
    derbyHint += ` · ${brand.gast.short} in Auswärtsfarbe`;
  }

  app.innerHTML = `
    <div class="screen menu menu-derby">
      <div>
        <p class="sub">Solo vs KI</p>
        <h1 class="brand" style="font-size:1.55rem">Matchup</h1>
        <p class="sub match-line">${escapeHtml(matchLine)}</p>
        <p class="tiny derby-hint">${escapeHtml(derbyHint)}</p>
        <div class="kit-preview" aria-hidden="true">
          ${kitSwatchHtml(brand.heim.id)}
          <span class="kit-vs">vs</span>
          ${kitSwatchHtml(brand.gast.id)}
        </div>
      </div>
      ${matchupPickHtml({ showDiff: true, showBehavior: true })}
      <div class="row setup-actions">
        <button class="btn secondary grow" id="solo-back" type="button">Menü</button>
        <button class="btn ksc grow" id="solo-next" type="button">Weiter</button>
      </div>
    </div>`;

  bindMatchupPickHandlers(() => renderSoloMatchup());
  app.querySelector("#solo-back")!.addEventListener("click", () => {
    sfx("ui");
    go("menu");
  });
  app.querySelector("#solo-next")!.addEventListener("click", () => {
    unlockAudio();
    sfx("ui");
    applySoloSettingsFromMenu();
    state.setup = defaultSetup();
    go("setup");
  });
}

type TutStep = {
  id: string;
  title: string;
  lead: string;
  body: string;
  diagram: string;
};

const TUTORIAL_STEPS: TutStep[] = [
  {
    id: "welcome",
    title: "Willkommen im Stadion",
    lead: "Kurz geführt — dann kickst du selbst.",
    body: "Du spielst die <b>Heimkurve</b>: baue Stände, hole Fans, sende Ultras/Hools in den Gang und schiebe Momentum bis zum Tor — oder stürme den Gästeblock.",
    diagram: `
      <div class="tut-diagram tut-stadion" aria-hidden="true">
        <div class="tut-block heim">Heim</div>
        <div class="tut-gang">Gang</div>
        <div class="tut-block gast">Gast</div>
      </div>`,
  },
  {
    id: "build",
    title: "Wie baut man?",
    lead: "Gebäude-Rail → Bauplatz tippen → Stand wählen.",
    body: "<b>Bier</b> füllt Bier (Hools), <b>Fanshop</b> Fanartikel (Ultras), <b>Ordner</b> Sicherheit & Posten. Nur Plots hinter deiner Standarte / Frontlinie. Upgrade erhöht die Produktion.",
    diagram: `
      <div class="tut-diagram tut-build" aria-hidden="true">
        <div class="tut-rail">Gebäude</div>
        <div class="tut-arrow">→</div>
        <div class="tut-plot">Bauplatz</div>
        <div class="tut-arrow">→</div>
        <div class="tut-stands"><span>Bier</span><span>Shop</span><span>Ordner</span></div>
      </div>`,
  },
  {
    id: "fans",
    title: "Personen holen",
    lead: "Personen-Rail: Fans, Ultras, Hooligans kaufen.",
    body: "<b>Fans</b> pushen Momentum & brauchen Sicherheit. <b>Ultras</b> senden/pyro (Fanartikel). <b>Hooligans</b> Nahkampf (Bier). Mehr Ultras im Block → stärkere <b>Choreo</b> (ab 5 / 10 / 20 / 30).",
    diagram: `
      <div class="tut-diagram tut-fans" aria-hidden="true">
        <div class="tut-fan f">Fan</div>
        <div class="tut-fan u">Ultra</div>
        <div class="tut-fan h">Hool</div>
      </div>`,
  },
  {
    id: "fight",
    title: "Wie kämpft man?",
    lead: "Angriff-Rail: Ultras (Fernkampf) oder Hools (Nahkampf) senden.",
    body: "Einheiten gehen über den <b>Ausgang</b> in den Gang, kämpfen um Raum und können den Gegnerblock besetzen. LIVE-Ticker unter dem Balken zeigt Kampfhinweise.",
    diagram: `
      <div class="tut-diagram tut-fight" aria-hidden="true">
        <div class="tut-block heim">Kurve</div>
        <div class="tut-path"><span class="tut-dot"></span><span class="tut-dot"></span><span class="tut-dot on"></span></div>
        <div class="tut-block gast">Gegner</div>
      </div>`,
  },
  {
    id: "goals",
    title: "Wie entstehen Tore?",
    lead: "Momentum-Balken bis ganz in die Gegnerhälfte → Tor.",
    body: "Fans in deinem Block + Stimmung füllen den Balken. Volle Füllung = <b>Tor</b>, dann Feier im Block, danach Glücksbiergang. Highlight mit Slow-Mo. Bei 45′ wählst du einen <b>Halbzeit-Boost</b>.",
    diagram: `
      <div class="tut-diagram tut-mom" aria-hidden="true">
        <div class="tut-mom-bar"><i style="width:86%"></i><b>⚽</b></div>
        <p class="tut-mom-cap">Kurve schiebt → Torchance steigt</p>
      </div>`,
  },
  {
    id: "storm",
    title: "Blocksturm",
    lead: "Genug Angreifer im Gegnerblock halten ≈ 5 s.",
    body: "Ultras/Hools besetzen den Gästeblock und halten das Banner „Hier regiert …“. Das ist ein alternativer Siegweg — und landet im Highscore als schnellster Blocksturm.",
    diagram: `
      <div class="tut-diagram tut-storm" aria-hidden="true">
        <div class="tut-banner">Hier regiert …</div>
        <div class="tut-timer">5 s</div>
      </div>`,
  },
];

function renderTutorial(stepIndex = 0): void {
  const i = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, stepIndex));
  const step = TUTORIAL_STEPS[i]!;
  const last = i >= TUTORIAL_STEPS.length - 1;
  app.innerHTML = `
    <div class="screen menu tutorial-screen tut-guided">
      <p class="sub">Schritt ${i + 1} / ${TUTORIAL_STEPS.length}</p>
      <h1 class="brand" style="font-size:1.55rem">${escapeHtml(step.title)}</h1>
      <p class="sub">${step.lead}</p>
      <div class="card stack tutorial-card">
        ${step.diagram}
        <p class="tut-body">${step.body}</p>
        <div class="tut-dots" aria-hidden="true">
          ${TUTORIAL_STEPS.map((_, di) => `<i class="${di === i ? "on" : ""}"></i>`).join("")}
        </div>
      </div>
      <div class="row setup-actions">
        <button class="btn secondary grow" id="tut-back" type="button">${i === 0 ? "Menü" : "Zurück"}</button>
        <button class="btn ksc grow" id="tut-next" type="button">${last ? "Fertig" : "Weiter"}</button>
      </div>
    </div>`;
  app.querySelector("#tut-back")!.addEventListener("click", () => {
    sfx("ui");
    if (i === 0) go("menu");
    else renderTutorial(i - 1);
  });
  app.querySelector("#tut-next")!.addEventListener("click", () => {
    sfx("ui");
    if (last) go("menu");
    else renderTutorial(i + 1);
  });
}

/**
 * Winner badge from the *stored* match — both logos (player + opponent)
 * like club highscores; works for nationals too (flags).
 * Never uses current menu club / live --ksc/--vfb branding.
 */
function hsMatchupBadge(e: HighscoreEntry): string {
  const frozen = freezeEntryClubs(e);
  const label = matchupLabel(frozen);
  const winnerId = resolveEntryClubId(frozen.playerClub, frozen.playerShort);
  const oppId = resolveEntryClubId(frozen.opponentClub, frozen.opponentShort);
  const prim =
    entryClubPrimary(frozen.playerClub, frozen.playerShort) || "#64748b";
  const logoImg = (id: string | undefined, cls: string) => {
    if (!id) return "";
    try {
      const logo = clubLogoDataUrl(id, 64);
      return logo ? `<img class="hs-logo ${cls}" src="${logo}" alt="">` : "";
    } catch {
      return "";
    }
  };
  const markA = logoImg(winnerId, "hs-logo-a");
  const markB = logoImg(oppId, "hs-logo-b");
  if (!label && !markA && !markB) return "";
  const text = label || frozen.playerShort || "Sieg";
  return `<span class="hs-team hs-winner" style="background:${prim}">${markA}<span class="hs-vs-label">${escapeHtml(text)}</span>${markB}</span>`;
}

/** Detail without matchup (badge shows Gegner separately). */
function hsDetailLine(e: HighscoreEntry): string {
  let d = e.detail;
  const vs = matchupLabel(e);
  if (vs) {
    d = d
      .replace(` · ${vs}`, "")
      .replace(`${vs} · `, "")
      .replace(` · ${vs} `, " ");
  }
  return escapeHtml(d);
}

function renderHighscores(): void {
  const d = state.highscoreDiff;
  const scope = state.highscoreScope;
  const myName = localStorage.getItem("matchday-player-name") || "";
  const cached =
    scope === "persoenlich"
      ? loadPersonalHighscores(myName || "Spieler")
      : loadHighscores();
  const paint = (tables: typeof cached, shared: boolean | null) => {
    const listHtml = (kind: ScoreBoardKind, title: string) => {
      const rows = tables[d][kind].map((e) => freezeEntryClubs(e));
      if (!rows.length) {
        return scope === "persoenlich"
          ? `<p class="tiny">${title}: noch keine persönlichen Einträge${myName ? ` für „${escapeHtml(myName)}“` : ""}</p>`
          : `<p class="tiny">${title}: noch leer</p>`;
      }
      return `<h3>${title}</h3><ol class="hs-list">${rows
        .map((e) => {
          const badge = hsMatchupBadge(e);
          return `<li><b>${escapeHtml(e.name)}</b>${badge ? ` ${badge}` : ""} — ${hsDetailLine(e)}</li>`;
        })
        .join("")}</ol>`;
    };
    const status =
      scope === "persoenlich"
        ? `<p class="tiny hs-sync">Persönliche Top-10${myName ? ` — ${escapeHtml(myName)}` : ""} (mehrere Ergebnisse möglich)</p>`
        : shared === null
          ? `<p class="tiny hs-sync">Globale Liste wird geladen…</p>`
          : shared
            ? `<p class="tiny hs-sync">Gesamt Top-10 — mehrere Einträge pro Name möglich</p>`
            : `<p class="tiny hs-sync">Offline — lokale Gesamt-Liste</p>`;
    app.innerHTML = `
    <div class="screen menu">
      <h1 class="brand">Highscores</h1>
      ${status}
      <div class="pick-mode-row hs-scope-row" role="group" aria-label="Highscore-Ansicht">
        <button type="button" class="pick-mode ${scope === "gesamt" ? "on" : ""}" data-hs-scope="gesamt">Gesamt Top-10</button>
        <button type="button" class="pick-mode ${scope === "persoenlich" ? "on" : ""}" data-hs-scope="persoenlich">Persönliche Top-10</button>
      </div>
      <label class="field">Schwierigkeit
        <select id="hs-diff">
          <option value="easy" ${d === "easy" ? "selected" : ""}>Einfach</option>
          <option value="normal" ${d === "normal" ? "selected" : ""}>Mittel</option>
          <option value="hard" ${d === "hard" ? "selected" : ""}>Schwer</option>
        </select>
      </label>
      <div class="card stack">
        ${listHtml("ergebnis", "Höchstes Ergebnis")}
        ${listHtml("blocksturm", "Schnellster Blocksturm")}
        ${listHtml("bier", "Meiste Biere")}
      </div>
      <button class="btn secondary" id="hs-back">Zurück</button>
    </div>`;
    app.querySelectorAll<HTMLButtonElement>("[data-hs-scope]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.highscoreScope = btn.dataset.hsScope as HighscoreScope;
        renderHighscores();
      });
    });
    app.querySelector("#hs-diff")!.addEventListener("change", (ev) => {
      state.highscoreDiff = (ev.target as HTMLSelectElement)
        .value as SoloSettings["difficulty"];
      renderHighscores();
    });
    app.querySelector("#hs-back")!.addEventListener("click", () => go("menu"));
  };
  paint(cached, scope === "persoenlich" ? false : null);
  if (scope === "gesamt") {
    void fetchSharedHighscores().then(({ tables, shared }) => {
      if (state.screen !== "highscores" || state.highscoreScope !== "gesamt")
        return;
      paint(tables, shared);
    });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function askPlayerName(defaultName = "Spieler"): string | null {
  const raw = window.prompt("Neuer Top-10-Platz! Dein Name:", defaultName);
  if (raw == null) return null;
  const name = raw.trim().slice(0, 20);
  return name || defaultName;
}

function attemptCardHtml(
  title: string,
  attempt: Challenge["a"],
  highlight: boolean,
): string {
  if (!attempt) {
    return `<div class="chal-slot"><b>${escapeHtml(title)}</b><p class="tiny">Noch offen</p></div>`;
  }
  return `<div class="chal-slot ${highlight ? "win" : ""}">
    <b>${escapeHtml(attempt.name)}</b>
    <p class="sub" style="margin:4px 0 0">${escapeHtml(attempt.detail)}</p>
    <p class="tiny">${attempt.beatAi ? "Sieg vs KI" : "Niederlage vs KI"}</p>
  </div>`;
}

function parseChallengePaste(raw: string): Challenge | null {
  let decoded: Challenge | null = null;
  if (raw.startsWith("http")) {
    try {
      const u = new URL(raw);
      decoded = challengeFromLocation(u.search, u.hash);
    } catch {
      decoded = null;
    }
  }
  if (!decoded && raw.includes("c=")) {
    const q = raw.includes("?") ? raw.slice(raw.indexOf("?")) : `?${raw}`;
    decoded = challengeFromLocation(q, "");
  }
  if (!decoded) {
    const payload = raw.replace(/^.*[?&#]c=/, "").split(/[&#]/)[0] || raw;
    decoded = decodeChallenge(decodeURIComponent(payload));
  }
  return decoded;
}

function openChallengeFromPayload(c: Challenge): void {
  upsertChallengeHistory(c);
  state.challenge = c;
  state.challengeRole = null;
  clearChallengeFromUrl();
  go("challengeLobby");
}

/** Challenge-Hub: Bilanz, Historie, neue Challenge / Link öffnen */
function renderChallengeHub(): void {
  const stats = challengeStats();
  const history = loadChallengeHistory();
  const histHtml = history.length
    ? `<ul class="chal-history">${history
        .map((e) => {
          const outcome = challengeOutcomeForMe(e, e.myRole);
          const badge = challengeOutcomeLabel(outcome);
          const cls =
            outcome === "win"
              ? "win"
              : outcome === "loss"
                ? "loss"
                : outcome === "draw"
                  ? "draw"
                  : "open";
          const scores =
            e.a || e.b
              ? `${e.a ? escapeHtml(e.a.name) + " " + escapeHtml(e.a.detail) : "—"} · ${e.b ? escapeHtml(e.b.name) + " " + escapeHtml(e.b.detail) : "—"}`
              : "Noch niemand gespielt";
          return `<li class="chal-history-item" data-chal-id="${escapeHtml(e.id)}">
            <div class="chal-history-top">
              <b>${escapeHtml(CHALLENGE_GOAL_LABEL[e.goal])}</b>
              <span class="chal-badge ${cls}">${escapeHtml(badge)}</span>
            </div>
            <p class="tiny">${escapeHtml(challengeSetupLine(e))}</p>
            <p class="tiny">${scores}</p>
          </li>`;
        })
        .join("")}</ul>`
    : `<p class="tiny">Noch keine Challenges — Link generieren und teilen.</p>`;

  app.innerHTML = `
    <div class="screen menu">
      <p class="sub">1 Versuch · Einladungslink · Sieger vergleichen</p>
      <h1 class="brand" style="font-size:1.55rem">Challenge</h1>
      <div class="chal-stats card stack">
        <p class="sub" style="margin:0">Deine Bilanz</p>
        <p class="chal-stats-line"><b>${stats.wins}</b> Siege · <b>${stats.losses}</b> Niederlagen · <b>${stats.draws}</b> Unentschieden</p>
        <p class="tiny">${stats.played} abgeschlossene Challenge${stats.played === 1 ? "" : "s"} auf diesem Gerät</p>
      </div>
      <div class="card stack">
        <button class="btn ksc" id="chal-new" type="button">Neue Challenge</button>
        <p class="tiny" style="margin:0">Einladungslink einfügen:</p>
        <div class="row" style="gap:8px">
          <input id="chal-paste" class="chal-input" type="text" placeholder="https://…?c=… oder Code" autocomplete="off" />
          <button class="btn secondary" id="chal-join" type="button">Öffnen</button>
        </div>
      </div>
      <div class="card stack">
        <p class="sub" style="margin:0">Vergangene Challenges</p>
        ${histHtml}
      </div>
      <button class="btn secondary" id="chal-hub-back" type="button">Menü</button>
    </div>`;

  app.querySelector("#chal-hub-back")!.addEventListener("click", () => {
    sfx("ui");
    go("menu");
  });
  app.querySelector("#chal-new")!.addEventListener("click", () => {
    sfx("ui");
    go("challengeCreate");
  });
  app.querySelector("#chal-join")!.addEventListener("click", () => {
    sfx("ui");
    const raw = (app.querySelector("#chal-paste") as HTMLInputElement).value.trim();
    const decoded = parseChallengePaste(raw);
    if (!decoded) {
      window.alert("Challenge-Link ungültig.");
      return;
    }
    openChallengeFromPayload(decoded);
  });
  app.querySelectorAll<HTMLElement>("[data-chal-id]").forEach((el) => {
    el.addEventListener("click", () => {
      sfx("ui");
      const id = el.dataset.chalId;
      const hit = loadChallengeHistory().find((h) => h.id === id);
      if (!hit) return;
      state.challenge = hit;
      state.challengeRole = null;
      go("challengeLobby");
    });
  });
}

function renderChallengeCreate(): void {
  syncMenuBrandingPreview();
  const brand = currentBranding();
  const matchLine = `${brand.heim.short} vs ${brand.gast.short}`;
  const goal = state.challengeGoal;
  const goals = (["ergebnis", "blocksturm", "bier"] as ChallengeGoal[])
    .map(
      (g) =>
        `<button type="button" class="pick-mode ${goal === g ? "on" : ""}" data-chal-goal="${g}">${CHALLENGE_GOAL_LABEL[g]}</button>`,
    )
    .join("");

  app.innerHTML = `
    <div class="screen menu">
      <p class="sub">Setup wählen → Einladungslink generieren</p>
      <h1 class="brand" style="font-size:1.45rem">Neue Challenge</h1>
      <p class="sub match-line">${escapeHtml(matchLine)}</p>
      <div class="kit-preview" aria-hidden="true">
        ${kitSwatchHtml(brand.heim.id)}
        <span class="kit-vs">vs</span>
        ${kitSwatchHtml(brand.gast.id)}
      </div>
      <div class="card stack">
        <p class="tiny">Ziel</p>
        <div class="pick-mode-row chal-goals" role="group" aria-label="Challenge-Ziel">${goals}</div>
        <p class="tiny">${escapeHtml(CHALLENGE_GOAL_BLURB[goal])}</p>
      </div>
      ${matchupPickHtml({ showDiff: true, showBehavior: false })}
      <div class="row setup-actions">
        <button class="btn secondary grow" id="chal-back" type="button">Zurück</button>
        <button class="btn ksc grow" id="chal-invite" type="button">Einladungslink generieren</button>
      </div>
      <p class="tiny">Danach Link teilen — du und der Gegner spielt jeweils 1× über denselben Link.</p>
    </div>`;

  app.querySelectorAll<HTMLButtonElement>("[data-chal-goal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sfx("ui");
      state.challengeGoal = btn.dataset.chalGoal as ChallengeGoal;
      renderChallengeCreate();
    });
  });
  bindMatchupPickHandlers(() => renderChallengeCreate());
  app.querySelector("#chal-back")!.addEventListener("click", () => {
    sfx("ui");
    go("challengeHub");
  });
  app.querySelector("#chal-invite")!.addEventListener("click", () => {
    unlockAudio();
    sfx("ui");
    const clubs = menuClubsFromState();
    const name =
      askChallengeName(localStorage.getItem("matchday-player-name") || "Spieler");
    if (!name) return;
    localStorage.setItem("matchday-player-name", name);
    const diff = readMenuDifficulty();
    const c = createChallenge({
      goal: state.challengeGoal,
      difficulty: diff,
      behavior: "balanced",
      playerClub: clubs.playerClub,
      aiClub: clubs.aiClub,
      hostName: name,
    });
    upsertChallengeHistory(c);
    state.challenge = c;
    state.challengeRole = null;
    applyChallengeSettings(c);
    go("challengeLobby");
    void copyChallengeLink(c, true);
  });
}

function renderChallengeLobby(): void {
  const c = state.challenge;
  if (!c) {
    go("challengeHub");
    return;
  }
  upsertChallengeHistory(c);
  applyChallengeSettings(c);
  const role = openChallengeRole(c);
  const winner = compareChallengeAttempts(c.goal, c.a, c.b);
  const verdict = challengeVerdictLabel(c, winner);
  const canPlay = role === "a" || role === "b";
  const already = role === "full";
  const done = role === "done";
  const url = challengeShareUrl(c);

  app.innerHTML = `
    <div class="screen menu">
      <p class="sub">Challenge · Einladungslink</p>
      <h1 class="brand" style="font-size:1.45rem">${escapeHtml(CHALLENGE_GOAL_LABEL[c.goal])}</h1>
      <p class="sub">${escapeHtml(challengeSetupLine(c))}</p>
      <div class="kit-preview" aria-hidden="true">
        ${kitSwatchHtml(c.playerClub as ClubId)}
        <span class="kit-vs">vs</span>
        ${kitSwatchHtml(c.aiClub as ClubId)}
      </div>
      <div class="chal-compare">
        ${attemptCardHtml(c.a ? c.a.name : "Spieler 1", c.a, winner === "a")}
        ${attemptCardHtml(c.b ? c.b.name : "Spieler 2", c.b, winner === "b")}
      </div>
      <p class="sub chal-verdict">${escapeHtml(verdict)}</p>
      <p class="tiny">${escapeHtml(CHALLENGE_GOAL_BLURB[c.goal])} · Nur 1 Versuch pro Spieler.</p>
      <label class="field">Einladungslink
        <input class="chal-input" id="chal-link-view" type="text" readonly value="${escapeHtml(url)}" />
      </label>
      <div class="row setup-actions">
        <button class="btn secondary grow" id="chal-lobby-back" type="button">Übersicht</button>
        <button class="btn secondary grow" id="chal-copy" type="button">Link kopieren</button>
      </div>
      ${
        canPlay
          ? `<button class="btn ksc" id="chal-play" type="button" style="width:100%;margin-top:8px">${c.a || c.b ? "Spielen (1×)" : "Jetzt spielen (1×)"}</button>`
          : already && !done
            ? `<p class="tiny">Du hast deinen Versuch auf diesem Gerät schon verbraucht — warte auf den Gegner / aktualisiere den Link.</p>`
            : ""
      }
    </div>`;

  app.querySelector("#chal-lobby-back")!.addEventListener("click", () => {
    sfx("ui");
    state.challenge = null;
    state.challengeRole = null;
    go("challengeHub");
  });
  app.querySelector("#chal-copy")!.addEventListener("click", () => {
    sfx("ui");
    void copyChallengeLink(c);
  });
  const playBtn = app.querySelector("#chal-play");
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      unlockAudio();
      sfx("ui");
      const open = openChallengeRole(c);
      if (open !== "a" && open !== "b") {
        renderChallengeLobby();
        return;
      }
      const name = askChallengeName(
        localStorage.getItem("matchday-player-name") ||
          c.hostName ||
          "Spieler",
      );
      if (!name) return;
      localStorage.setItem("matchday-player-name", name);
      state.challengeRole = open;
      applyChallengeSettings(c);
      state.setup = defaultSetup();
      go("setup");
    });
  }
}

async function copyChallengeLink(
  c: Challenge,
  silentOk = false,
): Promise<void> {
  const url = challengeShareUrl(c);
  try {
    await navigator.clipboard.writeText(url);
    if (!silentOk) {
      window.alert("Einladungslink kopiert — an den Gegner senden.");
    } else {
      window.alert("Einladungslink generiert und kopiert — teile ihn mit dem Gegner.");
    }
  } catch {
    window.prompt("Einladungslink kopieren:", url);
  }
}

function renderChallengeResult(): void {
  const c = state.challenge;
  if (!c) {
    go("challengeHub");
    return;
  }
  upsertChallengeHistory(c);
  const winner = compareChallengeAttempts(c.goal, c.a, c.b);
  const verdict = challengeVerdictLabel(c, winner);
  const mine = challengeOutcomeForMe(c, state.challengeRole);
  app.innerHTML = `
    <div class="screen menu">
      <p class="sub">Challenge-Ergebnis</p>
      <h1 class="brand" style="font-size:1.5rem">${escapeHtml(
        winner === "draw"
          ? "Unentschieden"
          : winner === "pending"
            ? "Dein Versuch zählt"
            : mine === "win"
              ? "Du hast gewonnen!"
              : mine === "loss"
                ? "Du hast verloren"
                : "Sieger!",
      )}</h1>
      <p class="sub">${escapeHtml(challengeSetupLine(c))}</p>
      <div class="chal-compare">
        ${attemptCardHtml(c.a?.name || "Spieler 1", c.a, winner === "a")}
        ${attemptCardHtml(c.b?.name || "Spieler 2", c.b, winner === "b")}
      </div>
      <p class="sub chal-verdict">${escapeHtml(verdict)}</p>
      <div class="row setup-actions">
        <button class="btn secondary grow" id="chal-res-hub" type="button">Übersicht</button>
        <button class="btn ksc grow" id="chal-res-copy" type="button">Link teilen</button>
      </div>
      <p class="tiny">${
        winner === "pending"
          ? "Gegner öffnet denselben Einladungslink und spielt 1× — danach siehst du den Sieger in der Historie."
          : "Beide Versuche stecken im Link. In der Challenge-Übersicht bleibt die Partie gespeichert."
      }</p>
    </div>`;
  app.querySelector("#chal-res-hub")!.addEventListener("click", () => {
    sfx("ui");
    state.challenge = null;
    state.challengeRole = null;
    go("challengeHub");
  });
  app.querySelector("#chal-res-copy")!.addEventListener("click", () => {
    sfx("ui");
    void copyChallengeLink(c);
  });
}

function finishChallengeAttempt(): void {
  const c = state.challenge;
  const role = state.challengeRole;
  const m = state.match;
  if (!c || !role || !m?.result) {
    go("result");
    return;
  }
  const r = m.result;
  const name = localStorage.getItem("matchday-player-name") || "Spieler";
  const attempt = attemptFromMatch({
    goal: c.goal,
    name,
    playerTeam: state.settings.playerTeam,
    winner: r.winner,
    reason: r.reason,
    score: r.score,
    minute: r.minute,
    beersDrunk: m.beersDrunkPlayer,
  });
  if (role === "a") c.a = attempt;
  else c.b = attempt;
  markPlayedChallengeRole(c.id, role);
  upsertChallengeHistory(c);
  state.challenge = c;
  go("challengeResult");
}

function renderSetup(): void {
  const mix = state.setup.mix;
  const chal = state.challenge;
  const row = (key: keyof FanMix, label: string) => `
    <div class="row" style="justify-content:space-between">
      <span>${label}</span>
      <div class="row">
        <button class="btn secondary" data-mix="${key}" data-d="-1" style="min-height:40px;min-width:40px;padding:0">−</button>
        <strong style="min-width:1.4rem;text-align:center">${mix[key]}</strong>
        <button class="btn secondary" data-mix="${key}" data-d="1" style="min-height:40px;min-width:40px;padding:0">+</button>
      </div>
    </div>`;
  app.innerHTML = `
    <div class="screen menu">
      <div>
        <p class="sub">${
          chal
            ? `Challenge · ${escapeHtml(challengeSetupLine(chal))} · 1 Versuch`
            : "8 Fans für den Heimblock (Startaufstellung)"
        }</p>
        <h1 class="brand" style="font-size:1.6rem">Aufstellung</h1>
      </div>
      <div class="card stack">
        ${row("normalos", "Fans (Momentum · Sicherheit)")}
        ${row("ultras", "Ultras (Senden · Fanartikel)")}
        ${row("hooligans", "Hooligans (Nahkampf · Bier)")}
        <p class="tiny">Summe ${mixSum(mix)} / 8 ${isValidMix(mix) ? "✓" : ""}</p>
      </div>
      <div class="row setup-actions">
        <button class="btn secondary grow" id="back" type="button">Zurück</button>
        <button class="btn ksc grow anpfiff-btn" id="start" type="button" ${isValidMix(mix) ? "" : "disabled"}>Anpfiff</button>
      </div>
    </div>`;
  app.querySelector("#back")!.addEventListener("click", () => {
    if (state.challenge && state.challengeRole) {
      // Don't burn the attempt until the match ends
      go("challengeLobby");
      return;
    }
    go("soloMatchup");
  });
  // Start requires an active click; do not gate match entry on fullscreen
  // (FS is optional after kickoff — otherwise playtests look like Anpfiff "failed").
  app.querySelector("#start")!.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (!isValidMix(state.setup.mix)) return;
    if (state.challenge && state.challengeRole) {
      applyChallengeSettings(state.challenge);
    }
    unlockAudio();
    sfx("whistle");
    startAmbience("match");
    const aiProf = difficultyProfile(state.settings.difficulty);
    state.match = new Match({
      settings: state.settings,
      playerSetup: state.setup,
      aiSetup: { mix: { ...aiProf.aiMix } },
    });
    // QA / playtest hook (read-only introspection)
    (window as unknown as { __match?: Match }).__match = state.match;
    go("match");
    void goFullscreen();
  });
  app.querySelectorAll<HTMLButtonElement>("[data-mix]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.mix as keyof FanMix;
      const d = Number(btn.dataset.d);
      const next = { ...state.setup.mix, [key]: state.setup.mix[key] + d };
      if (next[key] < MIX_MIN[key] || next[key] > MIX_MAX[key]) return;
      if (mixSum(next) > 8) return;
      state.setup.mix = next;
      renderSetup();
    });
  });
}

function renderMatchScreen(): void {
  const m = state.match!;
  m.setSpeed(1);
  const needFs = needsFullscreenGate();
  const iosHint = isIos() && !isStandalone();
  const tc = teamColor(m.playerTeam);
  state.pendingBuild = null;
  state.buildTarget = null;
  app.innerHTML = `
    <div class="rotate-hint">Bitte Handy quer drehen ↻</div>
    <div class="match-shell matchday">
      <div class="rail-slot" id="rail-slot" hidden>
        <aside class="side-rail right-rail person-rail" id="person-rail" aria-label="Personen" hidden>
          <header class="rail-banner">Personen</header>
          <div class="unit-rows person-cards">
            <article class="person-card">
              <div class="person-title">Fans <span class="meta" data-person-meta="normalos">(Lvl.1, x0)</span></div>
              <div class="person-actions dual">
                ${personBuyUpHtml(m, "normalos", tc)}
              </div>
            </article>
            <article class="person-card">
              <div class="person-title">Ultras <span class="meta" data-person-meta="ultras">(Lvl.1, x0)</span></div>
              <div class="person-actions dual">
                ${personBuyUpHtml(m, "ultras", tc)}
              </div>
            </article>
            <article class="person-card">
              <div class="person-title">Hooligans <span class="meta" data-person-meta="hooligans">(Lvl.1, x0)</span></div>
              <div class="person-actions dual">
                ${personBuyUpHtml(m, "hooligans", tc)}
              </div>
            </article>
            <article class="person-card">
              <div class="person-title">Ordner <span class="meta" data-person-meta="ordner">(Lvl.1, x0)</span></div>
              <div class="person-actions dual">
                ${personBuyUpHtml(m, "ordner", tc, { hireBtnId: "btn-hire-ordner" })}
              </div>
            </article>
          </div>
          <button type="button" class="rail-close" id="person-rail-close">Schließen</button>
        </aside>
        <aside class="side-rail right-rail build-rail" id="build-rail" aria-label="Gebäude" hidden>
          <header class="rail-banner" id="build-rail-title">Gebäude</header>
          <div class="unit-rows person-cards building-cards" id="build-place-rows">
            <article class="person-card building-card" data-build-card="bier">
              <div class="person-title">Bierstand <span class="meta" data-build-meta="bier">(Lvl.1, x0)</span></div>
              <div class="person-actions dual">
                ${buildingBuyUpHtml(m, "bier", tc)}
              </div>
            </article>
            <article class="person-card building-card" data-build-card="fanshop">
              <div class="person-title">Fanshop <span class="meta" data-build-meta="fanshop">(Lvl.1, x0)</span></div>
              <div class="person-actions dual">
                ${buildingBuyUpHtml(m, "fanshop", tc)}
              </div>
            </article>
            <article class="person-card building-card" data-build-card="ordner">
              <div class="person-title">Ordnerposten <span class="meta" data-build-meta="ordner">(Lvl.1, x0)</span></div>
              <div class="person-actions dual">
                ${buildingBuyUpHtml(m, "ordner", tc)}
              </div>
            </article>
          </div>
          <div class="build-rows hidden" id="build-upgrade-rows" aria-hidden="true"></div>
          <button type="button" class="rail-close" id="build-rail-close">Schließen</button>
        </aside>
        <aside class="side-rail right-rail attack-rail" id="attack-rail" aria-label="Angriff" hidden>
          <header class="rail-banner">Angriff</header>
          <div class="attack-body">
            <div class="unit-rows person-cards attack-cards">
              <article class="person-card attack-card">
                <div class="person-title">Pyro Wurf <span class="meta" data-attack-meta="ultras">(x0 bereit)</span></div>
                <div class="person-actions dual">
                  ${attackSendPairHtml(m, "ultras", tc)}
                </div>
              </article>
              <article class="person-card attack-card">
                <div class="person-title">Nahkampf <span class="meta" data-attack-meta="hooligans">(x0 bereit)</span></div>
                <div class="person-actions dual">
                  ${attackSendPairHtml(m, "hooligans", tc)}
                </div>
              </article>
            </div>
          </div>
          <button type="button" class="rail-close" id="attack-rail-close">Schließen</button>
        </aside>
      </div>
      <div id="game-wrap">
        <div class="fanbase-col gast sr-only" aria-label="Gegner">
          <span class="fb"><i>N</i><b id="fb-en">0</b></span>
          <span class="fb"><i>U</i><b id="fb-eu">0</b></span>
          <span class="fb"><i>H</i><b id="fb-eh">0</b></span>
          <span class="fb"><i>O</i><b id="fb-eo">0</b></span>
        </div>
        <span class="sr-only" id="fb-n">0</span>
        <span class="sr-only" id="fb-u">0</span>
        <span class="sr-only" id="fb-h">0</span>
        <span class="sr-only" id="fb-o">0</span>
        <div class="top-hud" id="pitch-hud">
          <div class="wallet-row" aria-label="Ressourcen">
            <span class="wi gold chip"><img src="${UI_ICONS.currencyGold}" alt=""><b id="gold">0</b></span>
            <span class="wi bier chip"><img src="${UI_ICONS.currencyBier}" alt=""><b id="cur-beer">0</b></span>
            <span class="wi merch chip"><img src="${UI_ICONS.currencyFanartikel}" alt=""><b id="cur-merch">0</b></span>
            <span class="wi sec chip"><img src="${UI_ICONS.currencySicherheit}" alt=""><b id="cur-sec">0</b></span>
          </div>
          <!-- Scoreboard + Momentum live on canvas (stadion top third) -->
          <div class="pitch-score sr-only" aria-label="Spielstand">
            <b id="hud-score">0:0</b>
            <span id="hud-minute">0′</span>
          </div>
          <div class="pitch-momentum sr-only" aria-label="Momentum">
            <div class="momentum-bar" id="momentum-bar">
              <div class="mom-fill heim" id="mom-heim"></div>
              <div class="mom-fill gast" id="mom-gast"></div>
              <div class="mom-knob" id="mom-knob"></div>
            </div>
            <span id="mom-p-heim">Stimmung Heim 1.0</span>
            <span id="mom-p-tor">Momentum Heim 50%</span>
            <span id="mom-p-gast">Stimmung Gast 1.0</span>
          </div>
          <div class="combat-banner hidden" id="combat-banner"></div>
        </div>
        <canvas id="c"></canvas>
        <!-- Live ticker is drawn on canvas under the momentum bar -->
        <div class="toast" id="toast"></div>
        <div class="choreo-chip hidden" id="choreo-chip" aria-live="polite"></div>
        <div class="halftime-panel hidden" id="halftime-panel" role="dialog" aria-label="Halbzeit">
          <div class="halftime-card">
            <h2>Halbzeit</h2>
            <p class="sub">Wähle einen Boost für die 2. Hälfte</p>
            <div class="halftime-boosts" id="halftime-boosts">
              ${HALF_BOOSTS.map(
                (b) =>
                  `<button type="button" class="btn secondary halftime-boost" data-boost="${b.id}"><b>${escapeHtml(b.title)}</b><span>${escapeHtml(b.blurb)}</span></button>`,
              ).join("")}
            </div>
          </div>
        </div>
        <div class="popup-menu hidden" id="build-menu">
          <p class="popup-title" id="build-title">Gebäude</p>
          <div id="build-options" class="hidden"></div>
          <div id="upgrade-options" class="hidden">
            <button id="btn-hire-steward" class="hidden popup-buy">
              <img src="${unitIconPath("ordner", tc, 1)}" alt="">
              <span>Ordner anheuern <small>${STEWARD_HIRE_GOLD}€</small></span>
            </button>
            <button id="btn-upgrade">Upgrade <small></small></button>
          </div>
          <button class="popup-cancel" id="build-cancel">Abbrechen</button>
        </div>
        <div class="fs-gate ${needFs ? "" : "hidden"}" id="fs-gate">
          <div class="fs-gate-card">
            <h2>Vollbild nötig</h2>
            <p>Ohne Vollbild bleiben Tabs und Adressleiste — das Spielfeld ist zu klein.</p>
            <button class="btn ksc" type="button" id="fs-enter">Vollbild starten</button>
            ${
              iosHint
                ? `<p class="tiny">iPhone: Teilen-Symbol → <b>Zum Home-Bildschirm</b>, dann Derby Time von dort öffnen.</p>`
                : `<p class="tiny">Danach Handy quer halten.</p>`
            }
          </div>
        </div>
      </div>
      <nav class="rail-toolbar" aria-label="Menü-Buttons">
        <button type="button" class="rail-tool-btn" id="tool-gebaeude" title="Gebäude" aria-label="Gebäude" data-rail="build">
          <img src="${UI_ICONS.btnIconBierAmber}" alt="">
        </button>
        <button type="button" class="rail-tool-btn" id="tool-personen" title="Personen" aria-label="Personen" data-rail="person">
          <img src="${UI_ICONS.btnIconUltraBlue}" alt="">
        </button>
        <button type="button" class="rail-tool-btn" id="tool-angriff" title="Angriff" aria-label="Angriff" data-rail="attack">
          <img src="${UI_ICONS.btnIconAngriffRed}" alt="">
        </button>
      </nav>
    </div>`;

  const canvas = app.querySelector<HTMLCanvasElement>("#c")!;
  const wrap = app.querySelector<HTMLDivElement>("#game-wrap")!;
  const ctx = canvas.getContext("2d")!;
  const buildMenu = app.querySelector<HTMLDivElement>("#build-menu")!;
  const btnUpgrade = app.querySelector<HTMLButtonElement>("#btn-upgrade")!;
  const btnHire = app.querySelector<HTMLButtonElement>("#btn-hire-steward")!;
  const fsGate = app.querySelector<HTMLDivElement>("#fs-gate")!;
  const pitchHud = app.querySelector<HTMLDivElement>("#pitch-hud")!;
  const railSlot = app.querySelector<HTMLElement>("#rail-slot")!;
  const personRail = app.querySelector<HTMLElement>("#person-rail")!;
  const buildRail = app.querySelector<HTMLElement>("#build-rail")!;
  const attackRail = app.querySelector<HTMLElement>("#attack-rail")!;
  const shell = app.querySelector<HTMLElement>(".match-shell.matchday")!;
  const halfPanel = app.querySelector<HTMLDivElement>("#halftime-panel")!;
  const choreoChip = app.querySelector<HTMLDivElement>("#choreo-chip")!;

  halfPanel.querySelectorAll<HTMLButtonElement>("[data-boost]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.boost as HalfBoostId;
      m.applyHalfBoost(id);
      halfPanel.classList.add("hidden");
      sfx("ui");
    });
  });
  type RailId = "person" | "build" | "attack" | null;
  let openRail: RailId = null;
  // Pull club kit colors into blue/red rail icons (live tint)
  app.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (/-(?:blue|red)-|tribune-block-(?:blue|red)/.test(src)) {
      setLiveTintImg(img, src);
    }
  });

  const layoutHud = () => {
    const rect = wrap.getBoundingClientRect();
    if (rect.width < 32 || rect.height < 32) return;
    pitchHud.style.top = "0";
    pitchHud.style.left = "0";
    pitchHud.style.width = "100%";
    pitchHud.style.height = "auto";
  };

  const syncToolActive = () => {
    app.querySelectorAll<HTMLButtonElement>(".rail-tool-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.rail === openRail);
    });
  };

  const syncAttackRailUi = () => {
    for (const kind of ["ultras", "hooligans"] as const) {
      const ready = m.attackReadyCount(kind);
      const unitCost = kind === "ultras" ? PYRO_FIGHT_MERCH : HOOLIGAN_ORDER_BEER;
      const effect = kind === "ultras" ? "Fernkampf" : "Nahkampf";
      const prefix = kind === "ultras" ? "ultra" : "hool";
      const meta = app.querySelector(`[data-attack-meta="${kind}"]`);
      if (meta) meta.textContent = `(x${ready} bereit)`;

      const src = unitIconPath(kind, tc, m.unitTechLevel(kind));
      for (const suffix of ["one", "all"] as const) {
        setLiveTintImg(
          app.querySelector<HTMLImageElement>(`#atk-ico-${prefix}-${suffix}`),
          src,
        );
      }

      const level = m.unitTechLevel(kind);
      const payOne = app.querySelector(`#atk-pay-${prefix}-one .amt`);
      if (payOne) payOne.textContent = String(unitCost);
      const payAll = app.querySelector(`#atk-pay-${prefix}-all .amt`);
      if (payAll) payAll.textContent = String(unitCost * ready);

      const fillStats = (suffix: "one" | "all", count: number) => {
        const root = app.querySelector(`#atk-stats-${prefix}-${suffix}`);
        if (!root) return;
        const s = attackCombatStats(kind, level, count);
        const countEl = root.querySelector(".atk-count .yield-amt");
        if (countEl) countEl.textContent = `x${s.count}`;
        const hpEl = root.querySelector(".atk-hp .yield-amt");
        if (hpEl) hpEl.textContent = String(s.hp);
        const atkEl = root.querySelector(".atk-dmg .yield-amt");
        if (atkEl) atkEl.textContent = String(s.atk);
        const atkImg = root.querySelector<HTMLImageElement>(".atk-dmg img");
        if (atkImg) atkImg.src = s.atkIcon;
      };
      fillStats("one", 1);
      fillStats("all", ready);

      const oneReady =
        kind === "ultras" ? m.pyroFightReady(1) : m.hooliganOrderReady(1);
      const allReady =
        kind === "ultras" ? m.pyroFightReady("all") : m.hooliganOrderReady("all");
      const btnOne = app.querySelector<HTMLButtonElement>(
        kind === "ultras" ? "#btn-pyro-fight" : "#btn-hooligan",
      );
      const btnAll = app.querySelector<HTMLButtonElement>(
        kind === "ultras" ? "#btn-pyro-fight-all" : "#btn-hooligan-all",
      );
      if (btnOne) {
        btnOne.disabled = !oneReady;
        btnOne.classList.toggle("ready", oneReady);
        btnOne.classList.toggle("cd", !oneReady);
        const s1 = attackCombatStats(kind, level, 1);
        btnOne.title = oneReady
          ? `1× ${effect} · HP ${s1.hp} · Atk ${s1.atk} · ${unitCost}`
          : `1× braucht ${unitCost}`;
      }
      if (btnAll) {
        btnAll.disabled = !allReady;
        btnAll.classList.toggle("ready", allReady);
        btnAll.classList.toggle("cd", !allReady);
        const allCost = unitCost * ready;
        const sN = attackCombatStats(kind, level, ready);
        btnAll.title = allReady
          ? `${ready}× ${effect} · HP ${sN.hp} · Atk ${sN.atk} · ${allCost}`
          : `${ready || 0}× braucht ${allCost || unitCost}`;
      }
    }
  };

  /** Schließt Aktionsrail; schmale Icon-Toolbar rechts kommt zurück. */
  const closeActionRail = () => {
    openRail = null;
    personRail.hidden = true;
    buildRail.hidden = true;
    attackRail.hidden = true;
    railSlot.hidden = true;
    shell.classList.remove("rail-open", "build-open");
    wrap.classList.remove("placing");
    syncToolActive();
  };

  const setOpenRail = (id: RailId) => {
    if (id === openRail || id == null) {
      closeActionRail();
      return;
    }
    openRail = id;
    personRail.hidden = id !== "person";
    buildRail.hidden = id !== "build";
    attackRail.hidden = id !== "attack";
    railSlot.hidden = false;
    shell.classList.add("rail-open");
    shell.classList.toggle("build-open", id === "build");
    syncToolActive();
    if (id === "build") syncBuildingRailUi();
    if (id === "attack") syncAttackRailUi();
    applyLiveTintToDomImages(
      id === "person" ? personRail : id === "build" ? buildRail : attackRail,
    );
  };

  const closeBuildRail = () => {
    state.pendingBuild = null;
    state.buildTarget = null;
    state.buildRailMode = "place";
    m.buildMenu = null;
    m.selectedSlot = null;
    wrap.classList.remove("placing");
    if (openRail === "build") closeActionRail();
    else syncBuildingRailUi();
  };

  const buildingKindLabel = (kind: BuildingKind): string =>
    kind === "bier" ? "Bierstand" : kind === "ordner" ? "Ordnerposten" : "Fanshop";

  /** Plot gewählt → Gebäude-Rail öffnen + Target setzen (kein Toggle-Zu). */
  const openBuildRail = (mode: "place" | "upgrade", target: { blockId: number; index: number }) => {
    state.buildTarget = target;
    state.buildRailMode = mode;
    m.selectedSlot = target;
    m.buildMenu = target;
    if (openRail !== "build") {
      openRail = "build";
      personRail.hidden = true;
      buildRail.hidden = false;
      attackRail.hidden = true;
      railSlot.hidden = false;
      shell.classList.add("rail-open", "build-open");
      syncToolActive();
    }
    syncBuildingRailUi();
  };

  const syncBuildingRailUi = () => {
    const kinds: BuildingKind[] = ["bier", "fanshop", "ordner"];
    const placeRows = app.querySelector<HTMLElement>("#build-place-rows");
    const upRows = app.querySelector<HTMLElement>("#build-upgrade-rows");
    const title = app.querySelector("#build-rail-title");
    const upgradeMode = state.buildRailMode === "upgrade" && !!state.buildTarget;
    const targetSlot = state.buildTarget
      ? m.slots.find(
          (s) =>
            s.blockId === state.buildTarget!.blockId &&
            s.index === state.buildTarget!.index,
        )
      : null;

    if (placeRows) placeRows.classList.toggle("hidden", upgradeMode);
    if (upRows) {
      upRows.classList.toggle("hidden", !upgradeMode);
      upRows.setAttribute("aria-hidden", upgradeMode ? "false" : "true");
    }
    if (title) {
      title.textContent = upgradeMode
        ? targetSlot?.building
          ? `${buildingKindLabel(targetSlot.building)} Upgrade`
          : "Upgrade"
        : "Gebäude";
    }

    if (upgradeMode && upRows && targetSlot?.building) {
      const kind = targetSlot.building;
      const lv = targetSlot.level || 1;
      const next = Math.min(UPGRADE_MAX, lv + 1);
      const upCost = m.upgradeCost(targetSlot);
      const upDelta =
        lv < UPGRADE_MAX
          ? buildingYieldPerSec(kind, next) - buildingYieldPerSec(kind, lv)
          : 0;
      const curIcon = standIconPath(kind, tc, lv);
      const nextIcon = standIconPath(kind, tc, next);
      const ok = upCost != null && m.gold >= upCost;
      upRows.innerHTML = `
        <div class="upgrade-panel" data-build-upgrade-panel="${kind}">
          <p class="upgrade-title">${buildingKindLabel(kind)} · Lv${lv}${lv < UPGRADE_MAX ? ` → Lv${next}` : " (Max)"}</p>
          <div class="upgrade-preview">
            <div class="up-stage">
              <img class="up-stand-ico" id="build-up-prev-cur" src="${curIcon}" alt="">
              <span class="up-lv">Lv${lv}</span>
              ${yieldChipHtml(kind, buildingYieldPerSec(kind, lv))}
            </div>
            <span class="up-arrow" aria-hidden="true">→</span>
            <div class="up-stage">
              <img class="up-stand-ico" id="build-up-prev-next" src="${nextIcon}" alt="">
              <span class="up-lv">${lv < UPGRADE_MAX ? `Lv${next}` : "Max"}</span>
              ${
                lv < UPGRADE_MAX
                  ? yieldChipHtml(kind, upDelta, { delta: true })
                  : `<span class="yield-chip"><span class="yield-amt">—</span></span>`
              }
            </div>
          </div>
          ${railActionBtnHtml({
            kind: "upgrade",
            unitSrc: nextIcon,
            unitId: "build-up-ico-focus",
            amount: upCost != null ? upCost : "—",
            currencySrc: UI_ICONS.currencyGold,
            payId: "build-up-pay-focus",
            yieldHtml: yieldChipHtml(kind, upDelta, {
              delta: true,
              id: "build-up-yield-focus",
            }),
            btnAttrs: `data-build-up-focus="${kind}" title="Upgrade"`,
            extraClass: ok ? "ready" : "cd",
          })}
        </div>`;
      // Relative paths + live kit tint (same as Bau-Karten)
      setLiveTintImg(
        upRows.querySelector<HTMLImageElement>("#build-up-prev-cur"),
        curIcon,
      );
      setLiveTintImg(
        upRows.querySelector<HTMLImageElement>("#build-up-prev-next"),
        nextIcon,
      );
      setLiveTintImg(
        upRows.querySelector<HTMLImageElement>("#build-up-ico-focus"),
        nextIcon,
      );
      const focusBtn = upRows.querySelector<HTMLButtonElement>("[data-build-up-focus]");
      if (focusBtn) {
        focusBtn.disabled = !ok;
        focusBtn.classList.toggle("ready", ok);
        focusBtn.classList.toggle("cd", !ok);
        focusBtn.onclick = () => {
          m.buildMenu = state.buildTarget;
          m.selectedSlot = state.buildTarget;
          m.tryUpgrade();
          // Stay on this building if still upgradable
          if (state.buildTarget) {
            const s = m.slots.find(
              (x) =>
                x.blockId === state.buildTarget!.blockId &&
                x.index === state.buildTarget!.index,
            );
            if (s?.building && (s.level || 1) < UPGRADE_MAX) {
              openBuildRail("upgrade", state.buildTarget);
            } else {
              closeBuildRail();
            }
          }
          syncOverlay();
        };
      }
    } else if (upRows) {
      upRows.innerHTML = "";
    }

    for (const kind of kinds) {
      const owned = ownedBuildingSlots(m, kind);
      const meta = app.querySelector(`[data-build-meta="${kind}"]`);
      if (meta) meta.textContent = buildingMetaLabel(m, kind);

      const refLv = owned.length
        ? Math.min(...owned.map((s) => s.level || 1))
        : 1;
      const next = Math.min(UPGRADE_MAX, refLv + 1);

      setLiveTintImg(
        app.querySelector<HTMLImageElement>(`#build-ico-${kind}`),
        standIconPath(kind, tc, 1),
      );
      setLiveTintImg(
        app.querySelector<HTMLImageElement>(`#build-up-ico-${kind}`),
        standIconPath(kind, tc, next),
      );

      setPayAmt(app, `build-pay-${kind}`, BUILD_COST[kind]);
      const bauPayImg = app.querySelector<HTMLImageElement>(`#build-pay-${kind} img`);
      if (bauPayImg) bauPayImg.src = UI_ICONS.currencyGold;

      const bauYieldImg = app.querySelector<HTMLImageElement>(`#build-yield-${kind} img`);
      if (bauYieldImg) bauYieldImg.src = buildingYieldCurrency(kind);
      const bauYield = app.querySelector(`#build-yield-${kind} .yield-amt`);
      if (bauYield) {
        bauYield.textContent = `${formatYieldPerSec(buildingYieldPerSec(kind, 1))}/s`;
      }

      const upDelta =
        refLv < UPGRADE_MAX
          ? buildingYieldPerSec(kind, next) - buildingYieldPerSec(kind, refLv)
          : 0;
      const upYieldImg = app.querySelector<HTMLImageElement>(`#build-up-yield-${kind} img`);
      if (upYieldImg) upYieldImg.src = buildingYieldCurrency(kind);
      const upYield = app.querySelector(`#build-up-yield-${kind} .yield-amt`);
      if (upYield) {
        upYield.textContent =
          owned.length > 0 && refLv < UPGRADE_MAX
            ? `+${formatYieldPerSec(upDelta)}/s`
            : owned.length > 0
              ? "—"
              : `+${formatYieldPerSec(buildingYieldPerSec(kind, 2) - buildingYieldPerSec(kind, 1))}/s`;
      }

      // Allgemeines Baumenü: immer niedrigstes Gebäude dieser Art
      const slot = pickBuildingUpgradeSlot(m, kind, null, false);
      const upCost =
        slot != null ? m.upgradeCost(slot) : null;
      setPayAmt(app, `build-up-pay-${kind}`, upCost != null ? upCost : "—");

      const bauBtn = app.querySelector<HTMLButtonElement>(
        `[data-build-bau="${kind}"]`,
      );
      if (bauBtn) {
        const canBau =
          !!state.buildTarget &&
          state.buildRailMode === "place" &&
          m.gold >= BUILD_COST[kind] &&
          (() => {
            const t = state.buildTarget!;
            const s = m.slots.find(
              (x) => x.blockId === t.blockId && x.index === t.index,
            );
            return (
              !!s &&
              (!s.building || s.greyNeutral || s.owner === "neutral") &&
              m.inPlayerTerritory(t.blockId, t.index)
            );
          })();
        bauBtn.disabled = !canBau;
        bauBtn.classList.toggle("ready", canBau);
        bauBtn.classList.toggle("cd", !canBau);
        bauBtn.classList.toggle(
          "selected",
          state.pendingBuild === kind,
        );
        bauBtn.title = canBau
          ? `Bauen · ${BUILD_COST[kind]}€`
          : state.buildTarget
            ? `Bauen · braucht ${BUILD_COST[kind]}€`
            : "Zuerst freien Plot tippen";
      }

      const upBtn = app.querySelector<HTMLButtonElement>(
        `[data-build-up="${kind}"]`,
      );
      if (upBtn) {
        const ok = slot != null && upCost != null && m.gold >= upCost;
        upBtn.disabled = !ok;
        upBtn.classList.toggle("ready", ok);
        upBtn.classList.toggle("cd", !ok);
        upBtn.title =
          slot == null
            ? owned.length
              ? "Max. Stufe"
              : "Zuerst Gebäude bauen"
            : `Niedrigstes → Lv${(slot.level || 1) + 1} · ${upCost}€`;
      }
    }
  };

  const syncPendingBuildUi = () => syncBuildingRailUi();

  const resize = () => {
    const vv = window.visualViewport;
    if (vv && (isStandalone() || document.documentElement.classList.contains("is-fs"))) {
      document.documentElement.style.setProperty("--vvw", `${Math.floor(vv.width)}px`);
      document.documentElement.style.setProperty("--vvh", `${Math.floor(vv.height)}px`);
    }
    const rect = wrap.getBoundingClientRect();
    if (rect.width < 32 || rect.height < 32) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = Math.floor(rect.width);
    const cssH = Math.floor(rect.height);
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    m.width = cssW;
    m.height = cssH;
    syncTribuneLayout(cssW, cssH);
    layoutHud();
    try {
      drawMatch(ctx, m);
    } catch (err) {
      console.warn("drawMatch resize", err);
    }
  };
  resize();
  requestAnimationFrame(resize);
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => {
    setTimeout(resize, 50);
    setTimeout(resize, 250);
    setTimeout(resize, 600);
  });
  window.visualViewport?.addEventListener("resize", resize);
  window.visualViewport?.addEventListener("scroll", resize);

  const syncGate = () => {
    const show = needsFullscreenGate();
    fsGate.classList.toggle("hidden", !show);
    syncFsClass();
    resize();
  };
  const unFs = onFullscreenChange(syncGate);

  const tryFs = () => {
    void goFullscreen().then(() => {
      syncGate();
      setTimeout(resize, 100);
      setTimeout(resize, 350);
    });
  };
  app.querySelector("#fs-enter")!.addEventListener("click", tryFs);
  if (!needFs) void lockLandscape();

  const hideMenus = () => {
    m.seatMenu = null;
    m.selectedSeat = null;
    buildMenu.classList.add("hidden");
    state.pendingBuild = null;
    state.buildTarget = null;
    state.buildRailMode = "place";
    m.buildMenu = null;
    m.selectedSlot = null;
    closeActionRail();
  };

  const showBuildMenu = (blockId: number, index: number) => {
    m.seatMenu = null;
    m.selectedSeat = null;
    buildMenu.classList.add("hidden");
    const slot = m.slots.find((s) => s.blockId === blockId && s.index === index);
    const owned =
      !!slot?.building &&
      slot.owner === m.playerTeam &&
      !slot.greyNeutral;
    if (owned) {
      state.pendingBuild = null;
      openBuildRail("upgrade", { blockId, index });
      return;
    }
    if (slot && (!slot.building || slot.greyNeutral || slot.owner === "neutral")) {
      if (!m.inPlayerTerritory(blockId, index)) {
        m.toast("Frontlinie noch nicht hier — keine Fahne");
        closeBuildRail();
        return;
      }
      openBuildRail("place", { blockId, index });
      // Pending Bau-Typ + Plot → sofort bauen
      if (state.pendingBuild) {
        const kind = state.pendingBuild;
        m.buildMenu = { blockId, index };
        m.selectedSlot = m.buildMenu;
        if (m.tryBuild(kind)) {
          state.pendingBuild = null;
          state.buildTarget = null;
          m.buildMenu = null;
        }
        syncBuildingRailUi();
      }
      return;
    }
    closeBuildRail();
  };

  canvas.addEventListener("pointerdown", (e) => {
    unlockAudio();
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Kauf nur über Personen-Sidebar — Block-Klick öffnet keinen Sitz-Kauf mehr
    const hit = hitSlot(m, mx, my);
    if (hit) {
      sfx("ui");
      showBuildMenu(hit.blockId, hit.index);
      syncOverlay();
      return;
    }
    hideMenus();
  });

  const syncOverlay = () => {
    (["ultras", "normalos", "hooligans"] as FanKind[]).forEach((kind) => {
      const plus = app.querySelector<HTMLButtonElement>(
        `[data-quick-buy="${kind}"]`,
      );
      if (!plus) return;
      const ok = m.canQuickBuy(kind);
      plus.disabled = !ok;
      plus.classList.toggle("ready", ok);
      plus.classList.toggle("cd", !ok);
    });
    syncPendingBuildUi();
    syncAttackRailUi();
  };

  attackRail.querySelectorAll<HTMLButtonElement>("[data-attack-kind]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kind = btn.dataset.attackKind as "ultras" | "hooligans";
      const count = btn.dataset.attackCount === "all" ? "all" : 1;
      if (kind === "ultras") m.tryPyroFight(count);
      else m.tryHooliganOrder(count);
      syncOverlay();
    });
  });
  app.querySelector("#btn-hire-ordner")?.addEventListener("click", () => {
    m.tryHireStewardQuick();
    syncOverlay();
  });
  app.querySelectorAll<HTMLButtonElement>("[data-quick-buy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      m.tryBuyFanQuick(btn.dataset.quickBuy as FanKind);
      syncOverlay();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-unit-up]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kind = btn.dataset.unitUp as FanKind | "ordner";
      m.tryUpgradeUnit(kind);
      syncOverlay();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-build-bau]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kind = btn.dataset.buildBau as BuildingKind;
      if (!state.buildTarget) {
        state.pendingBuild = kind;
        m.toast("Zuerst einen freien Plot tippen");
        syncBuildingRailUi();
        syncOverlay();
        return;
      }
      m.buildMenu = state.buildTarget;
      m.selectedSlot = state.buildTarget;
      const ok = m.tryBuild(kind);
      if (ok) {
        state.pendingBuild = null;
        state.buildTarget = null;
        m.buildMenu = null;
      }
      syncBuildingRailUi();
      syncOverlay();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-build-up]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kind = btn.dataset.buildUp as BuildingKind;
      // Immer nur das niedrigste eigene Gebäude dieser Art upgraden
      const slot = pickBuildingUpgradeSlot(m, kind, null, false);
      if (!slot) {
        m.toast(
          ownedBuildingSlots(m, kind).length
            ? "Max. Stufe"
            : "Zuerst Gebäude bauen",
        );
        syncBuildingRailUi();
        return;
      }
      m.buildMenu = { blockId: slot.blockId, index: slot.index };
      m.selectedSlot = m.buildMenu;
      m.tryUpgrade();
      syncBuildingRailUi();
      syncOverlay();
    });
  });
  btnHire.addEventListener("click", () => {
    m.tryHireSteward();
    if (m.buildMenu) showBuildMenu(m.buildMenu.blockId, m.buildMenu.index);
    syncOverlay();
  });
  btnUpgrade.addEventListener("click", () => {
    m.tryUpgrade();
    hideMenus();
    syncOverlay();
  });
  app.querySelector("#build-cancel")!.addEventListener("click", hideMenus);
  app.querySelector("#build-rail-close")?.addEventListener("click", () => {
    closeBuildRail();
    syncOverlay();
  });
  // Personen/Angriff: Schließen über Delegation (zuverlässig trotz Rail-Swap)
  railSlot.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement | null)?.closest?.("button.rail-close");
    if (!t || !railSlot.contains(t)) return;
    if (t.id === "build-rail-close") return; // eigener Handler
    closeActionRail();
    syncOverlay();
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  });

  app.querySelectorAll<HTMLButtonElement>(".rail-tool-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.rail as RailId;
      setOpenRail(id);
      syncOverlay();
      // Layout after rail open/close changes grid
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
      });
    });
  });

  closeActionRail();
  syncBuildingRailUi();
  syncOverlay();
  state.last = performance.now();
  const loop = (now: number) => {
    if (state.screen !== "match" || !state.match) return;
    const dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;
    try {
      m.update(dt);
      drawMatch(ctx, m);
      const chAmb = m.goalChance();
      setAmbienceFromMatch({
        celebrating: m.scorePulse > 0.12,
        storming: !!m.stormBanner,
        momentumAbs: Math.abs(chAmb.momentum),
      });
      const gold = app.querySelector("#gold");
      if (gold) gold.textContent = String(Math.floor(m.gold));
      const beer = app.querySelector("#cur-beer");
      const merch = app.querySelector("#cur-merch");
      const sec = app.querySelector("#cur-sec");
      if (beer) beer.textContent = String(m.currencyPct("beer"));
      if (merch) merch.textContent = String(m.currencyPct("merch"));
      if (sec) sec.textContent = String(m.currencyPct("security"));
      const own = m.countTeamFans(m.playerTeam);
      const foe = m.countTeamFans(m.aiTeam);
      const setFb = (id: string, n: number) => {
        const el = app.querySelector(id);
        if (el) el.textContent = String(n);
      };
      setFb("#fb-u", own.ultras);
      setFb("#fb-n", own.normalos);
      setFb("#fb-h", own.hooligans);
      setFb("#fb-o", own.ordner);
      setFb("#fb-eu", foe.ultras);
      setFb("#fb-en", foe.normalos);
      setFb("#fb-eh", foe.hooligans);
      setFb("#fb-eo", foe.ordner);
      const counts: Record<FanKind | "ordner", number> = {
        normalos: own.normalos,
        ultras: own.ultras,
        hooligans: own.hooligans,
        ordner: own.ordner,
      };
      const kinds: (FanKind | "ordner")[] = [
        "normalos",
        "ultras",
        "hooligans",
        "ordner",
      ];
      for (const kind of kinds) {
        const tech = m.unitTechLevel(kind);
        const next = Math.min(UPGRADE_MAX, tech + 1);
        const meta = app.querySelector(`[data-person-meta="${kind}"]`);
        if (meta) meta.textContent = personMetaLabel(m, kind, counts[kind]);
        setLiveTintImg(
          app.querySelector<HTMLImageElement>(`#buy-ico-${kind}`),
          unitIconPath(kind === "ordner" ? "ordner" : kind, tc, tech),
        );
        setLiveTintImg(
          app.querySelector<HTMLImageElement>(`#up-ico-${kind}`),
          unitIconPath(kind === "ordner" ? "ordner" : kind, tc, next),
        );
        const buy = personBuyCost(kind);
        setPayAmt(app, `buy-pay-${kind}`, buy.amount);
        const buyPayImg = app.querySelector<HTMLImageElement>(
          `#buy-pay-${kind} img`,
        );
        if (buyPayImg) buyPayImg.src = buy.currencySrc;
        const buyYieldImg = app.querySelector<HTMLImageElement>(
          `#buy-yield-${kind} img`,
        );
        if (buyYieldImg) buyYieldImg.src = personYieldCurrency(kind);
        const buyYield = app.querySelector(`#buy-yield-${kind} .yield-amt`);
        if (buyYield) {
          buyYield.textContent = `${formatYieldPerSec(personYieldPerSec(kind, tech))}/s`;
        }
        const upYieldImg = app.querySelector<HTMLImageElement>(
          `#up-yield-${kind} img`,
        );
        if (upYieldImg) upYieldImg.src = personYieldCurrency(kind);
        const upYield = app.querySelector(`#up-yield-${kind} .yield-amt`);
        if (upYield) {
          const delta =
            tech < UPGRADE_MAX
              ? personYieldPerSec(kind, next) - personYieldPerSec(kind, tech)
              : 0;
          const sign = delta >= 0 ? "+" : "";
          upYield.textContent =
            tech < UPGRADE_MAX
              ? `${sign}${formatYieldPerSec(delta)}/s`
              : "—";
        }
        const upBtn = app.querySelector<HTMLButtonElement>(
          `[data-unit-up="${kind}"]`,
        );
        if (upBtn) {
          const cost = m.unitUpgradeCostFor(kind);
          const ok = m.canUpgradeUnit(kind);
          upBtn.disabled = !ok;
          upBtn.classList.toggle("ready", ok);
          upBtn.classList.toggle("cd", !ok);
          setPayAmt(app, `up-pay-${kind}`, cost != null ? cost : "—");
          const upPayImg = app.querySelector<HTMLImageElement>(
            `#up-pay-${kind} img`,
          );
          if (upPayImg) upPayImg.src = UI_ICONS.currencyGold;
          const bCap = m.unitUpgradeBuildingCap(kind);
          upBtn.title =
            cost == null
              ? "Max. Stufe"
              : bCap < next
                ? `Gebäude erst Lv${next} nötig`
                : `Alle ${kind} → Lv${next} · ${cost}€`;
        }
      }
      const hireBtn = app.querySelector<HTMLButtonElement>("#btn-hire-ordner");
      if (hireBtn) {
        const canHire = m.slots.some(
          (s) =>
            s.building === "ordner" &&
            s.owner === m.playerTeam &&
            !s.greyNeutral &&
            m.stewardCountAt(s) < 2 &&
            m.gold >= STEWARD_HIRE_GOLD,
        );
        hireBtn.disabled = !canHire;
        hireBtn.classList.toggle("ready", canHire);
        hireBtn.classList.toggle("cd", !canHire);
      }
      const hudScore = app.querySelector("#hud-score");
      const hudMin = app.querySelector("#hud-minute");
      if (hudScore) {
        hudScore.textContent = `${m.scoreKsc}:${m.scoreVfb}`;
        hudScore.classList.toggle("goal-pulse", m.scorePulse > 0.15);
        if (m.scorePulse > 0.15) {
          const scale = 1 + m.scorePulse * 0.55;
          (hudScore as HTMLElement).style.transform = `scale(${scale})`;
        } else {
          (hudScore as HTMLElement).style.transform = "";
        }
      }
      const crestK = app.querySelector(".hud-crest.ksc");
      const crestV = app.querySelector(".hud-crest.vfb");
      if (crestK) {
        crestK.classList.toggle(
          "goal-flash",
          m.scorePulse > 0.2 && m.lastGoalTeam === "ksc",
        );
      }
      if (crestV) {
        crestV.classList.toggle(
          "goal-flash",
          m.scorePulse > 0.2 && m.lastGoalTeam === "vfb",
        );
      }
      if (hudMin) hudMin.textContent = `${Math.floor(m.minute)}′`;
      const ch = m.goalChance();
      const momHeim = app.querySelector<HTMLElement>("#mom-heim");
      const momGast = app.querySelector<HTMLElement>("#mom-gast");
      const momKnob = app.querySelector<HTMLElement>("#mom-knob");
      const pH = Math.round(ch.pHeim * 100);
      const pG = 100 - pH;
      if (momHeim) momHeim.style.width = `${pH}%`;
      if (momGast) momGast.style.width = `${pG}%`;
      if (momKnob) {
        momKnob.style.left = `${((ch.momentum + 1) / 2) * 100}%`;
        momKnob.style.transform = "";
      }
      const lpH = app.querySelector("#mom-p-heim");
      const lpT = app.querySelector("#mom-p-tor");
      const lpG = app.querySelector("#mom-p-gast");
      if (lpH) lpH.textContent = `Kurve Heim ${m.moodHeim.toFixed(1)}`;
      if (lpT) lpT.textContent = `Momentum Heim ${Math.round(ch.pHeim * 100)}%`;
      if (lpG) lpG.textContent = `Kurve Gast ${m.moodGaeste.toFixed(1)}`;
      const bar = app.querySelector("#momentum-bar");
      if (bar) {
        bar.classList.remove("kick");
      }
      // Extra mid-screen hint strips off — only the LIVE ticker under momentum
      const banner = app.querySelector("#combat-banner");
      if (banner) banner.classList.add("hidden");
      const toast = app.querySelector("#toast");
      if (toast) toast.classList.remove("show");
      // Halbzeit boost picker
      halfPanel.classList.toggle("hidden", !m.halfTimePending);
      // Choreo status chip
      if (m.choreo && m.choreo.team === m.playerTeam) {
        choreoChip.textContent = CHOREO_LABEL[m.choreo.tier];
        choreoChip.classList.remove("hidden");
      } else {
        const ready = m.playerChoreoTier();
        if (ready) {
          choreoChip.textContent = `${CHOREO_LABEL[ready]} bereit`;
          choreoChip.classList.remove("hidden");
        } else {
          choreoChip.classList.add("hidden");
        }
      }
      if (Math.floor(now / 250) !== Math.floor((now - dt * 1000) / 250)) syncOverlay();
      if (m.result) {
        // Let storm/goal highlight finish briefly before result screen
        if (m.highlight && m.highlight.t > 0.4) {
          state.raf = requestAnimationFrame(loop);
          return;
        }
        unFs();
        setTimeout(() => go("result"), 800);
        return;
      }
    } catch (err) {
      console.warn("match loop", err);
    }
    state.raf = requestAnimationFrame(loop);
  };
  state.raf = requestAnimationFrame(loop);
}

function renderResult(): void {
  // Challenge: record 1 attempt and show head-to-head (no rematch)
  if (state.challenge && state.challengeRole) {
    finishChallengeAttempt();
    return;
  }

  const m = state.match!;
  const r = m.result!;
  const youWin = r.winner === state.settings.playerTeam;
  const playerIsKsc = state.settings.playerTeam === "ksc";
  const playerGoals = playerIsKsc ? r.score[0] : r.score[1];
  const aiGoals = playerIsKsc ? r.score[1] : r.score[0];

  const paint = (hsNotes: string[]) => {
    app.innerHTML = `
    <div class="screen menu">
      <p class="sub">${r.detail}</p>
      <h1 class="brand">${youWin ? "Sieg!" : "Niederlage"}</h1>
      <p class="sub">${teamLabel(r.winner)} · ${r.score[0]}:${r.score[1]} · ${formatMinute(m.minute)} · ${difficultyLabel(r.difficulty)}</p>
      ${hsNotes.length ? `<p class="sub hs-note">${hsNotes.join(" · ")}</p>` : ""}
      <div class="row">
        <button class="btn secondary grow" id="menu">Menü</button>
        <button class="btn secondary grow" id="hs">Highscores</button>
        <button class="btn ksc grow" id="again">Rematch</button>
      </div>
    </div>`;
    app.querySelector("#menu")!.addEventListener("click", () => go("menu"));
    app.querySelector("#hs")!.addEventListener("click", () => {
      state.highscoreDiff = r.difficulty;
      go("highscores");
    });
    app.querySelector("#again")!.addEventListener("click", () => go("setup"));
  };

  if (!youWin) {
    paint([]);
    return;
  }

  paint(["Highscore wird geprüft…"]);
  void (async () => {
    const hsNotes: string[] = [];
    const lastName = localStorage.getItem("matchday-player-name") || "Spieler";
    if (r.reason === "invade") {
      const value = blocksturmValue(r.minute);
      if (await wouldEnterTop10Shared(r.difficulty, "blocksturm", value)) {
        const name = askPlayerName(lastName);
        if (name) {
          localStorage.setItem("matchday-player-name", name);
          const playerClub = state.settings.playerClub;
          const opponentClub = state.settings.aiClub;
          const playerShort = clubCode(playerClub) || undefined;
          const opponentShort = clubCode(opponentClub) || undefined;
          const vs = matchupLabel({
            name,
            value,
            detail: "",
            at: "",
            difficulty: r.difficulty,
            team: state.settings.playerTeam,
            playerClub,
            opponentClub,
            playerShort,
            opponentShort,
          });
          const { placed, rank, shared } = await tryInsertHighscoreShared(
            r.difficulty,
            "blocksturm",
            {
              name,
              value,
              team: state.settings.playerTeam,
              playerClub,
              opponentClub,
              playerShort,
              opponentShort,
              detail: `Blocksturm in ${formatMinute(r.minute)}${vs ? ` · ${vs}` : ""} (${difficultyLabel(r.difficulty)})`,
            },
          );
          if (placed) {
            hsNotes.push(
              `Blocksturm-Highscore Platz ${rank}${shared ? " (global)" : ""}!`,
            );
          }
        }
      }
    }
    const erg = ergebnisValue(playerGoals, aiGoals);
    if (await wouldEnterTop10Shared(r.difficulty, "ergebnis", erg)) {
      const name =
        hsNotes.length > 0
          ? localStorage.getItem("matchday-player-name") || "Spieler"
          : askPlayerName(lastName);
      if (name) {
        localStorage.setItem("matchday-player-name", name);
        const playerClub = state.settings.playerClub;
        const opponentClub = state.settings.aiClub;
        const playerShort = clubCode(playerClub) || undefined;
        const opponentShort = clubCode(opponentClub) || undefined;
        const vs = matchupLabel({
          name,
          value: erg,
          detail: "",
          at: "",
          difficulty: r.difficulty,
          team: state.settings.playerTeam,
          playerClub,
          opponentClub,
          playerShort,
          opponentShort,
        });
        const { placed, rank, shared } = await tryInsertHighscoreShared(
          r.difficulty,
          "ergebnis",
          {
            name,
            value: erg,
            team: state.settings.playerTeam,
            playerClub,
            opponentClub,
            playerShort,
            opponentShort,
            detail: `${playerGoals}:${aiGoals}${vs ? ` · ${vs}` : ""} · ${formatMinute(r.minute)} (${difficultyLabel(r.difficulty)})`,
          },
        );
        if (placed) {
          hsNotes.push(
            `Ergebnis-Highscore Platz ${rank}${shared ? " (global)" : ""}!`,
          );
        }
      }
    }
    const beers = bierValue(m.beersDrunkPlayer);
    if (beers > 0 && (await wouldEnterTop10Shared(r.difficulty, "bier", beers))) {
      const name =
        hsNotes.length > 0
          ? localStorage.getItem("matchday-player-name") || "Spieler"
          : askPlayerName(lastName);
      if (name) {
        localStorage.setItem("matchday-player-name", name);
        const playerClub = state.settings.playerClub;
        const opponentClub = state.settings.aiClub;
        const playerShort = clubCode(playerClub) || undefined;
        const opponentShort = clubCode(opponentClub) || undefined;
        const vs = matchupLabel({
          name,
          value: beers,
          detail: "",
          at: "",
          difficulty: r.difficulty,
          team: state.settings.playerTeam,
          playerClub,
          opponentClub,
          playerShort,
          opponentShort,
        });
        const { placed, rank, shared } = await tryInsertHighscoreShared(
          r.difficulty,
          "bier",
          {
            name,
            value: beers,
            team: state.settings.playerTeam,
            playerClub,
            opponentClub,
            playerShort,
            opponentShort,
            detail: `${beers} Bier${vs ? ` · ${vs}` : ""} (${difficultyLabel(r.difficulty)})`,
          },
        );
        if (placed) {
          hsNotes.push(
            `Bier-Highscore Platz ${rank}${shared ? " (global)" : ""}!`,
          );
        }
      }
    }
    if (state.screen !== "result") return;
    paint(hsNotes);
  })();
}

// Deep-link: Challenge ?c=… (Einladungslink)
{
  const linked = challengeFromLocation();
  if (linked) {
    upsertChallengeHistory(linked);
    state.challenge = linked;
    state.challengeRole = null;
    clearChallengeFromUrl();
    state.screen = "challengeLobby";
  }
}

render();

/** Visual QA: `?demoStands=1` auto-starts a paused match with filled Bau-slots. */
if (new URLSearchParams(location.search).has("demoStands")) {
  state.settings = defaultSoloSettings();
  state.setup = defaultSetup();
  const demoAi = difficultyProfile(state.settings.difficulty);
  state.match = new Match({
    settings: state.settings,
    playerSetup: state.setup,
    aiSetup: { mix: { ...demoAi.aiMix } },
  });
  const m = state.match;
  m.setSpeed(0);
  m.gold = 9999;
  const plan: Array<{
    blockId: number;
    index: number;
    kind: BuildingKind;
    owner: TeamId | "neutral";
  }> = [
    { blockId: 0, index: 0, kind: "bier", owner: "ksc" },
    { blockId: 0, index: 1, kind: "fanshop", owner: "ksc" },
    { blockId: 0, index: 2, kind: "ordner", owner: "ksc" },
    { blockId: 0, index: 3, kind: "bier", owner: "ksc" },
    { blockId: 1, index: 2, kind: "bier", owner: "neutral" },
    { blockId: 1, index: 3, kind: "fanshop", owner: "neutral" },
    { blockId: 2, index: 0, kind: "bier", owner: "vfb" },
    { blockId: 2, index: 1, kind: "fanshop", owner: "vfb" },
    { blockId: 2, index: 2, kind: "ordner", owner: "vfb" },
    { blockId: 2, index: 3, kind: "bier", owner: "vfb" },
  ];
  for (const p of plan) {
    const s = m.slots.find((x) => x.blockId === p.blockId && x.index === p.index);
    if (!s) continue;
    s.building = p.kind;
    s.owner = p.owner;
    s.greyNeutral = p.owner === "neutral";
    s.level = 3;
    s.stewardCd = 9999;
    if (p.kind === "bier") s.beer = 40;
    if (p.kind === "fanshop") s.merch = 40;
    if (p.kind === "ordner") {
      s.structMaxHp = 120;
      s.structHp = 120;
    }
  }
  // QA / playtest hook (same as setup→start path)
  (window as unknown as { __match?: Match }).__match = m;
  go("match");
}
