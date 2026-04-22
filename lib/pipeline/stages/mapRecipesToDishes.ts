import type {
  Dish,
  NormalizedRecipeRecord,
  RawRecipeRecord,
  Recipe,
  RecipeDishMapping,
  ReviewQueueItem,
  SourceRef
} from "@/lib/pipeline/types";
import { PIPELINE_THRESHOLDS, PILOT_CATEGORY_KEYWORDS, PILOT_CUISINE, STOPWORDS } from "@/lib/pipeline/config";
import { normalizeText, slugify, tokenize, weightedAverage } from "@/lib/pipeline/utils";
import { readJsonFile, workspacePath, writeJsonFile } from "@/lib/pipeline/io";

type LineageSeed = {
  dishes: Array<{
    id: string;
    name: string;
    normalized_name?: string;
    dish_family_id: string;
    primary_category_id?: string;
    origin_text?: string;
    description?: string;
  }>;
  aliases: Array<{
    entity_type: string;
    entity_id: string;
    alias: string;
  }>;
};

const AMERICAN_TERMS = /(american|united states|u\.s\.|usa|new england|southern|midwest|texas|california|louisiana|new york)/i;

const PRIORITY_ALIAS_RULES: Array<{ dish: string; aliases: string[] }> = [
  { dish: "Club Sandwich", aliases: ["club", "turkey club", "diner club sandwich", "classic club sandwich"] },
  { dish: "BLT", aliases: ["blt sandwich", "bacon lettuce tomato", "bacon lettuce and tomato"] },
  { dish: "French Dip", aliases: ["french dip sandwich", "beef dip"] },
  { dish: "Philly Cheesesteak", aliases: ["cheesesteak", "philly steak sandwich", "philadelphia cheesesteak"] },
  { dish: "Cheeseburger", aliases: ["cheese burger", "classic cheeseburger"] },
  { dish: "Patty Melt", aliases: ["beef patty melt"] },
  { dish: "Pulled Pork Sandwich", aliases: ["bbq pulled pork sandwich", "pulled pork burger"] },
  { dish: "Brisket Sandwich", aliases: ["bbq brisket sandwich"] },
  { dish: "Buffalo Wings", aliases: ["buffalo wing", "chicken wings"] },
  { dish: "Chicken Fried Steak", aliases: ["country fried steak"] },
  { dish: "Gumbo", aliases: ["seafood gumbo", "chicken gumbo"] },
  { dish: "Chili", aliases: ["chili con carne", "texas chili", "beef chili"] }
];

function dedupeStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function inferCategory(title: string, rawCategory?: string) {
  const withContext = `${title} ${rawCategory ?? ""}`;
  const found = PILOT_CATEGORY_KEYWORDS.find((category) => category.pattern.test(withContext));
  return found ?? null;
}

function inferAmericanScore(recipe: NormalizedRecipeRecord) {
  let score = 0;
  if (AMERICAN_TERMS.test(recipe.rawCuisine ?? "")) score += 0.55;
  if (AMERICAN_TERMS.test(recipe.rawCategory ?? "")) score += 0.25;
  if ((recipe.sourceId ?? "").includes("regional-dishes-of-the-united-states")) score += 0.5;
  if (/(buffalo|philly|new york|texas|louisiana|carolina)/i.test(recipe.title)) score += 0.2;
  return Math.min(1, score);
}

function toSourceRef(recipe: NormalizedRecipeRecord, transforms: string[]): SourceRef {
  return {
    sourceName: recipe.sourceName,
    sourceType: recipe.sourceType,
    externalId: recipe.sourceId,
    url: recipe.url,
    importedAt: recipe.importedAt,
    transforms
  };
}

export async function mapRecipesToDishes() {
  const [normalized, rawRecords, canonicalRecipeIds, lineage] = await Promise.all([
    readJsonFile<NormalizedRecipeRecord[]>(workspacePath("data", "normalized", "recipes", "normalized_recipes.json")),
    readJsonFile<RawRecipeRecord[]>(workspacePath("data", "raw", "recipes", "raw_recipes.json")),
    readJsonFile<string[]>(workspacePath("data", "normalized", "recipes", "canonical_recipe_ids.json")),
    readJsonFile<LineageSeed>(workspacePath("data_out", "recipe_lineage_seed.json"))
  ]);

  const rawById = new Map(rawRecords.map((record) => [record.id, record]));
  const canonicalSet = new Set(canonicalRecipeIds);

  const aliasIndex = new Map<string, { dishName: string; familyId?: string; categoryId?: string }>();
  lineage.dishes.forEach((dish) => {
    const normalizedName = normalizeText(dish.name);
    aliasIndex.set(normalizedName, { dishName: dish.name, familyId: dish.dish_family_id, categoryId: dish.primary_category_id });
  });

  lineage.aliases
    .filter((alias) => alias.entity_type === "dish")
    .forEach((alias) => {
      const dish = lineage.dishes.find((candidate) => candidate.id === alias.entity_id);
      if (!dish) return;
      aliasIndex.set(normalizeText(alias.alias), {
        dishName: dish.name,
        familyId: dish.dish_family_id,
        categoryId: dish.primary_category_id
      });
    });

  PRIORITY_ALIAS_RULES.forEach((rule) => {
    aliasIndex.set(normalizeText(rule.dish), { dishName: rule.dish });
    rule.aliases.forEach((alias) => aliasIndex.set(normalizeText(alias), { dishName: rule.dish }));
  });

  const dishesBySlug = new Map<string, Dish>();
  const mappings: RecipeDishMapping[] = [];
  const mappedRecipes: Recipe[] = [];
  const reviewQueue: ReviewQueueItem[] = [];

  const matchByAlias = (recipe: NormalizedRecipeRecord) => {
    const exact = aliasIndex.get(recipe.normalizedTitle);
    if (exact) {
      return {
        mappingMethod: "exact_alias" as const,
        dishName: exact.dishName,
        aliasMatchStrength: 1,
        familyId: exact.familyId,
        categoryId: exact.categoryId
      };
    }

    const tokens = recipe.titleTokens.filter((token) => !STOPWORDS.has(token));
    let best: { dishName: string; aliasMatchStrength: number; familyId?: string; categoryId?: string } | undefined;
    for (const [alias, mapped] of aliasIndex.entries()) {
      const aliasTokens = tokenize(alias);
      const overlap = aliasTokens.length
        ? aliasTokens.filter((token) => tokens.includes(token)).length / aliasTokens.length
        : 0;
      if (overlap >= 0.8 && (!best || overlap > best.aliasMatchStrength)) {
        best = {
          dishName: mapped.dishName,
          aliasMatchStrength: overlap,
          familyId: mapped.familyId,
          categoryId: mapped.categoryId
        };
      }
    }

    if (best) return { mappingMethod: "fuzzy_alias" as const, ...best };
    return undefined;
  };

  for (const recipe of normalized) {
    const raw = rawById.get(recipe.id);
    const aliasMatch = matchByAlias(recipe);

    const dishNameFromHint = recipe.dishHint && recipe.dishHint.trim().length ? recipe.dishHint.trim() : undefined;
    const dishName = aliasMatch?.dishName ?? dishNameFromHint ?? recipe.title;
    const dishSlug = slugify(dishName);

    const mappingMethod = aliasMatch
      ? aliasMatch.mappingMethod
      : dishNameFromHint
        ? "dish_hint"
        : "created_from_title";

    const titleMatchStrength = recipe.normalizedTitle === normalizeText(dishName) ? 1 : 0.72;
    const aliasMatchStrength = aliasMatch?.aliasMatchStrength ?? 0.45;
    const ingredientOverlapScore = recipe.normalizedIngredientIds.length ? 0.72 : 0.35;
    const sourceQualityScore = recipe.sourceQualityScore;

    const confidenceScore = weightedAverage([
      { score: titleMatchStrength, weight: 0.35 },
      { score: aliasMatchStrength, weight: 0.25 },
      { score: ingredientOverlapScore, weight: 0.2 },
      { score: sourceQualityScore, weight: 0.2 }
    ]);

    if (!dishesBySlug.has(dishSlug)) {
      const category = inferCategory(dishName, recipe.rawCategory);
      const americanScore = inferAmericanScore(recipe);
      dishesBySlug.set(dishSlug, {
        id: `dish-${dishSlug}`,
        name: dishName,
        slug: dishSlug,
        description: `Dish concept clustered from imported recipe records for ${dishName}.`,
        cuisineId: americanScore >= 0.55 ? PILOT_CUISINE.id : undefined,
        categoryId: aliasMatch?.categoryId ?? category?.id,
        familyId: aliasMatch?.familyId,
        aliases: dedupeStrings([dishName, recipe.title, ...(dishNameFromHint ? [dishNameFromHint] : [])]),
        canonicalIngredients: [],
        optionalCommonIngredients: [],
        techniques: [],
        sourceRefs: [toSourceRef(recipe, ["recipe_to_dish_mapping"]), ...(raw?.url ? [{ ...toSourceRef(recipe, []), url: raw.url }] : [])],
        confidenceScore,
        recipeCount: 0,
        coverageStatus: "taxonomy_only"
      });
    } else {
      const dish = dishesBySlug.get(dishSlug);
      if (dish) {
        dish.aliases = dedupeStrings([...dish.aliases, recipe.title, ...(dishNameFromHint ? [dishNameFromHint] : [])]);
        dish.sourceRefs = dedupeSourceRefs([...dish.sourceRefs, toSourceRef(recipe, ["recipe_to_dish_mapping"])]);
        dish.confidenceScore = Math.max(dish.confidenceScore, confidenceScore);
      }
    }

    const dish = dishesBySlug.get(dishSlug);
    if (!dish) continue;

    dish.recipeCount += canonicalSet.has(recipe.id) ? 1 : 0;
    if (dish.recipeCount >= 1) dish.coverageStatus = "has_recipe";
    if (dish.recipeCount >= 3) dish.coverageStatus = "multi_recipe";

    mappings.push({
      recipeId: recipe.id,
      dishId: dish.id,
      dishName: dish.name,
      mappingMethod,
      titleMatchStrength,
      aliasMatchStrength,
      ingredientOverlapScore,
      sourceQualityScore,
      confidenceScore
    });

    if (!canonicalSet.has(recipe.id)) continue;

    mappedRecipes.push({
      id: recipe.id,
      dishId: dish.id,
      title: recipe.title,
      variantName: recipe.title !== dish.name ? recipe.title : undefined,
      sourceUrl: recipe.url,
      sourceName: recipe.sourceName,
      sourceType: recipe.sourceType,
      ingredients: recipe.ingredientItems,
      instructions: raw?.rawInstructions ?? ["Imported reference recipe."],
      confidenceScore,
      isCanonicalCandidate: mappingMethod === "exact_alias" || mappingMethod === "dish_hint",
      sourceRefs: [toSourceRef(recipe, ["mapping", "canonical_recipe_filtering"])]
    });

    if (confidenceScore <= PIPELINE_THRESHOLDS.reviewQueueMaxConfidence) {
      reviewQueue.push({
        id: `review-map-${recipe.id}`,
        itemType: "mapping",
        itemId: recipe.id,
        issueType: "low_confidence_mapping",
        summary: `Low-confidence mapping for recipe '${recipe.title}' to dish '${dish.name}'.`,
        candidateResolutions: [
          "Confirm dish assignment",
          "Create a new dish concept",
          "Add dish alias and re-run mapping"
        ],
        confidenceScore,
        sourceExamples: [recipe.sourceName, recipe.title, recipe.url ?? ""].filter(Boolean),
        createdAt: new Date().toISOString()
      });
    }
  }

  const dishes = Array.from(dishesBySlug.values()).map((dish) => ({
    ...dish,
    aliases: dish.aliases.filter((alias) => normalizeText(alias) !== normalizeText(dish.name))
  }));

  await writeJsonFile(workspacePath("data", "normalized", "dishes", "recipe_dish_mappings.json"), mappings);
  await writeJsonFile(workspacePath("data", "normalized", "dishes", "dishes.json"), dishes);
  await writeJsonFile(workspacePath("data", "normalized", "recipes", "mapped_recipes.json"), mappedRecipes);
  await writeJsonFile(workspacePath("data", "normalized", "dishes", "review_queue_pre_profiles.json"), reviewQueue);

  return {
    dishCount: dishes.length,
    mappedRecipeCount: mappedRecipes.length,
    lowConfidenceMappings: reviewQueue.length
  };
}

function dedupeSourceRefs(sourceRefs: SourceRef[]) {
  const byKey = new Map<string, SourceRef>();
  for (const sourceRef of sourceRefs) {
    const key = `${sourceRef.sourceType}:${sourceRef.externalId ?? ""}:${sourceRef.url ?? ""}`;
    byKey.set(key, sourceRef);
  }
  return Array.from(byKey.values());
}
