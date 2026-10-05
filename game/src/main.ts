import "./style.css";
import { Match } from "./game/Match";
import { drawMatch, hitSlot } from "./game/render";
import {
  MIX_MAX,
  MIX_MIN,
  TOWERS,
  type AiBehavior,
  type AiDifficulty,
  type FanMix,
  type SetupConfig,
  type SoloSettings,
  type TeamId,
  type TowerKind,
} from "./game/types";
import {
  defaultMix,
  defaultSetup,
  defaultSoloSettings,
  formatMinute,
  isValidMix,
  mixSum,
  synergyBonus,
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
    <div class="screen">
      <div>
        <p class="sub">LaneLink · Baden-Derby</p>
        <h1 class="brand">KSC<br/>vs<br/>VfB</h1>
        <p class="sub">Ränge halten. Bier zapfen. Spiel gewinnen — oder Early Win.</p>
      </div>
      <div class="card stack">
        <button class="btn ksc" id="solo">Solo vs KI</button>
        <button class="btn secondary" disabled>Koop (bald)</button>
        <button class="btn secondary" disabled>Versus 2P (bald)</button>
      </div>
      <div class="card stack">
        <label class="field">Dein Verein
          <select id="team">
            <option value="ksc">KSC</option>
            <option value="vfb">VfB</option>
          </select>
        </label>
        <label class="field">KI-Schwierigkeit (Default: einfach)
          <select id="diff">
            <option value="easy" selected>Einfach · lesbar</option>
            <option value="normal">Normal</option>
            <option value="hard">Schwer</option>
          </select>
        </label>
        <label class="field">KI-Verhalten
          <select id="beh">
            <option value="balanced" selected>Ausgewogen</option>
            <option value="patient">Geduldig</option>
            <option value="aggro">Aggro-Stimmung</option>
            <option value="beer">Bier-Gier</option>
            <option value="earlywin">Early-Win-Hunter</option>
          </select>
        </label>
      </div>
    </div>
  `;
  const team = app.querySelector<HTMLSelectElement>("#team")!;
  const diff = app.querySelector<HTMLSelectElement>("#diff")!;
  const beh = app.querySelector<HTMLSelectElement>("#beh")!;
  team.value = state.settings.playerTeam;
  diff.value = state.settings.difficulty;
  beh.value = state.settings.behavior;
  app.querySelector("#solo")!.addEventListener("click", () => {
    state.settings = {
      playerTeam: team.value as TeamId,
      difficulty: diff.value as AiDifficulty,
      behavior: beh.value as AiBehavior,
    };
    state.setup = defaultSetup();
    go("setup");
  });
}

function mixControls(mix: FanMix): string {
  const row = (key: keyof FanMix, label: string) => `
    <div class="row" style="align-items:center; justify-content:space-between">
      <span>${label} <span class="tiny">${MIX_MIN[key]}–${MIX_MAX[key]}</span></span>
      <div class="row">
        <button class="btn secondary" data-mix="${key}" data-d="-1" style="min-height:40px;min-width:40px;padding:0">−</button>
        <strong style="min-width:1.5rem;text-align:center">${mix[key]}</strong>
        <button class="btn secondary" data-mix="${key}" data-d="1" style="min-height:40px;min-width:40px;padding:0">+</button>
      </div>
    </div>`;
  return (
    row("normalos", "Normalos") +
    row("ultras", "Ultras") +
    row("familie", "Familie") +
    `<p class="tiny">Summe ${mixSum(mix)} / 10 ${isValidMix(mix) ? "✓" : "— bitte auf 10 bringen"}</p>`
  );
}

function renderSetup(): void {
  const towers = Object.keys(TOWERS) as TowerKind[];
  app.innerHTML = `
    <div class="screen">
      <div>
        <p class="sub">Architect-Setup · ${teamLabel(state.settings.playerTeam)}</p>
        <h1 class="brand" style="font-size:1.8rem">Curva bauen</h1>
      </div>
      <div class="card stack" id="mix">${mixControls(state.setup.mix)}</div>
      <div class="card stack">
        <p class="tiny" style="margin:0">Starttower</p>
        <div class="row" id="towers">
          ${towers
            .map((k) => {
              const syn = synergyBonus(state.setup.mix, k);
              const active = state.setup.startTower === k ? "active" : "";
              return `<button class="chip ${active}" data-tower="${k}">${TOWERS[k].name}${syn > 1 ? " ★" : ""}</button>`;
            })
            .join("")}
        </div>
      </div>
      <div class="row">
        <button class="btn secondary grow" id="back">Zurück</button>
        <button class="btn ksc grow" id="start" ${isValidMix(state.setup.mix) ? "" : "disabled"}>Anpfiff</button>
      </div>
    </div>
  `;
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
  app.querySelectorAll<HTMLButtonElement>("[data-tower]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.setup.startTower = btn.dataset.tower as TowerKind;
      renderSetup();
    });
  });
}

function aiSetupFromBehavior(s: SoloSettings): SetupConfig {
  if (s.behavior === "beer")
    return { mix: { normalos: 6, ultras: 2, familie: 2 }, startTower: "bier" };
  if (s.behavior === "aggro")
    return { mix: { normalos: 3, ultras: 5, familie: 2 }, startTower: "pyro" };
  if (s.behavior === "patient")
    return { mix: { normalos: 4, ultras: 2, familie: 4 }, startTower: "gitter" };
  if (s.behavior === "earlywin")
    return { mix: { normalos: 4, ultras: 4, familie: 2 }, startTower: "chor" };
  return { mix: defaultMix(), startTower: "gitter" };
}

function startMatch(): void {
  state.match = new Match({
    settings: state.settings,
    playerSetup: state.setup,
    aiSetup: aiSetupFromBehavior(state.settings),
  });
  go("match");
}

function renderMatchScreen(): void {
  const m = state.match!;
  app.innerHTML = `
    <div class="screen" style="padding:10px">
      <div id="game-wrap">
        <canvas id="c"></canvas>
        <div class="hud">
          <div class="hud-top">
            <div class="panel">
              <div class="scoreline">
                <span>KSC</span>
                <span class="score" id="score">0:0</span>
                <span>VfB</span>
              </div>
              <div class="row" style="justify-content:space-between">
                <span class="tiny" id="clock">0′</span>
                <span class="tiny" id="phase">Regulär</span>
                <span class="tiny" id="fever"></span>
              </div>
            </div>
            <div class="panel stack" style="gap:4px">
              <div class="meter"><span>HP</span><div class="bar"><i id="hp" style="width:100%;background:#e85d4c"></i></div><span id="hpv">20</span></div>
              <div class="meter"><span>Gold</span><div class="bar"><i id="gold" style="width:40%;background:#d4a017"></i></div><span id="goldv">0</span></div>
              <div class="meter"><span>Durst</span><div class="bar"><i id="thirst" style="width:20%"></i></div><span id="thirstv">0</span></div>
              <div class="meter"><span>Interesse</span><div class="bar"><i id="int" style="width:70%;background:#6bcb77"></i></div><span id="intv">0</span></div>
              <div class="meter"><span>Bier-Win</span><div class="bar"><i id="beerw" style="width:0%;background:#d4a017"></i></div><span id="beerwv">0</span></div>
              <div class="meter"><span>Stimmung</span><div class="bar"><i id="moodw" style="width:0%;background:#c084fc"></i></div><span id="moodwv">0</span></div>
            </div>
          </div>
          <div>
            <div class="toast" id="toast"></div>
            <div class="panel bottom-bar" id="build">
              ${(Object.keys(TOWERS) as TowerKind[])
                .map(
                  (k) =>
                    `<button data-build="${k}">${TOWERS[k].name}<span class="price">${TOWERS[k].cost}g</span></button>`,
                )
                .join("")}
              <button data-act="upgrade">Upgrade<span class="price">Slot</span></button>
              <button data-act="pyro">Pyro<span class="price">25g</span></button>
              <button data-act="raid">Trinken<span class="price">20g Fremd</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

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

  const pick = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const slot = hitSlot(m, x, y);
    if (slot != null) m.selectedSlot = slot;
  };
  canvas.addEventListener("pointerdown", (e) => pick(e.clientX, e.clientY));

  app.querySelectorAll<HTMLButtonElement>("[data-build]").forEach((btn) => {
    btn.addEventListener("click", () => {
      m.tryBuild(btn.dataset.build as TowerKind);
    });
  });
  app.querySelector<HTMLButtonElement>("[data-act=upgrade]")!.onclick = () =>
    m.tryUpgrade();
  app.querySelector<HTMLButtonElement>("[data-act=pyro]")!.onclick = () =>
    m.activatePyro();
  app.querySelector<HTMLButtonElement>("[data-act=raid]")!.onclick = () =>
    m.drinkRaid();

  state.last = performance.now();
  const loop = (now: number) => {
    if (state.screen !== "match" || !state.match) return;
    const dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;
    m.update(dt);
    drawMatch(ctx, m);
    syncHud(m);
    if (m.result) {
      setTimeout(() => go("result"), 700);
      return;
    }
    state.raf = requestAnimationFrame(loop);
  };
  state.raf = requestAnimationFrame(loop);
}

function syncHud(m: Match): void {
  const $ = (id: string) => app.querySelector(`#${id}`)!;
  $("score").textContent = `${m.scoreKsc}:${m.scoreVfb}`;
  $("clock").textContent = formatMinute(m.minute);
  $("phase").textContent =
    m.phase === "regular"
      ? "Regulär"
      : m.phase === "et"
        ? "Verlängerung"
        : m.phase === "pens"
          ? "Elfmeter"
          : "Ende";
  $("fever").innerHTML = m.fever ? '<span class="fieber">FIEBER</span>' : "";
  const setBar = (id: string, v: number, max = 100) => {
    (app.querySelector(`#${id}`) as HTMLElement).style.width =
      `${Math.round(clampPct(v, max))}%`;
  };
  setBar("hp", m.player.hp, 20);
  $("hpv").textContent = String(Math.max(0, Math.ceil(m.player.hp)));
  setBar("gold", m.player.gold, 250);
  $("goldv").textContent = String(Math.floor(m.player.gold));
  setBar("thirst", m.player.thirst);
  $("thirstv").textContent = String(Math.floor(m.player.thirst));
  setBar("int", m.player.interest);
  $("intv").textContent = String(Math.floor(m.player.interest));
  setBar("beerw", m.player.beerDrunk, 120);
  $("beerwv").textContent = String(Math.floor(m.player.beerDrunk));
  setBar("moodw", m.player.mood);
  $("moodwv").textContent = String(Math.floor(m.player.mood));

  const toast = app.querySelector("#toast")!;
  const t = m.toasts[0];
  if (t) {
    toast.textContent = t.text;
    toast.classList.add("show");
  } else toast.classList.remove("show");
}

function clampPct(v: number, max: number): number {
  return Math.max(0, Math.min(100, (v / max) * 100));
}

function renderResult(): void {
  const m = state.match!;
  const r = m.result!;
  const youWin = r.winner === state.settings.playerTeam;
  app.innerHTML = `
    <div class="screen">
      <div>
        <p class="sub">${r.detail}</p>
        <h1 class="brand" style="font-size:2.2rem">${youWin ? "Sieg!" : "Niederlage"}</h1>
        <p class="sub">${teamLabel(r.winner === "draw-bug" ? "ksc" : r.winner)} gewinnt · Endstand ${r.score[0]}:${r.score[1]} · ${r.reason}</p>
      </div>
      <div class="card stack">
        <div class="tiny">Bier getrunken: du ${m.player.beerDrunk.toFixed(0)}ℓ · KI ${m.ai.beerDrunk.toFixed(0)}ℓ</div>
        <div class="tiny">Stimmung: du ${m.player.mood.toFixed(0)} · KI ${m.ai.mood.toFixed(0)}</div>
        <div class="tiny">Curva-HP Rest: ${Math.max(0, m.player.hp)}</div>
      </div>
      <div class="row">
        <button class="btn secondary grow" id="menu">Menü</button>
        <button class="btn ksc grow" id="again">Rematch</button>
      </div>
    </div>
  `;
  app.querySelector("#menu")!.addEventListener("click", () => go("menu"));
  app.querySelector("#again")!.addEventListener("click", () => {
    state.setup = { ...state.setup, mix: { ...state.setup.mix } };
    go("setup");
  });
}

render();
