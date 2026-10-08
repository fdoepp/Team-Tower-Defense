import { defineTool } from "@cursor/bdk/tools";
import { z } from "zod";
import {
  defaultGalleryPath,
  writeGalleryFile,
} from "../lib/galleryHtml.js";
import { defaultIconRoots, scanCutoutUnitIcons } from "../lib/unitIcons.js";

export default defineTool({
  description:
    "Build an HTML gallery that shows every freigeschnittene Personen-Icon in grey, blue, and red for levels 1–5. Writes docs/gallery/unit-icons-cutouts.html by default.",
  effect: "write",
  inputSchema: z.object({
    extraRoots: z
      .array(z.string())
      .optional()
      .describe("Optional extra directories to scan for icons."),
    outPath: z
      .string()
      .optional()
      .describe(
        "Output HTML path. Default: unit-icons-agent/docs/gallery/unit-icons-cutouts.html",
      ),
    embedImages: z
      .boolean()
      .optional()
      .describe(
        "Embed PNGs as data URIs so the gallery is self-contained (default false; uses relative paths).",
      ),
  }),
  async execute({ extraRoots, outPath, embedImages }) {
    const roots = defaultIconRoots(extraRoots ?? []);
    const inventory = scanCutoutUnitIcons(roots);
    const target = outPath?.trim() ? outPath : defaultGalleryPath();
    const written = writeGalleryFile(inventory, target, {
      embedImages: embedImages ?? false,
    });

    return {
      galleryPath: written.outPath,
      bytes: written.bytes,
      rootsScanned: roots,
      summary: {
        expectedTotal: inventory.expectedTotal,
        foundTotal: inventory.foundTotal,
        missingTotal: inventory.missingTotal,
        complete: inventory.missingTotal === 0,
      },
      missing: inventory.missing,
      howToOpen: `Open ${written.outPath} in a browser to review all cutout unit icons.`,
    };
  },
});
