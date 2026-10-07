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
import { L } from "./game/layout";
import {
  BUILD_COST,
  BUY_COST,
  HOOLIGAN_ORDER_BEER,
  MIX_MAX,
  MIX_MIN,
  PYRO_FIGHT_MERCH,
  STEWARD_HIRE_GOLD,
  UPGRADE_MAX,
  type BuildingKind,
  type FanKind,
  type FanMix,
  type MoodAction,
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

const app = document.querySelector<HTMLDivElement>("#app")!;

type Screen = "menu" | "setup" | "match" | "result";

const state = {
  screen: "menu" as Screen,
  settings: defaultSoloSettings() as SoloSettings,
  setup: defaultSetup(),
  match: null as Match | null,
  raf: 0,
  last: 0,
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
        ${row("normalos", "Fans (Gesang · Sicherheit)")}
        ${row("ultras", "Ultras (Pyro · Fanartikel)")}
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

function cdLabel(left: number): string {
  if (left <= 0) return "bereit";
  return `${Math.ceil(left)}s`;
}

function renderMatchScreen(): void {
  const m = state.match!;
  m.setSpeed(1);
  const needFs = needsFullscreenGate();
  const iosHint = isIos() && !isStandalone();
  app.innerHTML = `
    <div class="rotate-hint">Bitte Handy quer drehen ↻</div>
    <div class="match-shell a2c">
      <div id="game-wrap">
        <canvas id="c"></canvas>
        <div class="pitch-hud" id="pitch-hud">
          <div class="pitch-top">
            <div class="heim-panel" aria-label="Heim-Steuerung">
              <div class="wallet-row" aria-label="Ressourcen">
                <span class="wi gold"><i>Gold</i><b id="gold">0</b></span>
                <span class="wi bier"><i>Bier</i><b id="cur-beer">0</b></span>
                <span class="wi merch"><i>Fanartikel</i><b id="cur-merch">0</b></span>
                <span class="wi sec"><i>Sicherheit</i><b id="cur-sec">0</b></span>
              </div>
              <p class="freie-plaetze">Freie Plätze <b id="free-seats">0</b></p>
              <div class="unit-rows">
                <div class="ur-row">
                  <span class="ur-name">Fans</span>
                  <b class="ur-count" id="fb-n">0</b>
                  <button type="button" class="ar-plus" data-quick-buy="normalos" title="${BUY_COST.normalos.security} Sicherheit">+</button>
                  <button class="ar-btn gesang" data-mood="gesang" id="btn-gesang" type="button">Gesang<span></span></button>
                </div>
                <div class="ur-row">
                  <span class="ur-name">Ultras</span>
                  <b class="ur-count" id="fb-u">0</b>
                  <button type="button" class="ar-plus" data-quick-buy="ultras" title="${BUY_COST.ultras.merch} Fanartikel">+</button>
                  <button class="ar-btn pyro" data-mood="pyro" id="btn-pyro" type="button">Pyro<span></span></button>
                  <button class="ar-btn pyro-fight" id="btn-pyro-fight" type="button">Pyro Wurf<span></span></button>
                </div>
                <div class="ur-row">
                  <span class="ur-name">Hooligans</span>
                  <b class="ur-count" id="fb-h">0</b>
                  <button type="button" class="ar-plus" data-quick-buy="hooligans" title="${BUY_COST.hooligans.beer} Bier">+</button>
                  <button class="ar-btn fight" id="btn-hooligan" type="button">Angriff<span></span></button>
                </div>
                <div class="ur-row ur-row-ordner">
                  <span class="ur-name">Ordner</span>
                  <b class="ur-count" id="fb-o">0</b>
                </div>
              </div>
            </div>
            <div class="fanbase-col gast" aria-label="Gegner-Fanbase">
              <span class="fb"><i>N</i><b id="fb-en">0</b></span>
              <span class="fb"><i>U</i><b id="fb-eu">0</b></span>
              <span class="fb"><i>H</i><b id="fb-eh">0</b></span>
              <span class="fb"><i>O</i><b id="fb-eo">0</b></span>
            </div>
          </div>
          <div class="match-hud-score">
            <div class="hud-crest ksc">K</div>
            <div class="hud-scoreline">
              <b id="hud-score">0:0</b>
              <span id="hud-minute">0′</span>
            </div>
            <div class="hud-crest vfb">V</div>
          </div>
          <div class="mom-row">
            <div class="momentum-wrap">
              <div class="momentum-bar" id="momentum-bar" title="Momentum / Torchance">
                <div class="mom-fill heim" id="mom-heim"></div>
                <div class="mom-fill gast" id="mom-gast"></div>
                <div class="mom-knob" id="mom-knob"></div>
                <div class="mom-pulse" id="mom-pulse" aria-hidden="true"></div>
              </div>
              <div class="mom-labels">
                <span id="mom-p-heim">Heim 50%</span>
                <span id="mom-p-tor">Torchance 28%</span>
                <span id="mom-p-gast">Gast 50%</span>
              </div>
            </div>
          </div>
          <div class="combat-banner hidden" id="combat-banner"></div>
        </div>
        <div class="toast" id="toast"></div>
        <div class="popup-menu hidden" id="seat-menu">
          <p class="popup-title">Fan kaufen</p>
          <button data-buy="normalos" id="buy-normalos">Fan <small>${BUY_COST.normalos.security} Sicherheit</small></button>
          <button data-buy="ultras" id="buy-ultras">Ultra <small>${BUY_COST.ultras.merch} Fanartikel</small></button>
          <button data-buy="hooligans" id="buy-hooligans">Hooligan <small>${BUY_COST.hooligans.beer} Bier</small></button>
          <button class="popup-cancel" id="seat-cancel">Abbrechen</button>
        </div>
        <div class="popup-menu hidden" id="build-menu">
          <p class="popup-title" id="build-title">Gebäude</p>
          <div id="build-options">
            <button data-build="bier">Bierstand <small>${BUILD_COST.bier}g · +Bier</small></button>
            <button data-build="ordner">Ordnerposten <small>${BUILD_COST.ordner}g · Anti-Rush</small></button>
            <button data-build="fanshop">Fanshop <small>${BUILD_COST.fanshop}g · +Gesang</small></button>
          </div>
          <div id="upgrade-options" class="hidden">
            <button id="btn-hire-steward" class="hidden">Ordner anheuern <small>${STEWARD_HIRE_GOLD}€</small></button>
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
    </div>`;

  const canvas = app.querySelector<HTMLCanvasElement>("#c")!;
  const wrap = app.querySelector<HTMLDivElement>("#game-wrap")!;
  const ctx = canvas.getContext("2d")!;
  const seatMenu = app.querySelector<HTMLDivElement>("#seat-menu")!;
  const buildMenu = app.querySelector<HTMLDivElement>("#build-menu")!;
  const buildOptions = app.querySelector<HTMLDivElement>("#build-options")!;
  const upgradeOptions = app.querySelector<HTMLDivElement>("#upgrade-options")!;
  const buildTitle = app.querySelector<HTMLParagraphElement>("#build-title")!;
  const btnUpgrade = app.querySelector<HTMLButtonElement>("#btn-upgrade")!;
  const btnHire = app.querySelector<HTMLButtonElement>("#btn-hire-steward")!;
  const fsGate = app.querySelector<HTMLDivElement>("#fs-gate")!;
  const pitchHud = app.querySelector<HTMLDivElement>("#pitch-hud")!;

  const layoutHud = () => {
    const rect = wrap.getBoundingClientRect();
    if (rect.width < 32 || rect.height < 32) return;
    const pitchPx = rect.height * L.pitchH;
    pitchHud.style.top = "0";
    pitchHud.style.left = "0";
    pitchHud.style.width = "100%";
    pitchHud.style.height = `${Math.floor(pitchPx)}px`;
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
    m.buildMenu = null;
    m.selectedSeat = null;
    seatMenu.classList.add("hidden");
    buildMenu.classList.add("hidden");
  };

  const showSeatMenu = (blockId: number, seatIndex: number) => {
    hideMenus();
    m.seatMenu = { blockId, seatIndex };
    m.selectedSeat = { blockId, seatIndex };
    seatMenu.classList.remove("hidden");
    syncBuyButtons();
  };

  const showBuildMenu = (blockId: number, index: number) => {
    hideMenus();
    m.buildMenu = { blockId, index };
    m.selectedSlot = { blockId, index };
    const slot = m.slots.find((s) => s.blockId === blockId && s.index === index);
    const owned =
      slot?.building &&
      slot.owner === m.playerTeam &&
      !slot.greyNeutral;
    if (owned && slot) {
      buildOptions.classList.add("hidden");
      upgradeOptions.classList.remove("hidden");
      const cost = m.upgradeCost(slot);
      const next = (slot.level || 1) + 1;
      buildTitle.textContent = `${slot.building === "bier" ? "Bierstand" : slot.building === "ordner" ? "Ordnerposten" : "Fanshop"} Lv${slot.level}`;
      if (slot.building === "ordner") {
        btnHire.hidden = false;
        btnHire.classList.remove("hidden");
        const canHire = m.canHireSteward(slot);
        btnHire.disabled = !canHire;
        btnHire.innerHTML = `Ordner anheuern <small>${STEWARD_HIRE_GOLD}€ · ${m.stewardCountAt(slot)}/2</small>`;
        btnHire.classList.toggle("cd", !canHire);
      } else {
        btnHire.hidden = true;
        btnHire.classList.add("hidden");
      }
      if (cost == null || slot.level >= UPGRADE_MAX) {
        btnUpgrade.disabled = true;
        btnUpgrade.innerHTML = `Max. Stufe ${UPGRADE_MAX}`;
      } else {
        btnUpgrade.disabled = m.gold < cost;
        btnUpgrade.innerHTML = `Upgrade → Lv${next} <small>${cost}g</small>`;
      }
    } else {
      buildOptions.classList.remove("hidden");
      upgradeOptions.classList.add("hidden");
      btnHire.hidden = true;
      btnHire.classList.add("hidden");
      buildTitle.textContent = `Gebäude · Shop ${BUILD_COST.fanshop}g · Ordner ${BUILD_COST.ordner}g · Bier ${BUILD_COST.bier}g`;
    }
    buildMenu.classList.remove("hidden");
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

    const hit = hitSlot(m, mx, my);
    if (hit) {
      const slot = m.slots.find(
        (s) => s.blockId === hit.blockId && s.index === hit.index,
      );
      m.selectedSlot = hit;
      if (slot && (!slot.building || slot.greyNeutral || slot.owner === "neutral")) {
        showBuildMenu(hit.blockId, hit.index);
      } else if (
        slot?.building &&
        slot.owner === m.playerTeam &&
        !slot.greyNeutral
      ) {
        showBuildMenu(hit.blockId, hit.index);
      } else {
        hideMenus();
        m.toast(`Slot ${hit.blockId + 1}.${hit.index + 1}`);
      }
      return;
    }
    hideMenus();
  });

  const syncOverlay = () => {
    (["gesang", "pyro"] as MoodAction[]).forEach((act) => {
      const btn = app.querySelector<HTMLButtonElement>(`#btn-${act}`)!;
      const ready = m.moodActionReady(act);
      btn.classList.toggle("ready", ready);
      btn.classList.toggle("cd", !ready);
      btn.querySelector("span")!.textContent = cdLabel(m.cd[act]);
    });
    const hb = app.querySelector<HTMLButtonElement>("#btn-hooligan")!;
    const hready = m.hooliganOrderReady();
    hb.classList.toggle("ready", hready);
    hb.classList.toggle("cd", !hready);
    hb.querySelector("span")!.textContent = hready
      ? `${HOOLIGAN_ORDER_BEER} Bier`
      : m.currency.beer < HOOLIGAN_ORDER_BEER
        ? `${HOOLIGAN_ORDER_BEER} Bier`
        : "—";
    const pf = app.querySelector<HTMLButtonElement>("#btn-pyro-fight")!;
    const pready = m.pyroFightReady();
    pf.classList.toggle("ready", pready);
    pf.classList.toggle("cd", !pready);
    pf.querySelector("span")!.textContent = pready
      ? `${PYRO_FIGHT_MERCH} FA`
      : "—";
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
    if (freeEl) freeEl.textContent = String(m.countFreeBuySeats());
    if (!seatMenu.classList.contains("hidden")) syncBuyButtons();
  };

  app.querySelectorAll<HTMLButtonElement>("[data-mood]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const act = btn.dataset.mood as MoodAction;
      const ok = m.tryMoodAction(act);
      if (ok) {
        const bar = app.querySelector("#momentum-bar");
        const pulse = app.querySelector("#mom-pulse");
        if (bar) {
          bar.classList.remove("kick-gesang", "kick-pyro");
          // reflow so animation restarts
          void (bar as HTMLElement).offsetWidth;
          bar.classList.add(act === "gesang" ? "kick-gesang" : "kick-pyro", "kick");
        }
        if (pulse) {
          pulse.classList.remove("from-gesang", "from-pyro", "run");
          void (pulse as HTMLElement).offsetWidth;
          // Both Heim actions push from the left into the bar
          pulse.classList.add(act === "gesang" ? "from-gesang" : "from-pyro", "run");
        }
      }
      syncOverlay();
    });
  });
  app.querySelector("#btn-hooligan")!.addEventListener("click", () => {
    m.tryHooliganOrder();
    syncOverlay();
  });
  app.querySelector("#btn-pyro-fight")!.addEventListener("click", () => {
    m.tryPyroFight();
    syncOverlay();
  });
  app.querySelectorAll<HTMLButtonElement>("[data-quick-buy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      m.tryBuyFanQuick(btn.dataset.quickBuy as FanKind);
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
  app.querySelectorAll<HTMLButtonElement>("[data-build]").forEach((btn) => {
    btn.addEventListener("click", () => {
      m.tryBuild(btn.dataset.build as BuildingKind);
      hideMenus();
      syncOverlay();
    });
  });
  btnHire.addEventListener("click", () => {
    m.tryHireSteward();
    // Keep menu open so another Ordner can be hired
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
        momKnob.style.transform =
          m.moodKick > 0.08 ? `scale(${1 + m.moodKick * 0.85})` : "";
      }
      const lpH = app.querySelector("#mom-p-heim");
      const lpT = app.querySelector("#mom-p-tor");
      const lpG = app.querySelector("#mom-p-gast");
      if (lpH) lpH.textContent = `Heim ${pH}%`;
      if (lpT) lpT.textContent = `Torchance ${Math.round(ch.pTor * 100)}%`;
      if (lpG) lpG.textContent = `Gast ${pG}%`;
      const bar = app.querySelector("#momentum-bar");
      if (bar) {
        const kicking = m.moodKick > 0.08;
        bar.classList.toggle("kick", kicking);
        if (!kicking) {
          bar.classList.remove("kick-gesang", "kick-pyro");
        }
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
