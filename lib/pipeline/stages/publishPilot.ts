import type { CoverageStats, Dish, Ingredient, Recipe, ReviewQueueItem } from "@/lib/pipeline/types";
import { PIPELINE_THRESHOLDS, PILOT_CATEGORY_KEYWORDS, PILOT_CUISINE } from "@/lib/pipeline/config";
import { normalizeText } from "@/lib/pipeline/utils";
import { readJsonFile, workspacePath, writeJsonFile } from "@/lib/pipeline/io";

const PRIORITY_DISH_SLUGS = new Set([
  "club-sandwich",
  "blt",
  "french-dip",
  "philly-cheesesteak",
  "cheeseburger",
  "patty-melt",
  "pulled-pork-sandwich",
  "brisket-sandwich",
  "buffalo-wings",
  "chicken-fried-steak",
  "gumbo",
  "chili"
]);

function inferDishCategory(dish: Dish) {
  const content = `${dish.name} ${dish.description ?? ""} ${dish.categoryId ?? ""}`;
  return PILOT_CATEGORY_KEYWORDS.find((category) => category.pattern.test(content));
}

function americanScore(dish: Dish, recipeTitles: string[]) {
  let score = 0;
  if (dish.cuisineId === PILOT_CUISINE.id) score += 0.55;
  if (inferDishCategory(dish)) score += 0.2;
  if (/(american|united states|usa|new york|texas|louisiana|buffalo|philly)/i.test(`${dish.name} ${dish.description ?? ""}`))
    score += 0.25;
  if (recipeTitles.some((title) => /buffalo|philly|texas|carolina|new england|cajun|southern/i.test(title))) score += 0.2;
  return Math.min(1, score);
}

function sortByCoverageAndConfidence(a: Dish, b: Dish) {
  if (b.recipeCount !== a.recipeCount) return b.recipeCount - a.recipeCount;
  if (b.confidenceScore !== a.confidenceScore) return b.confidenceScore - a.confidenceScore;
  return a.name.localeCompare(b.name);
}

function buildCoverageStats(dishes: Dish[]): CoverageStats {
  const categories = PILOT_CATEGORY_KEYWORDS.map((category) => {
    const categoryDishes = dishes.filter((dish) => dish.categoryId === category.id || category.pattern.test(dish.name));
    return {
      categoryId: category.id,
      categoryName: category.name,
      totalDishes: categoryDishes.length,
      withCanonicalIngredients: categoryDishes.filter((dish) => dish.canonicalIngredients.length > 0).length,
      withOneOrMoreRecipes: categoryDishes.filter((dish) => dish.recipeCount >= 1).length,
      withThreeOrMoreRecipes: categoryDishes.filter((dish) => dish.recipeCount >= 3).length,
      reviewed: categoryDishes.filter((dish) => dish.coverageStatus === "reviewed").length
    };
  });

  return {
    cuisineId: PILOT_CUISINE.id,
    cuisineName: PILOT_CUISINE.name,
    totalDishes: dishes.length,
    dishesWithCanonicalIngredients: dishes.filter((dish) => dish.canonicalIngredients.length > 0).length,
    dishesWithOneOrMoreRecipes: dishes.filter((dish) => dish.recipeCount >= 1).length,
    dishesWithThreeOrMoreRecipes: dishes.filter((dish) => dish.recipeCount >= 3).length,
    reviewedDishes: dishes.filter((dish) => dish.coverageStatus === "reviewed").length,
    byCategory: categories
  };
}

export async function publishPilotDataset() {
  const [dishes, recipes, ingredients, reviewQueue] = await Promise.all([
    readJsonFile<Dish[]>(workspacePath("data", "normalized", "dishes", "dishes_with_profiles.json")),
    readJsonFile<Recipe[]>(workspacePath("data", "normalized", "recipes", "mapped_recipes.json")),
    readJsonFile<Ingredient[]>(workspacePath("data", "normalized", "ingredients", "ingredients.json")),
    readJsonFile<ReviewQueueItem[]>(workspacePath("data", "normalized", "dishes", "review_queue.json"))
  ]);

  const recipesByDish = recipes.reduce<Map<string, Recipe[]>>((acc, recipe) => {
    if (!acc.has(recipe.dishId)) acc.set(recipe.dishId, []);
    acc.get(recipe.dishId)?.push(recipe);
    return acc;
  }, new Map());

  let minConfidence = PIPELINE_THRESHOLDS.publishMinConfidence;
  let publishedDishes: Dish[] = [];

  while (minConfidence >= 0.5 && publishedDishes.length < 300) {
    publishedDishes = dishes
      .map((dish) => {
        const dishRecipes = recipesByDish.get(dish.id) ?? [];
        const score = americanScore(
          dish,
          dishRecipes.map((recipe) => recipe.title)
        );

        const category = inferDishCategory(dish);
        const normalizedAliases = dish.aliases.filter((alias) => normalizeText(alias) !== normalizeText(dish.name));
        const reviewed = PRIORITY_DISH_SLUGS.has(dish.slug) || dish.coverageStatus === "reviewed";

        const next: Dish = {
          ...dish,
          cuisineId: dish.cuisineId ?? (score >= 0.5 ? PILOT_CUISINE.id : dish.cuisineId),
          categoryId: dish.categoryId ?? category?.id,
          aliases: normalizedAliases,
          reviewedAt: reviewed ? new Date().toISOString() : dish.reviewedAt,
          coverageStatus: reviewed ? "reviewed" : dish.coverageStatus,
          confidenceScore: Math.max(dish.confidenceScore, score * 0.9)
        };

        return next;
      })
      .filter((dish) => dish.recipeCount >= 1)
      .filter((dish) => americanScore(dish, (recipesByDish.get(dish.id) ?? []).map((recipe) => recipe.title)) >= 0.5)
      .filter((dish) => dish.confidenceScore >= minConfidence || Boolean(dish.reviewedAt))
      .sort(sortByCoverageAndConfidence);

    minConfidence -= 0.02;
  }

  const publishedDishIds = new Set(publishedDishes.map((dish) => dish.id));
  const publishedRecipes = recipes.filter((recipe) => publishedDishIds.has(recipe.dishId));
  const publishedIngredientIds = new Set(
    publishedDishes.flatMap((dish) => [
      ...dish.canonicalIngredients.map((item) => item.ingredientId),
      ...dish.optionalCommonIngredients.map((item) => item.ingredientId),
      ...publishedRecipes
        .filter((recipe) => recipe.dishId === dish.id)
        .flatMap((recipe) => recipe.ingredients.map((ingredient) => ingredient.ingredientId))
        .filter((ingredientId): ingredientId is string => Boolean(ingredientId))
    ])
  );
  const publishedIngredients = ingredients.filter((ingredient) => publishedIngredientIds.has(ingredient.id));

  const publishedReviewQueue = reviewQueue.filter((item) => {
    if (item.itemType === "mapping" || item.itemType === "dish_profile") {
      const dishId = item.itemType === "mapping" ? publishedRecipes.find((recipe) => recipe.id === item.itemId)?.dishId : item.itemId;
      return dishId ? publishedDishIds.has(dishId) : false;
    }
    return true;
  });

  const coverage = buildCoverageStats(publishedDishes);

  const graphNodes = [
    { id: PILOT_CUISINE.id, kind: "cuisine", label: PILOT_CUISINE.name },
    ...PILOT_CATEGORY_KEYWORDS.map((category) => ({ id: category.id, kind: "category", label: category.name })),
    ...publishedDishes.map((dish) => ({
      id: dish.id,
      kind: "dish",
      label: dish.name,
      recipeCount: dish.recipeCount,
      coverageStatus: dish.coverageStatus,
      confidenceScore: dish.confidenceScore
    }))
  ];

  const graphEdges = [
    ...PILOT_CATEGORY_KEYWORDS.map((category) => ({
      id: `edge-${PILOT_CUISINE.id}-${category.id}`,
      source: PILOT_CUISINE.id,
      target: category.id,
      kind: "cuisine_contains_category"
    })),
    ...publishedDishes
      .filter((dish) => dish.categoryId)
      .map((dish) => ({
        id: `edge-${dish.categoryId}-${dish.id}`,
        source: dish.categoryId as string,
        target: dish.id,
        kind: "category_contains_dish"
      }))
  ];

  await Promise.all([
    writeJsonFile(workspacePath("data", "published", "graph", "dishes.json"), publishedDishes),
    writeJsonFile(workspacePath("data", "published", "recipes", "recipes.json"), publishedRecipes),
    writeJsonFile(workspacePath("data", "published", "graph", "ingredients.json"), publishedIngredients),
    writeJsonFile(workspacePath("data", "published", "graph", "nodes.json"), graphNodes),
    writeJsonFile(workspacePath("data", "published", "graph", "edges.json"), graphEdges),
    writeJsonFile(workspacePath("data", "published", "stats", "coverage.json"), coverage),
    writeJsonFile(workspacePath("data", "published", "stats", "summary.json"), {
      publishedAt: new Date().toISOString(),
      minConfidenceUsed: Number((minConfidence + 0.02).toFixed(2)),
      dishCount: publishedDishes.length,
      recipeCount: publishedRecipes.length,
      ingredientCount: publishedIngredients.length,
      reviewQueueCount: publishedReviewQueue.length
    }),
    writeJsonFile(workspacePath("data", "published", "review_queue.json"), publishedReviewQueue)
  ]);

  return {
    dishCount: publishedDishes.length,
    recipeCount: publishedRecipes.length,
    ingredientCount: publishedIngredients.length,
    coverage
  };
}
