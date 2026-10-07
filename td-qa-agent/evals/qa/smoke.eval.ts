import { defineEval, includes } from "@cursor/bdk/evals";

export default defineEval({
  tags: ["smoke", "qa"],
  cases: [
    {
      id: "auftrag-victory",
      description:
        "Explicit Auftrag resolves the game target, loads controls, and records a QA report.",
      async test(t) {
        await t.send(
          [
            "Aktiver QA-Auftrag: Testdurchlauf LaneLink bis zum Sieg.",
            "Ziel: lokal http://127.0.0.1:5173/",
            "Prüfe Spielbarkeit und dass alle HUD-Buttons sichtbar und klickbar sind.",
            "Am Ende record_qa_report aufrufen.",
          ].join("\n"),
        );
        t.succeeded();
        t.calledTool("resolve_game_target");
        t.calledTool("list_expected_controls");
        t.calledTool("record_qa_report");
        t.check(t.reply, includes(/pass|fail|blocked|sieg|victory|qa/i));
      },
    },
  ],
});
