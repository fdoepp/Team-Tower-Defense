import {
  defaultGitHubAuth,
  githubChannel,
} from "@cursor/bdk/channels/github";
import { ASK_QA_MARKER, QA_COMMAND } from "../lib/controls.js";
import { REPOS, watches } from "../lib/repos.js";

/** Ask once per PR identity; do not spam every synchronize. */
const ASK_ACTIONS = new Set(["opened", "reopened", "ready_for_review"]);

function isQaAuftrag(body: string): boolean {
  const text = body.trim().toLowerCase();
  if (text === QA_COMMAND || text.startsWith(`${QA_COMMAND} `)) {
    return true;
  }
  return (
    text.includes("qa starten") ||
    text.includes("qa-lauf") ||
    text.includes("testdurchlauf")
  );
}

export default githubChannel({
  botName: "td-qa-agent",
  // Repos via `bdk serve --cursor-events --repo fdoepp/Team-Tower-Defense`
  // so local `bdk call` / `eval --list` boot without a Cursor login.
  cursorAccount: true,
  deliverReplies: false,
  onPullRequest: (ctx, pr) => {
    if (!watches(ctx.repository.fullName) || pr.merged) {
      return null;
    }
    if (!ASK_ACTIONS.has(pr.action)) {
      return null;
    }
    return {
      task: async () => {
        const key = `qa:asked:${ctx.repository.fullName}#${pr.number}`;
        const already = await ctx.host.kv.get(key);
        if (already) {
          return;
        }
        const octokit = await ctx.github.getOctokit();
        await octokit.rest.issues.createComment({
          owner: ctx.repository.owner,
          repo: ctx.repository.name,
          issue_number: pr.number,
          body: [
            ASK_QA_MARKER,
            "## LaneLink QA?",
            "",
            "Soll ich einen **Testdurchlauf bis zum Sieg** fahren und die HUD-Buttons auf Sichtbarkeit/Klickbarkeit prüfen?",
            "",
            `Antworte mit \`${QA_COMMAND}\` (optional URL/Branch dahinter), dann starte ich den Auftrag.`,
            "",
            "_Ohne Auftrag läuft kein Playtest — nur diese Nachfrage._",
          ].join("\n"),
        });
        await ctx.host.kv.put(key, new Date().toISOString());
      },
    };
  },
  onComment: (ctx, comment) => {
    if (ctx.conversation.kind !== "pull_request") {
      return null;
    }
    if (!watches(ctx.repository.fullName)) {
      return null;
    }
    if (comment.body.includes(ASK_QA_MARKER)) {
      return null;
    }
    if (!isQaAuftrag(comment.body)) {
      return null;
    }
    return {
      auth: defaultGitHubAuth(ctx),
      title: `LaneLink QA ${ctx.repository.fullName}#${ctx.conversation.number}`,
      context: [
        "Active QA Auftrag from a PR comment.",
        "Load skills victory-playthrough and visual-ui-audit.",
        "Call resolve_game_target, list_expected_controls, then play until victory and record_qa_report once.",
      ],
      message: [
        `GitHub QA Auftrag on ${ctx.repository.fullName}#${ctx.conversation.number}`,
        `Comment: ${comment.body.trim()}`,
        `PR: ${ctx.conversation.url}`,
        "",
        "Run a full LaneLink playtest until victory and a visual UI button audit. Prefer the PR head / any URL in the comment. Finish with record_qa_report.",
      ].join("\n"),
    };
  },
});
