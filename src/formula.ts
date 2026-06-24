export type TasteFormulaInputs = {
  reward: number;
  anchorDrift: number;
  lambda: number;
};

export type TasteScore = {
  confidence: number;
  reward: number;
  anchorDrift: number;
  lambda: number;
  semantic: "taste inertia";
  formula: "confidence = clamp01(reward - lambda * anchorDrift)";
};

export function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function calculateConfidence(input: TasteFormulaInputs): TasteScore {
  const confidence = clamp01(input.reward - input.lambda * input.anchorDrift);

  return {
    confidence: roundScore(confidence),
    reward: input.reward,
    anchorDrift: input.anchorDrift,
    lambda: input.lambda,
    semantic: "taste inertia",
    formula: "confidence = clamp01(reward - lambda * anchorDrift)",
  };
}

function roundScore(value: number): number {
  return Math.round(value * 1000) / 1000;
}
