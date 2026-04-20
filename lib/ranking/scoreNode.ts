import { RANK_WEIGHTS } from "@/lib/ranking/constants";
import type { RankBreakdown, RankContext } from "@/lib/ranking/types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function kindBaseBoost(kind: RankContext["kind"]) {
  if (kind === "cuisine") return 14;
  if (kind === "family") return 12;
  if (kind === "category") return 10;
  if (kind === "technique" || kind === "ingredient") return 8;
  if (kind === "recipe" || kind === "variation") return 7;
  return 6;
}

function normalizedDegreeScore(degree: number, maxDegree: number) {
  if (maxDegree <= 0) return 0;
  return clamp((degree / maxDegree) * 100);
}

function normalizedCompletenessScore(context: RankContext) {
  const description = context.hasDescription ? 28 : 0;
  const meta = context.hasMeta ? 18 : 0;
  const tags = Math.min(context.tagCount, 6) * 6;
  const canonical = context.canonical ? 18 : 4;
  return clamp(description + meta + tags + canonical + kindBaseBoost(context.kind));
}

export function scoreNode(context: RankContext): RankBreakdown {
  const popularityScore = clamp(normalizedDegreeScore(context.degree, context.maxDegree) * 0.65 + normalizedCompletenessScore(context) * 0.35);
  const graphStrengthScore = clamp(normalizedDegreeScore(context.degree, context.maxDegree));
  const manualBoost = clamp(context.manualBoost ?? 0, 0, 20);
  const rankScore = clamp(
    popularityScore * RANK_WEIGHTS.popularity +
      graphStrengthScore * RANK_WEIGHTS.graphStrength +
      manualBoost * RANK_WEIGHTS.manualBoost
  );

  return {
    popularityScore,
    graphStrengthScore,
    manualBoost,
    rankScore
  };
}
