import { defineTool } from "@cursor/bdk/tools";
import { z } from "zod";
import { GAME_STACK } from "../lib/controls.js";

export default defineTool({
  description:
    "Resolve where LaneLink should be playtested for this Auftrag. Prefer an explicit URL, else local vite, else GitHub Pages. Never treat a stale Cloudflare tunnel as authoritative.",
  effect: "read",
  inputSchema: z.object({
    preferredUrl: z
      .string()
      .url()
      .optional()
      .describe("Explicit game URL from the Auftrag or PR preview."),
    branchHint: z
      .string()
      .optional()
      .describe("Git branch under test, if known."),
  }),
  async execute({ preferredUrl, branchHint }) {
    const envUrl = process.env.LANELINK_URL?.trim();
    const url = preferredUrl ?? (envUrl && envUrl.length > 0 ? envUrl : undefined);
    const source = url
      ? preferredUrl
        ? "auftrag"
        : "env"
      : "local-default";
    return {
      stack: GAME_STACK,
      target: {
        url: url ?? "http://127.0.0.1:5173/",
        source,
        branchHint: branchHint ?? null,
        howToBootLocal: GAME_STACK.localDev,
        pagesFallback: GAME_STACK.pagesUrl,
      },
      warnings: [
        "Cloudflare *.trycloudflare.com links expire and often lag the branch under test.",
        "Hard-refresh after deploys; confirm landscape viewport before asserting HUD bugs.",
        "Gameplay source of truth: cursor/block-spacing-ultra-combat-dba3; icons may land via cursor/matchday-icons-a9b1.",
      ],
    };
  },
});
