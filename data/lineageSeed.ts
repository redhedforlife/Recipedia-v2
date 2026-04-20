import recipeLineageSeedJson from "@/data_out/recipe_lineage_seed.json";
import type {
  Category,
  Cuisine,
  CuisineDishFamily,
  DishFamilyIngredient,
  DishFamilyRelatedDishFamily,
  DishFamilyTechnique,
  Ingredient,
  IngredientCategory,
  Recipe,
  RecipeFamily,
  RecipeIngredient,
  RecipeRelationship,
  RecipeStep,
  SeedData,
  Source,
  Technique,
  TechniqueCategory
} from "@/lib/types";

type LineageSource = {
  id: string;
  name: string;
  base_url?: string;
  license?: string;
  extraction_method?: string;
  created_at?: string;
};

type LineageCuisine = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  region?: string;
};

type LineageCategory = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  parent_category_id?: string;
  sort_order?: number;
};

type LineageCuisineCategory = {
  cuisine_id: string;
  category_id: string;
  sort_order?: number;
};

type LineageDishFamily = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  primary_category_id?: string;
  primary_cuisine_id?: string;
  created_at: string;
  updated_at: string;
};

type LineageDish = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  dish_family_id: string;
  primary_category_id?: string;
  primary_cuisine_id?: string;
  origin_text?: string;
  created_at: string;
  updated_at: string;
};

type LineageVariation = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  dish_id: string;
  parent_variation_id?: string;
  variation_type: string;
  source_id?: string;
  source_url?: string;
  attribution_text?: string;
  author_name?: string;
  location_text?: string;
  is_canonical?: boolean;
  created_at: string;
  updated_at: string;
};

type LineageIngredient = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  ingredient_kind?: string;
};

type LineageTechnique = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  technique_kind?: string;
};

type LineageFamilyIngredient = {
  dish_family_id: string;
  ingredient_id: string;
  role?: string;
  is_core?: boolean | string;
  weight?: string | number;
};

type LineageFamilyTechnique = {
  dish_family_id: string;
  technique_id: string;
  role?: string;
  is_core?: boolean | string;
  weight?: string | number;
};

type LineageFamilyCuisine = {
  dish_family_id: string;
  cuisine_id: string;
  relation_kind?: string;
};

type LineageFamilyCategory = {
  dish_family_id: string;
  category_id: string;
  is_primary?: boolean | string;
};

type LineageDishRelation = {
  from_dish_id: string;
  to_dish_id: string;
  relation_type: string;
};

type LineageAlias = {
  entity_type: string;
  entity_id: string;
  alias: string;
};

type LineageSeedJson = {
  sources: LineageSource[];
  cuisines: LineageCuisine[];
  categories: LineageCategory[];
  cuisine_categories: LineageCuisineCategory[];
  dish_families: LineageDishFamily[];
  dish_family_categories: LineageFamilyCategory[];
  dish_family_cuisines: LineageFamilyCuisine[];
  dishes: LineageDish[];
  variations: LineageVariation[];
  ingredients: LineageIngredient[];
  techniques: LineageTechnique[];
  dish_family_ingredients: LineageFamilyIngredient[];
  dish_family_techniques: LineageFamilyTechnique[];
  dish_relations: LineageDishRelation[];
  aliases: LineageAlias[];
};

const seed = recipeLineageSeedJson as LineageSeedJson;

const variationLabelByType: Record<string, string> = {
  canonical_reference: "Canonical variation"
};

function titleize(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function numericWeight(value: string | number | undefined, fallback: number) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

function asBool(value: boolean | string | undefined) {
  return value === true || value === "true";
}

const aliasGroups = seed.aliases.reduce<Record<string, string[]>>((acc, alias) => {
  const key = `${alias.entity_type}:${alias.entity_id}`;
  if (!acc[key]) acc[key] = [];
  if (!acc[key].includes(alias.alias)) acc[key].push(alias.alias);
  return acc;
}, {});

const lineageSourcesById = new Map(seed.sources.map((source) => [source.id, source]));
const cuisinesById = new Map(seed.cuisines.map((cuisine) => [cuisine.id, cuisine]));
const categoriesById = new Map(seed.categories.map((category) => [category.id, category]));
const familiesById = new Map(seed.dish_families.map((family) => [family.id, family]));
const dishesById = new Map(seed.dishes.map((dish) => [dish.id, dish]));
const ingredientsById = new Map(seed.ingredients.map((ingredient) => [ingredient.id, ingredient]));
const techniquesById = new Map(seed.techniques.map((technique) => [technique.id, technique]));

const familyCategoryLinksByFamilyId = seed.dish_family_categories.reduce<Record<string, LineageFamilyCategory[]>>(
  (acc, row) => {
    if (!acc[row.dish_family_id]) acc[row.dish_family_id] = [];
    acc[row.dish_family_id].push(row);
    return acc;
  },
  {}
);

const familyIngredientsById = seed.dish_family_ingredients.reduce<Record<string, LineageFamilyIngredient[]>>((acc, row) => {
  if (!acc[row.dish_family_id]) acc[row.dish_family_id] = [];
  acc[row.dish_family_id].push(row);
  return acc;
}, {});

const familyTechniquesById = seed.dish_family_techniques.reduce<Record<string, LineageFamilyTechnique[]>>((acc, row) => {
  if (!acc[row.dish_family_id]) acc[row.dish_family_id] = [];
  acc[row.dish_family_id].push(row);
  return acc;
}, {});

const canonicalVariationByDishId = new Map<string, LineageVariation>();
for (const variation of seed.variations) {
  if (!canonicalVariationByDishId.has(variation.dish_id)) canonicalVariationByDishId.set(variation.dish_id, variation);
}

const recipeSpecificSources = new Map<string, Source>();

function sourceConfidence(sourceId: string | undefined) {
  switch (sourceId) {
    case "src-wikidata":
      return 0.98;
    case "src-wikipedia-en":
      return 0.94;
    case "src-foodon":
      return 0.84;
    case "src-mealdb":
      return 0.88;
    case "src-dbpedia":
      return 0.72;
    default:
      return 0.75;
  }
}

function recipeSourceFor(recipeKey: string, variation: LineageVariation | undefined): string | undefined {
  if (!variation?.source_url) return undefined;
  const base = variation.source_id ? lineageSourcesById.get(variation.source_id) : undefined;
  const id = `src-lineage-${recipeKey}`;
  if (!recipeSpecificSources.has(id)) {
    recipeSpecificSources.set(id, {
      id,
      siteName: base?.name ?? "Lineage source",
      sourceUrl: variation.source_url,
      authorName: variation.author_name || variation.attribution_text || (base?.name ?? "Canonical source"),
      licenseNote: [base?.license, variation.attribution_text].filter(Boolean).join(" · ") || "Canonical lineage source.",
      importedAt: base?.created_at || new Date().toISOString(),
      extractionMethod: base?.extraction_method || "lineage-seed",
      extractionConfidence: sourceConfidence(variation.source_id)
    });
  }
  return id;
}

const familyCuisineCounts = seed.dish_families.reduce<Record<string, Record<string, number>>>((acc, family) => {
  if (family.primary_category_id && family.primary_cuisine_id) {
    if (!acc[family.primary_category_id]) acc[family.primary_category_id] = {};
    acc[family.primary_category_id][family.primary_cuisine_id] = (acc[family.primary_category_id][family.primary_cuisine_id] ?? 0) + 1;
  }
  return acc;
}, {});

const cuisineIdByCategoryId = new Map<string, string>();
for (const categoryLink of seed.cuisine_categories) {
  if (!cuisineIdByCategoryId.has(categoryLink.category_id)) {
    cuisineIdByCategoryId.set(categoryLink.category_id, categoryLink.cuisine_id);
  }
}
for (const [categoryId, counts] of Object.entries(familyCuisineCounts)) {
  const preferred = Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0];
  if (preferred) cuisineIdByCategoryId.set(categoryId, preferred);
}

const ingredientCategoriesByKind = new Map<string, IngredientCategory>();
const techniqueCategoriesByKind = new Map<string, TechniqueCategory>();

function ingredientCategoryFor(kind: string | undefined) {
  const normalized = kind || "uncategorized";
  if (!ingredientCategoriesByKind.has(normalized)) {
    ingredientCategoriesByKind.set(normalized, {
      id: `ingcat-${slugify(normalized)}`,
      slug: slugify(normalized),
      displayName: titleize(normalized),
      description: `${titleize(normalized)} ingredients grouped from the recipe-lineage seed.`,
      sortOrder: ingredientCategoriesByKind.size + 1
    });
  }
  return ingredientCategoriesByKind.get(normalized)!;
}

function techniqueCategoryFor(kind: string | undefined) {
  const normalized = kind || "uncategorized";
  if (!techniqueCategoriesByKind.has(normalized)) {
    techniqueCategoriesByKind.set(normalized, {
      id: `techcat-${slugify(normalized)}`,
      slug: slugify(normalized),
      displayName: titleize(normalized),
      description: `${titleize(normalized)} techniques grouped from the recipe-lineage seed.`,
      sortOrder: techniqueCategoriesByKind.size + 1
    });
  }
  return techniqueCategoriesByKind.get(normalized)!;
}

const cuisines: Cuisine[] = seed.cuisines.map((cuisine) => ({
  id: cuisine.id,
  slug: cuisine.slug,
  displayName: cuisine.name,
  description: cuisine.description || `${cuisine.name} cuisine in the lineage starter dataset.`,
  regionGroup: cuisine.region || undefined
}));

const categories: Category[] = seed.categories.map((category) => ({
  id: category.id,
  slug: category.slug,
  displayName: category.name,
  description: category.description || `${category.name} category in the lineage starter dataset.`,
  cuisineId: cuisineIdByCategoryId.get(category.id),
  parentCategoryId: category.parent_category_id || undefined,
  sortOrder: category.sort_order || 0
}));

const ingredientCategories: IngredientCategory[] = [];
const ingredients: Ingredient[] = seed.ingredients.map((ingredient) => {
  const category = ingredientCategoryFor(ingredient.ingredient_kind);
  if (!ingredientCategories.some((item) => item.id === category.id)) ingredientCategories.push(category);
  return {
    id: ingredient.id,
    canonicalName: ingredient.name.toLowerCase(),
    displayName: ingredient.name,
    category: category.slug,
    categoryId: category.id,
    aliases: (aliasGroups[`ingredient:${ingredient.id}`] ?? []).filter((alias) => alias !== ingredient.name)
  };
});

const techniqueCategories: TechniqueCategory[] = [];
const techniques: Technique[] = seed.techniques.map((technique) => {
  const category = techniqueCategoryFor(technique.technique_kind);
  if (!techniqueCategories.some((item) => item.id === category.id)) techniqueCategories.push(category);
  return {
    id: technique.id,
    canonicalName: technique.name.toLowerCase(),
    displayName: technique.name,
    description: technique.description || `${technique.name} technique in the lineage seed.`,
    techniqueGroup: category.slug,
    techniqueGroupId: category.id
  };
});

function familyCategoryIdFor(family: LineageDishFamily) {
  if (family.primary_category_id) return family.primary_category_id;
  const links = familyCategoryLinksByFamilyId[family.id] ?? [];
  return links.find((link) => asBool(link.is_primary))?.category_id ?? links[0]?.category_id;
}

const families: RecipeFamily[] = seed.dish_families.map((family) => {
  const cuisine = family.primary_cuisine_id ? cuisinesById.get(family.primary_cuisine_id) : undefined;
  const categoryId = familyCategoryIdFor(family);
  const category = categoryId ? categoriesById.get(categoryId) : undefined;
  return {
    id: family.id,
    slug: family.slug,
    displayName: family.name,
    category: category?.slug || "uncategorized",
    categoryId: categoryId || undefined,
    cuisine: cuisine?.name || "Global",
    cuisineId: family.primary_cuisine_id || undefined,
    description: family.description || `${family.name} dish family in the lineage starter dataset.`,
    isCanonical: true
  };
});

const dishFamilyIngredients: DishFamilyIngredient[] = seed.dish_family_ingredients.map((row) => ({
  dishFamilyId: row.dish_family_id,
  ingredientId: row.ingredient_id,
  importanceScore: numericWeight(row.weight, asBool(row.is_core) ? 1 : 0.5)
}));

const dishFamilyTechniques: DishFamilyTechnique[] = seed.dish_family_techniques.map((row) => ({
  dishFamilyId: row.dish_family_id,
  techniqueId: row.technique_id,
  importanceScore: numericWeight(row.weight, asBool(row.is_core) ? 1 : 0.5)
}));

const cuisineDishFamilies: CuisineDishFamily[] = seed.dish_family_cuisines.map((row) => ({
  cuisineId: row.cuisine_id,
  dishFamilyId: row.dish_family_id,
  relationshipStrength: row.relation_kind === "associated" ? 0.85 : 1
}));

const dishFamilyRelatedDishFamilies: DishFamilyRelatedDishFamily[] = [];
const seenFamilyRelations = new Set<string>();
for (const relation of seed.dish_relations) {
  const fromDish = dishesById.get(relation.from_dish_id);
  const toDish = dishesById.get(relation.to_dish_id);
  if (!fromDish || !toDish) continue;
  if (fromDish.dish_family_id === toDish.dish_family_id) continue;
  const id = `${fromDish.dish_family_id}:${toDish.dish_family_id}:${relation.relation_type}`;
  if (seenFamilyRelations.has(id)) continue;
  seenFamilyRelations.add(id);
  dishFamilyRelatedDishFamilies.push({
    fromDishFamilyId: fromDish.dish_family_id,
    toDishFamilyId: toDish.dish_family_id,
    relationshipType: "related_to"
  });
}

const usedSlugs = new Set<string>();
function uniqueRecipeSlug(base: string, suffix?: string) {
  const stem = slugify(base) || "recipe";
  let slug = suffix ? `${stem}-${suffix}` : stem;
  let counter = 2;
  while (usedSlugs.has(slug)) {
    slug = `${suffix ? `${stem}-${suffix}` : stem}-${counter}`;
    counter += 1;
  }
  usedSlugs.add(slug);
  return slug;
}

const recipes: Recipe[] = [];
const recipeIngredients: RecipeIngredient[] = [];
const steps: RecipeStep[] = [];
const recipeTechniques: Array<{ recipeId: string; techniqueId: string }> = [];
const relationships: RecipeRelationship[] = [];

function familyIngredientEntries(familyId: string) {
  return (familyIngredientsById[familyId] ?? [])
    .slice()
    .sort((left, right) => numericWeight(right.weight, 0.5) - numericWeight(left.weight, 0.5))
    .slice(0, 8);
}

function familyTechniqueEntries(familyId: string) {
  return (familyTechniquesById[familyId] ?? [])
    .slice()
    .sort((left, right) => numericWeight(right.weight, 0.5) - numericWeight(left.weight, 0.5))
    .slice(0, 6);
}

function attachRecipeProfile(recipe: Recipe, family: LineageDishFamily, dish: LineageDish, variation?: LineageVariation) {
  const ingredientEntries = familyIngredientEntries(family.id);
  ingredientEntries.forEach((entry, index) => {
    const ingredient = ingredientsById.get(entry.ingredient_id);
    if (!ingredient) return;
    recipeIngredients.push({
      id: `ri-${recipe.id}-${index + 1}`,
      recipeId: recipe.id,
      ingredientId: ingredient.id,
      rawText: ingredient.name,
      sortOrder: index + 1
    });
  });

  const techniqueEntries = familyTechniqueEntries(family.id);
  techniqueEntries.forEach((entry) => {
    recipeTechniques.push({
      recipeId: recipe.id,
      techniqueId: entry.technique_id
    });
  });

  const baseSteps = [
    `Use ${family.name} as the parent lineage context for ${recipe.title}.`,
    ...techniqueEntries
      .map((entry) => techniquesById.get(entry.technique_id)?.name)
      .filter(Boolean)
      .slice(0, 3)
      .map((name, index) => `Core technique ${index + 1}: ${name}.`),
    variation
      ? `Variation type: ${variation.variation_type.replace(/_/g, " ")} sourced from ${variation.source_url ?? "the canonical record"}.`
      : `Origin context: ${dish.origin_text || family.description || "canonical taxonomy seed"}.`
  ];

  baseSteps.forEach((instructionText, index) => {
    steps.push({
      id: `step-${recipe.id}-${index + 1}`,
      recipeId: recipe.id,
      stepNumber: index + 1,
      instructionText
    });
  });
}

const dishRecipeIdByDishId = new Map<string, string>();
const variationRecipeIdByVariationId = new Map<string, string>();

for (const dish of seed.dishes) {
  const family = familiesById.get(dish.dish_family_id);
  if (!family) continue;
  const cuisine = dish.primary_cuisine_id ? cuisinesById.get(dish.primary_cuisine_id) : undefined;
  const category = dish.primary_category_id ? categoriesById.get(dish.primary_category_id) : undefined;
  const canonicalVariation = canonicalVariationByDishId.get(dish.id);
  const recipe: Recipe = {
    id: dish.id,
    slug: uniqueRecipeSlug(dish.slug),
    recipeFamilyId: dish.dish_family_id,
    sourceId: recipeSourceFor(dish.id, canonicalVariation),
    title: dish.name,
    description: dish.description || family.description || `${dish.name} canonical dish in the lineage seed.`,
    serves: "Starter lineage profile",
    isSourceRecipe: true,
    isUserVariation: false,
    tags: [cuisine?.name, category?.name, dish.origin_text, "canonical dish"].filter(Boolean) as string[],
    createdAt: dish.created_at,
    updatedAt: dish.updated_at
  };
  recipes.push(recipe);
  dishRecipeIdByDishId.set(dish.id, recipe.id);
  attachRecipeProfile(recipe, family, dish);
}

for (const variation of seed.variations) {
  const dish = dishesById.get(variation.dish_id);
  if (!dish) continue;
  const family = familiesById.get(dish.dish_family_id);
  if (!family) continue;
  const category = dish.primary_category_id ? categoriesById.get(dish.primary_category_id) : undefined;
  const cuisine = dish.primary_cuisine_id ? cuisinesById.get(dish.primary_cuisine_id) : undefined;
  const suffix = variation.is_canonical ? "variation" : slugify(variation.variation_type);
  const label = variationLabelByType[variation.variation_type] || titleize(variation.variation_type);
  const recipe: Recipe = {
    id: variation.id,
    slug: uniqueRecipeSlug(variation.slug || dish.slug, suffix),
    recipeFamilyId: dish.dish_family_id,
    sourceId: recipeSourceFor(variation.id, variation),
    parentRecipeId: variation.parent_variation_id ? undefined : dishRecipeIdByDishId.get(dish.id),
    title: variation.name === dish.name ? `${variation.name} (${label})` : variation.name,
    description: variation.description || `${label} for ${dish.name}.`,
    serves: "Lineage reference",
    isSourceRecipe: false,
    isUserVariation: true,
    variationKind: "canonical",
    tags: [cuisine?.name, category?.name, label.toLowerCase(), "canonical variation"].filter(Boolean) as string[],
    createdAt: variation.created_at,
    updatedAt: variation.updated_at
  };
  recipes.push(recipe);
  variationRecipeIdByVariationId.set(variation.id, recipe.id);
  attachRecipeProfile(recipe, family, dish, variation);
}

for (const variation of seed.variations) {
  const recipeId = variationRecipeIdByVariationId.get(variation.id);
  if (!recipeId) continue;
  const parentRecipeId = variation.parent_variation_id
    ? variationRecipeIdByVariationId.get(variation.parent_variation_id)
    : dishRecipeIdByDishId.get(variation.dish_id);
  const recipe = recipes.find((item) => item.id === recipeId);
  if (recipe && parentRecipeId) recipe.parentRecipeId = parentRecipeId;
  if (parentRecipeId) {
    relationships.push({
      id: `rel-${recipeId}-${parentRecipeId}`,
      fromRecipeId: recipeId,
      toRecipeId: parentRecipeId,
      relationshipType: "variation_of"
    });
  }
}

const sources: Source[] = [
  ...seed.sources.map((source) => ({
    id: source.id,
    siteName: source.name,
    sourceUrl: source.base_url || "",
    authorName: source.name,
    licenseNote: source.license || "",
    importedAt: source.created_at || new Date().toISOString(),
    extractionMethod: source.extraction_method || "lineage-seed",
    extractionConfidence: sourceConfidence(source.id)
  })),
  ...recipeSpecificSources.values()
];

export const seedData: SeedData = {
  cuisines,
  categories,
  ingredientCategories,
  techniqueCategories,
  cookingMethods: [],
  difficultyBands: [],
  sources,
  creators: [],
  families,
  recipes,
  ingredients,
  techniques,
  cuisineDishFamilies,
  dishFamilyIngredients,
  dishFamilyTechniques,
  dishFamilyMethods: [],
  dishFamilyRelatedDishFamilies,
  recipeIngredients,
  steps,
  recipeTechniques,
  changes: [],
  cookReports: [],
  relationships
};
