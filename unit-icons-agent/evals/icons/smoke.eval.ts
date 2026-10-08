import { defineEval, includes } from "@cursor/bdk/evals";

export default defineEval({
  tags: ["smoke", "icons"],
  cases: [
    {
      id: "show-cutouts",
      description:
        "Auftrag lists freigeschnittene Personen-Icons and builds the gallery.",
      async test(t) {
        await t.send(
          [
            "Zeig mir alle Personen-Icons, die freigeschnitten in Grau, Blau und Rot für die Stufen 1 bis 5 existieren.",
            "Liste sie und baue die Galerie.",
          ].join("\n"),
        );
        t.succeeded();
        t.calledTool("list_cutout_unit_icons");
        t.calledTool("build_unit_icon_gallery");
        t.calledTool("record_icon_inventory");
        t.check(t.reply, includes(/60|galerie|grau|blau|rot|icon/i));
      },
    },
  ],
});
