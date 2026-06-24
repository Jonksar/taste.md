import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

import type { TasteCandidate, TasteEvidenceItem } from "./evidence.js";
import { calculateConfidence } from "./formula.js";

export type DiscoverGuidelineOptions = {
  repoPath: string;
  lambda?: number;
};

export type DiscoverRepositoryOptions = DiscoverGuidelineOptions & {
  includeGuidelines?: boolean;
};

type RuleSection = {
  heading: string;
  evidence: string;
};

const DEFAULT_LAMBDA = 0.35;
const EXCLUDED_DIRECTORIES = new Set([
  ".git",
  ".mypy_cache",
  ".pytest_cache",
  ".ruff_cache",
  ".venv",
  ".worktrees",
  "__pycache__",
  "coverage",
  "dist",
  "node_modules",
  "vendor",
]);

export async function discoverRepositoryCandidates(
  options: DiscoverRepositoryOptions,
): Promise<TasteCandidate[]> {
  const files = await listRepositoryMarkdownFiles(
    options.repoPath,
    options.includeGuidelines ?? false,
  );
  return await candidatesFromMarkdownFiles(files, options.repoPath, options.lambda ?? DEFAULT_LAMBDA);
}

export async function discoverGuidelineCandidates(
  options: DiscoverGuidelineOptions,
): Promise<TasteCandidate[]> {
  const files = await listGuidelineFiles(options.repoPath);
  return await candidatesFromMarkdownFiles(files, options.repoPath, options.lambda ?? DEFAULT_LAMBDA);
}

async function candidatesFromMarkdownFiles(
  files: string[],
  repoPath: string,
  lambda: number,
): Promise<TasteCandidate[]> {
  const candidates: TasteCandidate[] = [];
  const candidatesBySlug = new Map<string, TasteCandidate>();

  for (const file of files) {
    const content = await readFile(file, "utf8");
    const source = relative(repoPath, file);

    for (const section of extractRuleSections(content)) {
      const title = cleanHeading(section.heading);
      if (!title) continue;

      const evidence: TasteEvidenceItem = {
        source,
        text: section.evidence,
      };

      const slug = slugify(title);
      const existing = candidatesBySlug.get(slug);
      if (existing) {
        existing.evidence.push(evidence);
        continue;
      }

      const candidate = {
        slug,
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
      };
      candidatesBySlug.set(slug, candidate);
      candidates.push(candidate);
    }
  }

  return candidates;
}

async function listRepositoryMarkdownFiles(
  repoPath: string,
  includeGuidelines: boolean,
): Promise<string[]> {
  const files: string[] = [];
  await walkMarkdownFiles(repoPath, repoPath, includeGuidelines, files);
  return files.sort();
}

async function walkMarkdownFiles(
  rootPath: string,
  directory: string,
  includeGuidelines: boolean,
  files: string[],
): Promise<void> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (isMissingPathError(error)) return;
    throw error;
  }

  entries.sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (shouldSkipDirectory(rootPath, path, entry.name, includeGuidelines)) continue;
      await walkMarkdownFiles(rootPath, path, includeGuidelines, files);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(path);
    }
  }
}

function shouldSkipDirectory(
  rootPath: string,
  path: string,
  name: string,
  includeGuidelines: boolean,
): boolean {
  if (EXCLUDED_DIRECTORIES.has(name)) return true;
  if (!includeGuidelines && name === "guidelines") return true;

  const relativePath = relative(rootPath, path);
  return relativePath === "examples" || relativePath.startsWith(`examples/`);
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
  let currentParentHeading = "";
  let currentHeading: string | null = null;
  let currentBody: string[] = [];
  let inFence = false;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }

    const headingMatch = !inFence ? /^(#{1,6})\s+(.+)$/.exec(line) : null;
    if (headingMatch) {
      pushSection(sections, currentHeading, currentBody);
      currentHeading = null;
      currentBody = [];
      const level = headingMatch[1].length;
      const heading = headingMatch[2].trim();
      if (level === 2) {
        currentParentHeading = heading;
      }
      if (level === 3 && isRuleParentHeading(currentParentHeading)) {
        currentHeading = heading;
      }
      continue;
    }

    const bulletRule = !inFence ? extractBoldBulletRule(line, currentParentHeading) : null;
    if (bulletRule) {
      sections.push(bulletRule);
      continue;
    }

    if (currentHeading && !inFence) {
      currentBody.push(line);
    }
  }

  pushSection(sections, currentHeading, currentBody);
  return sections;
}

function extractBoldBulletRule(
  line: string,
  parentHeading: string,
): RuleSection | null {
  if (!isRuleParentHeading(parentHeading)) return null;

  const match = /^[-*]\s+\*\*([^*]+)\*\*:\s*(.+)$/.exec(line.trim());
  if (!match) return null;

  const heading = `${match[1]}: ${match[2]}`;
  return {
    heading,
    evidence: cleanMarkdownText(heading),
  };
}

function isRuleParentHeading(heading: string): boolean {
  return /architecture|coding|convention|constraint|footgun|guideline|rule|security|testing/i.test(heading);
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
    .replace(/^FG-\d+\s+[—-]\s*/i, "")
    .replace(/^\d+\.\s*/, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanMarkdownText(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
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
