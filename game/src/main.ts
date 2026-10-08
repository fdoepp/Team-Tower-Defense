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
import { drawMatch, hitSeat, hitSlot } from "./game/render";
import { syncTribuneLayout } from "./game/layout";
import {
  SCOREBOARD_NATIVE,
  UI_ICONS,
  currencyIconPath,
  preloadIcons,
  standIconPath,
  teamColor,
  unitHeadIconPath,
  unitIconPath,
} from "./game/assets";
import {
  BUILD_COST,
  BUY_COST,
  HOOLIGAN_ORDER_BEER,
  MIX_MAX,
  MIX_MIN,
  PYRO_FIGHT_MERCH,
  STEWARD_HIRE_GOLD,
  UNIT_FULL_LABEL,
  UPGRADE_COST,
  UPGRADE_MAX,
  unitBuyCost,
  unitUpgradeCost,
  type BuildingKind,
  type FanKind,
  type FanMix,
  type SoloSettings,
  type TeamId,
  type UnitUiKind,
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
        <p class="sub">8 Fans für den Heimblock (max. 12)</p>
        <h1 class="brand" style="font-size:1.6rem">Aufstellung</h1>
      </div>
      <div class="card stack">
        ${row("normalos", "Fans (Momentum · Sicherheit)")}
        ${row("ultras", "Ultras (Senden · Fanartikel)")}
        ${row("hooligans", "Hooligans (Nahkampf · Bier)")}
        <p class="tiny">Summe ${mixSum(mix)} / 8 ${isValidMix(mix) ? "✓" : ""}</p>
      </div>
      <div class="row">
        <button class="btn secondary grow" id="back">Zurück</button>
        <button class="btn ksc grow" id="start" ${isValidMix(mix) ? "" : "disabled"}>Anpfiff</button>
      </div>
    </div>`;
  app.querySelector("#back")!.addEventListener("click", () => go("menu"));
  app.querySelector("#start")!.addEventListener("click", () => {
    void goFullscreen();
    state.match = new Match({
      settings: state.settings,
      playerSetup: state.setup,
      aiSetup: { mix: defaultMix() },
    });
    go("match");
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
        <div class="unit-rows">
          ${(["normalos", "ultras", "hooligans", "ordner"] as UnitUiKind[])
            .map((kind) => {
              const buy = unitBuyCost(kind);
              const icon = unitHeadIconPath(kind, tc, 1);
              const countId =
                kind === "normalos"
                  ? "fb-n"
                  : kind === "ultras"
                    ? "fb-u"
                    : kind === "hooligans"
                      ? "fb-h"
                      : "fb-o";
              const buyCur = currencyIconPath(buy.currency);
              const curSrc = (p: string) => (p.startsWith("/") ? p : `/${p}`);
              const buyBtn =
                kind === "ordner"
                  ? `<button type="button" class="ar-cost-btn ar-kaufen" id="btn-hire-ordner" title="Kaufen">
                  <span class="ar-verb">KAUFEN</span>
                  <img class="ar-cost-ico" data-buy-cost-icon src="${curSrc(buyCur)}" alt="">
                  <span class="ar-cost-amt" data-buy-cost-amt>${buy.amount}</span>
                </button>`
                  : `<button type="button" class="ar-cost-btn ar-kaufen" data-quick-buy="${kind}" title="Kaufen">
                  <span class="ar-verb">KAUFEN</span>
                  <img class="ar-cost-ico" data-buy-cost-icon src="${curSrc(buyCur)}" alt="">
                  <span class="ar-cost-amt" data-buy-cost-amt>${buy.amount}</span>
                </button>`;
              const send =
                kind === "ultras"
                  ? `<button class="ar-cost-btn ar-senden" id="btn-pyro-fight" type="button" title="Senden">
                  <span class="ar-verb">SENDEN</span>
                  <img class="ar-cost-ico" data-send-cost-icon src="${curSrc(UI_ICONS.currencyFanartikel)}" alt="">
                  <span class="ar-cost-amt" data-send-cost-amt>${PYRO_FIGHT_MERCH}</span>
                </button>`
                  : kind === "hooligans"
                    ? `<button class="ar-cost-btn ar-senden" id="btn-hooligan" type="button" title="Senden">
                  <span class="ar-verb">SENDEN</span>
                  <img class="ar-cost-ico" data-send-cost-icon src="${curSrc(UI_ICONS.currencyBier)}" alt="">
                  <span class="ar-cost-amt" data-send-cost-amt>${HOOLIGAN_ORDER_BEER}</span>
                </button>`
                    : "";
              const upCost = unitUpgradeCost(1);
              const upgrade = `<button type="button" class="ar-cost-btn ar-upgrade" data-unit-upgrade="${kind}" title="Upgrade">
                  <span class="ar-verb">UPGRADE</span>
                  <img class="ar-cost-ico" data-upgrade-cost-icon src="${curSrc(UI_ICONS.currencyGold)}" alt="">
                  <span class="ar-cost-amt" data-upgrade-cost-amt>${upCost ?? "—"}</span>
                </button>`;
              return `<div class="action-card unit-card" data-unit-card="${kind}">
            <div class="ac-title-row">
              <h3 class="ac-title">${UNIT_FULL_LABEL[kind]}</h3>
              <b class="ur-count" id="${countId}">×0</b>
            </div>
            <div class="ur-body">
              <div class="ur-head" data-unit-head="${kind}" data-lv="1">
                <img class="ac-icon" data-unit-icon="${kind}" src="${icon.startsWith("/") ? icon : `/${icon}`}" alt="${UNIT_FULL_LABEL[kind]}">
              </div>
              <div class="ur-actions">
                ${buyBtn}
                ${send}
                ${upgrade}
              </div>
            </div>
          </div>`;
            })
            .join("")}
        </div>
      </aside>
      <div id="game-wrap">
        <div class="wallet-row wallet-fixed" aria-label="Ressourcen">
          <span class="wi gold chip"><img src="${UI_ICONS.currencyGold}" alt=""><b id="gold">0</b></span>
          <span class="wi bier chip"><img src="${UI_ICONS.currencyBier}" alt=""><b id="cur-beer">0</b></span>
          <span class="wi merch chip"><img src="${UI_ICONS.currencyFanartikel}" alt=""><b id="cur-merch">0</b></span>
          <span class="wi sec chip"><img src="${UI_ICONS.currencySicherheit}" alt=""><b id="cur-sec">0</b></span>
        </div>
        <div class="top-hud" id="pitch-hud">
          <div
            class="scoreboard-slot"
            id="scoreboard-slot"
            aria-label="Spielstand"
            style="aspect-ratio: ${SCOREBOARD_NATIVE.w} / ${SCOREBOARD_NATIVE.h}"
          >
            <img
              class="scoreboard-art"
              id="scoreboard-art"
              src="${UI_ICONS.scoreboard}"
              width="${SCOREBOARD_NATIVE.w}"
              height="${SCOREBOARD_NATIVE.h}"
              alt=""
              draggable="false"
            >
            <div class="scoreboard-live" aria-live="polite">
              <span class="sb-minute" id="hud-minute">0′</span>
              <b class="sb-score" id="hud-score">0 : 0</b>
              <div class="sb-mom" id="momentum-bar">
                <div class="sb-mom-heim" id="mom-heim" style="width:50%">
                  <span id="mom-p-heim">Heim 50%</span>
                </div>
                <div class="sb-mom-gast" id="mom-gast" style="width:50%">
                  <span id="mom-p-gast">Gast 50%</span>
                </div>
                <div class="sb-mom-knob" id="mom-knob">
                  <span class="sb-tor-label">Torchance</span>
                  <span class="sb-tor-pct" id="mom-p-tor">28%</span>
                </div>
              </div>
            </div>
          </div>
          <div class="combat-banner hidden" id="combat-banner"></div>
        </div>
        <canvas id="c"></canvas>
        <div class="toast" id="toast"></div>
        <div class="popup-menu hidden" id="seat-menu">
          <p class="popup-title">Fan kaufen</p>
          <button data-buy="normalos" id="buy-normalos" class="popup-buy">
            <img src="${unitIconPath("normalos", tc, 1)}" alt="">
            <span>Fan <small>${BUY_COST.normalos.security} Sicherheit</small></span>
          </button>
          <button data-buy="ultras" id="buy-ultras" class="popup-buy">
            <img src="${unitIconPath("ultras", tc, 1)}" alt="">
            <span>Ultra <small>${BUY_COST.ultras.merch} Fanartikel</small></span>
          </button>
          <button data-buy="hooligans" id="buy-hooligans" class="popup-buy">
            <img src="${unitIconPath("hooligans", tc, 1)}" alt="">
            <span>Hooligan <small>${BUY_COST.hooligans.beer} Bier</small></span>
          </button>
          <button class="popup-cancel" id="seat-cancel">Abbrechen</button>
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
                ? `<p class="tiny">iPhone: Teilen-Symbol → <b>Zum Home-Bildschirm</b>, dann LaneLink von dort öffnen.</p>`
                : `<p class="tiny">Danach Handy quer halten.</p>`
            }
          </div>
        </div>
      </div>
      <aside class="side-rail right-rail build-rail" id="build-rail" aria-label="Gebäude" hidden>
        <header class="rail-banner" id="build-rail-title">Bauen</header>
        <p class="rail-hint" id="build-hint">Gebäude wählen</p>
        <div class="build-rows" id="build-place-rows">
          <button type="button" class="build-card" data-pending-build="bier">
            <div class="build-top">
              <img class="build-preview" src="icons/stands/bier-${tc}-1.png" alt="">
              <div class="build-info">
                <span>Bierstand</span>
                <small>${BUILD_COST.bier} Gold</small>
              </div>
            </div>
            <img class="build-kaufen" src="${UI_ICONS.btnBauenAmber}" alt="Bauen">
          </button>
          <button type="button" class="build-card" data-pending-build="fanshop">
            <div class="build-top">
              <img class="build-preview" src="icons/stands/fanshop-${tc}-1.png" alt="">
              <div class="build-info">
                <span>Fanshop</span>
                <small>${BUILD_COST.fanshop} Gold</small>
              </div>
            </div>
            <img class="build-kaufen" src="${UI_ICONS.btnBauenAmber}" alt="Bauen">
          </button>
          <button type="button" class="build-card" data-pending-build="ordner">
            <div class="build-top">
              <img class="build-preview" src="icons/stands/ordner-${tc}-1.png" alt="">
              <div class="build-info">
                <span>Ordnerposten</span>
                <small>${BUILD_COST.ordner} Gold</small>
              </div>
            </div>
            <img class="build-kaufen" src="${UI_ICONS.btnBauenAmber}" alt="Bauen">
          </button>
        </div>
        <div class="build-rows hidden" id="build-upgrade-rows">
          <div class="upgrade-panel" id="upgrade-panel">
            <p class="upgrade-title" id="upgrade-title">Dieses Haus</p>
            <div class="upgrade-preview">
              <div class="up-stage">
                <img id="upgrade-from-img" src="" alt="">
                <span id="upgrade-from-lv">Lv1</span>
              </div>
              <div class="up-arrow" aria-hidden="true">→</div>
              <div class="up-stage">
                <img id="upgrade-to-img" src="" alt="">
                <span id="upgrade-to-lv">Lv2</span>
              </div>
            </div>
            <p class="upgrade-blurb" id="upgrade-blurb">Besserer Ertrag & stärkeres Gebäude</p>
            <button type="button" class="upgrade-buy" id="rail-upgrade">
              <span id="rail-upgrade-label">Upgrade</span>
              <small id="rail-upgrade-cost">—</small>
              <img class="build-kaufen" src="${UI_ICONS.btnUpgradePurple}" alt="Upgrade">
            </button>
          </div>
          <button type="button" class="build-card" id="rail-hire-ordner">
            <div class="build-top">
              <img class="build-preview" src="${unitIconPath("ordner", tc, 1)}" alt="">
              <div class="build-info">
                <span>Ordner anheuern</span>
                <small>${STEWARD_HIRE_GOLD} Gold</small>
              </div>
            </div>
            <img class="build-kaufen" src="${UI_ICONS.btnKaufenGreen}" alt="Kaufen">
          </button>
        </div>
        <button type="button" class="rail-close" id="build-rail-close">Schließen</button>
      </aside>
    </div>`;

  const canvas = app.querySelector<HTMLCanvasElement>("#c")!;
  const wrap = app.querySelector<HTMLDivElement>("#game-wrap")!;
  const ctx = canvas.getContext("2d")!;
  const seatMenu = app.querySelector<HTMLDivElement>("#seat-menu")!;
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

  const openBuildRail = (mode: "place" | "upgrade", target: { blockId: number; index: number }) => {
    state.buildTarget = target;
    m.selectedSlot = target;
    m.buildMenu = target;
    buildRail.hidden = false;
    buildRail.classList.add("open");
    shell.classList.add("build-open");
    const title = app.querySelector("#build-rail-title");
    const hint = app.querySelector("#build-hint");
    if (mode === "place") {
      buildPlaceRows.classList.remove("hidden");
      buildUpgradeRows.classList.add("hidden");
      if (title) title.textContent = "Bauen";
      if (hint) hint.textContent = "Gebäude für diesen Plot wählen";
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
      const labelEl = app.querySelector("#rail-upgrade-label");
      const fromImg = app.querySelector<HTMLImageElement>("#upgrade-from-img");
      const toImg = app.querySelector<HTMLImageElement>("#upgrade-to-img");
      const fromLv = app.querySelector("#upgrade-from-lv");
      const toLv = app.querySelector("#upgrade-to-lv");
      const blurb = app.querySelector("#upgrade-blurb");
      const upTitle = app.querySelector("#upgrade-title");
      const kind = slot?.building;
      const name =
        kind === "bier" ? "Bierstand" : kind === "fanshop" ? "Fanshop" : kind === "ordner" ? "Ordnerposten" : "Gebäude";
      if (upTitle) upTitle.textContent = `${name} upgraden`;
      if (kind && fromImg && toImg) {
        const fromSrc = standIconPath(kind, tc, lv);
        const toSrc = standIconPath(kind, tc, Math.min(UPGRADE_MAX, next));
        fromImg.src = fromSrc.startsWith("/") ? fromSrc : `/${fromSrc}`;
        toImg.src = toSrc.startsWith("/") ? toSrc : `/${toSrc}`;
        fromImg.alt = `${name} Lv${lv}`;
        toImg.alt = `${name} Lv${Math.min(UPGRADE_MAX, next)}`;
      }
      if (fromLv) fromLv.textContent = `Lv${lv}`;
      if (toLv) toLv.textContent = slot && slot.level >= UPGRADE_MAX ? "Max" : `Lv${next}`;
      if (blurb) {
        blurb.textContent =
          kind === "bier"
            ? "Mehr Bier-Produktion & Kapazität"
            : kind === "fanshop"
              ? "Mehr Fanartikel & Stimmung"
              : kind === "ordner"
                ? "Stärkerer Posten & mehr Ordner-Power"
                : "Gebäude verbessern";
      }
      if (cost == null || !slot || slot.level >= UPGRADE_MAX) {
        upBtn.disabled = true;
        if (labelEl) labelEl.textContent = "Maximale Stufe";
        if (costEl) costEl.textContent = `Lv${UPGRADE_MAX}`;
      } else {
        upBtn.disabled = m.gold < cost;
        if (labelEl) labelEl.textContent = `Upgrade auf Lv${next}`;
        if (costEl) costEl.textContent = `${cost} Gold`;
      }
      const hireBtn = app.querySelector<HTMLButtonElement>("#rail-hire-ordner")!;
      const canHire = !!(slot && m.canHireSteward(slot));
      hireBtn.classList.toggle("hidden", slot?.building !== "ordner");
      hireBtn.disabled = !canHire;
      hireBtn.classList.toggle("cd", !canHire);
      if (hint) {
        hint.textContent =
          slot?.building === "ordner"
            ? "Genau dieses Haus: Upgrade oder Ordner"
            : "Genau dieses Haus upgraden";
      }
    }
  };

  const syncPendingBuildUi = () => {
    const hint = app.querySelector("#build-hint");
    app.querySelectorAll<HTMLButtonElement>("[data-pending-build]").forEach((btn) => {
      const kind = btn.dataset.pendingBuild as BuildingKind;
      const on = state.pendingBuild === kind;
      btn.classList.toggle("selected", on);
      btn.classList.toggle("cd", m.gold < BUILD_COST[kind]);
    });
    if (hint && !buildPlaceRows.classList.contains("hidden")) {
      hint.textContent = state.buildTarget
        ? "Gebäude für diesen Plot wählen"
        : "Plot tippen";
    }
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
    // Keep tribune pack (block centers / seat lanes) in sync with canvas aspect.
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
    seatMenu.classList.add("hidden");
    buildMenu.classList.add("hidden");
    closeBuildRail();
  };

  const showSeatMenu = (blockId: number, seatIndex: number) => {
    hideMenus();
    m.seatMenu = { blockId, seatIndex };
    m.selectedSeat = { blockId, seatIndex };
    seatMenu.classList.remove("hidden");
    syncBuyButtons();
  };

  const showBuildMenu = (blockId: number, index: number) => {
    m.seatMenu = null;
    m.selectedSeat = null;
    seatMenu.classList.add("hidden");
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
      }
      // Always open place rail on a tapped empty plot (build still gated in tryBuild)
      openBuildRail("place", { blockId, index });
      return;
    }
    closeBuildRail();
  };

  const syncBuyButtons = () => {
    (["ultras", "normalos", "hooligans"] as FanKind[]).forEach((kind) => {
      const btn = app.querySelector<HTMLButtonElement>(`#buy-${kind}`)!;
      const ok = m.canBuy(kind);
      btn.classList.toggle("ready", ok);
      btn.classList.toggle("cd", !ok);
      btn.disabled = !ok;
    });
  };

  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Bauplots first — seats used to steal taps near the floor edge
    const hit = hitSlot(m, mx, my);
    if (hit) {
      showBuildMenu(hit.blockId, hit.index);
      syncOverlay();
      return;
    }

    const seat = hitSeat(m, mx, my);
    if (seat && !m.seatOccupied(seat.blockId, seat.seatIndex)) {
      if (!m.canBuyInBlock(seat.blockId)) {
        m.toast("Block noch nicht unter Kontrolle");
        return;
      }
      m.selectedSeat = seat;
      showSeatMenu(seat.blockId, seat.seatIndex);
      m.toast(`Platz ${seat.seatIndex + 1}`);
      return;
    }
    hideMenus();
  });

  const syncUnitActionCards = () => {
    const tcNow = teamColor(m.playerTeam);
    const asSrc = (p: string) => (p.startsWith("/") ? p : `/${p}`);

    app.querySelectorAll<HTMLElement>("[data-unit-card]").forEach((card) => {
      const kind = card.dataset.unitCard as UnitUiKind;
      const buy = unitBuyCost(kind);
      const lv = m.unitLevelOf(m.playerTeam, kind);
      const head = card.querySelector<HTMLElement>("[data-unit-head]");
      if (head) head.dataset.lv = String(lv);
      const icon = card.querySelector<HTMLImageElement>("[data-unit-icon]");
      if (icon) {
        const src = unitHeadIconPath(kind, tcNow, lv);
        const next = src.startsWith("/") ? src : `/${src}`;
        if (icon.getAttribute("src") !== next) icon.src = next;
      }

      const buyIco = card.querySelector<HTMLImageElement>("[data-buy-cost-icon]");
      const buyAmt = card.querySelector("[data-buy-cost-amt]");
      if (buyIco) buyIco.src = asSrc(currencyIconPath(buy.currency));
      if (buyAmt) buyAmt.textContent = String(buy.amount);

      const sendAmt = card.querySelector("[data-send-cost-amt]");
      const sendIco = card.querySelector<HTMLImageElement>("[data-send-cost-icon]");
      if (kind === "ultras") {
        if (sendAmt) sendAmt.textContent = String(PYRO_FIGHT_MERCH);
        if (sendIco) sendIco.src = asSrc(UI_ICONS.currencyFanartikel);
      } else if (kind === "hooligans") {
        if (sendAmt) sendAmt.textContent = String(HOOLIGAN_ORDER_BEER);
        if (sendIco) sendIco.src = asSrc(UI_ICONS.currencyBier);
      }

      const upCost = m.upgradeUnitCost(kind);
      const upAmt = card.querySelector("[data-upgrade-cost-amt]");
      const upIco = card.querySelector<HTMLImageElement>("[data-upgrade-cost-icon]");
      const upBtn = card.querySelector<HTMLButtonElement>("[data-unit-upgrade]");
      if (upIco) upIco.src = asSrc(UI_ICONS.currencyGold);
      if (upCost == null) {
        if (upAmt) upAmt.textContent = "MAX";
        if (upBtn) {
          upBtn.disabled = true;
          upBtn.classList.add("cd");
          upBtn.classList.remove("ready");
        }
      } else {
        if (upAmt) upAmt.textContent = String(upCost);
        const ok = m.gold >= upCost;
        if (upBtn) {
          upBtn.disabled = !ok;
          upBtn.classList.toggle("ready", ok);
          upBtn.classList.toggle("cd", !ok);
        }
      }

      const title = card.querySelector(".ac-title");
      if (title) {
        title.textContent =
          lv > 1
            ? `${UNIT_FULL_LABEL[kind]} Lv${lv}`
            : UNIT_FULL_LABEL[kind];
      }
    });
  };

  const syncOverlay = () => {
    const hb = app.querySelector<HTMLButtonElement>("#btn-hooligan");
    if (hb) {
      const hready = m.hooliganOrderReady();
      hb.classList.toggle("ready", hready);
      hb.classList.toggle("cd", !hready);
      hb.disabled = !hready;
      hb.title = hready
        ? `Senden · ${HOOLIGAN_ORDER_BEER} Bier`
        : `Senden · braucht ${HOOLIGAN_ORDER_BEER} Bier`;
    }
    const pf = app.querySelector<HTMLButtonElement>("#btn-pyro-fight");
    if (pf) {
      const pready = m.pyroFightReady();
      pf.classList.toggle("ready", pready);
      pf.classList.toggle("cd", !pready);
      pf.disabled = !pready;
      pf.title = pready
        ? `Senden · ${PYRO_FIGHT_MERCH} Fanartikel`
        : `Senden · braucht ${PYRO_FIGHT_MERCH} Fanartikel`;
    }
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
    if (!seatMenu.classList.contains("hidden")) syncBuyButtons();
    syncPendingBuildUi();
    syncUnitActionCards();
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
  app.querySelectorAll<HTMLButtonElement>("[data-unit-upgrade]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      m.tryUpgradeUnit(btn.dataset.unitUpgrade as UnitUiKind);
      syncOverlay();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-buy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!m.seatMenu) return;
      m.tryBuyFan(
        btn.dataset.buy as FanKind,
        m.seatMenu.blockId,
        m.seatMenu.seatIndex,
      );
      hideMenus();
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
  app.querySelector("#seat-cancel")!.addEventListener("click", hideMenus);
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
      const setFb = (id: string, n: number) => {
        const el = app.querySelector(id);
        if (el) el.textContent = String(n);
      };
      setFb("#fb-u", own.ultras);
      setFb("#fb-n", own.normalos);
      setFb("#fb-h", own.hooligans);
      setFb("#fb-o", own.ordner);
      syncUnitActionCards();
      const hudScore = app.querySelector("#hud-score");
      const hudMin = app.querySelector("#hud-minute");
      if (hudScore) hudScore.textContent = `${m.scoreKsc} : ${m.scoreVfb}`;
      if (hudMin) hudMin.textContent = `${Math.floor(m.minute)}′`;
      const ch = m.goalChance();
      const heimPct = Math.max(0.08, Math.min(0.92, ch.pHeim));
      const pH = Math.round(heimPct * 100);
      const pG = 100 - pH;
      const lpH = app.querySelector("#mom-p-heim");
      const lpT = app.querySelector("#mom-p-tor");
      const lpG = app.querySelector("#mom-p-gast");
      if (lpH) lpH.textContent = `Heim ${pH}%`;
      if (lpT) lpT.textContent = `${Math.round(ch.pTor * 100)}%`;
      if (lpG) lpG.textContent = `Gast ${pG}%`;
      const momHeim = app.querySelector<HTMLElement>("#mom-heim");
      const momGast = app.querySelector<HTMLElement>("#mom-gast");
      if (momHeim) momHeim.style.width = `${pH}%`;
      if (momGast) momGast.style.width = `${pG}%`;
      const art = app.querySelector<HTMLImageElement>("#scoreboard-art");
      if (art) {
        const nextSrc =
          heimPct >= 0.62
            ? UI_ICONS.scoreboardOrbHeim
            : heimPct <= 0.38
              ? UI_ICONS.scoreboardOrbGast
              : UI_ICONS.scoreboard;
        if (art.getAttribute("src") !== nextSrc) art.src = nextSrc;
      }
      const slot = app.querySelector<HTMLElement>("#scoreboard-slot");
      if (slot) {
        slot.classList.toggle("goal-pulse", m.scorePulse > 0.15);
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
