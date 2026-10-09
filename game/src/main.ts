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
  ordnerPostMaxHp,
  productionRate,
  stewardHealPerSec,
  stewardPostRadius,
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

function buildingYieldUnit(kind: BuildingKind): string {
  if (kind === "bier") return "Bier";
  if (kind === "fanshop") return "Fanart.";
  return "Sich.";
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

function yieldChipHtml(
  kind: BuildingKind,
  perSec: number,
  opts?: { delta?: boolean; id?: string },
): string {
  const sign = opts?.delta ? (perSec >= 0 ? "+" : "") : "";
  const id = opts?.id ? ` id="${opts.id}"` : "";
  const deltaCls = opts?.delta ? " yield-delta" : "";
  return `<span class="yield-chip${deltaCls}"${id}><img src="${buildingYieldCurrency(kind)}" alt=""><span class="yield-amt">${sign}${formatYieldPerSec(perSec)} ${buildingYieldUnit(kind)}/s</span></span>`;
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
  kind: "bauen" | "kaufen" | "upgrade";
  full: string;
  short: string;
  amount: number | string;
  currencySrc?: string;
  payId?: string;
}): string {
  const cur = opts.currencySrc ?? UI_ICONS.currencyGold;
  const payId = opts.payId ? ` id="${opts.payId}"` : "";
  return `<span class="ar-cost-btn ${opts.kind}" aria-hidden="true"><span class="inner"><span class="txt"><span class="full">${opts.full}</span><span class="short">${opts.short}</span></span><span class="pay"${payId}><img src="${cur}" alt="">${opts.amount}</span></span></span>`;
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
        <p class="freie-plaetze">Einheiten gesamt <b id="free-seats">0</b></p>
        <div class="unit-rows">
          <div class="ur-row" data-card-buy="normalos">
            <div class="ur-top">
              <img class="ur-icon" data-unit-icon="normalos" src="${unitIconPath("normalos", tc, 1)}" alt="">
              <div class="ur-meta">
                <span class="ur-name">Fans <small class="ur-lv" data-unit-lv="normalos">Lv1</small></span>
                <b class="ur-count" id="fb-n">0</b>
                <p class="ur-cost">${BUY_COST.normalos.security} Sicherheit</p>
              </div>
            </div>
            <div class="ur-actions ur-actions-dual">
              <button type="button" class="ar-icon-btn ar-kaufen" data-quick-buy="normalos" title="Kaufen">
                <img class="btn-ready" src="${UI_ICONS.btnKaufenGreen}" alt="Kaufen">
                <img class="btn-cd" src="${UI_ICONS.btnKaufenGrey}" alt="Kaufen">
              </button>
              <button type="button" class="ar-lv-btn" data-unit-up="normalos" title="Upgrade">▲</button>
            </div>
          </div>
          <div class="ur-row" data-card-buy="ultras">
            <div class="ur-top">
              <img class="ur-icon" data-unit-icon="ultras" src="${unitIconPath("ultras", tc, 1)}" alt="">
              <div class="ur-meta">
                <span class="ur-name">Ultras <small class="ur-lv" data-unit-lv="ultras">Lv1</small></span>
                <b class="ur-count" id="fb-u">0</b>
                <p class="ur-cost">${BUY_COST.ultras.merch} Fanartikel</p>
              </div>
            </div>
            <div class="ur-actions ur-actions-triple">
              <button type="button" class="ar-icon-btn ar-kaufen" data-quick-buy="ultras" title="Kaufen">
                <img class="btn-ready" src="${UI_ICONS.btnKaufenGreen}" alt="Kaufen">
                <img class="btn-cd" src="${UI_ICONS.btnKaufenGrey}" alt="Kaufen">
              </button>
              <button class="ar-icon-btn ar-senden" id="btn-pyro-fight" type="button" title="Senden">
                <img class="btn-ready" src="${UI_ICONS.btnSendenGreen}" alt="Senden">
                <img class="btn-cd" src="${UI_ICONS.btnSendenGrey}" alt="Senden">
              </button>
              <button type="button" class="ar-lv-btn" data-unit-up="ultras" title="Upgrade">▲</button>
            </div>
          </div>
          <div class="ur-row" data-card-buy="hooligans">
            <div class="ur-top">
              <img class="ur-icon" data-unit-icon="hooligans" src="${unitIconPath("hooligans", tc, 1)}" alt="">
              <div class="ur-meta">
                <span class="ur-name">Hooligans <small class="ur-lv" data-unit-lv="hooligans">Lv1</small></span>
                <b class="ur-count" id="fb-h">0</b>
                <p class="ur-cost">${BUY_COST.hooligans.beer} Bier</p>
              </div>
            </div>
            <div class="ur-actions ur-actions-triple">
              <button type="button" class="ar-icon-btn ar-kaufen" data-quick-buy="hooligans" title="Kaufen">
                <img class="btn-ready" src="${UI_ICONS.btnKaufenGreen}" alt="Kaufen">
                <img class="btn-cd" src="${UI_ICONS.btnKaufenGrey}" alt="Kaufen">
              </button>
              <button class="ar-icon-btn ar-senden" id="btn-hooligan" type="button" title="Senden">
                <img class="btn-ready" src="${UI_ICONS.btnSendenGreen}" alt="Senden">
                <img class="btn-cd" src="${UI_ICONS.btnSendenGrey}" alt="Senden">
              </button>
              <button type="button" class="ar-lv-btn" data-unit-up="hooligans" title="Upgrade">▲</button>
            </div>
          </div>
          <div class="ur-row ur-row-ordner" data-card-buy="ordner">
            <div class="ur-top">
              <img class="ur-icon" data-unit-icon="ordner" src="${unitIconPath("ordner", tc, 1)}" alt="">
              <div class="ur-meta">
                <span class="ur-name">Ordner <small class="ur-lv" data-unit-lv="ordner">Lv1</small></span>
                <b class="ur-count" id="fb-o">0</b>
                <p class="ur-cost">${STEWARD_HIRE_GOLD} Gold</p>
              </div>
            </div>
            <div class="ur-actions ur-actions-dual">
              <button type="button" class="ar-icon-btn ar-kaufen" id="btn-hire-ordner" title="Kaufen">
                <img class="btn-ready" src="${UI_ICONS.btnKaufenGreen}" alt="Kaufen">
                <img class="btn-cd" src="${UI_ICONS.btnKaufenGrey}" alt="Kaufen">
              </button>
              <button type="button" class="ar-lv-btn" data-unit-up="ordner" title="Upgrade">▲</button>
            </div>
          </div>
        </div>
        <div class="fanbase-col gast" aria-label="Gegner">
          <span class="fb"><i>N</i><b id="fb-en">0</b></span>
          <span class="fb"><i>U</i><b id="fb-eu">0</b></span>
          <span class="fb"><i>H</i><b id="fb-eh">0</b></span>
          <span class="fb"><i>O</i><b id="fb-eo">0</b></span>
        </div>
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
        </div>
        <div class="build-rows hidden" id="build-upgrade-rows">
          <div class="upgrade-panel" id="upgrade-panel">
            <p class="upgrade-title" id="upgrade-title">Gebäude</p>
            <div class="upgrade-preview">
              <div class="up-stage">
                <img id="upgrade-from-img" src="" alt="">
                <span class="up-lv" id="upgrade-from-lv">Lv1</span>
                <div class="up-stats" id="upgrade-from-stats">
                  <span class="yield-chip" id="upgrade-from-yield"><img src="${UI_ICONS.currencyBier}" alt=""><span class="yield-amt">0.41 Bier/s</span></span>
                </div>
              </div>
              <div class="up-arrow" aria-hidden="true">→</div>
              <div class="up-stage up-stage-next">
                <img id="upgrade-to-img" src="" alt="">
                <span class="up-lv" id="upgrade-to-lv">Lv2</span>
                <div class="up-stats" id="upgrade-to-stats">
                  <span class="yield-chip yield-delta" id="upgrade-to-yield"><img src="${UI_ICONS.currencyBier}" alt=""><span class="yield-amt">+0.17 Bier/s</span></span>
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
          <button type="button" class="build-card" id="rail-hire-ordner">
            <div class="build-top">
              <img class="build-preview" src="${unitIconPath("ordner", tc, 1)}" alt="">
              <div class="build-info">
                <span class="build-name">Ordner anheuern</span>
              </div>
            </div>
            ${arCostBtnHtml({ kind: "kaufen", full: "KAUFEN", short: "KAUF", amount: STEWARD_HIRE_GOLD })}
          </button>
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
      const hireBtn = app.querySelector<HTMLButtonElement>("#rail-hire-ordner")!;
      const canHire = !!(slot && m.canHireSteward(slot));
      hireBtn.classList.toggle("hidden", slot?.building !== "ordner");
      hireBtn.disabled = !canHire;
      hireBtn.classList.toggle("cd", !canHire);
      buildUpgradeRows.classList.toggle("hire-open", slot?.building === "ordner");
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
    const freeEl = app.querySelector("#free-seats");
    if (freeEl) {
      const o = m.countTeamFans(m.playerTeam);
      freeEl.textContent = String(o.normalos + o.ultras + o.hooligans + o.ordner);
    }
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
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      m.tryBuyFanQuick(btn.dataset.quickBuy as FanKind);
      syncOverlay();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-unit-up]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const kind = btn.dataset.unitUp as FanKind | "ordner";
      m.tryUpgradeUnit(kind);
      syncOverlay();
    });
  });
  // Whole brown card is a Kaufen hit-target (Bloons-style); Senden/Upgrade stay own buttons
  app.querySelectorAll<HTMLElement>("[data-card-buy]").forEach((card) => {
    card.addEventListener("click", (e) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest(".ar-senden, .ar-kaufen, .ar-lv-btn, button")) return;
      const kind = card.dataset.cardBuy;
      if (kind === "ordner") {
        m.tryHireStewardQuick();
      } else if (kind === "normalos" || kind === "ultras" || kind === "hooligans") {
        m.tryBuyFanQuick(kind);
      }
      syncOverlay();
    });
  });
  app.querySelector("#btn-hooligan")?.addEventListener(
    "click",
    (e) => e.stopPropagation(),
    true,
  );
  app.querySelector("#btn-pyro-fight")?.addEventListener(
    "click",
    (e) => e.stopPropagation(),
    true,
  );
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
  app.querySelector("#rail-hire-ordner")?.addEventListener("click", () => {
    if (state.buildTarget) {
      m.buildMenu = state.buildTarget;
      m.selectedSlot = state.buildTarget;
      m.tryHireSteward();
      openBuildRail("upgrade", state.buildTarget);
    }
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
      // Sidebar icons / level badges follow lowest living unit level per kind
      const tcNow = teamColor(m.playerTeam);
      const kinds: (FanKind | "ordner")[] = [
        "normalos",
        "ultras",
        "hooligans",
        "ordner",
      ];
      for (const kind of kinds) {
        const lvMin = m.minUnitLevel(kind);
        const lvMax = m.maxUnitLevel(kind);
        const img = app.querySelector<HTMLImageElement>(
          `[data-unit-icon="${kind}"]`,
        );
        if (img) {
          // Icon follows strongest unit so upgrades are visually obvious
          const next = unitIconPath(kind, tcNow, Math.max(1, lvMax || 1));
          if (img.getAttribute("src") !== next) img.src = next;
        }
        const lvEl = app.querySelector(`[data-unit-lv="${kind}"]`);
        if (lvEl) lvEl.textContent = m.unitLevelLabel(kind);
        const upBtn = app.querySelector<HTMLButtonElement>(
          `[data-unit-up="${kind}"]`,
        );
        if (upBtn) {
          const cost = m.unitUpgradeCostFor(kind);
          const ok = m.canUpgradeUnit(kind);
          upBtn.disabled = !ok;
          upBtn.classList.toggle("ready", ok);
          upBtn.classList.toggle("cd", !ok);
          upBtn.textContent = cost != null ? `▲${cost}` : "▲";
          upBtn.title =
            cost == null
              ? "Max. Stufe"
              : `Schwächste Einheit → Lv${lvMin + 1} · ${cost}€`;
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
