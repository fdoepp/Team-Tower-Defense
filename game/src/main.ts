import "./style.css";
import { Match } from "./game/Match";
import { drawMatch, hitSeat, hitSlot } from "./game/render";
import {
  BUILD_COST,
  MIX_MAX,
  MIX_MIN,
  type BuildingKind,
  type FanKind,
  type FanMix,
  type MoodAction,
  type SoloSettings,
  type SpeedMode,
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
  app.innerHTML = `
    <div class="screen menu">
      <div>
        <p class="sub">LaneLink · A2c Stadion</p>
        <h1 class="brand">KSC vs VfB</h1>
        <p class="sub">Blöcke · Gang · Stimmung — Querformat</p>
      </div>
      <div class="card stack">
        <button class="btn ksc" id="solo">Solo vs KI</button>
      </div>
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
  app.querySelector("#solo")!.addEventListener("click", () => {
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
        <p class="sub">10 Fans für den Heimblock</p>
        <h1 class="brand" style="font-size:1.6rem">Aufstellung</h1>
      </div>
      <div class="card stack">
        ${row("ultras", "Ultras (Kampf/Pyro)")}
        ${row("normalos", "Normalos (Gesang/Durst)")}
        ${row("familie", "Familie (Klatschen/Gold)")}
        <p class="tiny">Summe ${mixSum(mix)} / 10 ${isValidMix(mix) ? "✓" : ""}</p>
      </div>
      <div class="row">
        <button class="btn secondary grow" id="back">Zurück</button>
        <button class="btn ksc grow" id="start" ${isValidMix(mix) ? "" : "disabled"}>Anpfiff</button>
      </div>
    </div>`;
  app.querySelector("#back")!.addEventListener("click", () => go("menu"));
  app.querySelector("#start")!.addEventListener("click", () => {
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
      if (mixSum(next) > 10) return;
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
  m.setSpeed(0);
  app.innerHTML = `
    <div class="rotate-hint">Bitte Handy quer drehen ↻</div>
    <div class="match-shell a2c">
      <div class="top-chrome currency-chrome">
        <div class="cur-pill gold-pill"><span>Gold</span><b id="gold">0</b></div>
        <div class="cur-pill bier-pill" title="Bier → Ultras kaufen">
          <span>BIER</span><b id="cur-beer">0</b><i>/100</i>
        </div>
        <div class="cur-pill shop-pill" title="Fanshop → Normalos kaufen">
          <span>SHOP</span><b id="cur-shop">0</b><i>/100</i>
        </div>
        <div class="cur-pill ord-pill" title="Ordner → Familien kaufen">
          <span>ORDNER</span><b id="cur-ord">0</b><i>/100</i>
        </div>
        <div class="speed-btns">
          <button data-spd="0" class="on">⏸</button>
          <button data-spd="1">▶</button>
          <button data-spd="2">2×</button>
        </div>
      </div>
      <div id="game-wrap">
        <canvas id="c"></canvas>
        <div class="toast" id="toast"></div>
        <aside class="control-rail">
          <div class="mood-stack">
            <button class="mood-btn" data-mood="gesang" id="btn-gesang">Gesang<span></span></button>
            <button class="mood-btn" data-mood="pyro" id="btn-pyro">Pyro<span></span></button>
            <button class="mood-btn" data-mood="klatschen" id="btn-klatschen">Klatschen<span></span></button>
          </div>
          <button class="ultra-btn" id="btn-ultra">1 Ultra → Gang<span></span></button>
        </aside>
        <div class="popup-menu hidden" id="seat-menu">
          <p class="popup-title">Fan kaufen</p>
          <button data-buy="ultras" id="buy-ultras">Ultra <small>40 BIER</small></button>
          <button data-buy="normalos" id="buy-normalos">Normalo <small>35 SHOP</small></button>
          <button data-buy="familie" id="buy-familie">Familie <small>30 ORDNER</small></button>
          <button class="popup-cancel" id="seat-cancel">Abbrechen</button>
        </div>
        <div class="popup-menu hidden" id="build-menu">
          <p class="popup-title">Gebäude (${BUILD_COST.bier}g+)</p>
          <button data-build="bier">Bierstand <small>+BIER</small></button>
          <button data-build="ordner">Ordnerposten <small>+ORDNER</small></button>
          <button data-build="fanshop">Fanshop <small>+SHOP</small></button>
          <button class="popup-cancel" id="build-cancel">Abbrechen</button>
        </div>
      </div>
    </div>`;

  const canvas = app.querySelector<HTMLCanvasElement>("#c")!;
  const wrap = app.querySelector<HTMLDivElement>("#game-wrap")!;
  const ctx = canvas.getContext("2d")!;
  const seatMenu = app.querySelector<HTMLDivElement>("#seat-menu")!;
  const buildMenu = app.querySelector<HTMLDivElement>("#build-menu")!;

  const resize = () => {
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = Math.max(1, Math.floor(rect.width));
    const cssH = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    m.width = cssW;
    m.height = cssH;
    drawMatch(ctx, m);
  };
  resize();
  requestAnimationFrame(resize);
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => setTimeout(resize, 200));

  const hideMenus = () => {
    m.seatMenu = null;
    m.buildMenu = null;
    seatMenu.classList.add("hidden");
    buildMenu.classList.add("hidden");
  };

  const showSeatMenu = (blockId: number, seatIndex: number) => {
    m.seatMenu = { blockId, seatIndex };
    m.buildMenu = null;
    buildMenu.classList.add("hidden");
    seatMenu.classList.remove("hidden");
    syncBuyButtons();
  };

  const showBuildMenu = (blockId: number, index: number) => {
    m.buildMenu = { blockId, index };
    m.selectedSlot = { blockId, index };
    m.seatMenu = null;
    seatMenu.classList.add("hidden");
    buildMenu.classList.remove("hidden");
  };

  const syncBuyButtons = () => {
    (["ultras", "normalos", "familie"] as FanKind[]).forEach((kind) => {
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
      if (slot && !slot.building) {
        showBuildMenu(hit.blockId, hit.index);
      } else {
        hideMenus();
        m.toast(`Slot ${hit.blockId + 1}.${hit.index + 1}`);
      }
      return;
    }
    hideMenus();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-spd]").forEach((btn) => {
    btn.addEventListener("click", () => {
      m.setSpeed(Number(btn.dataset.spd) as SpeedMode);
      app.querySelectorAll("[data-spd]").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
    });
  });

  const syncOverlay = () => {
    (["gesang", "pyro", "klatschen"] as MoodAction[]).forEach((act) => {
      const btn = app.querySelector<HTMLButtonElement>(`#btn-${act}`)!;
      const ready = m.moodActionReady(act);
      btn.classList.toggle("ready", ready);
      btn.classList.toggle("cd", !ready);
      btn.querySelector("span")!.textContent = cdLabel(m.cd[act]);
    });
    const ub = app.querySelector<HTMLButtonElement>("#btn-ultra")!;
    const uready = m.ultraOrderReady();
    ub.classList.toggle("ready", uready);
    ub.classList.toggle("cd", !uready);
    ub.querySelector("span")!.textContent = cdLabel(m.cd.ultraOrder);
    if (!seatMenu.classList.contains("hidden")) syncBuyButtons();
  };

  app.querySelectorAll<HTMLButtonElement>("[data-mood]").forEach((btn) => {
    btn.addEventListener("click", () => {
      m.tryMoodAction(btn.dataset.mood as MoodAction);
      syncOverlay();
    });
  });
  app.querySelector("#btn-ultra")!.addEventListener("click", () => {
    m.tryUltraOrder();
    syncOverlay();
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
  app.querySelector("#seat-cancel")!.addEventListener("click", hideMenus);
  app.querySelector("#build-cancel")!.addEventListener("click", hideMenus);

  syncOverlay();
  state.last = performance.now();
  const loop = (now: number) => {
    if (state.screen !== "match" || !state.match) return;
    const dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;
    m.update(dt);
    drawMatch(ctx, m);
    const gold = app.querySelector("#gold");
    if (gold) gold.textContent = String(Math.floor(m.gold));
    const beer = app.querySelector("#cur-beer");
    const shop = app.querySelector("#cur-shop");
    const ord = app.querySelector("#cur-ord");
    if (beer) beer.textContent = String(m.currencyPct("beer"));
    if (shop) shop.textContent = String(m.currencyPct("shop"));
    if (ord) ord.textContent = String(m.currencyPct("ordner"));
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
      setTimeout(() => go("result"), 800);
      return;
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
