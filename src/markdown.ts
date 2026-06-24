import type { TasteCandidate, TasteEvidenceItem } from "./evidence.js";

export type RenderOptions = {
  title?: string;
};

export function renderTasteMarkdown(
  candidates: TasteCandidate[],
  options: RenderOptions = {},
): string {
  const title = options.title ?? "taste.md";
  const lines = [
    `# ${title}`,
    "",
    "Generated taste preferences. Include this file from `AGENTS.md` or `CLAUDE.md` when you want agents to apply these evidence-backed project preferences.",
    "",
    "Formula: `confidence = clamp01(reward - lambda * anchorDrift)`",
    "Lambda Semantic: `taste inertia`",
    "",
  ];

  if (candidates.length === 0) {
    lines.push("No taste candidates met the evidence threshold.", "");
    return lines.join("\n");
  }

  for (const candidate of candidates) {
    lines.push(`## ${candidate.title}`);
    lines.push("");
    lines.push(`Confidence: \`${formatScore(candidate.score.confidence)}\``);
    lines.push(`Reward: \`${formatScore(candidate.score.reward)}\``);
    lines.push(`Anchor Drift: \`${formatScore(candidate.score.anchorDrift)}\``);
    lines.push(`Lambda: \`${formatScore(candidate.score.lambda)}\``);
    lines.push(`Scope: \`${candidate.scope}\``);
    lines.push("");
    lines.push("Rule:");
    lines.push(candidate.rule);
    lines.push("");
    lines.push("Evidence:");
    lines.push(...candidate.evidence.map(renderEvidenceItem));
    if (candidate.contradictions.length > 0) {
      lines.push("");
      lines.push("Contradictions:");
      lines.push(...candidate.contradictions.map(renderEvidenceItem));
    }
    lines.push("");
  }

  return lines.join("\n");
}

function renderEvidenceItem(item: TasteEvidenceItem): string {
  const location = item.path ? ` (\`${item.path}\`)` : "";
  return `- ${item.source}${location}: ${oneLine(item.text)}`;
}

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function formatScore(value: number): string {
  return value.toFixed(3);
}
