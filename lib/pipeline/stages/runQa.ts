import type { Dish, Recipe } from "@/lib/pipeline/types";
import { readJsonFile, workspacePath, writeJsonFile } from "@/lib/pipeline/io";

type QaIssue = {
  code: string;
  severity: "error" | "warning";
  message: string;
  itemId?: string;
};

function hasDuplicate(values: string[]) {
  return new Set(values).size !== values.length;
}

export async function runPublishedQaChecks() {
  const [dishes, recipes, summary, dedupeClusters] = await Promise.all([
    readJsonFile<Dish[]>(workspacePath("data", "published", "graph", "dishes.json")),
    readJsonFile<Recipe[]>(workspacePath("data", "published", "recipes", "recipes.json")),
    readJsonFile<{ dishCount: number; recipeCount: number }>(workspacePath("data", "published", "stats", "summary.json")),
    readJsonFile<Array<{ canonicalRecipeId: string; duplicateRecipeIds: string[] }>>(
      workspacePath("data", "normalized", "recipes", "dedupe_clusters.json")
    )
  ]);

  const qaIssues: QaIssue[] = [];
  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));

  dishes.forEach((dish) => {
    if (!dish.name.trim() || !dish.slug.trim()) {
      qaIssues.push({
        code: "dish_name_or_slug_empty",
        severity: "error",
        message: "Published dish has empty name or slug.",
        itemId: dish.id
      });
    }

    if (hasDuplicate(dish.canonicalIngredients.map((item) => item.ingredientId))) {
      qaIssues.push({
        code: "duplicate_canonical_ingredients",
        severity: "error",
        message: "Canonical ingredient profile includes duplicate ingredient IDs.",
        itemId: dish.id
      });
    }

    if (dish.aliases.some((alias) => alias.trim().toLowerCase() === dish.name.trim().toLowerCase())) {
      qaIssues.push({
        code: "alias_duplicates_primary_name",
        severity: "error",
        message: "Dish alias duplicates primary dish name.",
        itemId: dish.id
      });
    }

    if (!dish.sourceRefs.length) {
      qaIssues.push({
        code: "missing_source_refs_dish",
        severity: "error",
        message: "Dish is missing source metadata.",
        itemId: dish.id
      });
    }

    if (dish.recipeCount >= 1 && dish.coverageStatus === "taxonomy_only") {
      qaIssues.push({
        code: "coverage_inconsistent_recipe_count",
        severity: "error",
        message: "Dish has recipeCount >= 1 but coverageStatus is taxonomy_only.",
        itemId: dish.id
      });
    }

    if (dish.canonicalIngredients.length && dish.coverageStatus === "taxonomy_only") {
      qaIssues.push({
        code: "coverage_inconsistent_ingredient_profile",
        severity: "error",
        message: "Dish has canonical ingredients but taxonomy_only coverage.",
        itemId: dish.id
      });
    }

    if (dish.confidenceScore < 0.45 && !dish.reviewedAt) {
      qaIssues.push({
        code: "low_confidence_unreviewed_published",
        severity: "error",
        message: "Low-confidence, unreviewed dish should not be published.",
        itemId: dish.id
      });
    }
  });

  recipes.forEach((recipe) => {
    if (!recipe.dishId || !dishes.find((dish) => dish.id === recipe.dishId)) {
      qaIssues.push({
        code: "recipe_missing_dish_link",
        severity: "error",
        message: "Published recipe does not link to a valid dish.",
        itemId: recipe.id
      });
    }

    if (!recipe.sourceRefs.length) {
      qaIssues.push({
        code: "missing_source_refs_recipe",
        severity: "error",
        message: "Recipe is missing source metadata.",
        itemId: recipe.id
      });
    }
  });

  dedupeClusters.forEach((cluster) => {
    const canonicalPublished = recipeById.has(cluster.canonicalRecipeId);
    const duplicatesPublished = cluster.duplicateRecipeIds.filter((duplicateRecipeId) => recipeById.has(duplicateRecipeId));
    if (canonicalPublished && duplicatesPublished.length) {
      qaIssues.push({
        code: "duplicate_recipes_inflating_counts",
        severity: "error",
        message: `Duplicate recipes are still published for canonical recipe ${cluster.canonicalRecipeId}.`,
        itemId: cluster.canonicalRecipeId
      });
    }
  });

  const report = {
    generatedAt: new Date().toISOString(),
    summary,
    totalIssues: qaIssues.length,
    errorCount: qaIssues.filter((issue) => issue.severity === "error").length,
    warningCount: qaIssues.filter((issue) => issue.severity === "warning").length,
    issues: qaIssues
  };

  await writeJsonFile(workspacePath("data", "published", "stats", "qa_report.json"), report);

  return report;
}
