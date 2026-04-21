import { americanIngredientEnrichment } from "@/data/enrichment/americanIngredients";
import type { Category, Ingredient, Recipe, SeedData } from "@/lib/types";

export type IngredientEvidenceSource =
  | "curated"
  | "direct_family"
  | "direct_dish"
  | "direct_variation"
  | "descendant_rollup";

export type EffectiveIngredientClass = "core" | "common" | "optional";

export type EffectiveIngredient = {
  ingredientId: string;
  label: string;
  classification: EffectiveIngredientClass;
  confidence: number;
  weight: number;
  sourceTypes: IngredientEvidenceSource[];
  provenance: Array<{
    sourceType: IngredientEvidenceSource;
    confidence: number;
    note: string;
  }>;
};

export type IngredientFilterOption = {
  ingredientId: string;
  label: string;
};

export type IngredientFilterIndex = {
  options: IngredientFilterOption[];
  families: Record<string, EffectiveIngredient[]>;
  categories: Record<string, EffectiveIngredient[]>;
  cuisines: Record<string, EffectiveIngredient[]>;
};

type IngredientAccumulator = {
  ingredientId: string;
  label: string;
  weight: number;
  sourceTypes: Set<IngredientEvidenceSource>;
  provenance: Array<{
    sourceType: IngredientEvidenceSource;
    confidence: number;
    note: string;
  }>;
};

type IngredientResolver = {
  resolve: (value: string) => { ingredientId: string; label: string };
  knownById: Map<string, Ingredient>;
};

const baseWeights: Record<IngredientEvidenceSource, number> = {
  curated: 1.2,
  direct_family: 1,
  direct_dish: 0.8,
  direct_variation: 0.6,
  descendant_rollup: 0.35
};

const aliasOverrides: Record<string, string> = {
  "roast beef": "beef",
  "ground beef": "beef",
  "beef patty": "beef",
  bun: "bread",
  roll: "bread",
  rolls: "bread",
  cheddar: "cheese",
  swiss: "cheese",
  "swiss cheese": "cheese",
  "cheddar cheese": "cheese",
  "red onion": "onion",
  onions: "onion",
  "peanut butter": "peanut butter",
  jelly: "jam",
  "crab meat": "crab",
  "lobster meat": "lobster"
};

export function buildIngredientFilterIndex(data: SeedData): IngredientFilterIndex {
  const context = buildContext(data);

  const families: Record<string, EffectiveIngredient[]> = {};
  data.families.forEach((family) => {
    families[family.id] = getEffectiveIngredientsForFamily(family.id, data, context);
  });

  const categories: Record<string, EffectiveIngredient[]> = {};
  data.categories.forEach((category) => {
    categories[category.id] = getEffectiveIngredientsForCategory(category.id, data, context);
  });

  const cuisines: Record<string, EffectiveIngredient[]> = {};
  data.cuisines.forEach((cuisine) => {
    cuisines[cuisine.id] = getEffectiveIngredientsForCuisine(cuisine.id, data, context);
  });

  const optionMap = new Map<string, string>();
  Object.values(families).forEach((items) => {
    items.forEach((item) => optionMap.set(item.ingredientId, item.label));
  });

  return {
    options: Array.from(optionMap.entries())
      .map(([ingredientId, label]) => ({ ingredientId, label }))
      .sort((left, right) => left.label.localeCompare(right.label)),
    families,
    categories,
    cuisines
  };
}

export function getEffectiveIngredientsForVariation(
  variationId: string,
  data: SeedData,
  context = buildContext(data)
): EffectiveIngredient[] {
  const recipe = data.recipes.find((candidate) => candidate.id === variationId);
  if (!recipe) return [];
  const accumulator = new Map<string, IngredientAccumulator>();

  addCuratedBySlug(accumulator, recipe.slug, context, "curated", "curated variation backfill");
  addRecipeIngredients(accumulator, recipe.id, context, recipe.isUserVariation ? "direct_variation" : "direct_dish");

  return finalize(accumulator);
}

export function getEffectiveIngredientsForDish(
  dishId: string,
  data: SeedData,
  context = buildContext(data)
): EffectiveIngredient[] {
  const recipe = data.recipes.find((candidate) => candidate.id === dishId);
  if (!recipe) return [];
  const accumulator = new Map<string, IngredientAccumulator>();

  addCuratedBySlug(accumulator, recipe.slug, context, "curated", "curated dish backfill");
  addRecipeIngredients(accumulator, recipe.id, context, recipe.isUserVariation ? "direct_variation" : "direct_dish");

  data.recipes
    .filter((candidate) => candidate.parentRecipeId === recipe.id)
    .forEach((variation) => {
      addRecipeIngredients(accumulator, variation.id, context, "descendant_rollup", "descendant variation ingredient");
    });

  return finalize(accumulator);
}

export function getEffectiveIngredientsForFamily(
  familyId: string,
  data: SeedData,
  context = buildContext(data)
): EffectiveIngredient[] {
  const family = data.families.find((candidate) => candidate.id === familyId);
  if (!family) return [];

  const accumulator = new Map<string, IngredientAccumulator>();

  addCuratedBySlug(accumulator, family.slug, context, "curated", "curated family backfill");

  data.dishFamilyIngredients
    .filter((relationship) => relationship.dishFamilyId === family.id)
    .forEach((relationship) => {
      const resolved = context.resolver.resolve(relationship.ingredientId);
      addEvidence(accumulator, resolved, "direct_family", Math.max(relationship.importanceScore, 0.5), "direct family link");
    });

  const recipes = data.recipes.filter((recipe) => recipe.recipeFamilyId === family.id);
  recipes.forEach((recipe) => {
    addCuratedBySlug(accumulator, recipe.slug, context, "curated", "curated recipe backfill");
    addRecipeIngredients(accumulator, recipe.id, context, recipe.isUserVariation ? "direct_variation" : "direct_dish");
  });

  const frequency = ingredientFrequencyByRecipes(recipes, context);
  frequency.forEach((count, ingredientId) => {
    const resolved = context.resolver.resolve(ingredientId);
    addEvidence(
      accumulator,
      resolved,
      "descendant_rollup",
      0.2 + Math.min(0.6, count * 0.15),
      `ingredient appears in ${count} descendant recipes`
    );
  });

  return finalize(accumulator);
}

export function getEffectiveIngredientsForCategory(
  categoryId: string,
  data: SeedData,
  context = buildContext(data)
): EffectiveIngredient[] {
  const familyIds = descendantFamilyIdsForCategory(categoryId, data.categories, data.families);
  return mergeFamilyIngredientSets(familyIds, data, context);
}

export function getEffectiveIngredientsForCuisine(
  cuisineId: string,
  data: SeedData,
  context = buildContext(data)
): EffectiveIngredient[] {
  const familyIds = new Set<string>();
  data.families
    .filter((family) => (family.primaryCuisineId ?? family.cuisineId) === cuisineId)
    .forEach((family) => familyIds.add(family.id));

  data.cuisineDishFamilies
    .filter((link) => link.cuisineId === cuisineId)
    .forEach((link) => familyIds.add(link.dishFamilyId));

  const categoryIds = new Set(
    data.categories.filter((category) => category.cuisineId === cuisineId).map((category) => category.id)
  );
  categoryIds.forEach((categoryId) => {
    descendantFamilyIdsForCategory(categoryId, data.categories, data.families).forEach((familyId) => familyIds.add(familyId));
  });

  return mergeFamilyIngredientSets(familyIds, data, context);
}

export function familyMatchesIngredient(
  familyId: string,
  ingredientValue: string,
  data: SeedData,
  context = buildContext(data)
) {
  const resolved = context.resolver.resolve(ingredientValue);
  return getEffectiveIngredientsForFamily(familyId, data, context).some((ingredient) => ingredient.ingredientId === resolved.ingredientId);
}

export function categoryMatchesIngredient(
  categoryId: string,
  ingredientValue: string,
  data: SeedData,
  context = buildContext(data)
) {
  const resolved = context.resolver.resolve(ingredientValue);
  return getEffectiveIngredientsForCategory(categoryId, data, context).some((ingredient) => ingredient.ingredientId === resolved.ingredientId);
}

export function cuisineMatchesIngredient(
  cuisineId: string,
  ingredientValue: string,
  data: SeedData,
  context = buildContext(data)
) {
  const resolved = context.resolver.resolve(ingredientValue);
  return getEffectiveIngredientsForCuisine(cuisineId, data, context).some((ingredient) => ingredient.ingredientId === resolved.ingredientId);
}

export function explainFamilyIngredientMatch(
  familyId: string,
  ingredientValue: string,
  data: SeedData,
  context = buildContext(data)
) {
  const resolved = context.resolver.resolve(ingredientValue);
  return getEffectiveIngredientsForFamily(familyId, data, context).find((ingredient) => ingredient.ingredientId === resolved.ingredientId);
}

function mergeFamilyIngredientSets(familyIds: Iterable<string>, data: SeedData, context: ReturnType<typeof buildContext>) {
  const accumulator = new Map<string, IngredientAccumulator>();
  Array.from(familyIds).forEach((familyId) => {
    getEffectiveIngredientsForFamily(familyId, data, context).forEach((ingredient) => {
      addEvidence(
        accumulator,
        { ingredientId: ingredient.ingredientId, label: ingredient.label },
        "descendant_rollup",
        Math.min(0.7, ingredient.confidence * 0.6),
        `descendant family ${familyId}`
      );
    });
  });
  return finalize(accumulator);
}

function ingredientFrequencyByRecipes(recipes: Recipe[], context: ReturnType<typeof buildContext>) {
  const recipeIds = new Set(recipes.map((recipe) => recipe.id));
  const counts = new Map<string, number>();
  context.data.recipeIngredients
    .filter((item) => recipeIds.has(item.recipeId))
    .forEach((item) => {
      const resolved = context.resolver.resolve(item.ingredientId);
      counts.set(resolved.ingredientId, (counts.get(resolved.ingredientId) ?? 0) + 1);
    });
  return counts;
}

function addCuratedBySlug(
  accumulator: Map<string, IngredientAccumulator>,
  slug: string,
  context: ReturnType<typeof buildContext>,
  sourceType: IngredientEvidenceSource,
  note: string
) {
  const entry = context.enrichmentBySlug.get(slug);
  if (!entry) return;

  entry.coreIngredients.forEach((term) => {
    addEvidence(accumulator, context.resolver.resolve(term), sourceType, 1.2, `${note}: core`);
  });
  (entry.commonIngredients ?? []).forEach((term) => {
    addEvidence(accumulator, context.resolver.resolve(term), sourceType, 0.9, `${note}: common`);
  });
  (entry.optionalIngredients ?? []).forEach((term) => {
    addEvidence(accumulator, context.resolver.resolve(term), sourceType, 0.6, `${note}: optional`);
  });
}

function addRecipeIngredients(
  accumulator: Map<string, IngredientAccumulator>,
  recipeId: string,
  context: ReturnType<typeof buildContext>,
  sourceType: IngredientEvidenceSource,
  note = "direct recipe link"
) {
  context.data.recipeIngredients
    .filter((item) => item.recipeId === recipeId)
    .forEach((item) => {
      const resolved = context.resolver.resolve(item.ingredientId);
      addEvidence(accumulator, resolved, sourceType, baseWeights[sourceType], note);
    });
}

function addEvidence(
  accumulator: Map<string, IngredientAccumulator>,
  ingredient: { ingredientId: string; label: string },
  sourceType: IngredientEvidenceSource,
  multiplier = 1,
  note = ""
) {
  const existing = accumulator.get(ingredient.ingredientId) ?? {
    ingredientId: ingredient.ingredientId,
    label: ingredient.label,
    weight: 0,
    sourceTypes: new Set<IngredientEvidenceSource>(),
    provenance: []
  };

  existing.weight += baseWeights[sourceType] * multiplier;
  existing.sourceTypes.add(sourceType);
  existing.provenance.push({
    sourceType,
    confidence: Math.min(1, baseWeights[sourceType] * multiplier),
    note
  });
  accumulator.set(ingredient.ingredientId, existing);
}

function finalize(accumulator: Map<string, IngredientAccumulator>): EffectiveIngredient[] {
  return Array.from(accumulator.values())
    .map((item) => {
      const confidence = Math.min(1, item.weight / 2);
      return {
        ingredientId: item.ingredientId,
        label: item.label,
        classification: classify(item.weight),
        confidence,
        weight: item.weight,
        sourceTypes: Array.from(item.sourceTypes),
        provenance: item.provenance
      } satisfies EffectiveIngredient;
    })
    .sort((left, right) => right.weight - left.weight || left.label.localeCompare(right.label));
}

function classify(weight: number): EffectiveIngredientClass {
  if (weight >= 1.4) return "core";
  if (weight >= 0.8) return "common";
  return "optional";
}

function descendantFamilyIdsForCategory(categoryId: string, categories: Category[], families: SeedData["families"]) {
  const categoryIds = descendantCategoryIds(categories, categoryId);
  const familyIds = new Set<string>();

  families.forEach((family) => {
    const primaryCategoryId = family.primaryCategoryId ?? family.categoryId;
    if (primaryCategoryId && categoryIds.has(primaryCategoryId)) familyIds.add(family.id);
    (family.secondaryCategoryIds ?? []).forEach((secondary) => {
      if (categoryIds.has(secondary)) familyIds.add(family.id);
    });
  });

  return familyIds;
}

function descendantCategoryIds(categories: Category[], rootId: string) {
  const ids = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    categories.forEach((category) => {
      if (category.parentCategoryId && ids.has(category.parentCategoryId) && !ids.has(category.id)) {
        ids.add(category.id);
        changed = true;
      }
    });
  }
  return ids;
}

function buildContext(data: SeedData) {
  const resolver = buildIngredientResolver(data.ingredients);
  return {
    data,
    resolver,
    enrichmentBySlug: new Map(americanIngredientEnrichment.map((entry) => [entry.slug, entry]))
  };
}

function buildIngredientResolver(ingredients: Ingredient[]): IngredientResolver {
  const knownById = new Map<string, Ingredient>(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const byNormalizedName = new Map<string, { ingredientId: string; label: string }>();

  ingredients.forEach((ingredient) => {
    const canonical = normalize(ingredient.canonicalName);
    if (canonical) byNormalizedName.set(canonical, { ingredientId: ingredient.id, label: ingredient.displayName });
    const display = normalize(ingredient.displayName);
    if (display) byNormalizedName.set(display, { ingredientId: ingredient.id, label: ingredient.displayName });
    ingredient.aliases.forEach((alias) => {
      const normalized = normalize(alias);
      if (normalized) byNormalizedName.set(normalized, { ingredientId: ingredient.id, label: ingredient.displayName });
    });
  });

  return {
    knownById,
    resolve(value: string) {
      const byId = knownById.get(value);
      if (byId) {
        return {
          ingredientId: byId.id,
          label: byId.displayName
        };
      }

      const normalizedInput = normalize(value);
      const override = aliasOverrides[normalizedInput] ?? normalizedInput;
      const direct = byNormalizedName.get(override) ?? byNormalizedName.get(normalizedInput);
      if (direct) return direct;

      const syntheticId = `ing-enriched-${override.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "unknown"}`;
      return {
        ingredientId: syntheticId,
        label: titleize(override)
      };
    }
  };
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleize(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
