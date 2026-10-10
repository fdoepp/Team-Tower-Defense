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
  preloadIcons,
  standIconPath,
  teamColor,
  unitIconPath,
} from "./game/assets";
import {
  BUILD_COST,
  BUY_COST,
  HOOLIGAN_ORDER_BEER,
  MIX_MAX,
  MIX_MIN,
  PROD_BEER,
  PROD_MERCH,
  PROD_SECURITY,
  PYRO_FIGHT_MERCH,
  STEWARD_HIRE_GOLD,
  UPGRADE_COST,
  UPGRADE_MAX,
  canVisit,
  ordnerPostMaxHp,
  productionRate,
  stewardHealPerSec,
  stewardPostRadius,
  visitGoldPayout,
  visitInterval,
  type BuildingKind,
  type FanKind,
  type FanMix,
  type SoloSettings,
  type TeamId,
} from "./game/types";
import {
  defaultMix,
  defaultSetup,
  defaultSoloSettings,
  formatMinute,
  isValidMix,
  mixSum,
  teamLabel,
} from "./game/util";

void preloadIcons();

const BUILD_NAME: Record<BuildingKind, string> = {
  bier: "Bierstand",
  fanshop: "Fanshop",
  ordner: "Ordnerposten",
};

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

/** Heilradius als % der Gang-Breite (gangX×100). */
function formatHealRadius(level: number): string {
  return String(Math.round(stewardPostRadius(level) * 100));
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

function statChipHtml(
  label: string,
  value: string,
  opts?: { delta?: boolean; id?: string },
): string {
  const id = opts?.id ? ` id="${opts.id}"` : "";
  const deltaCls = opts?.delta ? " yield-delta" : "";
  return `<span class="stat-chip${deltaCls}"${id}><span class="stat-label">${label}</span><span class="stat-amt">${value}</span></span>`;
}

/** Live Verb+Kosten über Button-Chrome (kein gebackenes Label). */
function arCostBtnHtml(opts: {
  kind: "bauen" | "kaufen" | "upgrade" | "senden";
  full: string;
  short: string;
  amount: number | string;
  currencySrc?: string;
  payId?: string;
  /** Echter Button (Personen-Rail); sonst dekoratives span (Build-Karten). */
  asButton?: boolean;
  btnId?: string;
  btnAttrs?: string;
}): string {
  const cur = opts.currencySrc ?? UI_ICONS.currencyGold;
  const payId = opts.payId ? ` id="${opts.payId}"` : "";
  const inner = `<span class="inner"><span class="txt"><span class="full">${opts.full}</span><span class="short">${opts.short}</span></span><span class="pay"${payId}><img src="${cur}" alt=""><span class="amt">${opts.amount}</span></span></span>`;
  if (opts.asButton) {
    const id = opts.btnId ? ` id="${opts.btnId}"` : "";
    const attrs = opts.btnAttrs ? ` ${opts.btnAttrs}` : "";
    return `<button type="button" class="ar-cost-btn ${opts.kind}"${id}${attrs}>${inner}</button>`;
  }
  return `<span class="ar-cost-btn ${opts.kind}" aria-hidden="true">${inner}</span>`;
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
 * Personen Kauf/UP (Alt D):
 * Figur links, Ertrag darunter; Kosten groß rechts daneben.
 * Abstände %-relativ zur Button-Face (skalierbar).
 */
function personActionBtnHtml(opts: {
  kind: "kaufen" | "upgrade";
  unitSrc: string;
  unitId: string;
  amount: number | string;
  currencySrc: string;
  payId: string;
  yieldHtml: string;
  asButton?: boolean;
  btnId?: string;
  btnAttrs?: string;
}): string {
  const payId = opts.payId ? ` id="${opts.payId}"` : "";
  const unitId = opts.unitId ? ` id="${opts.unitId}"` : "";
  const inner = `<span class="inner person-btn-inner"><span class="unit-col"><img class="unit-ico"${unitId} src="${opts.unitSrc}" alt="">${opts.yieldHtml}</span><span class="pay pay-lg"${payId}><img src="${opts.currencySrc}" alt=""><span class="amt">${opts.amount}</span></span></span>`;
  if (opts.asButton !== false) {
    const id = opts.btnId ? ` id="${opts.btnId}"` : "";
    const attrs = opts.btnAttrs ? ` ${opts.btnAttrs}` : "";
    return `<button type="button" class="ar-cost-btn ${opts.kind} person-action"${id}${attrs}>${inner}</button>`;
  }
  return `<span class="ar-cost-btn ${opts.kind} person-action" aria-hidden="true">${inner}</span>`;
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
    personActionBtnHtml({
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
    personActionBtnHtml({
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
      btnAttrs: `data-unit-up="${kind}" title="Upgrade"`,
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

function setPayAmt(root: ParentNode, payId: string, amount: number | string): void {
  const el = root.querySelector(`#${payId} .amt`) ?? root.querySelector(`#${payId}`);
  if (el) el.textContent = String(amount);
}

const app = document.querySelector<HTMLDivElement>("#app")!;

type Screen = "menu" | "setup" | "match" | "result";

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
};

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
  else if (state.screen === "setup") renderSetup();
  else if (state.screen === "match") renderMatchScreen();
  else renderResult();
}

function renderMenu(): void {
  const iosHint = isIos() && !isStandalone();
  app.innerHTML = `
    <div class="screen menu">
      <div>
        <p class="sub">Stadion · Blöcke · Gang · Stimmung</p>
        <h1 class="brand">LaneLink</h1>
        <p class="sub">KSC vs VfB — Querformat</p>
      </div>
      <div class="card stack">
        <button class="btn ksc" id="solo">Solo vs KI</button>
        <button class="btn secondary" id="fs-menu">Vollbild</button>
      </div>
      ${
        iosHint
          ? `<p class="tiny fs-hint">iPhone: Teilen → <b>Zum Home-Bildschirm</b> — dann ohne Tabs/Adressleiste.</p>`
          : `<p class="tiny fs-hint">Tipp: Vollbild für volle Spielfläche (ohne Browser-Leisten).</p>`
      }
      <div class="card stack">
        <label class="field">Verein
          <select id="team"><option value="ksc">KSC</option><option value="vfb">VfB</option></select>
        </label>
        <label class="field">KI
          <select id="diff">
            <option value="easy" selected>Einfach</option>
            <option value="normal">Normal</option>
            <option value="hard">Schwer</option>
          </select>
        </label>
      </div>
    </div>`;
  app.querySelector("#fs-menu")!.addEventListener("click", () => {
    void goFullscreen();
  });
  app.querySelector("#solo")!.addEventListener("click", () => {
    void goFullscreen();
    state.settings = {
      playerTeam: (app.querySelector("#team") as HTMLSelectElement).value as TeamId,
      difficulty: (app.querySelector("#diff") as HTMLSelectElement)
        .value as SoloSettings["difficulty"],
      behavior: "balanced",
    };
    state.setup = defaultSetup();
    go("setup");
  });
}

function renderSetup(): void {
  const mix = state.setup.mix;
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
        <p class="sub">8 Fans für den Heimblock (Startaufstellung)</p>
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
  app.querySelector("#back")!.addEventListener("click", () => go("menu"));
  // Start requires an active click; do not gate match entry on fullscreen
  // (FS is optional after kickoff — otherwise playtests look like Anpfiff "failed").
  app.querySelector("#start")!.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (!isValidMix(state.setup.mix)) return;
    state.match = new Match({
      settings: state.settings,
      playerSetup: state.setup,
      aiSetup: { mix: defaultMix() },
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
      <aside class="side-rail left-rail" aria-label="Personen">
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
        <!-- Hidden send controls — still wired for combat orders, not shown in rail -->
        <button type="button" class="sr-only" id="btn-pyro-fight" tabindex="-1" aria-hidden="true">Senden Ultra</button>
        <button type="button" class="sr-only" id="btn-hooligan" tabindex="-1" aria-hidden="true">Senden Hool</button>
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
      </aside>
      <div id="game-wrap">
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
            <span id="mom-p-tor">nächstes Tor Heim 50%</span>
            <span id="mom-p-gast">Stimmung Gast 1.0</span>
          </div>
          <div class="combat-banner hidden" id="combat-banner"></div>
        </div>
        <canvas id="c"></canvas>
        <div class="toast" id="toast"></div>
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
                ? `<p class="tiny">iPhone: Teilen-Symbol → <b>Zum Home-Bildschirm</b>, dann LaneLink von dort öffnen.</p>`
                : `<p class="tiny">Danach Handy quer halten.</p>`
            }
          </div>
        </div>
      </div>
      <aside class="side-rail right-rail build-rail" id="build-rail" aria-label="Gebäude" hidden>
        <header class="rail-banner" id="build-rail-title">Bauen</header>
        <div class="build-rows" id="build-place-rows">
          <button type="button" class="build-card" data-pending-build="bier">
            <div class="build-top">
              <img class="build-preview" src="icons/stands/bier-${tc}-1.png" alt="">
              <div class="build-info">
                <span class="build-name">Bierstand</span>
                ${yieldChipHtml("bier", buildingYieldPerSec("bier", 1))}
              </div>
            </div>
            ${arCostBtnHtml({ kind: "bauen", full: "BAUEN", short: "BAU", amount: BUILD_COST.bier })}
          </button>
          <button type="button" class="build-card" data-pending-build="fanshop">
            <div class="build-top">
              <img class="build-preview" src="icons/stands/fanshop-${tc}-1.png" alt="">
              <div class="build-info">
                <span class="build-name">Fanshop</span>
                ${yieldChipHtml("fanshop", buildingYieldPerSec("fanshop", 1))}
              </div>
            </div>
            ${arCostBtnHtml({ kind: "bauen", full: "BAUEN", short: "BAU", amount: BUILD_COST.fanshop })}
          </button>
          <button type="button" class="build-card" data-pending-build="ordner">
            <div class="build-top">
              <img class="build-preview" src="icons/stands/ordner-${tc}-1.png" alt="">
              <div class="build-info">
                <span class="build-name">Ordnerposten</span>
                ${yieldChipHtml("ordner", buildingYieldPerSec("ordner", 1))}
                ${statChipHtml("HP", String(ordnerPostMaxHp(1)))}
                ${statChipHtml("Radius", `${formatHealRadius(1)}%`)}
                ${statChipHtml("Heilung", `${stewardHealPerSec(1)}/s`)}
              </div>
            </div>
            ${arCostBtnHtml({ kind: "bauen", full: "BAUEN", short: "BAU", amount: BUILD_COST.ordner })}
          </button>
        </div>
        <div class="build-rows hidden" id="build-upgrade-rows">
          <div class="upgrade-panel" id="upgrade-panel">
            <p class="upgrade-title" id="upgrade-title">Gebäude</p>
            <div class="upgrade-preview">
              <div class="up-stage">
                <img id="upgrade-from-img" src="" alt="">
                <span class="up-lv" id="upgrade-from-lv">Lv1</span>
                <div class="up-stats" id="upgrade-from-stats">
                  <span class="yield-chip" id="upgrade-from-yield"><img src="${UI_ICONS.currencyBier}" alt=""><span class="yield-amt">0.41/s</span></span>
                </div>
              </div>
              <div class="up-arrow" aria-hidden="true">→</div>
              <div class="up-stage up-stage-next">
                <img id="upgrade-to-img" src="" alt="">
                <span class="up-lv" id="upgrade-to-lv">Lv2</span>
                <div class="up-stats" id="upgrade-to-stats">
                  <span class="yield-chip yield-delta" id="upgrade-to-yield"><img src="${UI_ICONS.currencyBier}" alt=""><span class="yield-amt">+0.17/s</span></span>
                </div>
              </div>
            </div>
            <button type="button" class="ar-cost-btn upgrade" id="rail-upgrade">
              <span class="inner">
                <span class="txt"><span class="full">UPGRADE</span><span class="short">UP</span></span>
                <span class="pay" id="rail-upgrade-pay"><img src="${UI_ICONS.currencyGold}" alt=""><span id="rail-upgrade-cost">—</span></span>
              </span>
            </button>
          </div>
        </div>
        <button type="button" class="rail-close" id="build-rail-close">Schließen</button>
      </aside>
    </div>`;

  const canvas = app.querySelector<HTMLCanvasElement>("#c")!;
  const wrap = app.querySelector<HTMLDivElement>("#game-wrap")!;
  const ctx = canvas.getContext("2d")!;
  const buildMenu = app.querySelector<HTMLDivElement>("#build-menu")!;
  const btnUpgrade = app.querySelector<HTMLButtonElement>("#btn-upgrade")!;
  const btnHire = app.querySelector<HTMLButtonElement>("#btn-hire-steward")!;
  const fsGate = app.querySelector<HTMLDivElement>("#fs-gate")!;
  const pitchHud = app.querySelector<HTMLDivElement>("#pitch-hud")!;
  const buildRail = app.querySelector<HTMLElement>("#build-rail")!;
  const buildPlaceRows = app.querySelector<HTMLElement>("#build-place-rows")!;
  const buildUpgradeRows = app.querySelector<HTMLElement>("#build-upgrade-rows")!;
  const shell = app.querySelector<HTMLElement>(".match-shell.matchday")!;

  const layoutHud = () => {
    const rect = wrap.getBoundingClientRect();
    if (rect.width < 32 || rect.height < 32) return;
    pitchHud.style.top = "0";
    pitchHud.style.left = "0";
    pitchHud.style.width = "100%";
    pitchHud.style.height = "auto";
  };

  const closeBuildRail = () => {
    state.pendingBuild = null;
    state.buildTarget = null;
    m.buildMenu = null;
    buildRail.hidden = true;
    buildRail.classList.remove("open");
    shell.classList.remove("build-open");
    wrap.classList.remove("placing");
    buildPlaceRows.classList.remove("hidden");
    buildUpgradeRows.classList.add("hidden");
  };

  const fillUpgradeStats = (
    host: Element | null,
    kind: BuildingKind,
    level: number,
    deltaFrom: number | null,
  ) => {
    if (!host) return;
    const isDelta = deltaFrom != null;
    const lv = isDelta ? level : level;
    const parts: string[] = [];
    if (kind === "ordner") {
      const hp = ordnerPostMaxHp(lv);
      const radius = formatHealRadius(lv);
      const heal = stewardHealPerSec(lv);
      if (isDelta) {
        const dHp = hp - ordnerPostMaxHp(deltaFrom!);
        const dR = Math.round(stewardPostRadius(lv) * 100) - Math.round(stewardPostRadius(deltaFrom!) * 100);
        const dHeal = heal - stewardHealPerSec(deltaFrom!);
        parts.push(statChipHtml("HP", `${dHp >= 0 ? "+" : ""}${dHp}`, { delta: true }));
        parts.push(statChipHtml("Radius", `${dR >= 0 ? "+" : ""}${dR}%`, { delta: true }));
        parts.push(statChipHtml("Heilung", `${dHeal >= 0 ? "+" : ""}${dHeal}/s`, { delta: true }));
      } else {
        parts.push(statChipHtml("HP", String(hp)));
        parts.push(statChipHtml("Radius", `${radius}%`));
        parts.push(statChipHtml("Heilung", `${heal}/s`));
      }
      // Sicherheit-Ertrag zusätzlich
      const y = buildingYieldPerSec(kind, lv);
      if (isDelta) {
        const dY = y - buildingYieldPerSec(kind, deltaFrom!);
        parts.push(yieldChipHtml(kind, dY, { delta: true }));
      } else {
        parts.push(yieldChipHtml(kind, y));
      }
    } else {
      const y = buildingYieldPerSec(kind, lv);
      if (isDelta) {
        parts.push(yieldChipHtml(kind, y - buildingYieldPerSec(kind, deltaFrom!), { delta: true }));
      } else {
        parts.push(yieldChipHtml(kind, y));
      }
    }
    host.innerHTML = parts.join("");
  };

  const openBuildRail = (mode: "place" | "upgrade", target: { blockId: number; index: number }) => {
    state.buildTarget = target;
    m.selectedSlot = target;
    m.buildMenu = target;
    buildRail.hidden = false;
    buildRail.classList.add("open");
    shell.classList.add("build-open");
    const title = app.querySelector("#build-rail-title");
    if (mode === "place") {
      buildPlaceRows.classList.remove("hidden");
      buildUpgradeRows.classList.add("hidden");
      if (title) title.textContent = "Bauen";
      syncPendingBuildUi();
    } else {
      buildPlaceRows.classList.add("hidden");
      buildUpgradeRows.classList.remove("hidden");
      if (title) title.textContent = "Upgrade";
      const slot = m.slots.find(
        (s) => s.blockId === target.blockId && s.index === target.index,
      );
      const lv = slot?.level ?? 1;
      const next = lv + 1;
      const cost = slot ? (UPGRADE_COST as readonly number[])[next] : null;
      const upBtn = app.querySelector<HTMLButtonElement>("#rail-upgrade")!;
      const costEl = app.querySelector("#rail-upgrade-cost");
      const fromImg = app.querySelector<HTMLImageElement>("#upgrade-from-img");
      const toImg = app.querySelector<HTMLImageElement>("#upgrade-to-img");
      const fromLv = app.querySelector("#upgrade-from-lv");
      const toLv = app.querySelector("#upgrade-to-lv");
      const fromStats = app.querySelector("#upgrade-from-stats");
      const toStats = app.querySelector("#upgrade-to-stats");
      const upTitle = app.querySelector("#upgrade-title");
      const kind = slot?.building;
      const name = kind ? BUILD_NAME[kind] : "Gebäude";
      if (upTitle) upTitle.textContent = name;
      if (kind && fromImg && toImg) {
        const fromSrc = standIconPath(kind, tc, lv);
        const toSrc = standIconPath(kind, tc, Math.min(UPGRADE_MAX, next));
        fromImg.src = fromSrc.startsWith("/") ? fromSrc : `/${fromSrc}`;
        toImg.src = toSrc.startsWith("/") ? toSrc : `/${toSrc}`;
        fromImg.alt = `${name} Lv${lv}`;
        toImg.alt = `${name} Lv${Math.min(UPGRADE_MAX, next)}`;
      }
      if (fromLv) fromLv.textContent = `Lv${lv}`;
      const atMax = !!(slot && slot.level >= UPGRADE_MAX);
      if (toLv) toLv.textContent = atMax ? "Max" : `Lv${next}`;
      if (kind) {
        fillUpgradeStats(fromStats, kind, lv, null);
        if (atMax) {
          if (toStats) toStats.innerHTML = "";
        } else {
          fillUpgradeStats(toStats, kind, next, lv);
        }
      }
      if (cost == null || !slot || atMax) {
        upBtn.disabled = true;
        upBtn.classList.add("cd");
        if (costEl) costEl.textContent = "—";
      } else {
        const broke = m.gold < cost;
        upBtn.disabled = broke;
        upBtn.classList.toggle("cd", broke);
        if (costEl) costEl.textContent = String(cost);
      }
    }
  };

  const syncPendingBuildUi = () => {
    app.querySelectorAll<HTMLButtonElement>("[data-pending-build]").forEach((btn) => {
      const kind = btn.dataset.pendingBuild as BuildingKind;
      const on = state.pendingBuild === kind;
      btn.classList.toggle("selected", on);
      btn.classList.toggle("cd", m.gold < BUILD_COST[kind]);
    });
  };

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
    closeBuildRail();
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
      return;
    }
    closeBuildRail();
  };

  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Kauf nur über Personen-Sidebar — Block-Klick öffnet keinen Sitz-Kauf mehr
    const hit = hitSlot(m, mx, my);
    if (hit) {
      showBuildMenu(hit.blockId, hit.index);
      syncOverlay();
      return;
    }
    hideMenus();
  });

  const syncOverlay = () => {
    const hb = app.querySelector<HTMLButtonElement>("#btn-hooligan")!;
    const hready = m.hooliganOrderReady();
    hb.classList.toggle("ready", hready);
    hb.classList.toggle("cd", !hready);
    hb.disabled = !hready;
    hb.title = hready
      ? `Senden · ${HOOLIGAN_ORDER_BEER} Bier`
      : `Senden · braucht ${HOOLIGAN_ORDER_BEER} Bier`;
    const pf = app.querySelector<HTMLButtonElement>("#btn-pyro-fight")!;
    const pready = m.pyroFightReady();
    pf.classList.toggle("ready", pready);
    pf.classList.toggle("cd", !pready);
    pf.disabled = !pready;
    pf.title = pready
      ? `Senden · ${PYRO_FIGHT_MERCH} Fanartikel`
      : `Senden · braucht ${PYRO_FIGHT_MERCH} Fanartikel`;
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
  };

  app.querySelector("#btn-hooligan")!.addEventListener("click", () => {
    m.tryHooliganOrder();
    syncOverlay();
  });
  app.querySelector("#btn-pyro-fight")!.addEventListener("click", () => {
    m.tryPyroFight();
    syncOverlay();
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
  app.querySelectorAll<HTMLButtonElement>("[data-pending-build]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kind = btn.dataset.pendingBuild as BuildingKind;
      if (!state.buildTarget) {
        m.toast("Zuerst einen freien Plot tippen");
        return;
      }
      m.buildMenu = state.buildTarget;
      m.selectedSlot = state.buildTarget;
      const ok = m.tryBuild(kind);
      if (ok) {
        closeBuildRail();
      } else {
        syncPendingBuildUi();
      }
      syncOverlay();
    });
  });
  app.querySelector("#rail-upgrade")?.addEventListener("click", () => {
    if (state.buildTarget) {
      m.buildMenu = state.buildTarget;
      m.tryUpgrade();
    }
    closeBuildRail();
    syncOverlay();
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
  app.querySelector("#person-rail-close")?.addEventListener("click", () => {
    hideMenus();
    syncOverlay();
  });

  syncOverlay();
  state.last = performance.now();
  const loop = (now: number) => {
    if (state.screen !== "match" || !state.match) return;
    const dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;
    try {
      m.update(dt);
      drawMatch(ctx, m);
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
        const buyIco = app.querySelector<HTMLImageElement>(`#buy-ico-${kind}`);
        if (buyIco) {
          buyIco.src = unitIconPath(
            kind === "ordner" ? "ordner" : kind,
            tc,
            tech,
          );
        }
        const upIco = app.querySelector<HTMLImageElement>(`#up-ico-${kind}`);
        if (upIco) {
          upIco.src = unitIconPath(
            kind === "ordner" ? "ordner" : kind,
            tc,
            next,
          );
        }
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
          upBtn.title =
            cost == null
              ? "Max. Stufe"
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
      if (lpT) lpT.textContent = `nächstes Tor Heim ${Math.round(ch.pHeim * 100)}%`;
      if (lpG) lpG.textContent = `Kurve Gast ${m.moodGaeste.toFixed(1)}`;
      const bar = app.querySelector("#momentum-bar");
      if (bar) {
        bar.classList.remove("kick");
      }
      const banner = app.querySelector("#combat-banner");
      if (banner) {
        const st = m.combatStatus();
        if (st) {
          banner.textContent = st;
          banner.classList.remove("hidden");
        } else banner.classList.add("hidden");
      }
      const toast = app.querySelector("#toast");
      if (toast) {
        const t = m.toasts[0];
        if (t) {
          toast.textContent = t.text;
          toast.classList.add("show");
        } else toast.classList.remove("show");
      }
      if (Math.floor(now / 250) !== Math.floor((now - dt * 1000) / 250)) syncOverlay();
      if (m.result) {
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
  const m = state.match!;
  const r = m.result!;
  const youWin = r.winner === state.settings.playerTeam;
  app.innerHTML = `
    <div class="screen menu">
      <p class="sub">${r.detail}</p>
      <h1 class="brand">${youWin ? "Sieg!" : "Niederlage"}</h1>
      <p class="sub">${teamLabel(r.winner)} · ${r.score[0]}:${r.score[1]} · ${formatMinute(m.minute)}</p>
      <div class="row">
        <button class="btn secondary grow" id="menu">Menü</button>
        <button class="btn ksc grow" id="again">Rematch</button>
      </div>
    </div>`;
  app.querySelector("#menu")!.addEventListener("click", () => go("menu"));
  app.querySelector("#again")!.addEventListener("click", () => go("setup"));
}

render();

/** Visual QA: `?demoStands=1` auto-starts a paused match with filled Bau-slots. */
if (new URLSearchParams(location.search).has("demoStands")) {
  state.settings = defaultSoloSettings();
  state.setup = defaultSetup();
  state.match = new Match({
    settings: state.settings,
    playerSetup: state.setup,
    aiSetup: { mix: defaultMix() },
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
    if (p.kind === "ordner") {
      s.structMaxHp = 120;
      s.structHp = 120;
    }
  }
  go("match");
}
