import "./style.css";
import { Match } from "./game/Match";
import { drawMatch, hitSlot } from "./game/render";
import {
  MIX_MAX,
  MIX_MIN,
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
      <div class="top-chrome">
        <div class="stat"><span>Gold</span><b id="gold">0</b></div>
        <div class="stat recruit-stat" title="Fan-Gewinnung">
          <span>N <b id="rec-n">0</b></span>
          <span>F <b id="rec-f">0</b></span>
          <span>U <b id="rec-u">0</b></span>
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
        <button class="build-fab" id="btn-build">Bierstand / Claim</button>
      </div>
    </div>`;

  const canvas = app.querySelector<HTMLCanvasElement>("#c")!;
  const wrap = app.querySelector<HTMLDivElement>("#game-wrap")!;
  const ctx = canvas.getContext("2d")!;

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

  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const hit = hitSlot(m, e.clientX - rect.left, e.clientY - rect.top);
    if (hit) {
      m.selectedSlot = hit;
      m.toast(`Slot ${hit.blockId + 1}.${hit.index + 1}`);
      syncOverlay();
    }
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

    const bb = app.querySelector<HTMLButtonElement>("#btn-build")!;
    const can =
      !!m.selectedSlot &&
      m.gold >= 50 &&
      m.selectedSlot.blockId !== 4 &&
      !m.slots.find(
        (s) =>
          s.blockId === m.selectedSlot!.blockId &&
          s.index === m.selectedSlot!.index &&
          s.hasBier,
      );
    bb.classList.toggle("ready", can);
    bb.classList.toggle("cd", !can);
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
  app.querySelector("#btn-build")!.addEventListener("click", () => {
    m.tryBuildSelected();
    syncOverlay();
  });

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
    const rn = app.querySelector("#rec-n");
    const rf = app.querySelector("#rec-f");
    const ru = app.querySelector("#rec-u");
    if (rn)
      rn.textContent = `${Math.floor((m.recruit.beer / 28) * 100)}%`;
    if (rf)
      rf.textContent = `${Math.floor((m.recruit.security / 32) * 100)}%`;
    if (ru)
      ru.textContent = `${Math.floor((m.recruit.fight / 24) * 100)}%`;
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
