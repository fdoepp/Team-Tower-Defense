import { defineTool } from "@cursor/bdk/tools";
import { z } from "zod";
import {
  EXPECTED_CONTROLS,
  VICTORY_CONDITIONS,
  type ControlKind,
} from "../lib/controls.js";

export default defineTool({
  description:
    "Return the LaneLink UI control inventory and victory conditions used for visual/playability QA.",
  effect: "read",
  inputSchema: z.object({
    kinds: z
      .array(z.enum(["menu", "setup", "hud", "popup"]))
      .optional()
      .describe("Optional filter; omit for the full inventory."),
  }),
  async execute({ kinds }) {
    const filter = kinds && kinds.length > 0 ? new Set<ControlKind>(kinds) : null;
    const controls = filter
      ? EXPECTED_CONTROLS.filter((c) => filter.has(c.kind))
      : EXPECTED_CONTROLS;
    return {
      controls,
      victoryConditions: VICTORY_CONDITIONS,
      auditHints: [
        "Visible and clickable: in viewport, not covered, enabled when the flow says so, hit target receives the click.",
        "German labels: Gesang / Pyro / Pyro Wurf / Angriff; Matchday branch may show Kaufen/Senden.",
        "Do not stop after HUD looks ok — play until Spielsieg or observed Blocksturm.",
      ],
    };
  },
});
