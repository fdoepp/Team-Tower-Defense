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
import { drawMatch, hitBlitzTarget, hitSlot } from "./game/render";
import { syncTribuneLayout } from "./game/layout";
import {
  SCENE_ASSETS,
  UI_ICONS,
  applyCssIconUrls,
  preloadIcons,
  slotEmptyIconPath,
  standIconPath,
  teamColor,
  tribuneIconPath,
  unitIconPath,
} from "./game/assets";
import {
  BLOCK_STORM_COUNT,
  BLOCK_STORM_SEC,
  BUILD_COST,
  BUILD_LABEL,
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
  entryClubSecondary,
  entryClubShort,
  ergebnisValue,
  fetchSharedHighscores,
  freezeEntryClubs,
  hsMetaLabel,
  hsResultLabel,
  ALL_KINDS,
  SCORE_BOARD_TITLE,
  loadHighscores,
  loadPersonalHighscores,
  matchupLabel,
  resolveEntryClubId,
  sortBoardEntries,
  tryInsertHighscoreShared,
  wouldEnterTop10Shared,
  type HighscoreEntry,
  type HighscoreScope,
  type ScoreBoardKind,
} from "./game/highscores";
import {
  audioDebugState,
  bindAudioGestures,
  isAudioUnlocked,
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
import {
  buildLiveEmbedResult,
  clearEmbedLaunchParams,
  emitChallengeClose,
  emitChallengeCreated,
  emitChallengeResult,
  emitLiveClose,
  emitLiveCreated,
  emitLiveError,
  emitLiveResult,
  emitReady,
  installEmbedHostListener,
  materializeEmbedCreate,
  parseEmbedLaunch,
  resolveLiveMatchup,
  type LiveEmbedResult,
} from "./game/embedBridge";
import {
  createLiveHost,
  joinLiveGuest,
  loadLiveHistory,
  loadLiveStats,
  recordLiveResult,
  settingsFromLive,
  type LiveKpis,
  type LiveRole,
  type LiveSession,
} from "./game/liveChallenge";
import {
  applyPvpCmd,
  applyPvpSnap,
  exportPvpSnap,
  mirrorPvpCmdToHost,
  mirrorPvpSnapForGuest,
  type PvpCmd,
} from "./game/pvp";
import {
  BADGE_DEFS,
  badgeCount,
  evaluateMatchBadges,
  loadBadges,
  tierLabel,
  type BadgeDef,
  type BadgeUnlock,
} from "./game/badges";
import {
  applyTournamentMatchResult,
  clearTournament,
  createTournament,
  currentOpponent,
  loadTournament,
  saveTournament,
  settingsFromTournament,
  tournamentProgressLabel,
  tourneyDiffLabel,
  type TournamentDifficulty,
  type TournamentState,
} from "./game/tournament";

void preloadIcons();
bindAudioGestures();
(window as unknown as { __audio?: typeof audioDebugState }).__audio =
  audioDebugState;

function muteButtonLabel(): string {
  return isMuted() ? "Ton: aus" : "Ton: an";
}

function audioUnlockHintHtml(): string {
  if (isMuted()) {
    return `<p class="tiny fs-hint audio-hint">Ton ist aus — unter Einstellungen wieder einschalten.</p>`;
  }
  if (isAudioUnlocked()) {
    return `<p class="tiny fs-hint audio-hint on">Ton an · Stadion-Ambiente läuft</p>`;
  }
  return `<button type="button" class="btn ksc audio-unlock-btn" id="audio-unlock">Ton einschalten</button>
    <p class="tiny fs-hint audio-hint">Browser brauchen einen Tip — dann hörst du Kurve, Pfiff und Hits.</p>`;
}

function bindAudioUnlockUi(): void {
  const btn = app.querySelector("#audio-unlock");
  if (!btn) return;
  btn.addEventListener("click", () => {
    unlockAudio();
    startAmbience("menu");
    // Re-render hint state without full menu rebuild
    const wrap = btn.closest(".menu-mood-body") ?? btn.parentElement;
    const host = document.createElement("div");
    host.innerHTML = audioUnlockHintHtml();
    const oldBtn = app.querySelector("#audio-unlock");
    const oldHint = app.querySelector(".audio-hint");
    if (oldBtn && host.firstElementChild) {
      oldBtn.replaceWith(host.firstElementChild);
    }
    if (oldHint) {
      const nextHint = host.querySelector(".audio-hint");
      if (nextHint) oldHint.replaceWith(nextHint);
      else oldHint.remove();
    }
    void wrap;
  });
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

function controlTeamOf(m: Match): TeamId {
  return m.pvp ? m.localTeam : m.playerTeam;
}

function controlGoldOf(m: Match): number {
  return m.pvp && m.localTeam === "vfb" ? m.aiGold : m.gold;
}

function ownedBuildingSlots(m: Match, kind: BuildingKind) {
  const team = controlTeamOf(m);
  return m.slots.filter(
    (s) =>
      s.building === kind &&
      s.owner === team &&
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
  | "challengeResult"
  | "liveHub"
  | "liveLobby"
  | "liveResult"
  | "badges"
  | "tournamentHub"
  | "tournamentBracket";

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
  /** Live Challenge (PeerJS) session */
  live: null as LiveSession | null,
  liveMyKpi: null as LiveKpis | null,
  liveOutcome: null as "win" | "loss" | "draw" | null,
  liveWaitingOpponent: false,
  livePvpHostMix: null as FanMix | null,
  livePvpGuestMix: null as FanMix | null,
  livePvpTick: 0,
  livePvpLastAck: 0,
  /** Guided first solo after tutorial */
  guidedOnboarding: false,
  /** 60s Blitz reaction mode */
  blitz: false,
  /** Badges unlocked this result screen */
  resultBadges: [] as { id: string; def: BadgeDef; unlock: BadgeUnlock }[],
  /** Solo tournament run */
  tournament: null as TournamentState | null,
  tournamentDiff: "normal" as TournamentDifficulty,
  /** Host-app embed (async challenge / live) */
  embed: false,
  embedAutoplay: false,
  embedPreferredRole: null as "a" | "b" | null,
  embedLiveRole: null as LiveRole | null,
  /** Matchup came from host app / random — hide lobby picker */
  embedLiveLockedMatchup: false,
  embedLiveLastResult: null as LiveEmbedResult | null,
  /** Auto ready/start once for embed lobbies */
  embedLiveAutoReadySent: false,
  embedLiveAutoStarted: false,
};

function menuAtmosphereHtml(): string {
  return `<div class="menu-atmosphere" aria-hidden="true">
    <span class="menu-beam menu-beam-l"></span>
    <span class="menu-beam menu-beam-r"></span>
    <span class="menu-ember"></span>
  </div>`;
}

/** Wrap submenu content in Matchday mood shell */
function moodMenu(body: string, extraClass = ""): string {
  return `<div class="screen menu menu-mood menu-derby ${extraClass}">
    ${menuAtmosphereHtml()}
    <div class="menu-mood-body">${body}</div>
  </div>`;
}

/** Consistent page header for all mood submenus */
function moodHead(opts: {
  eyebrow?: string;
  title: string;
  lead?: string;
  extra?: string;
}): string {
  return `<header class="mood-head">
    ${opts.eyebrow ? `<p class="mood-eyebrow">${opts.eyebrow}</p>` : ""}
    <h1 class="brand">${opts.title}</h1>
    ${opts.lead ? `<p class="mood-lead">${opts.lead}</p>` : ""}
    ${opts.extra ?? ""}
  </header>`;
}

function playerNameStored(): string {
  return (localStorage.getItem("matchday-player-name") || "").trim().slice(0, 20);
}

function askLiveName(fallback = "Spieler"): string {
  if (state.embed) {
    const stored = (localStorage.getItem("matchday-player-name") || "").trim();
    const cleaned = (stored || fallback).slice(0, 20);
    localStorage.setItem("matchday-player-name", cleaned);
    return cleaned;
  }
  const cur = playerNameStored() || fallback;
  const name = window.prompt("Dein Name für Live-PvP:", cur);
  if (!name) return cur;
  const cleaned = name.trim().slice(0, 20) || cur;
  localStorage.setItem("matchday-player-name", cleaned);
  return cleaned;
}

function destroyLiveSession(): void {
  state.live?.destroy();
  state.live = null;
  state.liveMyKpi = null;
  state.liveOutcome = null;
  state.liveWaitingOpponent = false;
  state.livePvpHostMix = null;
  state.livePvpGuestMix = null;
  state.livePvpTick = 0;
  state.livePvpLastAck = 0;
  state.embedLiveAutoReadySent = false;
  state.embedLiveAutoStarted = false;
}

function kpisFromMatch(m: Match, name: string): LiveKpis {
  const r = m.result;
  const me = m.pvp ? m.localTeam : m.playerTeam;
  const scoreFor = me === "ksc" ? m.scoreKsc : m.scoreVfb;
  const scoreAgainst = me === "ksc" ? m.scoreVfb : m.scoreKsc;
  let winner: LiveKpis["winner"] = null;
  if (r) {
    winner = r.winner === me ? "player" : "ai";
  }
  const gold = controlGoldOf(m);
  const beers =
    m.pvp && m.localTeam === "vfb" ? m.beersDrunkAi : m.beersDrunkPlayer;
  return {
    name,
    scoreFor,
    scoreAgainst,
    minute: Math.floor(m.minute),
    beers,
    gold: Math.floor(gold),
    done: !!r,
    winner,
    reason: r?.reason,
    detail: r?.detail,
  };
}

/** Live PvP: guest sends mirrored cmd; host applies locally (own team via try*). */
function livePvpAction(cmd: PvpCmd, localApply: () => boolean): boolean {
  const live = state.live;
  const m = state.match;
  if (!live || !m?.pvp) return localApply();
  if (live.role === "guest") {
    live.sendInput(mirrorPvpCmdToHost(cmd));
    return true;
  }
  return localApply();
}

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

function enhanceMenuMood(): void {
  const screen = app.querySelector<HTMLElement>(".screen.menu");
  if (!screen || screen.classList.contains("menu-home")) return;
  screen.classList.add("menu-mood", "menu-derby");
  if (!screen.querySelector(".menu-atmosphere")) {
    screen.insertAdjacentHTML("afterbegin", menuAtmosphereHtml());
  }
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
  else if (state.screen === "liveHub") renderLiveHub();
  else if (state.screen === "liveLobby") renderLiveLobby();
  else if (state.screen === "liveResult") renderLiveResult();
  else if (state.screen === "badges") renderBadges();
  else if (state.screen === "tournamentHub") renderTournamentHub();
  else if (state.screen === "tournamentBracket") renderTournamentBracket();
  else renderResult();
  if (state.screen !== "match") enhanceMenuMood();
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
  if (state.embed) {
    const stored = (localStorage.getItem("matchday-player-name") || "").trim();
    return (stored || defaultName).slice(0, 20);
  }
  const raw = window.prompt("Dein Name für die Challenge:", defaultName);
  if (raw == null) return null;
  return raw.trim().slice(0, 20) || defaultName;
}

function challengeRoleOpts() {
  return {
    prefer: state.embedPreferredRole || undefined,
    ignoreDeviceLock: state.embed,
  } as const;
}

function beginChallengePlay(c: Challenge, role: "a" | "b", name: string): void {
  localStorage.setItem("matchday-player-name", name);
  state.challenge = c;
  state.challengeRole = role;
  applyChallengeSettings(c);
  state.setup = defaultSetup();
  go("setup");
}

function returnToHostApp(): void {
  if (state.live || state.embedLiveRole) {
    emitLiveClose(
      state.embedLiveLastResult,
      state.live?.code ?? null,
    );
    destroyLiveSession();
    return;
  }
  emitChallengeClose(state.challenge, state.challengeRole);
}

function applyLiveMatchupToMenu(playerClub: string, aiClub: string, difficulty: typeof state.menuDifficulty): void {
  state.menuPlayerClub = playerClub as ClubId;
  state.menuAiClub = aiClub as ClubId;
  state.menuDifficulty = difficulty;
  state.teamScope = getClub(playerClub).kind === "national" ? "nations" : "clubs";
  state.pickMode = "free";
  syncMenuBrandingPreview();
  setClubSoundIdentity(playerClub, aiClub);
}

async function bootstrapLiveEmbed(launch: ReturnType<typeof parseEmbedLaunch>): Promise<void> {
  const name =
    launch.playerName ||
    localStorage.getItem("matchday-player-name") ||
    (launch.liveRole === "guest" ? "Gast" : "Host");
  localStorage.setItem("matchday-player-name", name.slice(0, 20));
  try {
    if (launch.liveRole === "guest") {
      if (!launch.liveCode) {
        throw new Error("Live-Raumcode fehlt (live=CODE)");
      }
      const session = await joinLiveGuest(launch.liveCode, name);
      state.live = session;
      bindLiveSession(session);
      emitReady({
        mode: "live",
        liveCode: session.code,
        liveRole: "guest",
      });
      go("liveLobby");
      return;
    }

    const matchup = resolveLiveMatchup(launch);
    applyLiveMatchupToMenu(
      matchup.playerClub,
      matchup.aiClub,
      launch.difficulty,
    );
    state.embedLiveLockedMatchup = true;
    const session = await createLiveHost(name, launch.liveCode || undefined);
    const config = {
      playerClub: matchup.playerClub,
      aiClub: matchup.aiClub,
      difficulty: launch.difficulty,
      hostName: name,
      pvp: true as const,
    };
    session.setConfig(config);
    state.live = session;
    bindLiveSession(session);
    emitLiveCreated({
      code: session.code,
      role: "host",
      config,
      matchup,
    });
    emitReady({
      mode: "live",
      liveCode: session.code,
      liveRole: "host",
    });
    go("liveLobby");
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Live-Embed fehlgeschlagen";
    emitLiveError(message);
    if (state.embed) {
      app.innerHTML = moodMenu(`
        ${moodHead({
          eyebrow: "Live · App",
          title: "Verbindung fehlgeschlagen",
          lead: escapeHtml(message),
        })}
        <button class="btn ksc" id="live-embed-fail-back" type="button">Zurück zur App</button>
      `);
      app.querySelector("#live-embed-fail-back")?.addEventListener("click", () => {
        returnToHostApp();
      });
      return;
    }
    window.alert(message);
    go("menu");
  }
}

function maybeEmbedLiveAutoFlow(): void {
  const live = state.live;
  if (!state.embed || !live || !state.embedAutoplay) return;

  if (live.connected && !live.localReady && !state.embedLiveAutoReadySent) {
    state.embedLiveAutoReadySent = true;
    live.sendReady(true, defaultSetup().mix);
  }

  if (
    live.role === "host" &&
    live.connected &&
    live.localReady &&
    live.remoteReady &&
    !state.embedLiveAutoStarted
  ) {
    state.embedLiveAutoStarted = true;
    const clubs = {
      playerClub: live.config?.playerClub || state.menuPlayerClub,
      aiClub: live.config?.aiClub || state.menuAiClub,
    };
    live.setConfig({
      playerClub: clubs.playerClub,
      aiClub: clubs.aiClub,
      difficulty: live.config?.difficulty || state.menuDifficulty,
      hostName: live.localName,
      guestName: live.remoteName || undefined,
      pvp: true,
    });
    const mix = defaultSetup().mix;
    const guestMix = live.remoteMix ?? mix;
    window.setTimeout(() => {
      if (!state.live || state.screen !== "liveLobby") return;
      state.live.sendStart(mix, guestMix);
    }, 600);
  }
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
          <p class="menu-group-label">Solo</p>
          <button class="btn ksc menu-cta" id="solo">Solo vs KI</button>
          <button class="btn secondary" id="blitz">Blitz · 60s</button>
          <button class="btn secondary" id="tournament">Solo-Turnier</button>
        </div>
        <div class="menu-group">
          <p class="menu-group-label">Multiplayer</p>
          <button class="btn secondary" id="live">Live-PvP</button>
          <button class="btn secondary" id="challenge">Challenge</button>
        </div>
        <div class="menu-group">
          <p class="menu-group-label">Allgemein</p>
          <div class="menu-util-row">
            <button class="btn secondary util" id="badges">Badges</button>
            <button class="btn secondary util" id="highscores">Highscores</button>
          </div>
          <details class="menu-settings">
            <summary class="btn secondary menu-settings-summary">Einstellungen</summary>
            <div class="menu-util-row">
              <button class="btn secondary util" id="mute-audio">${muteButtonLabel()}</button>
              <button class="btn secondary util" id="fs-menu">Vollbild</button>
            </div>
          </details>
        </div>
      </div>
      ${
        iosHint
          ? `<p class="tiny fs-hint">iPhone: Teilen → <b>Zum Home-Bildschirm</b> — dann ohne Tabs/Adressleiste.</p>`
          : `<p class="tiny fs-hint">Tipp: Vollbild für volle Spielfläche (ohne Browser-Leisten).</p>`
      }
      ${audioUnlockHintHtml()}
    </div>`;
  bindAudioUnlockUi();
  app.querySelector("#fs-menu")!.addEventListener("click", () => {
    unlockAudio();
    startAmbience("menu");
    void goFullscreen();
  });
  app.querySelector("#mute-audio")!.addEventListener("click", () => {
    unlockAudio();
    toggleMuted();
    if (!isMuted()) {
      startAmbience("menu");
      sfx("ui");
    }
    (app.querySelector("#mute-audio") as HTMLButtonElement).textContent =
      muteButtonLabel();
    // Refresh hint under menu
    const oldHint = app.querySelector(".audio-unlock-btn, .audio-hint");
    if (oldHint) {
      const host = document.createElement("div");
      host.innerHTML = audioUnlockHintHtml();
      oldHint.replaceWith(...Array.from(host.childNodes));
      bindAudioUnlockUi();
    }
  });
  app.querySelector("#highscores")!.addEventListener("click", () => {
    sfx("ui");
    state.highscoreDiff = state.menuDifficulty;
    go("highscores");
  });
  app.querySelector("#badges")!.addEventListener("click", () => {
    sfx("ui");
    go("badges");
  });
  app.querySelector("#tournament")!.addEventListener("click", () => {
    unlockAudio();
    sfx("ui");
    state.tournament = loadTournament();
    go("tournamentHub");
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
  app.querySelector("#live")!.addEventListener("click", () => {
    unlockAudio();
    sfx("ui");
    destroyLiveSession();
    go("liveHub");
  });
  app.querySelector("#solo")!.addEventListener("click", () => {
    unlockAudio();
    sfx("ui");
    startAmbience("menu");
    void goFullscreen();
    state.challenge = null;
    state.challengeRole = null;
    state.blitz = false;
    go("soloMatchup");
  });
  app.querySelector("#blitz")!.addEventListener("click", () => {
    unlockAudio();
    sfx("ui");
    startAmbience("menu");
    void goFullscreen();
    state.challenge = null;
    state.challengeRole = null;
    state.blitz = true;
    go("soloMatchup");
  });
  // Any menu click primes audio + soft bed (autoplay policy)
  app.querySelectorAll("button").forEach((b) => {
    b.addEventListener(
      "pointerdown",
      () => {
        unlockAudio();
        if (!isMuted()) startAmbience("menu");
      },
      { once: false, capture: true },
    );
  });
}

/** After Solo: choose matchup, difficulty, AI character → Aufstellung */
function renderSoloMatchup(): void {
  syncMenuBrandingPreview();
  const brand = currentBranding();
  const derby = findDerby(state.menuDerbyId);
  const nationFix = findNationalFixture(state.menuNationalFixtureId);
  const matchLine = `${brand.heim.short} vs ${brand.gast.short}`;
  const blitz = state.blitz;
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

  app.innerHTML = moodMenu(`
      ${moodHead({
        eyebrow: blitz ? "Blitz · 60 Sekunden" : "Solo vs KI",
        title: blitz ? "Blitz-Matchup" : "Matchup",
        lead: escapeHtml(
          blitz
            ? `${matchLine} · Tippen = Stimmung / Ressourcen / Kampf`
            : matchLine,
        ),
        extra: `<p class="tiny derby-hint">${escapeHtml(
          blitz
            ? `${derbyHint} · Start Lvl 3 · Ordner unbegrenzt`
            : derbyHint,
        )}</p>
        <div class="kit-preview" aria-hidden="true">
          ${kitSwatchHtml(brand.heim.id)}
          <span class="kit-vs">vs</span>
          ${kitSwatchHtml(brand.gast.id)}
        </div>`,
      })}
      ${matchupPickHtml({ showDiff: true, showBehavior: true })}
      <div class="row mood-actions">
        <button class="btn secondary grow" id="solo-back" type="button">Menü</button>
        <button class="btn ksc grow" id="solo-next" type="button">${
          blitz ? "Anpfiff" : "Weiter"
        }</button>
      </div>
    `);

  bindMatchupPickHandlers(() => renderSoloMatchup());
  app.querySelector("#solo-back")!.addEventListener("click", () => {
    sfx("ui");
    state.blitz = false;
    go("menu");
  });
  app.querySelector("#solo-next")!.addEventListener("click", () => {
    unlockAudio();
    sfx("ui");
    applySoloSettingsFromMenu();
    state.setup = defaultSetup();
    if (state.blitz) {
      startBlitzMatch();
      return;
    }
    go("setup");
  });
}

function startBlitzMatch(): void {
  unlockAudio();
  sfx("whistle");
  startAmbience("match");
  const aiProf = difficultyProfile(state.settings.difficulty);
  state.match = new Match({
    settings: state.settings,
    playerSetup: state.setup,
    aiSetup: { mix: { ...aiProf.aiMix } },
    blitz: true,
  });
  state.resultBadges = [];
  (window as unknown as { __match?: Match }).__match = state.match;
  go("match");
  void goFullscreen();
}

type TutStep = {
  id: string;
  title: string;
  lead: string;
  body: string;
  diagram: string;
};

function tutImg(src: string, cls = "tut-ico"): string {
  return `<img class="${cls}" src="${src}" alt="" data-tut-tint="1">`;
}

function tutCur(src: string, label: string): string {
  return `<span class="tut-cur">${tutImg(src, "tut-cur-ico")}<span>${label}</span></span>`;
}

function tutRailDemo(active: "build" | "person" | "attack" | null = null): string {
  const items: { id: "build" | "person" | "attack"; src: string; label: string }[] = [
    { id: "build", src: UI_ICONS.btnIconBierAmber, label: "Gebäude" },
    { id: "person", src: UI_ICONS.btnIconUltraBlue, label: "Personen" },
    { id: "attack", src: UI_ICONS.btnIconAngriffRed, label: "Angriff" },
  ];
  return `<div class="tut-rail-demo" aria-hidden="true">
    ${items
      .map(
        (it) => `<div class="tut-rail-btn ${active === it.id ? "on" : ""}">
        ${tutImg(it.src, "tut-rail-ico")}
        <span>${it.label}</span>
      </div>`,
      )
      .join("")}
  </div>`;
}

function tutUnitCard(
  kind: FanKind | "ordner",
  opts: { title: string; cost: string; stats: string; role: string },
): string {
  const src = unitIconPath(kind, "blue", 1);
  return `<article class="tut-unit-card">
    ${tutImg(src, "tut-unit-ico")}
    <div class="tut-unit-meta">
      <b>${opts.title}</b>
      <p class="tut-unit-cost">${opts.cost}</p>
      <p class="tut-unit-stats">${opts.stats}</p>
      <p class="tut-unit-role">${opts.role}</p>
    </div>
  </article>`;
}

function tutBuildCard(
  kind: BuildingKind,
  opts: { title: string; cost: string; makes: string; unlocks: string },
): string {
  const src = standIconPath(kind, "blue", 1);
  return `<article class="tut-build-card">
    ${tutImg(src, "tut-build-ico")}
    <div class="tut-unit-meta">
      <b>${opts.title}</b>
      <p class="tut-unit-cost">${opts.cost}</p>
      <p class="tut-unit-stats">${opts.makes}</p>
      <p class="tut-unit-role">${opts.unlocks}</p>
    </div>
  </article>`;
}

function tutorialSteps(): TutStep[] {
  const cBlue = "blue" as const;
  const slotSrc = slotEmptyIconPath("blue");
  const tribHeim = tribuneIconPath(0);
  const tribMid = tribuneIconPath(1);
  const tribGast = tribuneIconPath(2);
  const beerCur = UI_ICONS.currencyBier;
  const merchCur = UI_ICONS.currencyFanartikel;
  const secCur = UI_ICONS.currencySicherheit;
  const goldCur = UI_ICONS.currencyGold;
  const stormIco = UI_ICONS.iconAngriffBlocksturm;
  const pyroIco = UI_ICONS.iconAngriffPyro;
  const fistIco = UI_ICONS.iconAngriffFaust;
  const upPerson = UI_ICONS.btnIconUpgradePerson;
  const upBuild = UI_ICONS.btnIconUpgradeBuilding;
  const buyGreen = UI_ICONS.btnKaufenGreen;
  const sendGreen = UI_ICONS.btnSendenGreen;

  return [
    {
      id: "wins",
      title: "Zwei Wege zum Sieg",
      lead: "Entweder mehr Tore — oder den Gästeblock stürmen.",
      body: `<div class="tut-win-grid">
        <article class="tut-win-card">
          <header>${tutImg(UI_ICONS.moodPlus, "tut-win-ico")}<b>1 · Tor-Sieg</b></header>
          <ul class="tut-points">
            <li>Fans sitzen in deiner Kurve und pushen <b>Stimmung / Momentum</b>.</li>
            <li>Der Balken wandert zur Gegnerseite → <b>Tor</b>.</li>
            <li>Nach 90′ (ggf. Verlängerung/Elfmeter) gewinnt, wer mehr Tore hat.</li>
          </ul>
        </article>
        <article class="tut-win-card storm">
          <header>${tutImg(stormIco, "tut-win-ico")}<b>2 · Blocksturm</b></header>
          <ul class="tut-points">
            <li>Sende Ultras/Hools in den Gang und in den <b>Gästeblock</b>.</li>
            <li>Mindestens <b>${BLOCK_STORM_COUNT} Angreifer</b> im Block halten.</li>
            <li>Banner ≈ <b>${BLOCK_STORM_SEC} s</b> halten → sofortiger Sieg (auch vor 90′).</li>
          </ul>
        </article>
      </div>
      <p class="tut-foot">Du spielst immer die <b>Heimkurve links</b>. Beides baut auf denselben Tools: Gebäude → Personen → Angriff.</p>`,
      diagram: `<div class="tut-diagram tut-board-wide" aria-hidden="true">
        ${tutImg(tribHeim, "tut-trib")}
        <div class="tut-gang"><span>Gang</span></div>
        ${tutImg(tribMid, "tut-trib mid")}
        <div class="tut-gang"><span>→</span></div>
        ${tutImg(tribGast, "tut-trib")}
      </div>`,
    },
    {
      id: "board",
      title: "Gesamtsicht",
      lead: "Drei Blöcke, Gang dazwischen, Bauplätze vor den Kurven.",
      body: `<ul class="tut-points">
        <li>${tutImg(tribHeim, "tut-inline")} <b>Heim (blau)</b> — deine Kurve, Start für Fans & Stände.</li>
        <li>${tutImg(tribMid, "tut-inline")} <b>Neutral (grau)</b> — Mitte mit Ordnerposten; kämpfen & erobern.</li>
        <li>${tutImg(tribGast, "tut-inline")} <b>Gäste (rot)</b> — Gegnerblock; Ziel für Blocksturm.</li>
        <li>${tutImg(slotSrc, "tut-inline")} <b>Bauplatz</b> — freier Plot hinter deiner Frontlinie tippen.</li>
      </ul>
      <p class="tut-foot">Unten rechts die drei Menü-Buttons — alle Erklärungen zeigen genau diese Icons.</p>`,
      diagram: `<div class="tut-diagram tut-board-stack" aria-hidden="true">
        <div class="tut-board-row">
          ${tutImg(tribHeim, "tut-trib")}
          ${tutImg(SCENE_ASSETS.stadiumFloodlightDerby, "tut-pitch-thumb")}
          ${tutImg(tribGast, "tut-trib")}
        </div>
        <div class="tut-slot-row">
          ${tutImg(slotSrc, "tut-slot")}
          ${tutImg(slotEmptyIconPath("grey"), "tut-slot")}
          ${tutImg(slotEmptyIconPath("red"), "tut-slot")}
          <span class="tut-slot-cap">Bauplätze</span>
        </div>
        ${tutRailDemo(null)}
      </div>`,
    },
    {
      id: "build",
      title: "Gebäude bauen",
      lead: "Button Gebäude → Bauplatz tippen → Stand wählen.",
      body: `${tutRailDemo("build")}
      <div class="tut-flow" aria-hidden="true">
        <div class="tut-flow-step">${tutImg(UI_ICONS.btnIconBierAmber)}<span>Gebäude</span></div>
        <div class="tut-arrow"></div>
        <div class="tut-flow-step">${tutImg(slotSrc)}<span>Bauplatz</span></div>
        <div class="tut-arrow"></div>
        <div class="tut-flow-step">${tutImg(UI_ICONS.btnBauenAmber)}<span>Bauen</span></div>
      </div>
      <div class="tut-card-grid">
        ${tutBuildCard("bier", {
          title: "Bierstand",
          cost: `${tutCur(goldCur, `${BUILD_COST.bier}€`)}`,
          makes: `Produziert ${tutCur(beerCur, "Bier")} — Treibstoff für Hooligans.`,
          unlocks: `Schaltet Hooligan-Upgrades frei (Gebäude-Lv = Max-Personen-Lv).`,
        })}
        ${tutBuildCard("fanshop", {
          title: "Fanshop",
          cost: `${tutCur(goldCur, `${BUILD_COST.fanshop}€`)}`,
          makes: `Produziert ${tutCur(merchCur, "Fanartikel")} — für Ultras / Pyro.`,
          unlocks: `Schaltet Ultra-Upgrades frei.`,
        })}
        ${tutBuildCard("ordner", {
          title: "Ordnerposten",
          cost: `${tutCur(goldCur, `${BUILD_COST.ordner}€`)}`,
          makes: `Produziert ${tutCur(secCur, "Sicherheit")} — Fans kaufen; Ordner heilen.`,
          unlocks: `Schaltet Fan- & Ordner-Upgrades frei. Posten hat eigene HP.`,
        })}
      </div>
      <p class="tut-foot">Nur Plots <b>hinter deiner Frontlinie</b> (Fahnen-Grenze). Graue Neutrals kannst du später übernehmen.</p>`,
      diagram: "",
    },
    {
      id: "buildUpgrade",
      title: "Gebäude verbessern",
      lead: "Eigenen Stand tippen → Upgrade-Button (Lila).",
      body: `<div class="tut-flow" aria-hidden="true">
        ${tutImg(standIconPath("bier", cBlue, 1), "tut-build-ico")}
        <div class="tut-arrow"></div>
        ${tutImg(upBuild, "tut-btn-ico")}
        <div class="tut-arrow"></div>
        ${tutImg(standIconPath("bier", cBlue, 3), "tut-build-ico")}
        <div class="tut-lvl-row">
          <span class="tut-lvl">Lv1</span><span class="tut-lvl">Lv2</span><span class="tut-lvl on">Lv3</span><span class="tut-lvl">…</span><span class="tut-lvl">Lv5</span>
        </div>
      </div>
      <ul class="tut-points">
        <li>Tippe einen <b>eigenen Stand</b> an — die Gebäude-Rail zeigt Upgrade.</li>
        <li>Kostet ${tutCur(goldCur, "Gold")}; höhere Lv = mehr Produktion.</li>
        <li>Max <b>Lv${UPGRADE_MAX}</b>. Personen dürfen nur so hoch wie das passende Gebäude.</li>
        <li>Beispiel: ${BUILD_LABEL.bier} Lv3 → Hooligans bis Lv3.</li>
      </ul>`,
      diagram: "",
    },
    {
      id: "fans",
      title: "Personen & Stats",
      lead: "Button Personen — jede Figur zahlt auf etwas anderes ein.",
      body: `${tutRailDemo("person")}
      <div class="tut-card-grid tut-units">
        ${tutUnitCard("normalos", {
          title: "Fan",
          cost: `Kauf: ${tutCur(secCur, `${BUY_COST.normalos.security}`)} · Button ${tutImg(buyGreen, "tut-mini-btn")}`,
          stats: `Kaum Angriff · hohe Stimmung im Block · geht zum Fanshop (nicht Bier).`,
          role: `Treibt <b>Momentum / Tore</b>. Bleibt meist sitzen — dein Tor-Motor.`,
        })}
        ${tutUnitCard("ultras", {
          title: "Ultra",
          cost: `Kauf: ${tutCur(merchCur, `${BUY_COST.ultras.merch}`)} · Senden: ${tutCur(merchCur, `${PYRO_FIGHT_MERCH}`)}`,
          stats: `Mittlere HP · Pyro-Fernkampf · mäßiger Jubel · schnell im Gang.`,
          role: `Angriff & Blocksturm. Mehr Ultras → stärkere <b>Choreo</b> (5/10/20/30).`,
        })}
        ${tutUnitCard("hooligans", {
          title: "Hooligan",
          cost: `Kauf: ${tutCur(beerCur, `${BUY_COST.hooligans.beer}`)} · Senden: ${tutCur(beerCur, `${HOOLIGAN_ORDER_BEER}`)}`,
          stats: `Hohe HP & Nahkampf · trinkt viel Bier · wenig Stimmung im Block.`,
          role: `Tank / Faust-Kampf im Gang. Stark für Blocksturm-Druck.`,
        })}
        ${tutUnitCard("ordner", {
          title: "Ordner",
          cost: `Anheuern: ${tutCur(goldCur, `${STEWARD_HIRE_GOLD}€`)} am Posten`,
          stats: `Kein Kauf über Personen-Rail · heilt Verbündete · stark vs Ultras · patrouilliert.`,
          role: `Verteidigung um den Posten (Radius wächst mit Lv). Kostet laufend etwas Gold.`,
        })}
      </div>
      <p class="tut-foot">Grob: <b>Fans = Tore</b>, <b>Ultras/Hools = Gang & Sturm</b>, <b>Ordner = halten</b>.</p>`,
      diagram: "",
    },
    {
      id: "fanUpgrade",
      title: "Personen verbessern",
      lead: "Neben Kaufen: Upgrade — Gebäude muss mithalten.",
      body: `<div class="tut-flow tut-fan-up-flow" aria-hidden="true">
        <div class="tut-pair">${tutImg(standIconPath("ordner", cBlue, 2))}${tutImg(unitIconPath("normalos", cBlue, 2))}<span>Fan ← Ordner</span></div>
        <div class="tut-pair">${tutImg(standIconPath("fanshop", cBlue, 2))}${tutImg(unitIconPath("ultras", cBlue, 2))}<span>Ultra ← Shop</span></div>
        <div class="tut-pair">${tutImg(standIconPath("bier", cBlue, 2))}${tutImg(unitIconPath("hooligans", cBlue, 2))}<span>Hool ← Bier</span></div>
        ${tutImg(upPerson, "tut-btn-ico")}
      </div>
      <ul class="tut-points">
        <li>Personen-Rail → ${tutImg(upPerson, "tut-mini-btn")} <b>Upgrade</b> (Tech Lv1–Lv${UPGRADE_MAX}).</li>
        <li>Kostet ${tutCur(goldCur, "Gold")}; alle lebenden + neuen Einheiten dieser Art steigen.</li>
        <li>Gebäude-Level ist die Decke: Ultra Lv4 nur mit Fanshop Lv4+.</li>
        <li>Höheres Lv = mehr HP/Kampf (Kämpfer) bzw. mehr Ertrag/Stimmung (Fans).</li>
      </ul>`,
      diagram: "",
    },
    {
      id: "fight",
      title: "Angriff & Gang",
      lead: "Button Angriff — Ultras (Pyro) oder Hools (Nahkampf) senden.",
      body: `${tutRailDemo("attack")}
      <div class="tut-card-grid tut-atk">
        <article class="tut-unit-card">
          ${tutImg(pyroIco, "tut-unit-ico")}
          <div class="tut-unit-meta">
            <b>Ultra → Pyro</b>
            <p class="tut-unit-stats">Button ${tutImg(sendGreen, "tut-mini-btn")} · kostet ${tutCur(merchCur, "Fanartikel")}</p>
            <p class="tut-unit-role">Fernkampf im Gang, dann ggf. in den Block.</p>
          </div>
        </article>
        <article class="tut-unit-card">
          ${tutImg(fistIco, "tut-unit-ico")}
          <div class="tut-unit-meta">
            <b>Hool → Faust</b>
            <p class="tut-unit-stats">Button ${tutImg(sendGreen, "tut-mini-btn")} · kostet ${tutCur(beerCur, "Bier")}</p>
            <p class="tut-unit-role">Nahkampf, hält Druck und stürmt den Block.</p>
          </div>
        </article>
      </div>
      <ul class="tut-points">
        <li>Figur geht über den <b>Ausgang</b> in den Gang, kämpft um Raum.</li>
        <li>1× oder <b>alle</b> senden — Kosten skalieren mit der Anzahl.</li>
        <li>LIVE-Ticker unter dem Momentum-Balken zeigt Kampfhinweise.</li>
      </ul>`,
      diagram: `<div class="tut-diagram tut-fight" aria-hidden="true">
        ${tutImg(tribHeim, "tut-trib sm")}
        <div class="tut-path">
          ${tutImg(unitIconPath("ultras", cBlue, 1), "tut-fight-unit")}
          <span class="tut-dot"></span><span class="tut-dot"></span><span class="tut-dot on"></span>
          ${tutImg(unitIconPath("hooligans", cBlue, 1), "tut-fight-unit")}
        </div>
        ${tutImg(tribGast, "tut-trib sm")}
      </div>`,
    },
    {
      id: "goals",
      title: "Tore durch Momentum",
      lead: "Fans in der Kurve schieben den Balken — das ist Siegweg 1.",
      body: `<ul class="tut-points">
        <li>${tutImg(unitIconPath("normalos", cBlue, 1), "tut-inline")} Fans im Heimblock wiegen am stärksten für Momentum.</li>
        <li>Ultras/Hools im Block helfen weniger — im Gang zählen sie für Sturm.</li>
        <li>Balken voll in die Gegnerhälfte = <b>Tor</b> → Feier, Kurvenjubel.</li>
        <li>Bei 45′ wählst du einen <b>Halbzeit-Boost</b> (Gold / Stimmung / Vorrat).</li>
      </ul>
      <p class="tut-foot">Wer zur Schluss-Pfeife mehr Tore hat, gewinnt — außer der Blocksturm kam früher.</p>`,
      diagram: `<div class="tut-diagram tut-mom" aria-hidden="true">
        <div class="tut-mom-bar"><i style="width:86%"></i><span class="tut-mom-ball">Tor</span></div>
        <p class="tut-mom-cap">${tutImg(unitIconPath("normalos", cBlue, 1), "tut-inline")} Kurve voll → Torchance steigt</p>
      </div>`,
    },
    {
      id: "storm",
      title: "Blocksturm",
      lead: `Siegweg 2 — ${BLOCK_STORM_COUNT} Angreifer, ${BLOCK_STORM_SEC} s Banner.`,
      body: `<ul class="tut-points">
        <li>${tutImg(stormIco, "tut-inline")} Ultras/Hools besetzen den <b>Gästeblock</b> (nicht nur den Gang).</li>
        <li>Ab ${BLOCK_STORM_COUNT} Angreifern erscheint „Hier regiert …“.</li>
        <li>Banner ${BLOCK_STORM_SEC} s halten, ohne unter ${BLOCK_STORM_COUNT} zu fallen → <b>Sofort-Sieg</b>.</li>
        <li>Frühe Stürme zählen für Highscores / Badges.</li>
      </ul>`,
      diagram: `<div class="tut-diagram tut-storm" aria-hidden="true">
        ${tutImg(stormIco, "tut-storm-ico")}
        <div class="tut-banner">Hier regiert …</div>
        <div class="tut-timer">${BLOCK_STORM_SEC} s</div>
        <div class="tut-storm-units">
          ${tutImg(unitIconPath("ultras", cBlue, 1), "tut-fight-unit")}
          ${tutImg(unitIconPath("hooligans", cBlue, 1), "tut-fight-unit")}
          ${tutImg(unitIconPath("ultras", cBlue, 2), "tut-fight-unit")}
          ${tutImg(unitIconPath("hooligans", cBlue, 2), "tut-fight-unit")}
        </div>
      </div>`,
    },
    {
      id: "path",
      title: "Dein erster Weg",
      lead: "Vier Meilensteine — dann kickst du selbst (Einfach).",
      body: `<ul class="tut-points tut-miles">
        <li><span class="tut-n">1</span>${tutImg(UI_ICONS.btnIconBierAmber, "tut-mile-ico")} Gebäude bauen (Bier / Shop / Ordner)</li>
        <li><span class="tut-n">2</span>${tutImg(UI_ICONS.btnIconUltraBlue, "tut-mile-ico")} Person holen (Fan / Ultra / Hool)</li>
        <li><span class="tut-n">3</span>${tutImg(UI_ICONS.btnIconAngriffRed, "tut-mile-ico")} In den Gang senden</li>
        <li><span class="tut-n">4</span>${tutImg(stormIco, "tut-mile-ico")} Tor-Moment oder Blocksturm</li>
      </ul>
      <p class="tut-foot">Tipp: Stände und Personen mit Gold upgraden. Geführtes Solo auf <b>Einfach</b> zeigt Toasts an den Meilensteinen. Badges: Bronze → Silber → Gold.</p>`,
      diagram: tutRailDemo(null),
    },
  ];
}

function startGuidedSolo(): void {
  state.guidedOnboarding = true;
  state.challenge = null;
  state.challengeRole = null;
  state.tournament = null;
  state.live = null;
  state.menuDifficulty = "easy";
  state.menuBehavior = "patient";
  applySoloSettingsFromMenu();
  state.settings = {
    ...state.settings,
    difficulty: "easy",
    behavior: "patient",
  };
  state.setup = defaultSetup();
  go("setup");
}

function renderTutorial(stepIndex = 0): void {
  const steps = tutorialSteps();
  const i = Math.max(0, Math.min(steps.length - 1, stepIndex));
  const step = steps[i]!;
  const last = i >= steps.length - 1;
  app.innerHTML = moodMenu(
    `
      ${moodHead({
        eyebrow: `Tutorial · Schritt ${i + 1} / ${steps.length}`,
        title: escapeHtml(step.title),
        lead: escapeHtml(step.lead),
      })}
      <div class="card stack tutorial-card">
        ${step.diagram ? step.diagram : ""}
        <div class="tut-body">${step.body}</div>
        <div class="tut-dots" aria-hidden="true">
          ${steps.map((_, di) => `<i class="${di === i ? "on" : ""}"></i>`).join("")}
        </div>
      </div>
      <div class="row mood-actions">
        <button class="btn secondary grow" id="tut-back" type="button">${i === 0 ? "Menü" : "Zurück"}</button>
        <button class="btn ksc grow" id="tut-next" type="button">${last ? "Erstes Solo (Einfach)" : "Weiter"}</button>
      </div>
      ${last ? `<button class="btn secondary" id="tut-skip" type="button">Nur Menü</button>` : ""}
    `,
    "tutorial-screen tut-guided",
  );
  app.querySelectorAll<HTMLImageElement>("img[data-tut-tint]").forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (/-(?:blue|red|grey)-|tribune-block-(?:blue|red|grey)/.test(src)) {
      setLiveTintImg(img, src);
    }
  });
  app.querySelector("#tut-back")!.addEventListener("click", () => {
    sfx("ui");
    if (i === 0) go("menu");
    else renderTutorial(i - 1);
  });
  app.querySelector("#tut-next")!.addEventListener("click", () => {
    unlockAudio();
    sfx("ui");
    if (last) startGuidedSolo();
    else renderTutorial(i + 1);
  });
  app.querySelector("#tut-skip")?.addEventListener("click", () => {
    sfx("ui");
    go("menu");
  });
}

/**
 * Highscore matchup row: own club bordered in primary, result centered,
 * opponent opposite — frozen entry branding only (never live menu kits).
 */
function hsMatchupRow(
  e: HighscoreEntry,
  kind: ScoreBoardKind,
  rank: number,
): string {
  const frozen = freezeEntryClubs(e);
  const ownId = resolveEntryClubId(frozen.playerClub, frozen.playerShort);
  const oppId = resolveEntryClubId(frozen.opponentClub, frozen.opponentShort);
  const ownShort = entryClubShort(
    frozen.playerClub,
    frozen.team,
    frozen.playerShort,
  );
  const oppShort = entryClubShort(
    frozen.opponentClub,
    undefined,
    frozen.opponentShort,
  );
  const ownPrim =
    entryClubPrimary(frozen.playerClub, frozen.playerShort) || "#64748b";
  const ownSec =
    entryClubSecondary(frozen.playerClub, frozen.playerShort) || "#0f172a";
  const oppPrim =
    entryClubPrimary(frozen.opponentClub, frozen.opponentShort) || "#64748b";
  const result = hsResultLabel(frozen, kind);
  const meta = hsMetaLabel(frozen, kind);

  const logoImg = (id: string | undefined) => {
    if (!id) return "";
    try {
      const logo = clubLogoDataUrl(id, 72);
      return logo ? `<img class="hs-logo" src="${logo}" alt="">` : "";
    } catch {
      return "";
    }
  };

  const side = (
    role: "own" | "opp",
    id: string | undefined,
    short: string,
    prim: string,
    sec: string,
  ) => {
    const code = short && short !== "—" ? short : "—";
    const mark = logoImg(id);
    return `<div class="hs-side hs-side-${role}" style="--hs-kit:${prim};--hs-kit-sec:${sec}">
      ${mark || `<span class="hs-logo hs-logo-fallback" aria-hidden="true">${escapeHtml(code.slice(0, 1))}</span>`}
      <span class="hs-code">${escapeHtml(code)}</span>
    </div>`;
  };

  return `<li class="hs-row">
    <div class="hs-row-top">
      <span class="hs-rank">${rank}</span>
      <span class="hs-name">${escapeHtml(frozen.name)}</span>
    </div>
    <div class="hs-matchup" aria-label="${escapeHtml(matchupLabel(frozen) || "Partie")} ${escapeHtml(result)}">
      ${side("own", ownId, ownShort, ownPrim, ownSec)}
      <div class="hs-score"><span>${escapeHtml(result)}</span></div>
      ${side("opp", oppId, oppShort, oppPrim, "#0f172a")}
    </div>
    ${meta ? `<p class="hs-meta">${escapeHtml(meta)}</p>` : ""}
  </li>`;
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
    const listHtml = (kind: ScoreBoardKind) => {
      const title = SCORE_BOARD_TITLE[kind];
      const rows = sortBoardEntries(
        kind,
        tables[d][kind].map((e) => freezeEntryClubs(e)),
      );
      if (!rows.length) {
        return scope === "persoenlich"
          ? `<p class="tiny">${title}: noch keine persönlichen Einträge${myName ? ` für „${escapeHtml(myName)}“` : ""}</p>`
          : `<p class="tiny">${title}: noch leer</p>`;
      }
      return `<section class="hs-board">
        <h3 class="hs-board-title">${title}</h3>
        <ol class="hs-list">${rows.map((e, i) => hsMatchupRow(e, kind, i + 1)).join("")}</ol>
      </section>`;
    };
    const statusLead =
      scope === "persoenlich"
        ? `Persönliche Top-10${myName ? ` — ${escapeHtml(myName)}` : ""}`
        : shared === null
          ? "Globale Liste wird geladen…"
          : shared
            ? "Gesamt Top-10 — mehrere Einträge pro Name möglich"
            : "Offline — lokale Gesamt-Liste";
    app.innerHTML = moodMenu(`
      ${moodHead({
        eyebrow: "Allgemein",
        title: "Highscores",
        lead: statusLead,
      })}
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
      <div class="card stack hs-card">
        ${ALL_KINDS.map((k) => listHtml(k)).join("")}
      </div>
      <button class="btn secondary" id="hs-back">Menü</button>
    `);
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

  app.innerHTML = moodMenu(`
      ${moodHead({
        eyebrow: "Multiplayer",
        title: "Challenge",
        lead: "1 Versuch · Einladungslink · Sieger vergleichen",
      })}
      <div class="chal-stats card stack">
        <p class="card-label">Deine Bilanz</p>
        <p class="chal-stats-line"><b>${stats.wins}</b> Siege · <b>${stats.losses}</b> Niederlagen · <b>${stats.draws}</b> Unentschieden</p>
        <p class="tiny">${stats.played} abgeschlossene Challenge${stats.played === 1 ? "" : "s"} auf diesem Gerät</p>
      </div>
      <div class="card stack">
        <button class="btn ksc" id="chal-new" type="button">Neue Challenge</button>
        <p class="tiny" style="margin:0">Einladungslink einfügen:</p>
        <div class="row mood-inline">
          <input id="chal-paste" class="chal-input" type="text" placeholder="https://…?c=… oder Code" autocomplete="off" />
          <button class="btn secondary" id="chal-join" type="button">Öffnen</button>
        </div>
      </div>
      <div class="card stack">
        <p class="card-label">Vergangene Challenges</p>
        ${histHtml}
      </div>
      <button class="btn secondary" id="chal-hub-back" type="button">Menü</button>
    `);

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

  app.innerHTML = moodMenu(`
      ${moodHead({
        eyebrow: "Challenge",
        title: "Neue Challenge",
        lead: escapeHtml(matchLine),
        extra: `<div class="kit-preview" aria-hidden="true">
          ${kitSwatchHtml(brand.heim.id)}
          <span class="kit-vs">vs</span>
          ${kitSwatchHtml(brand.gast.id)}
        </div>`,
      })}
      <div class="card stack">
        <p class="card-label">Ziel</p>
        <div class="pick-mode-row chal-goals" role="group" aria-label="Challenge-Ziel">${goals}</div>
        <p class="tiny">${escapeHtml(CHALLENGE_GOAL_BLURB[goal])}</p>
      </div>
      ${matchupPickHtml({ showDiff: true, showBehavior: false })}
      <div class="row mood-actions">
        <button class="btn secondary grow" id="chal-back" type="button">Zurück</button>
        <button class="btn ksc grow" id="chal-invite" type="button">Link generieren</button>
      </div>
      <p class="tiny">Danach Link teilen — jeder spielt 1× über denselben Link.</p>
    `);

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
    go(state.embed ? "menu" : "challengeHub");
    return;
  }
  upsertChallengeHistory(c);
  applyChallengeSettings(c);
  const role = openChallengeRole(c, challengeRoleOpts());
  const winner = compareChallengeAttempts(c.goal, c.a, c.b);
  const verdict = challengeVerdictLabel(c, winner);
  const canPlay = role === "a" || role === "b";
  const already = role === "full";
  const done = role === "done";
  const url = challengeShareUrl(c);

  if (state.embed && done) {
    emitChallengeResult(c, state.challengeRole || state.embedPreferredRole);
    go("challengeResult");
    return;
  }

  app.innerHTML = moodMenu(`
      ${moodHead({
        eyebrow: state.embed ? "Challenge · App" : "Challenge · Einladungslink",
        title: escapeHtml(CHALLENGE_GOAL_LABEL[c.goal]),
        lead: escapeHtml(challengeSetupLine(c)),
        extra: `<div class="kit-preview" aria-hidden="true">
          ${kitSwatchHtml(c.playerClub as ClubId)}
          <span class="kit-vs">vs</span>
          ${kitSwatchHtml(c.aiClub as ClubId)}
        </div>`,
      })}
      <div class="chal-compare">
        ${attemptCardHtml(c.a ? c.a.name : "Spieler 1", c.a, winner === "a")}
        ${attemptCardHtml(c.b ? c.b.name : "Spieler 2", c.b, winner === "b")}
      </div>
      <p class="chal-verdict">${escapeHtml(verdict)}</p>
      <p class="tiny">${escapeHtml(CHALLENGE_GOAL_BLURB[c.goal])} · Nur 1 Versuch pro Spieler.</p>
      ${
        state.embed
          ? ""
          : `<label class="field">Einladungslink
        <input class="chal-input" id="chal-link-view" type="text" readonly value="${escapeHtml(url)}" />
      </label>`
      }
      <div class="row mood-actions">
        <button class="btn secondary grow" id="chal-lobby-back" type="button">${
          state.embed ? "Zurück zur App" : "Übersicht"
        }</button>
        ${
          state.embed
            ? ""
            : `<button class="btn secondary grow" id="chal-copy" type="button">Link kopieren</button>`
        }
      </div>
      ${
        canPlay
          ? `<button class="btn ksc" id="chal-play" type="button">${c.a || c.b ? "Spielen (1×)" : "Jetzt spielen (1×)"}</button>`
          : already && !done
            ? `<p class="tiny">Dein Versuch auf diesem Gerät ist verbraucht — warte auf den Gegner oder aktualisiere den Link.</p>`
            : ""
      }
    `);

  app.querySelector("#chal-lobby-back")!.addEventListener("click", () => {
    sfx("ui");
    if (state.embed) {
      returnToHostApp();
      return;
    }
    state.challenge = null;
    state.challengeRole = null;
    go("challengeHub");
  });
  const copyBtn = app.querySelector("#chal-copy");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      sfx("ui");
      void copyChallengeLink(c);
    });
  }
  const playBtn = app.querySelector("#chal-play");
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      unlockAudio();
      sfx("ui");
      const open = openChallengeRole(c, challengeRoleOpts());
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
      beginChallengePlay(c, open, name);
    });
  }
}

async function copyChallengeLink(
  c: Challenge,
  silentOk = false,
): Promise<void> {
  const url = challengeShareUrl(c);
  if (state.embed) {
    emitChallengeResult(c, state.challengeRole || state.embedPreferredRole);
    return;
  }
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
    go(state.embed ? "menu" : "challengeHub");
    return;
  }
  upsertChallengeHistory(c);
  const winner = compareChallengeAttempts(c.goal, c.a, c.b);
  const verdict = challengeVerdictLabel(c, winner);
  const mine = challengeOutcomeForMe(c, state.challengeRole);
  if (state.embed) {
    emitChallengeResult(c, state.challengeRole || state.embedPreferredRole);
  }
  app.innerHTML = moodMenu(`
      ${moodHead({
        eyebrow: "Challenge-Ergebnis",
        title: escapeHtml(
          winner === "draw"
            ? "Unentschieden"
            : winner === "pending"
              ? "Dein Versuch zählt"
              : mine === "win"
                ? "Du hast gewonnen!"
                : mine === "loss"
                  ? "Du hast verloren"
                  : "Sieger!",
        ),
        lead: escapeHtml(challengeSetupLine(c)),
      })}
      <div class="chal-compare">
        ${attemptCardHtml(c.a?.name || "Spieler 1", c.a, winner === "a")}
        ${attemptCardHtml(c.b?.name || "Spieler 2", c.b, winner === "b")}
      </div>
      <p class="chal-verdict">${escapeHtml(verdict)}</p>
      <div class="row mood-actions">
        <button class="btn ${state.embed ? "ksc" : "secondary"} grow" id="chal-res-hub" type="button">${
          state.embed ? "Zurück zur App" : "Übersicht"
        }</button>
        ${
          state.embed
            ? ""
            : `<button class="btn ksc grow" id="chal-res-copy" type="button">Link teilen</button>`
        }
      </div>
      <p class="tiny">${
        state.embed
          ? winner === "pending"
            ? "Ergebnis an die App gemeldet — Gegner spielt dasselbe Szenario."
            : "Endstand an die App gemeldet."
          : winner === "pending"
            ? "Gegner öffnet denselben Einladungslink und spielt 1× — danach siehst du den Sieger in der Historie."
            : "Beide Versuche stecken im Link. In der Challenge-Übersicht bleibt die Partie gespeichert."
      }</p>
    `);
  app.querySelector("#chal-res-hub")!.addEventListener("click", () => {
    sfx("ui");
    if (state.embed) {
      returnToHostApp();
      return;
    }
    state.challenge = null;
    state.challengeRole = null;
    go("challengeHub");
  });
  const copyBtn = app.querySelector("#chal-res-copy");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      sfx("ui");
      void copyChallengeLink(c);
    });
  }
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

function renderBadges(): void {
  const save = loadBadges();
  const counts = badgeCount();
  const cards = BADGE_DEFS.map((def) => {
    const u = save[def.id];
    const tier = u?.tier;
    const locked = !tier;
    const cls = locked ? "locked" : tier;
    return `<div class="badge-card ${cls}">
      <div class="badge-mark" aria-hidden="true">${escapeHtml(def.mark)}</div>
      <div class="badge-meta">
        <b>${escapeHtml(def.title)}</b>
        <p class="tiny">${escapeHtml(def.blurb)}</p>
        <p class="badge-tier">${locked ? "Gesperrt" : `${tierLabel(tier!)} · ${tier === "gold" ? "Schwer" : tier === "silver" ? "Mittel" : "Einfach"}`}</p>
      </div>
    </div>`;
  }).join("");

  app.innerHTML = moodMenu(`
    ${moodHead({
      eyebrow: "Allgemein",
      title: "Badges",
      lead: `Bronze = Einfach · Silber = Mittel · Gold = Schwer`,
      extra: `<p class="tiny">${counts.unlocked}/${counts.total} freigeschaltet · ${counts.gold}× Gold</p>`,
    })}
    <div class="badge-grid">${cards}</div>
    <button class="btn secondary" id="badges-back" type="button">Menü</button>
  `);
  app.querySelector("#badges-back")!.addEventListener("click", () => {
    sfx("ui");
    go("menu");
  });
}

function renderTournamentHub(): void {
  const existing = loadTournament();
  state.tournament = existing;
  const d = state.tournamentDiff;
  app.innerHTML = moodMenu(`
    ${moodHead({
      eyebrow: "Solo",
      title: "Solo-Turnier",
      lead: "5 Runden · Gegner werden stärker · du immer Heim links",
    })}
    ${
      existing?.active
        ? `<div class="card stack">
        <p class="card-label">Laufendes Turnier</p>
        <p class="card-strong">${escapeHtml(tournamentProgressLabel(existing))} · ${tourneyDiffLabel(existing.tourneyDiff)}</p>
        <p class="tiny">${existing.wins} Siege</p>
        <button class="btn ksc" id="tourney-continue" type="button">Weiterspielen</button>
        <button class="btn secondary" id="tourney-abandon" type="button">Aufgeben</button>
      </div>`
        : ""
    }
    <div class="card stack">
      <p class="card-label">Turnier-Schwierigkeit</p>
      <div class="pick-mode-row" role="group">
        ${(["easy", "normal", "hard"] as TournamentDifficulty[])
          .map(
            (x) =>
              `<button type="button" class="pick-mode ${d === x ? "on" : ""}" data-tdiff="${x}">${tourneyDiffLabel(x)}</button>`,
          )
          .join("")}
      </div>
      <p class="tiny">Einfach startet weich, Schwer startet hart — beide steigern den Baumfortschritt der Gegner.</p>
      <button class="btn ksc" id="tourney-new" type="button">${existing?.active ? "Neues Turnier" : "Turnier starten"}</button>
    </div>
    <button class="btn secondary" id="tourney-back" type="button">Menü</button>
  `);
  app.querySelectorAll<HTMLButtonElement>("[data-tdiff]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sfx("ui");
      state.tournamentDiff = btn.dataset.tdiff as TournamentDifficulty;
      renderTournamentHub();
    });
  });
  app.querySelector("#tourney-back")!.addEventListener("click", () => {
    sfx("ui");
    go("menu");
  });
  app.querySelector("#tourney-abandon")?.addEventListener("click", () => {
    sfx("ui");
    clearTournament();
    state.tournament = null;
    renderTournamentHub();
  });
  app.querySelector("#tourney-continue")?.addEventListener("click", () => {
    sfx("ui");
    go("tournamentBracket");
  });
  app.querySelector("#tourney-new")!.addEventListener("click", () => {
    unlockAudio();
    sfx("ui");
    syncMenuBrandingPreview();
    const clubs = menuClubsFromState();
    const t = createTournament(state.tournamentDiff, clubs.playerClub as ClubId);
    saveTournament(t);
    state.tournament = t;
    state.guidedOnboarding = false;
    state.challenge = null;
    state.live = null;
    go("tournamentBracket");
  });
}

function renderTournamentBracket(): void {
  const t = state.tournament ?? loadTournament();
  if (!t?.active) {
    go("tournamentHub");
    return;
  }
  state.tournament = t;
  const opp = currentOpponent(t);
  const rows = t.opponents
    .map((o, i) => {
      const done = i < t.round;
      const cur = i === t.round;
      const cls = done ? "done" : cur ? "current" : "upcoming";
      return `<li class="tourney-round ${cls}">
        <b>R${i + 1}</b> ${escapeHtml(o.label)}
        <span class="tiny">${clubCode(o.aiClub) || o.aiClub} · ${difficultyLabel(o.difficulty)} · ${AI_BEHAVIOR_LABEL[o.behavior] || o.behavior}</span>
      </li>`;
    })
    .join("");

  app.innerHTML = moodMenu(`
    ${moodHead({
      eyebrow: `${tourneyDiffLabel(t.tourneyDiff)}-Turnier`,
      title: "Bracket",
      lead: escapeHtml(tournamentProgressLabel(t)),
    })}
    <ul class="tourney-list">${rows}</ul>
    ${
      opp
        ? `<div class="card stack">
        <p class="card-label">Nächster Gegner</p>
        <p class="card-strong">${escapeHtml(opp.label)} — ${clubCode(opp.aiClub) || opp.aiClub}</p>
        <p class="tiny">${difficultyLabel(opp.difficulty)} · ${AI_BEHAVIOR_LABEL[opp.behavior] || opp.behavior}</p>
        <div class="kit-preview" aria-hidden="true">
          ${kitSwatchHtml(opp.playerClub)}
          <span class="kit-vs">vs</span>
          ${kitSwatchHtml(opp.aiClub)}
        </div>
        <button class="btn ksc" id="tourney-play" type="button">Anpfiff Runde ${t.round + 1}</button>
      </div>`
        : ""
    }
    <button class="btn secondary" id="tourney-br-back" type="button">Turnier-Hub</button>
  `);
  app.querySelector("#tourney-br-back")!.addEventListener("click", () => {
    sfx("ui");
    go("tournamentHub");
  });
  app.querySelector("#tourney-play")?.addEventListener("click", () => {
    unlockAudio();
    sfx("ui");
    const settings = settingsFromTournament(t);
    if (!settings) return;
    state.settings = settings;
    setClubSoundIdentity(settings.playerClub, settings.aiClub);
    state.setup = defaultSetup();
    go("setup");
  });
}

function renderLiveHub(): void {
  const stats = loadLiveStats();
  const hist = loadLiveHistory();
  const histHtml = hist.length
    ? `<ul class="chal-history">${hist
        .slice(0, 8)
        .map((e) => {
          const cls =
            e.outcome === "win" ? "win" : e.outcome === "loss" ? "loss" : "draw";
          const badge =
            e.outcome === "win"
              ? "Sieg"
              : e.outcome === "loss"
                ? "Niederlage"
                : "Remis";
          return `<li class="chal-history-item">
            <div class="chal-history-top">
              <b>vs ${escapeHtml(e.opponent)}</b>
              <span class="chal-badge ${cls}">${badge}</span>
            </div>
            <p class="tiny">${escapeHtml(e.myScore)} · Gegner ${escapeHtml(e.oppScore)} · ${formatMinute(e.minute)}</p>
          </li>`;
        })
        .join("")}</ul>`
    : `<p class="tiny">Noch keine Live-Spiele auf diesem Gerät.</p>`;

  app.innerHTML = moodMenu(`
    ${moodHead({
      eyebrow: "Multiplayer",
      title: "Live-PvP",
      lead: "Ein Spielfeld · jeder steuert seine Mannschaft (bei sich links)",
    })}
    <div class="chal-stats card stack">
      <p class="card-label">Persönliche Live-Stats</p>
      <p class="chal-stats-line"><b>${stats.wins}</b> Siege · <b>${stats.losses}</b> Niederlagen · <b>${stats.draws}</b> Remis</p>
      <p class="tiny">${stats.played} Spiele · Tore ${stats.goalsFor}:${stats.goalsAgainst} · Biere ${stats.beers}</p>
    </div>
    <div class="card stack">
      <button class="btn ksc" id="live-host" type="button">Raum erstellen</button>
      <p class="tiny" style="margin:0">Oder Raumcode eingeben:</p>
      <div class="row mood-inline">
        <input id="live-code" class="chal-input" type="text" maxlength="8" placeholder="z. B. AB12CD" autocomplete="off" style="text-transform:uppercase" />
        <button class="btn secondary" id="live-join" type="button">Beitreten</button>
      </div>
    </div>
    <div class="card stack">
      <p class="card-label">Letzte Live-Spiele</p>
      ${histHtml}
    </div>
    <button class="btn secondary" id="live-back" type="button">Menü</button>
  `);

  app.querySelector("#live-back")!.addEventListener("click", () => {
    sfx("ui");
    destroyLiveSession();
    go("menu");
  });
  app.querySelector("#live-host")!.addEventListener("click", () => {
    void (async () => {
      unlockAudio();
      sfx("ui");
      const name = askLiveName("Host");
      try {
        app.querySelector("#live-host")!.textContent = "Verbinde…";
        const session = await createLiveHost(name);
        state.live = session;
        syncMenuBrandingPreview();
        const clubs = menuClubsFromState();
        session.setConfig({
          playerClub: clubs.playerClub,
          aiClub: clubs.aiClub,
          difficulty: readMenuDifficulty(),
          hostName: name,
        });
        bindLiveSession(session);
        go("liveLobby");
      } catch (err) {
        window.alert(
          err instanceof Error ? err.message : "Live-Raum fehlgeschlagen",
        );
        renderLiveHub();
      }
    })();
  });
  app.querySelector("#live-join")!.addEventListener("click", () => {
    void (async () => {
      unlockAudio();
      sfx("ui");
      const code = (
        app.querySelector("#live-code") as HTMLInputElement
      ).value
        .trim()
        .toUpperCase();
      if (code.length < 4) {
        window.alert("Bitte Raumcode eingeben.");
        return;
      }
      const name = askLiveName("Gast");
      try {
        app.querySelector("#live-join")!.textContent = "…";
        const session = await joinLiveGuest(code, name);
        state.live = session;
        bindLiveSession(session);
        go("liveLobby");
      } catch (err) {
        window.alert(
          err instanceof Error ? err.message : "Beitritt fehlgeschlagen",
        );
        renderLiveHub();
      }
    })();
  });
}

function bindLiveSession(session: LiveSession): void {
  session.onUpdate(() => {
    if (state.screen === "liveLobby") {
      maybeEmbedLiveAutoFlow();
      renderLiveLobby();
    }
    if (state.screen === "match") syncLiveKpiPanel();
    if (state.screen === "liveResult" && state.liveWaitingOpponent) {
      maybeFinishLiveResult();
    }
  });
  session.onStart((cfg, at, mixes) => {
    state.settings = settingsFromLive(cfg, session.role);
    setClubSoundIdentity(state.settings.playerClub, state.settings.aiClub);
    syncMenuBrandingPreview();
    state.livePvpHostMix = mixes.host;
    state.livePvpGuestMix = mixes.guest;
    state.setup = { mix: { ...mixes.host } };
    const delay = Math.max(0, at - Date.now());
    window.setTimeout(() => {
      if (!state.live) return;
      startLivePvpMatch();
    }, delay);
  });
  session.onInput((cmd) => {
    const m = state.match;
    if (!m?.pvp || !m.pvpAuthority || state.screen !== "match") return;
    // Guest cmds already remapped to host coords; guest is always vfb on host.
    applyPvpCmd(m, "vfb", cmd);
  });
  session.onSnap((snap) => {
    const m = state.match;
    if (!m?.pvp || m.pvpAuthority || state.screen !== "match") return;
    applyPvpSnap(m, mirrorPvpSnapForGuest(snap));
  });
}

/** Kick off shared-board Live PvP (skips solo setup — both use exchanged mixes). */
function startLivePvpMatch(): void {
  const live = state.live;
  if (!live) return;
  unlockAudio();
  sfx("whistle");
  startAmbience("match");
  const hostMix = state.livePvpHostMix ?? defaultSetup().mix;
  const guestMix = state.livePvpGuestMix ?? defaultSetup().mix;
  // Each client: own mix left (Heim), opponent mix right — guest view is mirrored snaps.
  const ownMix = live.role === "host" ? hostMix : guestMix;
  const oppMix = live.role === "host" ? guestMix : hostMix;
  state.match = new Match({
    settings: state.settings,
    playerSetup: { mix: { ...ownMix } },
    aiSetup: { mix: { ...oppMix } },
    pvp: true,
    localTeam: "ksc",
    pvpAuthority: live.role === "host",
  });
  state.resultBadges = [];
  state.livePvpTick = 0;
  state.livePvpLastAck = 0;
  (window as unknown as { __match?: Match }).__match = state.match;
  go("match");
  void goFullscreen();
}

function renderLiveLobby(): void {
  const live = state.live;
  if (!live) {
    go(state.embed ? "menu" : "liveHub");
    return;
  }
  maybeEmbedLiveAutoFlow();
  syncMenuBrandingPreview();
  const brand = currentBranding();
  const cfg = live.config;
  const matchLine = cfg
    ? `${clubCode(cfg.playerClub) || cfg.playerClub} vs ${clubCode(cfg.aiClub) || cfg.aiClub}`
    : `${brand.heim.short} vs ${brand.gast.short}`;
  const bothReady = live.localReady && live.remoteReady && live.connected;
  const showMatchupPicker =
    live.role === "host" && !(state.embed && state.embedLiveLockedMatchup);

  app.innerHTML = moodMenu(`
    ${moodHead({
      eyebrow: `Live · ${escapeHtml(live.status)}`,
      title: state.embed ? "Live · App" : "Lobby",
      lead: escapeHtml(matchLine),
      extra: `<p class="live-code">${escapeHtml(live.code)}</p>
        <p class="tiny mood-center">Live-PvP · ein Spielfeld · jeder sieht die eigene Mannschaft links</p>
        <div class="kit-preview" aria-hidden="true">
          ${kitSwatchHtml((cfg?.playerClub || brand.heim.id) as ClubId)}
          <span class="kit-vs">vs</span>
          ${kitSwatchHtml((cfg?.aiClub || brand.gast.id) as ClubId)}
        </div>`,
    })}
    ${
      showMatchupPicker
        ? `<div class="card stack">
        <p class="card-label">Matchup (du links · Gegner rechts — bei dir)</p>
        ${matchupPickHtml({ showDiff: true, showBehavior: false })}
        <p class="tiny">Gegner sieht bei sich ebenfalls die eigene Mannschaft links. Keine KI — echtes Duell.</p>
      </div>`
        : live.role === "host"
          ? `<div class="card stack"><p class="tiny">${
              state.embed
                ? "Matchup von der App gesetzt (zufällig oder vorgegeben). Warte auf den Gegner — Anpfiff startet automatisch."
                : "Matchup fest."
            }</p></div>`
          : `<div class="card stack"><p class="tiny">Du bist <b>Gast</b> — deine Mannschaft liegt bei dir <b>links</b>. Host legt das Matchup fest; gleiches Spielfeld, live gegeneinander.${
              state.embed ? " Bereit-Status wird automatisch gesetzt." : ""
            }</p></div>`
    }
    <div class="card stack">
      <div class="live-ready-row">
        <span><span class="live-dot ${live.localReady ? "on" : ""}"></span> Du (${escapeHtml(live.localName)})</span>
        ${
          state.embed && state.embedAutoplay
            ? `<span class="tiny">${live.localReady ? "bereit" : "…"}</span>`
            : `<button class="btn secondary" id="live-ready" type="button">${live.localReady ? "Nicht bereit" : "Bereit"}</button>`
        }
      </div>
      <div class="live-ready-row">
        <span><span class="live-dot ${live.remoteReady ? "on" : ""}"></span> Gegner (${escapeHtml(live.remoteName || "…")})</span>
        <span class="tiny">${live.connected ? "online" : "offline"}</span>
      </div>
    </div>
    ${
      live.role === "host"
        ? state.embed && state.embedAutoplay
          ? `<p class="tiny mood-center">${bothReady ? "Anpfiff…" : "Warte auf Gegner…"}</p>`
          : `<button class="btn ksc" id="live-start" type="button" ${bothReady ? "" : "disabled"}>Anpfiff (beide bereit)</button>`
        : `<p class="tiny mood-center">Warte auf Host-Anpfiff…</p>`
    }
    <button class="btn secondary" id="live-lobby-back" type="button">${
      state.embed ? "Zurück zur App" : "Abbrechen"
    }</button>
  `);

  if (showMatchupPicker) {
    bindMatchupPickHandlers(() => {
      const clubs = menuClubsFromState();
      live.setConfig({
        playerClub: clubs.playerClub,
        aiClub: clubs.aiClub,
        difficulty: readMenuDifficulty(),
        hostName: live.localName,
        guestName: live.remoteName || undefined,
      });
      renderLiveLobby();
    });
  }
  const readyBtn = app.querySelector("#live-ready");
  if (readyBtn) {
    readyBtn.addEventListener("click", () => {
      sfx("ui");
      live.sendReady(!live.localReady);
      renderLiveLobby();
    });
  }
  app.querySelector("#live-lobby-back")!.addEventListener("click", () => {
    sfx("ui");
    if (state.embed) {
      returnToHostApp();
      return;
    }
    destroyLiveSession();
    go("liveHub");
  });
  const startBtn = app.querySelector("#live-start");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      if (!bothReady) return;
      sfx("ui");
      const clubs = menuClubsFromState();
      live.setConfig({
        playerClub: clubs.playerClub,
        aiClub: clubs.aiClub,
        difficulty: readMenuDifficulty(),
        hostName: live.localName,
        guestName: live.remoteName || undefined,
        pvp: true,
      });
      const mix = defaultSetup().mix;
      const guestMix = live.remoteMix ?? mix;
      live.sendStart(mix, guestMix);
    });
  }
}

function syncLiveKpiPanel(): void {
  const panel = app.querySelector("#live-kpi-panel");
  const live = state.live;
  const m = state.match;
  if (!panel || !live) return;
  if (m?.pvp) {
    const side = live.role === "host" ? "Du · Host (links)" : "Du · Gast (links)";
    panel.innerHTML = `<b>Live-PvP</b>
      <span>${escapeHtml(side)}</span>
      <span>${escapeHtml(live.localName)} vs ${escapeHtml(live.remoteName || "…")}</span>
      <span class="tiny">${live.connected ? "verbunden" : "offline"} · ${live.role === "host" ? "Host simuliert" : "Sync · eigene Seite links"}</span>`;
    return;
  }
  const k = live.remoteKpi;
  if (!k) {
    panel.innerHTML = `<b>Gegner</b><span>${escapeHtml(live.remoteName || "…")}</span><span class="tiny">warte auf KPIs…</span>`;
    return;
  }
  panel.innerHTML = `<b>Gegner · rechts</b>
    <span>${escapeHtml(k.name)}</span>
    <span><strong>${k.scoreFor}:${k.scoreAgainst}</strong> · ${formatMinute(k.minute)}</span>
    <span>Biere ${k.beers} · Gold ${k.gold}</span>
    <span class="tiny">${k.done ? k.detail || "fertig" : "läuft…"}</span>`;
}

function publishLiveEmbedResult(
  live: LiveSession,
  me: LiveKpis,
  them: LiveKpis,
  outcome: "win" | "loss" | "draw",
): void {
  if (!state.embed) return;
  const payload = buildLiveEmbedResult({
    code: live.code,
    role: live.role,
    outcome,
    me,
    them,
    config: live.config,
  });
  state.embedLiveLastResult = payload;
  emitLiveResult(payload);
}

function maybeFinishLiveResult(): void {
  const live = state.live;
  if (!live || !state.liveMyKpi) return;
  const them = live.remoteKpi;
  if (!them?.done) return;
  if (state.liveOutcome) return;
  const { outcome } = recordLiveResult({
    opponent: them.name || live.remoteName || "Gegner",
    me: state.liveMyKpi,
    them,
  });
  state.liveOutcome = outcome;
  state.liveWaitingOpponent = false;
  publishLiveEmbedResult(live, state.liveMyKpi, them, outcome);
  renderLiveResult();
}

function renderLiveResult(): void {
  const live = state.live;
  const me = state.liveMyKpi;
  if (!live || !me) {
    go(state.embed ? "menu" : "liveHub");
    return;
  }
  const them = live.remoteKpi;
  if (!them?.done) {
    state.liveWaitingOpponent = true;
    app.innerHTML = moodMenu(`
      ${moodHead({
        eyebrow: "Live-PvP",
        title: "Warte auf Gegner…",
        lead: "Abgleich der Ergebnis-Meldung",
      })}
      <div class="live-compare">
        <div class="live-slot">
          <p class="tiny">Du (links)</p>
          <p class="card-strong">${escapeHtml(me.name)}</p>
          <p>${me.scoreFor}:${me.scoreAgainst}</p>
          <p class="tiny">${formatMinute(me.minute)} · Biere ${me.beers}</p>
          <p class="tiny">${escapeHtml(me.detail || "")}</p>
        </div>
        <div class="live-slot">
          <p class="tiny">Gegner</p>
          <p class="card-strong">${escapeHtml(them?.name || live.remoteName || "…")}</p>
          <p>${them ? `${them.scoreFor}:${them.scoreAgainst}` : "—"}</p>
          <p class="tiny">${them ? `${formatMinute(them.minute)} · läuft…` : "verbindet…"}</p>
        </div>
      </div>
      <button class="btn secondary" id="live-wait-leave" type="button">${
        state.embed ? "Zurück zur App" : "Abbrechen"
      }</button>
    `);
    app.querySelector("#live-wait-leave")!.addEventListener("click", () => {
      if (state.embed) {
        returnToHostApp();
        return;
      }
      destroyLiveSession();
      go("menu");
    });
    return;
  }

  if (!state.liveOutcome) {
    const { outcome } = recordLiveResult({
      opponent: them.name || live.remoteName || "Gegner",
      me,
      them,
    });
    state.liveOutcome = outcome;
    publishLiveEmbedResult(live, me, them, outcome);
  } else if (state.embed && !state.embedLiveLastResult) {
    publishLiveEmbedResult(live, me, them, state.liveOutcome);
  }
  const outcome = state.liveOutcome;
  const stats = loadLiveStats();
  const verdict =
    outcome === "win"
      ? "Sieg!"
      : outcome === "loss"
        ? "Niederlage"
        : "Unentschieden";
  app.innerHTML = moodMenu(`
    ${moodHead({
      eyebrow: "Live-PvP · Ergebnis",
      title: verdict,
    })}
    <div class="live-compare">
      <div class="live-slot ${outcome === "win" ? "win" : outcome === "loss" ? "loss" : ""}">
        <p class="tiny">Du (links)</p>
        <p class="card-strong">${escapeHtml(me.name)}</p>
        <p>${me.scoreFor}:${me.scoreAgainst}</p>
        <p class="tiny">${formatMinute(me.minute)} · Biere ${me.beers} · Gold ${me.gold}</p>
        <p class="tiny">${escapeHtml(me.detail || me.reason || "")}</p>
      </div>
      <div class="live-slot ${outcome === "loss" ? "win" : outcome === "win" ? "loss" : ""}">
        <p class="tiny">Gegner</p>
        <p class="card-strong">${escapeHtml(them.name)}</p>
        <p>${them.scoreFor}:${them.scoreAgainst}</p>
        <p class="tiny">${formatMinute(them.minute)} · Biere ${them.beers} · Gold ${them.gold}</p>
        <p class="tiny">${escapeHtml(them.detail || them.reason || "")}</p>
      </div>
    </div>
    ${badgesResultHtml()}
    <div class="chal-stats card stack">
      <p class="card-label">Persönliche Stats</p>
      <p class="chal-stats-line"><b>${stats.wins}</b> W · <b>${stats.losses}</b> L · <b>${stats.draws}</b> D · ${stats.played} Spiele</p>
      <p class="tiny">Tore gesamt ${stats.goalsFor}:${stats.goalsAgainst} · Biere ${stats.beers}</p>
    </div>
    <div class="row mood-actions">
      <button class="btn ${state.embed ? "ksc" : "secondary"} grow" id="live-res-menu" type="button">${
        state.embed ? "Zurück zur App" : "Menü"
      }</button>
      ${
        state.embed
          ? ""
          : `<button class="btn ksc grow" id="live-res-again" type="button">Live-Hub</button>`
      }
    </div>
    ${
      state.embed
        ? `<p class="tiny">Ergebnis an die App gemeldet.</p>`
        : ""
    }
  `);
  app.querySelector("#live-res-menu")!.addEventListener("click", () => {
    if (state.embed) {
      returnToHostApp();
      return;
    }
    destroyLiveSession();
    go("menu");
  });
  const again = app.querySelector("#live-res-again");
  if (again) {
    again.addEventListener("click", () => {
      destroyLiveSession();
      go("liveHub");
    });
  }
}

function renderSetup(): void {
  const mix = state.setup.mix;
  const chal = state.challenge;
  const live = state.live;
  const row = (key: keyof FanMix, label: string) => `
    <div class="row" style="justify-content:space-between">
      <span>${label}</span>
      <div class="row">
        <button class="btn secondary" data-mix="${key}" data-d="-1" style="min-height:40px;min-width:40px;padding:0">−</button>
        <strong style="min-width:1.4rem;text-align:center">${mix[key]}</strong>
        <button class="btn secondary" data-mix="${key}" data-d="1" style="min-height:40px;min-width:40px;padding:0">+</button>
      </div>
    </div>`;
  const setupLead = live
    ? "Live-PvP · Aufstellung (gleicher Start beider Seiten)"
    : state.tournament?.active
      ? `Turnier · ${escapeHtml(tournamentProgressLabel(state.tournament))}`
      : state.guidedOnboarding
        ? "Geführtes Solo (Einfach) — Meilensteine im Match"
        : chal
          ? `Challenge · ${escapeHtml(challengeSetupLine(chal))} · 1 Versuch`
          : "8 Fans für den Heimblock";
  app.innerHTML = moodMenu(`
      ${moodHead({
        eyebrow: "Vor dem Anpfiff",
        title: "Aufstellung",
        lead: setupLead,
      })}
      <div class="card stack">
        ${row("normalos", "Fans (Momentum · Sicherheit)")}
        ${row("ultras", "Ultras (Senden · Fanartikel)")}
        ${row("hooligans", "Hooligans (Nahkampf · Bier)")}
        <p class="tiny">Summe ${mixSum(mix)} / 8 ${isValidMix(mix) ? "✓" : ""}</p>
      </div>
      <div class="row mood-actions">
        <button class="btn secondary grow" id="back" type="button">Zurück</button>
        <button class="btn ksc grow anpfiff-btn" id="start" type="button" ${isValidMix(mix) ? "" : "disabled"}>Anpfiff</button>
      </div>
    `);
  app.querySelector("#back")!.addEventListener("click", () => {
    if (state.live) {
      go("liveLobby");
      return;
    }
    if (state.tournament?.active) {
      go("tournamentBracket");
      return;
    }
    if (state.challenge && state.challengeRole) {
      // Don't burn the attempt until the match ends
      go("challengeLobby");
      return;
    }
    if (state.guidedOnboarding) {
      go("tutorial");
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
    if (state.tournament?.active) {
      const s = settingsFromTournament(state.tournament);
      if (s) {
        state.settings = s;
        setClubSoundIdentity(s.playerClub, s.aiClub);
      }
    }
    unlockAudio();
    sfx("whistle");
    startAmbience("match");
    const aiProf = difficultyProfile(state.settings.difficulty);
    state.match = new Match({
      settings: state.settings,
      playerSetup: state.setup,
      aiSetup: { mix: { ...aiProf.aiMix } },
      guided: state.guidedOnboarding,
    });
    state.resultBadges = [];
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
  const tc = teamColor(controlTeamOf(m));
  state.pendingBuild = null;
  state.buildTarget = null;
  app.innerHTML = `
    <div class="rotate-hint">Bitte Handy quer drehen ↻</div>
    <div class="match-shell matchday">
      ${
        state.live
          ? `<aside class="live-kpi-panel" id="live-kpi-panel" aria-live="polite"><b>Live-PvP</b><span>…</span></aside>`
          : ""
      }
      <div class="match-flash hidden" id="match-flash" aria-live="assertive"></div>
      ${
        state.guidedOnboarding
          ? `<aside class="guided-panel" id="guided-panel" aria-live="polite">
        <b>Onboarding</b>
        <span data-g="build">🏗 Bauen</span>
        <span data-g="fans">👤 Person</span>
        <span data-g="send">→ Gang</span>
        <span data-g="goal">⚽ Moment</span>
      </aside>`
          : m.blitz
            ? `<aside class="guided-panel blitz-panel" id="blitz-panel" aria-live="polite">
        <b>Blitz <span id="blitz-clock">60s</span></b>
        <span>Heim = Stimmung</span>
        <span>Gebäude = Ressource</span>
        <span>Gegner = Kampf</span>
      </aside>`
            : ""
      }
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
  if (state.live) syncLiveKpiPanel();

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
      const ok = upCost != null && controlGoldOf(m) >= upCost;
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
          if (!state.buildTarget) return;
          const target = state.buildTarget;
          m.buildMenu = target;
          m.selectedSlot = target;
          livePvpAction(
            {
              op: "upgradeBuild",
              blockId: target.blockId,
              index: target.index,
            },
            () => m.tryUpgrade(),
          );
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
          controlGoldOf(m) >= BUILD_COST[kind] &&
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
        const ok = slot != null && upCost != null && controlGoldOf(m) >= upCost;
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
    const controlTeam = controlTeamOf(m);
    const owned =
      !!slot?.building &&
      slot.owner === controlTeam &&
      !slot.greyNeutral;
    if (owned) {
      state.pendingBuild = null;
      openBuildRail("upgrade", { blockId, index });
      if (m.pvp && state.live?.role === "guest") {
        livePvpAction({ op: "selectSlot", blockId, index }, () => true);
      }
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
        const ok = livePvpAction(
          { op: "build", blockId, index, kind },
          () => m.tryBuild(kind),
        );
        if (ok) {
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

    if (m.blitz) {
      const tap = hitBlitzTarget(m, mx, my);
      if (tap) {
        const ok = m.tryBlitzTap(
          tap.kind === "building"
            ? { kind: "building", blockId: tap.blockId, index: tap.index }
            : { kind: tap.kind },
          { x: mx / Math.max(1, m.width), y: my / Math.max(1, m.height) },
        );
        if (ok) sfx("ui");
        return;
      }
      hideMenus();
      return;
    }

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
      const count = (btn.dataset.attackCount === "all" ? "all" : 1) as 1 | "all";
      if (kind === "ultras") {
        livePvpAction({ op: "sendPyro", count }, () => m.tryPyroFight(count));
      } else {
        livePvpAction({ op: "sendHool", count }, () => m.tryHooliganOrder(count));
      }
      syncOverlay();
    });
  });
  app.querySelector("#btn-hire-ordner")?.addEventListener("click", () => {
    const sel = m.buildMenu ?? m.selectedSlot;
    if (sel) {
      livePvpAction(
        { op: "hire", blockId: sel.blockId, index: sel.index },
        () => m.tryHireStewardQuick(),
      );
    } else {
      livePvpAction(
        { op: "hire", blockId: 0, index: 0 },
        () => m.tryHireStewardQuick(),
      );
    }
    syncOverlay();
  });
  app.querySelectorAll<HTMLButtonElement>("[data-quick-buy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kind = btn.dataset.quickBuy as FanKind;
      livePvpAction({ op: "buy", kind }, () => m.tryBuyFanQuick(kind));
      syncOverlay();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-unit-up]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kind = btn.dataset.unitUp as FanKind | "ordner";
      livePvpAction({ op: "upgradeUnit", kind }, () => m.tryUpgradeUnit(kind));
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
      const ok = livePvpAction(
        {
          op: "build",
          blockId: state.buildTarget.blockId,
          index: state.buildTarget.index,
          kind,
        },
        () => m.tryBuild(kind),
      );
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
      livePvpAction(
        { op: "upgradeBuild", blockId: slot.blockId, index: slot.index },
        () => m.tryUpgrade(),
      );
      syncBuildingRailUi();
      syncOverlay();
    });
  });
  btnHire.addEventListener("click", () => {
    const sel = m.buildMenu ?? m.selectedSlot;
    if (sel) {
      livePvpAction(
        { op: "hire", blockId: sel.blockId, index: sel.index },
        () => m.tryHireSteward(),
      );
    } else {
      m.tryHireSteward();
    }
    if (m.buildMenu) showBuildMenu(m.buildMenu.blockId, m.buildMenu.index);
    syncOverlay();
  });
  btnUpgrade.addEventListener("click", () => {
    const sel = m.buildMenu ?? m.selectedSlot;
    if (sel) {
      livePvpAction(
        { op: "upgradeBuild", blockId: sel.blockId, index: sel.index },
        () => m.tryUpgrade(),
      );
    } else {
      m.tryUpgrade();
    }
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
      if (m.pvp && m.pvpAuthority && state.live) {
        state.livePvpTick += 1;
        if (state.livePvpTick % 6 === 0) {
          state.live.sendSnap(exportPvpSnap(m, state.livePvpTick), state.livePvpLastAck);
        }
      }
      drawMatch(ctx, m);
      const chAmb = m.goalChance();
      setAmbienceFromMatch({
        celebrating: m.scorePulse > 0.12,
        storming: !!m.stormBanner,
        momentumAbs: Math.abs(chAmb.momentum),
      });
      const control = controlTeamOf(m);
      const goldEl = app.querySelector("#gold");
      if (goldEl) goldEl.textContent = String(Math.floor(controlGoldOf(m)));
      const beer = app.querySelector("#cur-beer");
      const merch = app.querySelector("#cur-merch");
      const sec = app.querySelector("#cur-sec");
      if (beer) {
        beer.textContent = String(
          control === "vfb" && m.pvp
            ? Math.floor(m.aiBeer)
            : m.currencyPct("beer"),
        );
      }
      if (merch) {
        merch.textContent = String(
          control === "vfb" && m.pvp
            ? Math.floor(m.aiMerch)
            : m.currencyPct("merch"),
        );
      }
      if (sec) {
        sec.textContent = String(
          control === "vfb" && m.pvp
            ? Math.floor(m.aiSecurity)
            : m.currencyPct("security"),
        );
      }
      const own = m.countTeamFans(control);
      const foe = m.countTeamFans(control === "ksc" ? "vfb" : "ksc");
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
            s.owner === control &&
            !s.greyNeutral &&
            m.stewardCountAt(s) < 2 &&
            controlGoldOf(m) >= STEWARD_HIRE_GOLD,
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
      // Match feedback: combat banner + big flash
      const banner = app.querySelector<HTMLElement>("#combat-banner");
      const combat = m.combatStatus();
      if (banner) {
        if (combat) {
          banner.textContent = combat;
          banner.classList.remove("hidden");
          banner.classList.add("show");
        } else {
          banner.classList.add("hidden");
          banner.classList.remove("show");
        }
      }
      const flashEl = app.querySelector<HTMLElement>("#match-flash");
      if (flashEl) {
        if (m.uiFlash && m.uiFlash.t > 0) {
          flashEl.textContent = m.uiFlash.text;
          flashEl.dataset.tone = m.uiFlash.tone;
          flashEl.classList.remove("hidden");
        } else {
          flashEl.classList.add("hidden");
        }
      }
      const guidedPanel = app.querySelector("#guided-panel");
      if (guidedPanel) {
        for (const key of ["build", "fans", "send", "goal"] as const) {
          const el = guidedPanel.querySelector(`[data-g="${key}"]`);
          if (el) el.classList.toggle("done", m.guidedDone.has(key));
        }
      }
      const blitzClock = app.querySelector("#blitz-clock");
      if (blitzClock && m.blitz) {
        blitzClock.textContent = `${Math.ceil(m.blitzSecondsLeft())}s`;
      }
      const toast = app.querySelector("#toast");
      if (toast) toast.classList.remove("show");
      // Halbzeit boost picker (PvP: auto +30€ both — no dual UI)
      halfPanel.classList.toggle("hidden", !m.halfTimePending || m.pvp);
      // Choreo status chip
      if (m.choreo && m.choreo.team === control) {
        choreoChip.textContent = CHOREO_LABEL[m.choreo.tier];
        choreoChip.classList.remove("hidden");
      } else if (!m.pvp) {
        const ready = m.playerChoreoTier();
        if (ready) {
          choreoChip.textContent = `${CHOREO_LABEL[ready]} bereit`;
          choreoChip.classList.remove("hidden");
        } else {
          choreoChip.classList.add("hidden");
        }
      } else {
        choreoChip.classList.add("hidden");
      }
      if (Math.floor(now / 250) !== Math.floor((now - dt * 1000) / 250)) syncOverlay();
      if (state.live && Math.floor(now / 1000) !== Math.floor((now - dt * 1000) / 1000)) {
        const kpi = kpisFromMatch(m, state.live.localName);
        state.live.sendKpi(kpi);
        syncLiveKpiPanel();
      }
      if (m.result) {
        // Let storm/goal highlight finish briefly before result screen
        if (m.highlight && m.highlight.t > 0.4) {
          state.raf = requestAnimationFrame(loop);
          return;
        }
        unFs();
        if (state.live) {
          const kpi = kpisFromMatch(m, state.live.localName);
          state.liveMyKpi = kpi;
          state.live.sendKpi(kpi);
          setTimeout(() => go("liveResult"), 800);
          return;
        }
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

function collectResultBadges(opts?: {
  tournamentChampion?: boolean;
  fromTournamentRound?: boolean;
  fromLiveWin?: boolean;
}): void {
  const m = state.match;
  if (!m?.result) return;
  const r = m.result;
  const me = controlTeamOf(m);
  const playerIsKsc = me === "ksc";
  const scoreFor = playerIsKsc ? r.score[0] : r.score[1];
  const scoreAgainst = playerIsKsc ? r.score[1] : r.score[0];
  const beers =
    m.pvp && me === "vfb" ? m.beersDrunkAi : m.beersDrunkPlayer;
  state.resultBadges = evaluateMatchBadges({
    difficulty: r.difficulty,
    playerTeam: me,
    winner: r.winner,
    reason: r.reason,
    scoreFor,
    scoreAgainst,
    minute: r.minute,
    beers,
    buildingsOwned: m.countPlayerBuildings(),
    wasBehind: m.wasBehind,
    fromTournamentRound: opts?.fromTournamentRound,
    tournamentChampion: opts?.tournamentChampion,
    fromLiveWin: opts?.fromLiveWin,
  });
}

function badgesResultHtml(): string {
  if (!state.resultBadges.length) return "";
  return `<div class="badge-unlocks card stack">
    <p class="sub" style="margin:0">Neue Badges</p>
    ${state.resultBadges
      .map(
        (b) =>
          `<div class="badge-unlock-row ${b.unlock.tier}">
            <span class="badge-mark">${escapeHtml(b.def.mark)}</span>
            <span><b>${escapeHtml(b.def.title)}</b> · ${tierLabel(b.unlock.tier)}</span>
          </div>`,
      )
      .join("")}
  </div>`;
}

function renderResult(): void {
  // Live Challenge: summary + personal stats
  if (state.live) {
    if (state.liveMyKpi?.winner === "player") {
      collectResultBadges({ fromLiveWin: true });
    }
    go("liveResult");
    return;
  }
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

  // Tournament advancement
  let tourneyNote = "";
  let tourneyChampion = false;
  const playedTournament = !!state.tournament?.active;
  if (playedTournament && state.tournament) {
    const { state: next, champion, eliminated } = applyTournamentMatchResult(
      state.tournament,
      youWin,
    );
    state.tournament = next;
    tourneyChampion = champion;
    if (champion) tourneyNote = "Turnier gewonnen — Champion!";
    else if (eliminated) tourneyNote = "Turnier vorbei — Ausscheiden.";
    else tourneyNote = `Runde gewonnen · weiter zu ${tournamentProgressLabel(next)}`;
  }

  collectResultBadges({
    fromTournamentRound: playedTournament && youWin,
    tournamentChampion: tourneyChampion,
  });
  state.guidedOnboarding = false;

  const paint = (hsNotes: string[]) => {
    const againLabel = state.tournament?.active
      ? "Nächste Runde"
      : tourneyChampion
        ? "Turnier-Hub"
        : "Rematch";
    app.innerHTML = moodMenu(`
      <p class="sub">${r.detail}</p>
      <h1 class="brand">${youWin ? "Sieg!" : "Niederlage"}</h1>
      <p class="sub">${teamLabel(r.winner)} · ${r.score[0]}:${r.score[1]} · ${formatMinute(m.minute)} · ${difficultyLabel(r.difficulty)}</p>
      ${tourneyNote ? `<p class="sub hs-note">${escapeHtml(tourneyNote)}</p>` : ""}
      ${badgesResultHtml()}
      ${hsNotes.length ? `<p class="sub hs-note">${hsNotes.join(" · ")}</p>` : ""}
      <div class="row">
        <button class="btn secondary grow" id="menu">Menü</button>
        <button class="btn secondary grow" id="hs">Highscores</button>
        <button class="btn ksc grow" id="again">${againLabel}</button>
      </div>
    `);
    app.querySelector("#menu")!.addEventListener("click", () => {
      state.blitz = false;
      go("menu");
    });
    app.querySelector("#hs")!.addEventListener("click", () => {
      state.highscoreDiff = r.difficulty;
      go("highscores");
    });
    app.querySelector("#again")!.addEventListener("click", () => {
      if (state.tournament?.active) {
        go("tournamentBracket");
        return;
      }
      if (tourneyChampion || (state.tournament && !state.tournament.active)) {
        go("tournamentHub");
        return;
      }
      if (state.blitz) {
        startBlitzMatch();
        return;
      }
      go("setup");
    });
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

// Deep-link / host-app embed: Challenge ?c=… / Live ?live=…
{
  const launch = parseEmbedLaunch();
  let linked = launch.challenge || challengeFromLocation();
  let createdFresh = false;

  if (!linked && launch.create) {
    linked = materializeEmbedCreate(launch.create);
    createdFresh = true;
  }

  if (launch.embed) {
    state.embed = true;
    state.embedAutoplay = launch.autoplay;
    state.embedPreferredRole = launch.role;
    state.embedLiveRole = launch.liveRole;
    document.documentElement.classList.add("embed-mode");
    document.body?.classList.add("embed-mode");
    installEmbedHostListener({
      onCloseRequest: () => returnToHostApp(),
    });
  }

  if (launch.playerName) {
    localStorage.setItem("matchday-player-name", launch.playerName);
  }

  if (launch.embed && launch.mode === "live" && launch.liveRole) {
    clearChallengeFromUrl();
    clearEmbedLaunchParams();
    state.screen = "liveHub";
    render();
    void bootstrapLiveEmbed(launch);
  } else if (linked) {
    upsertChallengeHistory(linked);
    state.challenge = linked;
    state.challengeRole = null;
    applyChallengeSettings(linked);
    if (createdFresh && state.embed) {
      emitChallengeCreated(linked);
    }

    const open = openChallengeRole(linked, {
      prefer: launch.role || undefined,
      ignoreDeviceLock: state.embed,
    });

    clearChallengeFromUrl();
    clearEmbedLaunchParams();

    if (state.embed && launch.autoplay && (open === "a" || open === "b")) {
      const playerName =
        launch.playerName ||
        localStorage.getItem("matchday-player-name") ||
        linked.hostName ||
        "Spieler";
      localStorage.setItem("matchday-player-name", playerName.slice(0, 20));
      state.challengeRole = open;
      state.setup = defaultSetup();
      state.screen = "setup";
      emitReady({ mode: "challenge", challengeId: linked.id });
    } else if (open === "done" || (linked.a && linked.b)) {
      state.screen = "challengeResult";
      if (state.embed) emitReady({ mode: "challenge", challengeId: linked.id });
    } else {
      state.screen = "challengeLobby";
      if (state.embed) emitReady({ mode: "challenge", challengeId: linked.id });
    }
    render();
  } else {
    if (state.embed) {
      clearEmbedLaunchParams();
      emitReady({ mode: launch.mode });
    }
    render();
  }
}

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
