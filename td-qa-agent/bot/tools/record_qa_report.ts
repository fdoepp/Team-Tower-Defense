import { parseGitHubPrContinuationKey } from "@cursor/bdk/channels/github";
import { defineTool } from "@cursor/bdk/tools";
import { z } from "zod";

const check = z.object({
  id: z.string().min(1).max(80),
  area: z.enum(["playability", "ui", "env"]),
  status: z.enum(["pass", "fail", "blocked", "skipped"]),
  detail: z.string().min(1).max(400),
});

type Check = z.infer<typeof check>;

export default defineTool({
  description:
    "Record the structured LaneLink QA report for this Auftrag. Call once at the end. Posts a PR comment when the session is a GitHub PR.",
  effect: "write",
  inputSchema: z.object({
    targetUrl: z.string().min(1).max(400),
    reachedVictory: z.boolean(),
    victoryKind: z
      .enum(["spielsieg", "blocksturm", "none", "unknown"])
      .describe("How victory was reached, or none/unknown."),
    checks: z.array(check).min(1).max(80),
    summary: z.string().min(1).max(500),
  }),
  async execute(input, ctx) {
    const fails = input.checks.filter((c) => c.status === "fail");
    const blocked = input.checks.filter((c) => c.status === "blocked");
    const verdict =
      fails.length > 0 ? "FAIL" : blocked.length > 0 ? "BLOCKED" : "PASS";

    await ctx.host.kv.put(`qa:last:${ctx.session.id}`, {
      at: new Date().toISOString(),
      verdict,
      ...input,
    });

    if (ctx.session.purpose === "eval") {
      return { recorded: true, posted: false, reason: "eval", verdict };
    }

    const ref = parseGitHubPrContinuationKey(ctx.session.continuationKey ?? "");
    if (ref === undefined) {
      return { recorded: true, posted: false, reason: "no-pr-session", verdict };
    }

    const octokit = await ctx.host.github.getOctokit();
    const response = await octokit.rest.issues.createComment({
      owner: ref.owner,
      repo: ref.repo,
      issue_number: ref.number,
      body: reportMarkdown({ ...input, verdict, fails, blocked }),
    });

    return {
      recorded: true,
      posted: true,
      verdict,
      pr: `${ref.owner}/${ref.repo}#${ref.number}`,
      url: response.data.html_url,
    };
  },
});

function reportMarkdown(args: {
  targetUrl: string;
  reachedVictory: boolean;
  victoryKind: string;
  summary: string;
  checks: Check[];
  verdict: string;
  fails: Check[];
  blocked: Check[];
}): string {
  const lines = [
    "## LaneLink QA",
    "",
    `**Verdict:** ${args.verdict}`,
    `**Target:** ${args.targetUrl}`,
    `**Victory:** ${args.reachedVictory ? "yes" : "no"} (${args.victoryKind})`,
    "",
    args.summary,
    "",
    "### Checks",
  ];
  for (const item of args.checks) {
    lines.push(
      `- \`${item.status}\` **${item.area}/${item.id}** — ${flatten(item.detail)}`,
    );
  }
  if (args.fails.length === 0 && args.blocked.length === 0) {
    lines.push("", "_No failing or blocked checks._");
  }
  return lines.join("\n");
}

function flatten(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
