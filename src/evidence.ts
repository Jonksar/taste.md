import { calculateConfidence, type TasteScore } from "./formula.js";

export type PullRequestEvidence = {
  number: number;
  title: string;
  url: string;
  files: PullRequestFile[];
  reviews: PullRequestReview[];
  issueComments: PullRequestComment[];
  reviewComments: PullRequestReviewComment[];
};

export type PullRequestFile = {
  filename: string;
};

export type PullRequestReview = {
  author: string;
  body: string;
  state?: string;
};

export type PullRequestComment = {
  author: string;
  body: string;
};

export type PullRequestReviewComment = {
  author: string;
  body: string;
  path?: string;
};

export type DeriveOptions = {
  lambda?: number;
};

export type TasteCandidate = {
  slug: string;
  title: string;
  scope: string;
  rule: string;
  evidence: TasteEvidenceItem[];
  contradictions: TasteEvidenceItem[];
  score: TasteScore;
};

export type TasteEvidenceItem = {
  source: string;
  text: string;
  path?: string;
};

type CandidateAccumulator = {
  slug: string;
  title: string;
  rule: string;
  positive: TasteEvidenceItem[];
  negative: TasteEvidenceItem[];
  evidencePaths: string[];
  changedPaths: string[];
};

const DEFAULT_LAMBDA = 0.35;

export function deriveTasteCandidates(
  prs: PullRequestEvidence[],
  options: DeriveOptions = {},
): TasteCandidate[] {
  const accumulators = new Map<string, CandidateAccumulator>();
  const behaviorTests = ensureAccumulator(accumulators, {
    slug: "prefer-behavior-tests",
    title: "Prefer behavior tests",
    rule: "Prefer behavior tests over tests that mirror implementation details.",
  });

  for (const pr of prs) {
    const changedPaths = pr.files.map((file) => file.filename);
    behaviorTests.changedPaths.push(...changedPaths);

    for (const item of collectTextEvidence(pr)) {
      if (isBehaviorTestPreference(item.text)) {
        behaviorTests.positive.push(item);
        if (item.path) behaviorTests.evidencePaths.push(item.path);
        continue;
      }
      if (isBehaviorTestContradiction(item.text)) {
        behaviorTests.negative.push(item);
        if (item.path) behaviorTests.evidencePaths.push(item.path);
        continue;
      }

      const genericRule = parseGenericRule(item.text);
      if (genericRule) {
        const accumulator = ensureAccumulator(accumulators, genericRule);
        accumulator.positive.push(item);
        accumulator.changedPaths.push(...changedPaths);
        if (item.path) accumulator.evidencePaths.push(item.path);
      }
    }
  }

  const lambda = options.lambda ?? DEFAULT_LAMBDA;

  return [...accumulators.values()]
    .filter((accumulator) => accumulator.positive.length > 0)
    .map((accumulator) => {
      const reward = Math.min(1, 0.5 + accumulator.positive.length * 0.2);
      const anchorDrift = Math.min(1, accumulator.negative.length * 0.25);

      return {
        slug: accumulator.slug,
        title: accumulator.title,
        scope: inferScope(accumulator.evidencePaths, accumulator.changedPaths),
        rule: accumulator.rule,
        evidence: accumulator.positive,
        contradictions: accumulator.negative,
        score: calculateConfidence({ reward, anchorDrift, lambda }),
      };
    });
}

function ensureAccumulator(
  accumulators: Map<string, CandidateAccumulator>,
  rule: Pick<CandidateAccumulator, "slug" | "title" | "rule">,
): CandidateAccumulator {
  const existing = accumulators.get(rule.slug);
  if (existing) return existing;

  const accumulator = {
    ...rule,
    positive: [],
    negative: [],
    evidencePaths: [],
    changedPaths: [],
  };
  accumulators.set(rule.slug, accumulator);
  return accumulator;
}

function collectTextEvidence(pr: PullRequestEvidence): TasteEvidenceItem[] {
  const source = `PR #${pr.number}`;
  return [
    ...pr.reviews.map((review) => ({
      source,
      text: review.body,
    })),
    ...pr.issueComments.map((comment) => ({
      source,
      text: comment.body,
    })),
    ...pr.reviewComments.map((comment) => ({
      source,
      text: comment.body,
      path: comment.path,
    })),
  ].filter((item) => item.text.trim().length > 0);
}

function isBehaviorTestPreference(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    normalized.includes("behavior test") ||
    normalized.includes("observable behavior") ||
    (normalized.includes("test") &&
      normalized.includes("implementation detail") &&
      !normalized.includes("acceptable"))
  );
}

function isBehaviorTestContradiction(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    normalized.includes("implementation detail") &&
    normalized.includes("acceptable")
  );
}

function parseGenericRule(text: string): Pick<CandidateAccumulator, "slug" | "title" | "rule"> | null {
  const normalized = oneLine(text);
  const sentence = normalized.split(/[.!?]/)[0]?.trim();
  if (!sentence) return null;

  const useInstead = /^use\s+(.+?)\s+instead of\s+(.+)$/i.exec(sentence);
  if (useInstead) {
    return ruleFromSentence(`Use ${useInstead[1]} instead of ${useInstead[2]}`);
  }

  const preferOver = /^prefer\s+(.+?)\s+over\s+(.+)$/i.exec(sentence);
  if (preferOver) {
    return ruleFromSentence(`Prefer ${preferOver[1]} over ${preferOver[2]}`);
  }

  const avoid = /^avoid\s+(.+)$/i.exec(sentence);
  if (avoid) {
    return ruleFromSentence(`Avoid ${avoid[1]}`);
  }

  return null;
}

function ruleFromSentence(sentence: string): Pick<CandidateAccumulator, "slug" | "title" | "rule"> {
  const cleaned = sentence.trim().replace(/\s+/g, " ");
  return {
    slug: slugify(cleaned),
    title: cleaned,
    rule: `${cleaned}.`,
  };
}

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferScope(evidencePaths: string[], changedPaths: string[]): string {
  const testPath = evidencePaths.find((path) => path.includes("/tests/") || path.includes("/test/"));
  if (testPath) return throughTestDirectory(testPath);
  const firstPath = changedPaths[0] ?? evidencePaths[0];
  if (!firstPath) return "repository";
  return inferProjectScope(firstPath);
}

function throughTestDirectory(path: string): string {
  const parts = path.split("/");
  const testIndex = parts.findIndex((part) => part === "tests" || part === "test");
  if (testIndex <= 0) return parts.slice(0, 2).join("/");
  return parts.slice(0, testIndex + 1).join("/");
}

function inferProjectScope(path: string): string {
  const parts = path.split("/");
  const projectsIndex = parts.indexOf("projects");
  if (projectsIndex >= 0 && parts.length > projectsIndex + 1) {
    return parts.slice(0, projectsIndex + 2).join("/");
  }
  return parts.slice(0, Math.min(2, parts.length)).join("/");
}
