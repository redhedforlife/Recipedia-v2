import type { Dish, DishIngredientProfile, Ingredient, Recipe, ReviewQueueItem } from "@/lib/pipeline/types";
import { PIPELINE_THRESHOLDS } from "@/lib/pipeline/config";
import { readJsonFile, workspacePath, writeJsonFile } from "@/lib/pipeline/io";

const MANUAL_CANONICAL_OVERRIDES: Record<string, string[]> = {
  "club-sandwich": ["bread", "lettuce", "tomato", "mayonnaise"],
  blt: ["bacon", "lettuce", "tomato", "bread", "mayonnaise"],
  cheeseburger: ["beef", "bun", "cheese"],
  "philly-cheesesteak": ["beef", "bread", "cheese", "onion"],
  chili: ["beef", "chili pepper", "tomato", "onion"]
};

function buildProfileRow(
  dishId: string,
  ingredientId: string,
  role: DishIngredientProfile["role"],
  frequency: number,
  sourceRecipeCount: number
): DishIngredientProfile {
  return {
    dishId,
    ingredientId,
    role,
    frequency,
    confidenceScore: Math.min(1, 0.55 + frequency * 0.45),
    sourceRecipeCount
  };
}

export async function computeDishIngredientProfiles() {
  const [dishes, recipes, ingredients, reviewQueue] = await Promise.all([
    readJsonFile<Dish[]>(workspacePath("data", "normalized", "dishes", "dishes.json")),
    readJsonFile<Recipe[]>(workspacePath("data", "normalized", "recipes", "mapped_recipes.json")),
    readJsonFile<Ingredient[]>(workspacePath("data", "normalized", "ingredients", "ingredients.json")),
    readJsonFile<ReviewQueueItem[]>(workspacePath("data", "normalized", "dishes", "review_queue_pre_profiles.json"))
  ]);

  const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const ingredientIdBySlug = new Map(ingredients.map((ingredient) => [ingredient.slug, ingredient.id]));
  const recipesByDish = recipes.reduce<Map<string, Recipe[]>>((acc, recipe) => {
    if (!acc.has(recipe.dishId)) acc.set(recipe.dishId, []);
    acc.get(recipe.dishId)?.push(recipe);
    return acc;
  }, new Map());

  const updatedDishes = dishes.map((dish) => {
    const dishRecipes = recipesByDish.get(dish.id) ?? [];

    if (!dishRecipes.length) {
      return {
        ...dish,
        recipeCount: 0,
        coverageStatus: dish.canonicalIngredients.length ? "ingredients_only" : "taxonomy_only"
      };
    }

    const ingredientRecipeCount = new Map<string, number>();

    dishRecipes.forEach((recipe) => {
      const seen = new Set<string>();
      recipe.ingredients.forEach((ingredient) => {
        if (!ingredient.ingredientId || seen.has(ingredient.ingredientId)) return;
        seen.add(ingredient.ingredientId);
        ingredientRecipeCount.set(ingredient.ingredientId, (ingredientRecipeCount.get(ingredient.ingredientId) ?? 0) + 1);
      });
    });

    const profileRows: DishIngredientProfile[] = Array.from(ingredientRecipeCount.entries()).map(([ingredientId, count]) => {
      const frequency = count / dishRecipes.length;
      let role: DishIngredientProfile["role"] = "variant";
      if (dishRecipes.length >= PIPELINE_THRESHOLDS.minRecipesForFrequencyProfiles) {
        if (frequency >= PIPELINE_THRESHOLDS.canonicalMinFrequency) role = "canonical";
        else if (
          frequency >= PIPELINE_THRESHOLDS.optionalMinFrequency &&
          frequency <= PIPELINE_THRESHOLDS.optionalMaxFrequency
        )
          role = "optional";
      } else if (frequency >= 0.8) {
        role = "canonical";
      } else if (frequency >= 0.4) {
        role = "optional";
      }

      return buildProfileRow(dish.id, ingredientId, role, frequency, count);
    });

    const manualOverrides = MANUAL_CANONICAL_OVERRIDES[dish.slug] ?? [];
    for (const overrideName of manualOverrides) {
      const overrideId = ingredientIdBySlug.get(overrideName.replace(/\s+/g, "-"));
      if (!overrideId) continue;
      const existing = profileRows.find((row) => row.ingredientId === overrideId);
      if (existing) {
        existing.role = "canonical";
        existing.confidenceScore = Math.max(existing.confidenceScore, 0.92);
      } else {
        profileRows.push(buildProfileRow(dish.id, overrideId, "canonical", 0.67, Math.max(1, Math.floor(dishRecipes.length * 0.67))));
      }
    }

    const canonicalIngredients = profileRows
      .filter((row) => row.role === "canonical")
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 12);
    const optionalCommonIngredients = profileRows
      .filter((row) => row.role === "optional")
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);

    const unresolvedIngredients = profileRows.filter(
      (row) => !ingredientById.has(row.ingredientId) || row.ingredientId === "ing-unknown-ingredient"
    );
    if (unresolvedIngredients.length) {
      reviewQueue.push({
        id: `review-ing-${dish.id}`,
        itemType: "ingredient",
        itemId: dish.id,
        issueType: "poor_ingredient_normalization",
        summary: `Dish '${dish.name}' has ${unresolvedIngredients.length} low-quality ingredient normalizations.`,
        candidateResolutions: [
          "Add ingredient synonym mappings",
          "Map unresolved ingredient IDs manually",
          "Re-run normalization"
        ],
        confidenceScore: 0.48,
        sourceExamples: unresolvedIngredients.map((row) => row.ingredientId).slice(0, 8),
        createdAt: new Date().toISOString()
      });
    }

    if (canonicalIngredients.length === 0 && dishRecipes.length >= PIPELINE_THRESHOLDS.minRecipesForFrequencyProfiles) {
      reviewQueue.push({
        id: `review-profile-${dish.id}`,
        itemType: "dish_profile",
        itemId: dish.id,
        issueType: "conflicting_profile",
        summary: `Dish '${dish.name}' has no canonical ingredients despite ${dishRecipes.length} recipes.`,
        candidateResolutions: [
          "Review recipe-to-dish mapping quality",
          "Split dish into multiple dish concepts",
          "Tune canonical frequency threshold"
        ],
        confidenceScore: 0.44,
        sourceExamples: dishRecipes.slice(0, 5).map((recipe) => recipe.title),
        createdAt: new Date().toISOString()
      });
    }

    const coverageStatus = dish.reviewedAt
      ? "reviewed"
      : dishRecipes.length >= 3
        ? "multi_recipe"
        : canonicalIngredients.length
          ? "ingredients_only"
          : "has_recipe";

    return {
      ...dish,
      recipeCount: dishRecipes.length,
      canonicalIngredients,
      optionalCommonIngredients,
      coverageStatus
    };
  });

  await writeJsonFile(workspacePath("data", "normalized", "dishes", "dishes_with_profiles.json"), updatedDishes);
  await writeJsonFile(workspacePath("data", "normalized", "dishes", "review_queue.json"), reviewQueue);

  return {
    dishCount: updatedDishes.length,
    reviewQueueCount: reviewQueue.length,
    dishesWithCanonicalIngredients: updatedDishes.filter((dish) => dish.canonicalIngredients.length).length
  };
}
