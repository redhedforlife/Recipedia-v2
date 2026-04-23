import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  Category,
  Cuisine,
  DishFamilyIngredient,
  Ingredient,
  IngredientCategory,
  Recipe,
  RecipeFamily,
  RecipeIngredient,
  RecipeStep,
  SeedData,
  Source,
  Technique,
  TechniqueCategory
} from "@/lib/types";
import type { Dish, Recipe as EnrichedRecipe } from "@/lib/pipeline/types";

type CoverageStats = {
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
  }>;
};

const EMPTY_SEED_DATA: SeedData = {
  cuisines: [],
  categories: [],
  ingredientCategories: [],
  techniqueCategories: [],
  cookingMethods: [],
  difficultyBands: [],
  sources: [],
  creators: [],
  families: [],
  recipes: [],
  ingredients: [],
  techniques: [],
  cuisineDishFamilies: [],
  dishFamilyIngredients: [],
  dishFamilyTechniques: [],
  dishFamilyMethods: [],
  dishFamilyRelatedDishFamilies: [],
  recipeIngredients: [],
  steps: [],
  recipeTechniques: [],
  changes: [],
  cookReports: [],
  relationships: []
};

const DISHES_PATH = path.join(process.cwd(), "data", "published", "graph", "dishes.json");
const RECIPES_PATH = path.join(process.cwd(), "data", "published", "recipes", "recipes.json");
const INGREDIENTS_PATH = path.join(process.cwd(), "data", "published", "graph", "ingredients.json");
const COVERAGE_PATH = path.join(process.cwd(), "data", "published", "stats", "coverage.json");

let cache: { signature: string; data: SeedData } | undefined;

export async function loadPublishedSeedData() {
  const signature = await computeSignature([DISHES_PATH, RECIPES_PATH, INGREDIENTS_PATH, COVERAGE_PATH]);
  if (!signature) return EMPTY_SEED_DATA;
  if (cache && cache.signature === signature) return cache.data;

  const [dishes, recipes, ingredients, coverage] = await Promise.all([
    readJsonFile<Dish[]>(DISHES_PATH),
    readJsonFile<EnrichedRecipe[]>(RECIPES_PATH),
    readJsonFile<IngredientSeedInput[]>(INGREDIENTS_PATH),
    readJsonFile<CoverageStats>(COVERAGE_PATH)
  ]);

  const data = adaptToSeedData(dishes, recipes, ingredients, coverage);
  cache = { signature, data };
  return data;
}

type IngredientSeedInput = {
  id: string;
  name: string;
  slug: string;
  aliases: string[];
  category?: string;
};

async function computeSignature(paths: string[]) {
  try {
    const stats = await Promise.all(paths.map((filePath) => fs.stat(filePath)));
    return stats.map((stat) => `${Math.round(stat.mtimeMs)}:${stat.size}`).join("|");
  } catch {
    return undefined;
  }
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const file = await fs.readFile(filePath, "utf8");
  return JSON.parse(file) as T;
}

function adaptToSeedData(
  dishes: Dish[],
  recipes: EnrichedRecipe[],
  ingredients: IngredientSeedInput[],
  coverage: CoverageStats
): SeedData {
  const now = new Date().toISOString();
  const cuisineById = new Map<string, Cuisine>();
  const categoryNameById = new Map(coverage.byCategory.map((entry) => [entry.categoryId, entry.categoryName]));
  const categoriesById = new Map<string, Category>();

  dishes.forEach((dish) => {
    const cuisineId = dish.cuisineId ?? "cui-american";
    if (!cuisineById.has(cuisineId)) {
      const cuisineSlug = stripPrefix(cuisineId, "cui-");
      cuisineById.set(cuisineId, {
        id: cuisineId,
        slug: cuisineSlug,
        displayName: titleize(cuisineSlug),
        description: `${titleize(cuisineSlug)} cuisine from published enrichment pipeline.`
      });
    }

    if (dish.categoryId && !categoriesById.has(dish.categoryId)) {
      const categorySlug = stripPrefix(dish.categoryId, "cat-");
      categoriesById.set(dish.categoryId, {
        id: dish.categoryId,
        slug: categorySlug,
        displayName: categoryNameById.get(dish.categoryId) ?? titleize(categorySlug),
        description: `Published category for ${titleize(categorySlug)} dishes.`,
        cuisineId,
        sortOrder: categoriesById.size + 1
      });
    }
  });

  const ingredientCategoryById = new Map<string, IngredientCategory>();
  const ingredientRows: Ingredient[] = ingredients.map((ingredient) => {
    const categorySlug = ingredient.category ? slugify(ingredient.category) : "other";
    const categoryId = `ingcat-pub-${categorySlug}`;
    if (!ingredientCategoryById.has(categoryId)) {
      ingredientCategoryById.set(categoryId, {
        id: categoryId,
        slug: `pub-${categorySlug}`,
        displayName: titleize(categorySlug),
        description: `Published ingredient category: ${titleize(categorySlug)}.`,
        sortOrder: ingredientCategoryById.size + 1
      });
    }

    return {
      id: ingredient.id,
      canonicalName: ingredient.name,
      displayName: titleize(ingredient.name),
      category: ingredient.category,
      categoryId,
      aliases: ingredient.aliases ?? []
    };
  });

  const sourceByKey = new Map<string, Source>();
  const sourceIdForRef = (sourceRef: Dish["sourceRefs"][number] | EnrichedRecipe["sourceRefs"][number] | undefined) => {
    if (!sourceRef) return undefined;
    const key = `${sourceRef.sourceType}:${sourceRef.externalId ?? ""}:${sourceRef.url ?? ""}`;
    if (!sourceByKey.has(key)) {
      const id = `src-pub-${sourceByKey.size + 1}`;
      sourceByKey.set(key, {
        id,
        siteName: sourceRef.sourceName,
        sourceUrl: sourceRef.url ?? `urn:source:${id}`,
        authorName: sourceRef.sourceType,
        licenseNote: sourceRef.licenseNotes ?? "Published pipeline source reference",
        importedAt: sourceRef.importedAt ?? now,
        extractionMethod: sourceRef.transforms?.join("|") ?? "pipeline",
        extractionConfidence: 0.78
      });
    }
    return sourceByKey.get(key)?.id;
  };

  const familyByDishId = new Map<string, RecipeFamily>();
  const families: RecipeFamily[] = dishes.map((dish) => {
    const category = dish.categoryId ? categoriesById.get(dish.categoryId) : undefined;
    const cuisineId = dish.cuisineId ?? "cui-american";
    const cuisine = cuisineById.get(cuisineId);

    dish.sourceRefs.forEach((sourceRef) => {
      sourceIdForRef(sourceRef);
    });

    const family: RecipeFamily = {
      id: `pub-fam-${dish.id}`,
      slug: dish.slug,
      displayName: titleize(dish.name),
      category: category?.slug ?? "dish",
      categoryId: dish.categoryId,
      cuisine: cuisine?.displayName ?? titleize(stripPrefix(cuisineId, "cui-")),
      description: dish.description ?? `Published dish concept for ${titleize(dish.name)}.`,
      cuisineId,
      ingredientIds: [...dish.canonicalIngredients, ...dish.optionalCommonIngredients].map((item) => item.ingredientId),
      techniqueIds: dish.techniques.map((technique) => `pub-tec-${slugify(technique)}`),
      isCanonical: dish.coverageStatus === "reviewed" || dish.coverageStatus === "multi_recipe"
    };

    familyByDishId.set(dish.id, family);
    return family;
  });

  const techniquesById = new Map<string, Technique>();
  dishes.forEach((dish) => {
    dish.techniques.forEach((techniqueName) => {
      const id = `pub-tec-${slugify(techniqueName)}`;
      if (!techniquesById.has(id)) {
        techniquesById.set(id, {
          id,
          canonicalName: techniqueName.toLowerCase(),
          displayName: titleize(techniqueName),
          description: `Published technique linked to dish concepts.`
        });
      }
    });
  });

  const recipesBySlug = new Set<string>();
  const recipeRows: Recipe[] = recipes.map((recipeInput) => {
    recipeInput.sourceRefs.forEach((sourceRef) => {
      sourceIdForRef(sourceRef);
    });

    const family = familyByDishId.get(recipeInput.dishId);
    const baseSlug = slugify(recipeInput.title || recipeInput.id);
    const slug = uniqueSlug(baseSlug, recipesBySlug);

    return {
      id: `pub-rec-${recipeInput.id}`,
      slug,
      recipeFamilyId: family?.id ?? `pub-fam-${recipeInput.dishId}`,
      sourceId: sourceIdForRef(recipeInput.sourceRefs[0]),
      title: recipeInput.title,
      description: recipeInput.instructions[0] ?? `Published recipe for ${recipeInput.title}.`,
      serves: recipeInput.yieldText ?? "N/A",
      prepTimeMinutes: recipeInput.prepTimeMinutes,
      cookTimeMinutes: recipeInput.cookTimeMinutes,
      totalTimeMinutes: recipeInput.totalTimeMinutes,
      isSourceRecipe: true,
      isUserVariation: false,
      tags: [
        family?.displayName,
        family?.category,
        recipeInput.sourceType,
        recipeInput.isCanonicalCandidate ? "canonical-candidate" : undefined
      ].filter(Boolean) as string[],
      createdAt: recipeInput.sourceRefs[0]?.importedAt ?? now,
      updatedAt: now
    };
  });

  const recipeIngredients: RecipeIngredient[] = [];
  const recipeSteps: RecipeStep[] = [];

  recipes.forEach((recipeInput) => {
    const recipeId = `pub-rec-${recipeInput.id}`;
    recipeInput.ingredients.forEach((ingredient, index) => {
      if (!ingredient.ingredientId) return;
      recipeIngredients.push({
        id: `pub-ri-${recipeId}-${index + 1}`,
        recipeId,
        ingredientId: ingredient.ingredientId,
        rawText: ingredient.rawText,
        quantity: ingredient.quantityText,
        sortOrder: index + 1
      });
    });

    (recipeInput.instructions.length ? recipeInput.instructions : ["No instructions yet."]).forEach((instruction, index) => {
      recipeSteps.push({
        id: `pub-step-${recipeId}-${index + 1}`,
        recipeId,
        stepNumber: index + 1,
        instructionText: instruction
      });
    });
  });

  const dishFamilyIngredients: DishFamilyIngredient[] = [];
  dishes.forEach((dish) => {
    const family = familyByDishId.get(dish.id);
    if (!family) return;

    [...dish.canonicalIngredients, ...dish.optionalCommonIngredients].forEach((profile) => {
      dishFamilyIngredients.push({
        dishFamilyId: family.id,
        ingredientId: profile.ingredientId,
        importanceScore: profile.frequency
      });
    });
  });

  return {
    ...EMPTY_SEED_DATA,
    cuisines: Array.from(cuisineById.values()),
    categories: Array.from(categoriesById.values()),
    ingredientCategories: Array.from(ingredientCategoryById.values()),
    techniqueCategories: [] as TechniqueCategory[],
    sources: Array.from(sourceByKey.values()),
    families,
    recipes: recipeRows,
    ingredients: ingredientRows,
    techniques: Array.from(techniquesById.values()),
    cuisineDishFamilies: families.map((family) => ({
      cuisineId: family.cuisineId ?? "cui-american",
      dishFamilyId: family.id,
      relationshipStrength: 0.8
    })),
    dishFamilyIngredients,
    dishFamilyTechniques: families.flatMap((family) =>
      (family.techniqueIds ?? []).map((techniqueId) => ({
        dishFamilyId: family.id,
        techniqueId,
        importanceScore: 0.6
      }))
    ),
    recipeIngredients,
    steps: recipeSteps,
    recipeTechniques: families.flatMap((family) =>
      recipeRows
        .filter((recipe) => recipe.recipeFamilyId === family.id)
        .flatMap((recipe) =>
          (family.techniqueIds ?? []).map((techniqueId) => ({
            recipeId: recipe.id,
            techniqueId
          }))
        )
    )
  };
}

function stripPrefix(value: string, prefix: string) {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

function titleize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => (word.length <= 2 ? word.toUpperCase() : `${word.charAt(0).toUpperCase()}${word.slice(1)}`))
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

function uniqueSlug(base: string, existing: Set<string>) {
  let candidate = base || "recipe";
  let suffix = 2;
  while (existing.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  existing.add(candidate);
  return candidate;
}
