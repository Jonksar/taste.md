import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

import type { TasteCandidate, TasteEvidenceItem } from "./evidence.js";
import { calculateConfidence } from "./formula.js";

export type DiscoverGuidelineOptions = {
  repoPath: string;
  lambda?: number;
};

type RuleSection = {
  heading: string;
  evidence: string;
};

const DEFAULT_LAMBDA = 0.35;

export async function discoverGuidelineCandidates(
  options: DiscoverGuidelineOptions,
): Promise<TasteCandidate[]> {
  const files = await listGuidelineFiles(options.repoPath);
  const candidates: TasteCandidate[] = [];
  const lambda = options.lambda ?? DEFAULT_LAMBDA;

  for (const file of files) {
    const content = await readFile(file, "utf8");
    const source = relative(options.repoPath, file);

    for (const section of extractRuleSections(content)) {
      const title = cleanHeading(section.heading);
      if (!title) continue;

      const evidence: TasteEvidenceItem = {
        source,
        text: section.evidence,
      };

      candidates.push({
        slug: slugify(title),
        title,
        scope: "repository",
        rule: ensureSentence(title),
        evidence: [evidence],
        contradictions: [],
        score: calculateConfidence({
          reward: 1,
          anchorDrift: 0,
          lambda,
        }),
      });
    }
  }

  return candidates;
}

async function listGuidelineFiles(repoPath: string): Promise<string[]> {
  const guidelinesPath = join(repoPath, "guidelines");
  let names: string[];
  try {
    names = await readdir(guidelinesPath);
  } catch (error) {
    if (isMissingPathError(error)) return [];
    throw error;
  }

  return names
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => join(guidelinesPath, name));
}

function extractRuleSections(markdown: string): RuleSection[] {
  const sections: RuleSection[] = [];
  const lines = markdown.split(/\r?\n/);
  let currentHeading: string | null = null;
  let currentBody: string[] = [];
  let inFence = false;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }

    if (!inFence && line.startsWith("### ")) {
      pushSection(sections, currentHeading, currentBody);
      currentHeading = line.slice(4).trim();
      currentBody = [];
      continue;
    }

    if (!inFence && currentHeading && line.startsWith("#")) {
      pushSection(sections, currentHeading, currentBody);
      currentHeading = null;
      currentBody = [];
      continue;
    }

    if (currentHeading && !inFence) {
      currentBody.push(line);
    }
  }

  pushSection(sections, currentHeading, currentBody);
  return sections;
}

function pushSection(
  sections: RuleSection[],
  heading: string | null,
  body: string[],
): void {
  if (!heading) return;
  const evidence = firstParagraph(body);
  if (!evidence) return;
  sections.push({ heading, evidence });
}

function firstParagraph(lines: string[]): string {
  const paragraph: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed && paragraph.length === 0) continue;
    if (!trimmed && paragraph.length > 0) break;
    paragraph.push(trimmed);
  }

  return paragraph.join(" ").replace(/\s+/g, " ").trim();
}

function cleanHeading(heading: string): string {
  return heading
    .replace(/^GL\d+-R\d+\.\s*/i, "")
    .replace(/^\d+\.\s*/, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureSentence(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isMissingPathError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}
