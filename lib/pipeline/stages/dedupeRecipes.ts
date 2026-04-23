import type { DedupeCluster, NormalizedRecipeRecord } from "@/lib/pipeline/types";
import { jaccardSimilarity, weightedAverage } from "@/lib/pipeline/utils";
import { readJsonFile, workspacePath, writeJsonFile } from "@/lib/pipeline/io";

function baseTitleKey(normalizedTitle: string) {
  return normalizedTitle
    .replace(/\b(classic|easy|best|homemade|style|recipe|authentic|quick)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function dedupeRecipes() {
  const normalizedPath = workspacePath("data", "normalized", "recipes", "normalized_recipes.json");
  const normalized = await readJsonFile<NormalizedRecipeRecord[]>(normalizedPath);

  const buckets = normalized.reduce<Map<string, NormalizedRecipeRecord[]>>((acc, recipe) => {
    const key = baseTitleKey(recipe.normalizedTitle) || recipe.normalizedTitle;
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key)?.push(recipe);
    return acc;
  }, new Map());

  const dedupeClusters: DedupeCluster[] = [];
  const canonicalRecipeIds = new Set<string>();

  for (const [key, items] of buckets) {
    if (items.length === 1) {
      canonicalRecipeIds.add(items[0].id);
      continue;
    }

    const canonical = items[0];
    canonicalRecipeIds.add(canonical.id);
    const duplicateRecipeIds: string[] = [];
    let titleScoreSum = 0;
    let ingredientScoreSum = 0;
    let instructionScoreSum = 0;

    for (let index = 1; index < items.length; index += 1) {
      const candidate = items[index];
      const titleSimilarity = jaccardSimilarity(canonical.titleTokens, candidate.titleTokens);
      const ingredientOverlap = jaccardSimilarity(canonical.normalizedIngredientIds, candidate.normalizedIngredientIds);
      const instructionSimilarity = jaccardSimilarity(
        canonical.normalizedInstructionTokens,
        candidate.normalizedInstructionTokens
      );

      const duplicateScore = weightedAverage([
        { score: titleSimilarity, weight: 0.45 },
        { score: ingredientOverlap, weight: 0.4 },
        { score: instructionSimilarity, weight: 0.15 }
      ]);

      if (duplicateScore >= 0.75) {
        duplicateRecipeIds.push(candidate.id);
        titleScoreSum += titleSimilarity;
        ingredientScoreSum += ingredientOverlap;
        instructionScoreSum += instructionSimilarity;
      } else {
        canonicalRecipeIds.add(candidate.id);
      }
    }

    if (duplicateRecipeIds.length) {
      const count = duplicateRecipeIds.length;
      dedupeClusters.push({
        clusterId: `dup-${key.replace(/\s+/g, "-")}`,
        canonicalRecipeId: canonical.id,
        duplicateRecipeIds,
        confidenceScore: weightedAverage([
          { score: titleScoreSum / count, weight: 0.45 },
          { score: ingredientScoreSum / count, weight: 0.4 },
          { score: instructionScoreSum / count, weight: 0.15 }
        ]),
        evidence: {
          titleSimilarity: titleScoreSum / count,
          ingredientOverlap: ingredientScoreSum / count,
          instructionSimilarity: instructionScoreSum / count
        }
      });
    }
  }

  await writeJsonFile(workspacePath("data", "normalized", "recipes", "dedupe_clusters.json"), dedupeClusters);
  await writeJsonFile(workspacePath("data", "normalized", "recipes", "canonical_recipe_ids.json"), Array.from(canonicalRecipeIds));

  return {
    canonicalRecipeCount: canonicalRecipeIds.size,
    duplicateClusterCount: dedupeClusters.length
  };
}
