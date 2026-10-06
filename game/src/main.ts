import "./style.css";
import { Match } from "./game/Match";
import { drawMatch, hitLaneSlot, hitPlayerCurva } from "./game/render";
import {
  MIX_MAX,
  MIX_MIN,
  type FanMix,
  type SendKind,
  type SetupConfig,
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
  settings: defaultSoloSettings(),
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
        <p class="sub">LaneLink · Baden-Derby · Querformat</p>
        <h1 class="brand">KSC vs VfB</h1>
        <p class="sub">Blöcke auf die Lane. Bierstände. Kurven halten.</p>
      </div>
      <div class="card stack">
        <button class="btn ksc" id="solo">Solo vs KI</button>
      </div>
      <div class="card stack">
        <label class="field">Verein
          <select id="team"><option value="ksc">KSC</option><option value="vfb">VfB</option></select>
        </label>
        <label class="field">KI-Schwierigkeit
          <select id="diff">
            <option value="easy" selected>Einfach</option>
            <option value="normal">Normal</option>
            <option value="hard">Schwer</option>
          </select>
        </label>
        <label class="field">KI-Verhalten
          <select id="beh">
            <option value="balanced" selected>Ausgewogen</option>
            <option value="patient">Geduldig</option>
            <option value="aggro">Aggro</option>
            <option value="beer">Bier-Gier</option>
            <option value="earlywin">Early-Win</option>
          </select>
        </label>
      </div>
    </div>`;
  const team = app.querySelector<HTMLSelectElement>("#team")!;
  const diff = app.querySelector<HTMLSelectElement>("#diff")!;
  const beh = app.querySelector<HTMLSelectElement>("#beh")!;
  team.value = state.settings.playerTeam;
  diff.value = state.settings.difficulty;
  beh.value = state.settings.behavior;
  app.querySelector("#solo")!.addEventListener("click", () => {
    state.settings = {
      playerTeam: team.value as TeamId,
      difficulty: diff.value as SoloSettings["difficulty"],
      behavior: beh.value as SoloSettings["behavior"],
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
        <p class="sub">Architect-Setup · ${teamLabel(state.settings.playerTeam)}</p>
        <h1 class="brand" style="font-size:1.7rem">10 Fans wählen</h1>
      </div>
      <div class="card stack">
        ${row("normalos", "Normalos (trinken/Stimmung)")}
        ${row("ultras", "Ultras (Kampf)")}
        ${row("familie", "Familie (Geld)")}
        <p class="tiny">Summe ${mixSum(mix)} / 10 ${isValidMix(mix) ? "✓" : ""}</p>
      </div>
      <div class="row">
        <button class="btn secondary grow" id="back">Zurück</button>
        <button class="btn ksc grow" id="start" ${isValidMix(mix) ? "" : "disabled"}>Anpfiff</button>
      </div>
    </div>`;
  app.querySelector("#back")!.addEventListener("click", () => go("menu"));
  app.querySelector("#start")!.addEventListener("click", startMatch);
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

function aiSetup(s: SoloSettings): SetupConfig {
  if (s.behavior === "beer")
    return { mix: { normalos: 6, ultras: 2, familie: 2 }, startBier: true };
  if (s.behavior === "aggro")
    return { mix: { normalos: 3, ultras: 5, familie: 2 }, startBier: true };
  if (s.behavior === "patient")
    return { mix: { normalos: 4, ultras: 2, familie: 4 }, startBier: true };
  return { mix: defaultMix(), startBier: true };
}

function startMatch(): void {
  state.match = new Match({
    settings: state.settings,
    playerSetup: state.setup,
    aiSetup: aiSetup(state.settings),
  });
  go("match");
}

function buyClass(ok: boolean): string {
  return ok ? "buy ready" : "buy locked";
}

function renderMatchScreen(): void {
  const m = state.match!;
  app.innerHTML = `
    <div class="rotate-hint">Bitte Handy quer drehen ↻</div>
    <div class="match-shell">
      <div class="topbar">
        <div class="stat-big">
          <span class="label">Gold</span>
          <span class="value" id="gold">0</span>
        </div>
        <div class="scorebox">
          <div class="score" id="score">0:0</div>
          <div class="minute" id="clock">0′</div>
          <div class="tiny" id="phase">Regulär</div>
        </div>
        <div class="stat-big right">
          <span class="label">Momentum</span>
          <span class="value" id="mom">0</span>
        </div>
      </div>
      <div id="game-wrap">
        <canvas id="c"></canvas>
        <div class="toast" id="toast"></div>
      </div>
      <div class="row" style="justify-content:space-between">
        <div class="speed-btns">
          <button data-spd="0" title="Pause">⏸</button>
          <button data-spd="1" class="on" title="Play">▶</button>
          <button data-spd="2" title="2x">2×</button>
        </div>
        <div class="tiny" id="hint">Slot tippen → Bierstand · Kurve → Stimmung · Mitte → Fans schicken</div>
      </div>
      <div class="action-dock">
        <div class="zone" id="zona-curva">
          <h3>Kurve · Stimmung</h3>
          <div id="curva-actions" class="stack"></div>
        </div>
        <div class="zone" id="zona-lane">
          <h3>Lane · Fans schicken</h3>
          <div id="lane-actions" class="row"></div>
        </div>
        <div class="zone" id="zona-build">
          <h3>Versorgung · Bauen</h3>
          <div id="build-actions" class="stack"></div>
        </div>
      </div>
    </div>`;

  const canvas = app.querySelector<HTMLCanvasElement>("#c")!;
  const wrap = app.querySelector<HTMLDivElement>("#game-wrap")!;
  const ctx = canvas.getContext("2d")!;

  const resize = () => {
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    m.width = rect.width;
    m.height = rect.height;
  };
  resize();
  window.addEventListener("resize", resize);

  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const slot = hitLaneSlot(m, x, y);
    if (slot != null) {
      m.selectedLaneSlot = slot;
      syncActions();
      return;
    }
    if (hitPlayerCurva(m, x, y)) {
      // focus curva actions visually via toast
      m.toast("Kurve gewählt — Pyro/Chor unten");
    }
  });

  app.querySelectorAll<HTMLButtonElement>("[data-spd]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const spd = Number(btn.dataset.spd) as SpeedMode;
      m.setSpeed(spd);
      app.querySelectorAll("[data-spd]").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
    });
  });

  const syncActions = () => {
    const sends: SendKind[] = ["ultras", "normalos", "familie", "mix"];
    const lane = app.querySelector("#lane-actions")!;
    lane.innerHTML = sends
      .map((k) => {
        const st = m.canSend(k);
        return `<button class="${buyClass(st.ok)}" data-send="${k}">
          ${st.label}<span class="price">${st.cost}g</span>
          ${st.ok ? "" : `<span class="need">${st.reason ?? ""}</span>`}
        </button>`;
      })
      .join("");
    lane.querySelectorAll<HTMLButtonElement>("[data-send]").forEach((btn) => {
      btn.addEventListener("click", () => {
        m.trySend(btn.dataset.send as SendKind);
        syncActions();
      });
    });

    const curva = app.querySelector("#curva-actions")!;
    const pyro = m.canCurvaAction("pyro");
    const chor = m.canCurvaAction("chor");
    curva.innerHTML = `
      <button class="${buyClass(pyro.ok)}" data-act="pyro">Pyro<span class="price">${pyro.cost}g</span>${pyro.ok ? "" : `<span class="need">${pyro.reason}</span>`}</button>
      <button class="${buyClass(chor.ok)}" data-act="chor">Chor<span class="price">${chor.cost}g</span>${chor.ok ? "" : `<span class="need">${chor.reason}</span>`}</button>`;
    curva.querySelectorAll<HTMLButtonElement>("[data-act]").forEach((btn) => {
      btn.addEventListener("click", () => {
        m.tryCurvaAction(btn.dataset.act as "pyro" | "chor");
        syncActions();
      });
    });

    const build = app.querySelector("#build-actions")!;
    const slot = m.selectedLaneSlot;
    if (slot == null) {
      build.innerHTML = `<p class="tiny">Leeren Lane-Slot tippen</p>`;
    } else {
      const st = m.canBuildBier(slot);
      build.innerHTML = `<button class="${buyClass(st.ok)}" data-build="bier">Bierstand Slot ${slot + 1}<span class="price">${st.cost}g</span>${st.ok ? "" : `<span class="need">${st.reason}</span>`}</button>`;
      build.querySelector("button")?.addEventListener("click", () => {
        m.tryBuildBier(slot);
        syncActions();
      });
    }
  };
  syncActions();

  state.last = performance.now();
  const loop = (now: number) => {
    if (state.screen !== "match" || !state.match) return;
    const dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;
    m.update(dt);
    drawMatch(ctx, m);
    syncHud(m);
    if (Math.floor(now / 400) !== Math.floor((now - dt * 1000) / 400)) syncActions();
    if (m.result) {
      setTimeout(() => go("result"), 800);
      return;
    }
    state.raf = requestAnimationFrame(loop);
  };
  state.raf = requestAnimationFrame(loop);
}

function syncHud(m: Match): void {
  const $ = (id: string) => app.querySelector(`#${id}`)!;
  $("score").textContent = `${m.scoreKsc} : ${m.scoreVfb}`;
  $("clock").textContent = formatMinute(m.minute);
  $("phase").textContent =
    m.phase === "regular"
      ? "Regulär"
      : m.phase === "et"
        ? "Verlängerung"
        : m.phase === "pens"
          ? "Elfmeter"
          : "Ende";
  $("gold").textContent = String(Math.floor(m.gold));
  $("mom").textContent = String(Math.floor(m.momentum));
  const toast = app.querySelector("#toast")!;
  const t = m.toasts[0];
  if (t) {
    toast.textContent = t.text;
    toast.classList.add("show");
  } else toast.classList.remove("show");
}

function renderResult(): void {
  const m = state.match!;
  const r = m.result!;
  const youWin = r.winner === state.settings.playerTeam;
  app.innerHTML = `
    <div class="screen menu">
      <div>
        <p class="sub">${r.detail}</p>
        <h1 class="brand">${youWin ? "Sieg!" : "Niederlage"}</h1>
        <p class="sub">${teamLabel(r.winner)} · ${r.score[0]}:${r.score[1]} · ${r.reason}</p>
      </div>
      <div class="row">
        <button class="btn secondary grow" id="menu">Menü</button>
        <button class="btn ksc grow" id="again">Rematch</button>
      </div>
    </div>`;
  app.querySelector("#menu")!.addEventListener("click", () => go("menu"));
  app.querySelector("#again")!.addEventListener("click", () => go("setup"));
}

render();
