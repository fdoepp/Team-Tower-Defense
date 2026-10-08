/**
 * LaneLink UI inventory aligned with gameplay branch
 * `cursor/block-spacing-ultra-combat-dba3` (DOM HUD + canvas world).
 * Matchday icons (`cursor/matchday-icons-a9b1`) may rename labels to
 * Kaufen/Senden — keep both label families in mind during visual QA.
 */

export type ControlKind = "menu" | "setup" | "hud" | "popup";

export type ExpectedControl = {
  id: string;
  kind: ControlKind;
  labels: string[];
  selectorHint: string;
  mustBeClickable: boolean;
};

export const GAME_STACK = {
  name: "LaneLink",
  flavor: "KSC vs VfB stadium team-TD",
  runtime: "Vite + TypeScript (canvas world + DOM HUD)",
  localDev: "cd game && npm install && npm run dev → http://127.0.0.1:5173/",
  pagesUrl: "https://fdoepp.github.io/Team-Tower-Defense/",
  preferredBranches: [
    "cursor/block-spacing-ultra-combat-dba3",
    "cursor/matchday-icons-a9b1",
    "cursor/team-td-konzept-dba3",
  ],
  note: "Prefer branch under test + vite. Cloudflare quick tunnels expire; hard-refresh after deploys. Landscape ~1200×700 for playtests.",
} as const;

export const VICTORY_CONDITIONS = [
  {
    id: "spielsieg",
    label: "Spielsieg (primary)",
    detail:
      "Fans in block → Jubel → Momentum → Tore; win on score after regular / ET / pens. phase=ended with player winner.",
  },
  {
    id: "blocksturm",
    label: "Blocksturm (rare hard-win)",
    detail: "3 Ultras for 5s continuously in the enemy block (resets if <3).",
  },
] as const;

export const EXPECTED_CONTROLS: ExpectedControl[] = [
  {
    id: "solo",
    kind: "menu",
    labels: ["Solo vs KI"],
    selectorHint: "#solo",
    mustBeClickable: true,
  },
  {
    id: "fs-menu",
    kind: "menu",
    labels: ["Vollbild"],
    selectorHint: "#fs-menu",
    mustBeClickable: true,
  },
  {
    id: "start",
    kind: "setup",
    labels: ["Anpfiff"],
    selectorHint: "#start",
    mustBeClickable: true,
  },
  {
    id: "back",
    kind: "setup",
    labels: ["Zurück"],
    selectorHint: "#back",
    mustBeClickable: true,
  },
  {
    id: "btn-gesang",
    kind: "hud",
    labels: ["Gesang"],
    selectorHint: "#btn-gesang",
    mustBeClickable: true,
  },
  {
    id: "btn-pyro",
    kind: "hud",
    labels: ["Pyro"],
    selectorHint: "#btn-pyro",
    mustBeClickable: true,
  },
  {
    id: "btn-pyro-fight",
    kind: "hud",
    labels: ["Pyro Wurf"],
    selectorHint: "#btn-pyro-fight",
    mustBeClickable: true,
  },
  {
    id: "btn-hooligan",
    kind: "hud",
    labels: ["Angriff"],
    selectorHint: "#btn-hooligan",
    mustBeClickable: true,
  },
  {
    id: "quick-buy",
    kind: "hud",
    labels: ["+", "Kaufen"],
    selectorHint: "[data-quick-buy]",
    mustBeClickable: true,
  },
  {
    id: "buy-normalos",
    kind: "popup",
    labels: ["Fan", "Kaufen"],
    selectorHint: "#buy-normalos",
    mustBeClickable: true,
  },
  {
    id: "buy-ultras",
    kind: "popup",
    labels: ["Ultra", "Kaufen"],
    selectorHint: "#buy-ultras",
    mustBeClickable: true,
  },
  {
    id: "buy-hooligans",
    kind: "popup",
    labels: ["Hooligan", "Kaufen"],
    selectorHint: "#buy-hooligans",
    mustBeClickable: true,
  },
  {
    id: "build-bier",
    kind: "popup",
    labels: ["Bierstand"],
    selectorHint: '[data-build="bier"]',
    mustBeClickable: true,
  },
  {
    id: "build-ordner",
    kind: "popup",
    labels: ["Ordnerposten"],
    selectorHint: '[data-build="ordner"]',
    mustBeClickable: true,
  },
  {
    id: "build-fanshop",
    kind: "popup",
    labels: ["Fanshop"],
    selectorHint: '[data-build="fanshop"]',
    mustBeClickable: true,
  },
  {
    id: "btn-hire-steward",
    kind: "popup",
    labels: ["Ordner anheuern"],
    selectorHint: "#btn-hire-steward",
    mustBeClickable: true,
  },
  {
    id: "btn-upgrade",
    kind: "popup",
    labels: ["Upgrade"],
    selectorHint: "#btn-upgrade",
    mustBeClickable: true,
  },
  {
    id: "fs-enter",
    kind: "hud",
    labels: ["Vollbild starten"],
    selectorHint: "#fs-enter",
    mustBeClickable: true,
  },
];

export const ASK_QA_MARKER = "<!-- lanelink-qa-ask -->";
export const QA_COMMAND = "/qa";
