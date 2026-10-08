import { defineTool } from "@cursor/bdk/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Record the final Personen-Icon inventory summary for this Auftrag (counts, missing files, gallery path).",
  effect: "write",
  inputSchema: z.object({
    foundTotal: z.number().int().nonnegative(),
    expectedTotal: z.number().int().positive().default(60),
    missingFilenames: z.array(z.string()).default([]),
    galleryPath: z.string().optional(),
    notes: z.string().optional(),
  }),
  async execute(input) {
    const complete =
      input.foundTotal >= input.expectedTotal &&
      input.missingFilenames.length === 0;
    return {
      recorded: true,
      complete,
      verdict: complete ? "complete" : "incomplete",
      foundTotal: input.foundTotal,
      expectedTotal: input.expectedTotal,
      missingFilenames: input.missingFilenames,
      galleryPath: input.galleryPath ?? null,
      notes: input.notes ?? null,
    };
  },
});
