import type { Prisma } from "@prisma/client";
import { loadPublishedSeedData } from "@/lib/published/seedAdapter";
import { prisma } from "@/lib/db";
import { loadGraphFromDatabase, loadSeedDataFromDatabase } from "@/lib/data/dbSeed";
import type {
  Category,
  Creator,
  CookReport,
  Cuisine,
  CookingMethod,
  DifficultyBand,
  DishFamilyIngredient,
  DishFamilyMethod,
  DishFamilyTechnique,
  Ingredient,
  IngredientCategory,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  Recipe,
  RecipeChange,
  RecipeChangeType,
  RecipeIngredient,
  RecipeRelationship,
  RecipeStep,
  SeedData,
  Technique,
  TechniqueCategory
} from "@/lib/types";

const emptySeedData = (): SeedData => ({
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
});

let dbCache: { data: SeedData; loadedAt: number } | undefined;
const DB_CACHE_TTL_MS = Number(process.env.RECIPEDIA_DB_CACHE_TTL_MS ?? "5000");

export async function getData(): Promise<SeedData> {
  const now = Date.now();
  if (dbCache && now - dbCache.loadedAt < DB_CACHE_TTL_MS) {
    return dbCache.data;
  }

  const data = await loadSeedDataFromDatabase();
  if (hasDataRows(data)) {
    dbCache = { data, loadedAt: now };
    return data;
  }

  if (process.env.RECIPEDIA_ALLOW_JSON_CACHE === "true") {
    const published = await loadPublishedSeedData();
    dbCache = { data: published, loadedAt: now };
    return published;
  }

  return emptySeedData();
}

export async function getGraphData() {
  const graph = await loadGraphFromDatabase();
  if (graph.nodes.length > 0) return graph;

  const data = await getData();
  return buildSemanticGraph(data);
}

function hasDataRows(data: SeedData) {
  return data.recipes.length + data.families.length + data.ingredients.length + data.cuisines.length > 0;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function isCanonicalVariation(recipe: Pick<Recipe, "isUserVariation" | "variationKind">) {
  return recipe.isUserVariation && recipe.variationKind === "canonical";
}

export function isPersonalVariation(recipe: Pick<Recipe, "isUserVariation" | "variationKind">) {
  return recipe.isUserVariation && recipe.variationKind !== "canonical";
}

export function recipeBadgeLabel(recipe: Pick<Recipe, "isSourceRecipe" | "isUserVariation" | "variationKind">) {
  if (isCanonicalVariation(recipe)) return "Canonical variation";
  if (isPersonalVariation(recipe)) return "Personal variation";
  return recipe.isSourceRecipe ? "Canonical dish" : "Recipe";
}

export async function getRecipeDetails(slug: string) {
  const data = await getData();
  const recipe = data.recipes.find((candidate) => candidate.slug === slug);
  if (!recipe) return undefined;

  const family = data.families.find((candidate) => candidate.id === recipe.recipeFamilyId);
  if (!family) return undefined;

  const source = data.sources.find((candidate) => candidate.id === recipe.sourceId);
  const ingredients = data.recipeIngredients
    .filter((item) => item.recipeId === recipe.id)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      ...item,
      ingredient: data.ingredients.find((ingredient) => ingredient.id === item.ingredientId)!
    }))
    .filter((item) => item.ingredient);
  const steps = data.steps
    .filter((step) => step.recipeId === recipe.id)
    .sort((a, b) => a.stepNumber - b.stepNumber);
  const techniqueIds = new Set(
    data.recipeTechniques.filter((item) => item.recipeId === recipe.id).map((item) => item.techniqueId)
  );
  const techniques = data.techniques.filter((technique) => techniqueIds.has(technique.id));
  const changes = data.changes.filter((change) => change.recipeId === recipe.id);
  const parent = data.recipes.find((candidate) => candidate.id === recipe.parentRecipeId);
  const children = data.recipes.filter((candidate) => candidate.parentRecipeId === recipe.id);
  const cookReports = data.cookReports.filter((report) => report.recipeId === recipe.id);

  return {
    ...recipe,
    family,
    source,
    ingredients,
    steps,
    techniques,
    changes,
    parent,
    children,
    cookReports
  };
}

export async function getFamily(slug: string) {
  const data = await getData();
  const family = data.families.find((candidate) => candidate.slug === slug);
  if (!family) return undefined;
  const recipes = data.recipes.filter((recipe) => recipe.recipeFamilyId === family.id);
  const recipeIds = new Set(recipes.map((recipe) => recipe.id));
  const recipeIngredientCounts = countNames(
    data.recipeIngredients
      .filter((item) => recipeIds.has(item.recipeId))
      .map((item) => data.ingredients.find((ingredient) => ingredient.id === item.ingredientId)?.displayName)
  );
  const recipeTechniqueCounts = countNames(
    data.recipeTechniques
      .filter((item) => recipeIds.has(item.recipeId))
      .map((item) => data.techniques.find((technique) => technique.id === item.techniqueId)?.displayName)
  );
  const familyIngredientCounts = data.dishFamilyIngredients
    .filter((item) => item.dishFamilyId === family.id)
    .map((item) => ({
      name: data.ingredients.find((ingredient) => ingredient.id === item.ingredientId)?.displayName ?? item.ingredientId,
      count: Math.round(item.importanceScore * 100)
    }));
  const familyTechniqueCounts = data.dishFamilyTechniques
    .filter((item) => item.dishFamilyId === family.id)
    .map((item) => ({
      name: data.techniques.find((technique) => technique.id === item.techniqueId)?.displayName ?? item.techniqueId,
      count: Math.round(item.importanceScore * 100)
    }));

  const ingredientCounts = mergeCountRows(recipeIngredientCounts, familyIngredientCounts).slice(0, 8);
  const techniqueCounts = mergeCountRows(recipeTechniqueCounts, familyTechniqueCounts).slice(0, 8);

  return {
    family,
    recipes,
    ingredientCounts,
    techniqueCounts,
    graph: buildFamilyGraph(data, family.id)
  };
}

export async function getCuisine(slug: string) {
  const data = await getData();
  const cuisine = data.cuisines.find((candidate) => candidate.slug === slug);
  if (!cuisine) return undefined;

  const familyIds = new Set(
    data.cuisineDishFamilies
      .filter((link) => link.cuisineId === cuisine.id)
      .map((link) => link.dishFamilyId)
  );
  data.families
    .filter((family) => family.cuisineId === cuisine.id)
    .forEach((family) => familyIds.add(family.id));

  const families = data.families.filter((family) => familyIds.has(family.id));
  const categoryIds = new Set(
    families
      .map((family) => resolveFamilyCategoryId(family, data.categories))
      .filter(Boolean) as string[]
  );

  const categories = data.categories
    .filter((category) => category.cuisineId === cuisine.id || categoryIds.has(category.id))
    .sort((left, right) => left.sortOrder - right.sortOrder);

  const recipes = data.recipes
    .filter((recipe) => familyIds.has(recipe.recipeFamilyId))
    .sort((left, right) => Number(right.createdAt.localeCompare(left.createdAt)));

  return {
    cuisine,
    categories,
    families,
    recipes
  };
}

export async function getCategory(slug: string) {
  const data = await getData();
  const category = data.categories.find((candidate) => candidate.slug === slug);
  if (!category) return undefined;
  const categoryIds = descendantCategoryIds(data.categories, category.id);
  const families = data.families.filter((family) => {
    const categoryId = resolveFamilyCategoryId(family, data.categories);
    return categoryId ? categoryIds.has(categoryId) : family.category === slug;
  });
  const familyIds = new Set(families.map((family) => family.id));
  const recipes = data.recipes.filter((recipe) => familyIds.has(recipe.recipeFamilyId));
  const cuisineIds = new Set(
    families
      .map((family) => family.cuisineId)
      .filter(Boolean)
      .concat(category.cuisineId ? [category.cuisineId] : [])
  );
  const cuisines = data.cuisines
    .filter((candidate) => cuisineIds.has(candidate.id))
    .sort((left, right) => left.displayName.localeCompare(right.displayName));

  return {
    category,
    childCategories: data.categories
      .filter((candidate) => candidate.parentCategoryId === category.id)
      .sort((left, right) => left.sortOrder - right.sortOrder),
    cuisine: category.cuisineId ? data.cuisines.find((candidate) => candidate.id === category.cuisineId) : undefined,
    cuisines,
    families,
    recipes
  };
}

export async function getIngredient(slug: string) {
  const data = await getData();
  const ingredient = data.ingredients.find((candidate) => slugify(candidate.canonicalName) === slug);
  if (!ingredient) return undefined;
  const recipeIds = new Set(
    data.recipeIngredients
      .filter((item) => item.ingredientId === ingredient.id)
      .map((item) => item.recipeId)
  );
  const recipes = data.recipes.filter((recipe) => recipeIds.has(recipe.id));
  return {
    ingredient,
    recipes,
    families: data.families.filter((family) => recipes.some((recipe) => recipe.recipeFamilyId === family.id)),
    relatedTechniques: relatedTechniques(data, new Set(recipes.map((recipe) => recipe.id)))
  };
}

export async function getTechnique(slug: string) {
  const data = await getData();
  const technique = data.techniques.find((candidate) => slugify(candidate.canonicalName) === slug);
  if (!technique) return undefined;
  const recipeIds = new Set(
    data.recipeTechniques
      .filter((item) => item.techniqueId === technique.id)
      .map((item) => item.recipeId)
  );
  const recipes = data.recipes.filter((recipe) => recipeIds.has(recipe.id));
  return {
    technique,
    recipes,
    families: data.families.filter((family) => recipes.some((recipe) => recipe.recipeFamilyId === family.id)),
    relatedIngredients: relatedIngredients(data, recipeIds)
  };
}

export async function searchRecipes(query: string) {
  const data = await getData();
  const needle = query.trim().toLowerCase();
  if (!needle) return data.recipes.slice(0, 8);

  const ingredientMatches = new Set(
    data.recipeIngredients
      .filter((item) => {
        const ingredient = data.ingredients.find((candidate) => candidate.id === item.ingredientId);
        return ingredient?.displayName.toLowerCase().includes(needle) || item.rawText.toLowerCase().includes(needle);
      })
      .map((item) => item.recipeId)
  );

  return data.recipes.filter((recipe) => {
    const family = data.families.find((candidate) => candidate.id === recipe.recipeFamilyId);
    return (
      recipe.title.toLowerCase().includes(needle) ||
      recipe.tags.some((tag) => tag.toLowerCase().includes(needle)) ||
      family?.displayName.toLowerCase().includes(needle) ||
      family?.category === needle ||
      ingredientMatches.has(recipe.id)
    );
  });
}

export function recipeScore(recipe: Recipe, cookReports: CookReport[], relationships: RecipeRelationship[]) {
  const reports = cookReports.filter((report) => report.recipeId === recipe.id);
  const averageRating = reports.length
    ? reports.reduce((sum, report) => sum + report.rating, 0) / reports.length
    : 0;
  const wouldMakeAgainRate = reports.length
    ? reports.filter((report) => report.wouldMakeAgain).length / reports.length
    : 0;
  const variationCount = relationships.filter(
    (relationship) => relationship.toRecipeId === recipe.id && relationship.relationshipType === "variation_of"
  ).length;
  const reportWeight = Math.min(reports.length / 10, 1);
  return averageRating * 0.4 + wouldMakeAgainRate * 5 * 0.3 + reportWeight * 5 * 0.2 + variationCount * 0.1;
}

export async function createVariation(input: {
  parentSlug: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  note: string;
}) {
  const data = await getData();
  const parent = data.recipes.find((recipe) => recipe.slug === input.parentSlug);
  if (!parent) throw new Error("Parent recipe was not found.");

  const slugBase = slugify(input.title || `${parent.title} variation`);
  const existingSlugs = new Set(data.recipes.map((recipe) => recipe.slug));
  const slug = uniqueSlug(slugBase, existingSlugs);

  const parentIngredients = data.recipeIngredients
    .filter((item) => item.recipeId === parent.id)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => item.rawText);
  const parentSteps = data.steps
    .filter((step) => step.recipeId === parent.id)
    .sort((a, b) => a.stepNumber - b.stepNumber)
    .map((step) => step.instructionText);
  const inheritedTechniques = data.recipeTechniques
    .filter((item) => item.recipeId === parent.id)
    .map((item) => item.techniqueId);

  const recipe = await prisma.$transaction(async (tx) => {
    const user = await ensureSystemUser(tx);
    const created = await tx.recipe.create({
      data: {
        slug,
        recipeFamilyId: parent.recipeFamilyId,
        dishId: await resolveDishIdForRecipe(tx, parent.id),
        parentRecipeId: parent.id,
        createdByUserId: user.id,
        title: input.title,
        description: input.description,
        serves: parent.serves,
        prepTimeMinutes: parent.prepTimeMinutes,
        cookTimeMinutes: parent.cookTimeMinutes,
        totalTimeMinutes: parent.totalTimeMinutes,
        isSourceRecipe: false,
        isUserVariation: true
      }
    });

    const ingredientRecords = await ingredientRowsForVariation(tx, created.id, input.ingredients);
    if (ingredientRecords.length) {
      await tx.recipeIngredient.createMany({ data: ingredientRecords });
    }

    const stepRecords = input.steps
      .filter(Boolean)
      .map((instructionText, index) => ({
        recipeId: created.id,
        stepNumber: index + 1,
        instructionText
      }));
    if (stepRecords.length) {
      await tx.recipeStep.createMany({ data: stepRecords });
    }

    if (inheritedTechniques.length) {
      await tx.recipeTechnique.createMany({
        data: inheritedTechniques.map((techniqueId) => ({
          recipeId: created.id,
          techniqueId
        })),
        skipDuplicates: true
      });
    }

    const changes = buildChanges({
      recipeId: created.id,
      parentRecipeId: parent.id,
      titleBefore: parent.title,
      titleAfter: input.title,
      parentIngredients,
      nextIngredients: input.ingredients,
      parentSteps,
      nextSteps: input.steps,
      note: input.note
    });

    if (changes.length) {
      await tx.recipeChange.createMany({
        data: changes.map((change) => ({
          recipeId: change.recipeId,
          parentRecipeId: change.parentRecipeId,
          changeType: change.changeType,
          fieldName: change.fieldName,
          beforeValue: change.beforeValue,
          afterValue: change.afterValue,
          note: change.note
        }))
      });
    }

    await tx.recipeRelationship.create({
      data: {
        fromRecipeId: created.id,
        toRecipeId: parent.id,
        relationshipType: "variation_of"
      }
    });

    await tx.recipeVariation.upsert({
      where: {
        parentRecipeId_variationRecipeId_variationType: {
          parentRecipeId: parent.id,
          variationRecipeId: created.id,
          variationType: "personal"
        }
      },
      create: {
        id: `var-${created.id}`,
        parentRecipeId: parent.id,
        variationRecipeId: created.id,
        variationType: "personal",
        note: input.note || null
      },
      update: {
        note: input.note || null
      }
    });

    return created;
  });

  clearDataCache();
  return {
    id: recipe.id,
    slug: recipe.slug,
    recipeFamilyId: recipe.recipeFamilyId,
    sourceId: recipe.sourceId ?? undefined,
    parentRecipeId: recipe.parentRecipeId ?? undefined,
    createdByUserId: recipe.createdByUserId ?? undefined,
    title: recipe.title,
    description: recipe.description,
    serves: recipe.serves ?? "N/A",
    prepTimeMinutes: recipe.prepTimeMinutes ?? undefined,
    cookTimeMinutes: recipe.cookTimeMinutes ?? undefined,
    totalTimeMinutes: recipe.totalTimeMinutes ?? undefined,
    imageUrl: recipe.imageUrl ?? undefined,
    isSourceRecipe: recipe.isSourceRecipe,
    isUserVariation: recipe.isUserVariation,
    variationKind: "personal",
    tags: ["variation"],
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString()
  } satisfies Recipe;
}

export async function addCookReport(input: {
  recipeSlug: string;
  madeIt: boolean;
  rating: number;
  wouldMakeAgain: boolean;
  difficultyRating: number;
  notes: string;
}) {
  const recipe = await prisma.recipe.findUnique({ where: { slug: input.recipeSlug } });
  if (!recipe) throw new Error("Recipe was not found.");

  const report = await prisma.$transaction(async (tx) => {
    const user = await ensureSystemUser(tx);
    return tx.cookReport.create({
      data: {
        recipeId: recipe.id,
        userId: user.id,
        madeIt: input.madeIt,
        rating: input.rating,
        wouldMakeAgain: input.wouldMakeAgain,
        difficultyRating: input.difficultyRating,
        notes: input.notes
      }
    });
  });

  clearDataCache();
  return {
    id: report.id,
    recipeId: report.recipeId,
    userId: report.userId,
    madeIt: report.madeIt,
    rating: report.rating,
    wouldMakeAgain: report.wouldMakeAgain,
    difficultyRating: report.difficultyRating,
    notes: report.notes,
    createdAt: report.createdAt.toISOString()
  } satisfies CookReport;
}

export async function registerImportedRecipe(input: {
  title: string;
  sourceUrl: string;
  authorName: string;
  ingredients: string[];
  instructions: string[];
  category: string;
  familySlug: string;
  extractionMethod: "recipe-scrapers" | "json-ld" | "beautiful-soup";
  extractionConfidence: number;
}) {
  const family = await prisma.recipeFamily.findUnique({ where: { slug: input.familySlug } });
  if (!family) throw new Error("Choose an existing family for this MVP import.");

  const allRecipes = await prisma.recipe.findMany({ select: { slug: true } });
  const slug = uniqueSlug(
    slugify(input.title),
    new Set(allRecipes.map((recipe) => recipe.slug))
  );

  const result = await prisma.$transaction(async (tx) => {
    const source = await upsertImportedSource(tx, input);
    const sourceImport = await tx.sourceImport.upsert({
      where: { sourceUrl: input.sourceUrl },
      create: {
        id: `srcimp-${slug}`,
        sourceUrl: input.sourceUrl,
        siteName: "Serious Eats",
        authorName: input.authorName || "Serious Eats",
        licenseNote: "Source attribution retained. Imported by Recipedia ingestion.",
        extractionMethod: input.extractionMethod,
        extractionConfidence: input.extractionConfidence
      },
      update: {
        extractionMethod: input.extractionMethod,
        extractionConfidence: input.extractionConfidence,
        authorName: input.authorName || "Serious Eats"
      }
    });

    const recipe = await tx.recipe.create({
      data: {
        slug,
        recipeFamilyId: family.id,
        sourceId: source.id,
        sourceImportId: sourceImport.id,
        title: input.title,
        description: `Imported Serious Eats recipe in the ${family.displayName} family.`,
        serves: "Imported",
        isSourceRecipe: true,
        isUserVariation: false
      }
    });

    const ingredientRecords = await ingredientRowsForVariation(tx, recipe.id, input.ingredients);
    if (ingredientRecords.length) {
      await tx.recipeIngredient.createMany({ data: ingredientRecords });
    }

    const stepRows = input.instructions
      .filter(Boolean)
      .map((instructionText, index) => ({
        recipeId: recipe.id,
        stepNumber: index + 1,
        instructionText
      }));
    if (stepRows.length) {
      await tx.recipeStep.createMany({ data: stepRows });
    }

    return { slug: recipe.slug };
  });

  clearDataCache();
  return result;
}

async function ensureSystemUser(tx: Prisma.TransactionClient) {
  const systemEmail = "local@recipedia.app";
  const existing = await tx.user.findUnique({ where: { email: systemEmail } });
  if (existing) return existing;

  return tx.user.create({
    data: {
      name: "Local Recipedia User",
      email: systemEmail
    }
  });
}

async function resolveDishIdForRecipe(tx: Prisma.TransactionClient, recipeId: string) {
  const parent = await tx.recipe.findUnique({
    where: { id: recipeId },
    select: { dishId: true }
  });
  return parent?.dishId ?? null;
}

async function upsertImportedSource(
  tx: Prisma.TransactionClient,
  input: {
    sourceUrl: string;
    authorName: string;
    extractionMethod: "recipe-scrapers" | "json-ld" | "beautiful-soup";
    extractionConfidence: number;
  }
) {
  const existing = await tx.source.findUnique({ where: { sourceUrl: input.sourceUrl } });
  if (existing) {
    return tx.source.update({
      where: { id: existing.id },
      data: {
        authorName: input.authorName || "Serious Eats",
        extractionMethod: input.extractionMethod,
        extractionConfidence: input.extractionConfidence
      }
    });
  }

  return tx.source.create({
    data: {
      siteName: "Serious Eats",
      sourceUrl: input.sourceUrl,
      authorName: input.authorName || "Serious Eats",
      licenseNote: "Source attribution retained. Imported by Recipedia ingestion.",
      extractionMethod: input.extractionMethod,
      extractionConfidence: input.extractionConfidence
    }
  });
}

function clearDataCache() {
  dbCache = undefined;
}

function uniqueSlug(base: string, existingSlugs: Set<string>) {
  let slug = base || "recipe-variation";
  let counter = 2;
  while (existingSlugs.has(slug)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

async function ingredientRowsForVariation(
  tx: Prisma.TransactionClient,
  recipeId: string,
  rawIngredients: string[]
): Promise<RecipeIngredient[]> {
  const rows: RecipeIngredient[] = [];
  for (const rawText of rawIngredients.filter(Boolean)) {
    const ingredient = await findOrCreateIngredient(tx, rawText);
    rows.push({
      id: `ri-${recipeId}-${rows.length + 1}-${slugify(rawText).slice(0, 16)}`,
      recipeId,
      ingredientId: ingredient.id,
      rawText,
      sortOrder: rows.length + 1
    });
  }
  return rows;
}

async function findOrCreateIngredient(tx: Prisma.TransactionClient, rawText: string) {
  const normalized = canonicalize(rawText);
  const found = await tx.ingredient.findFirst({
    where: {
      OR: [
        { canonicalName: normalized },
        { displayName: { equals: normalized, mode: "insensitive" } }
      ]
    }
  });
  if (found) return found;

  const displayName = normalized
    .split(" ")
    .slice(0, 3)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return tx.ingredient.create({
    data: {
      id: `ing-local-${slugify(displayName)}-${Date.now().toString(36)}`,
      canonicalName: normalized.split(",")[0].slice(0, 48),
      displayName,
      aliases: []
    }
  });
}

function canonicalize(rawText: string) {
  return rawText
    .toLowerCase()
    .replace(/\brue\b/g, "roux")
    .replace(/\bgreen onions?\b/g, "scallion")
    .replace(/\bparmigiano reggiano\b/g, "parmesan")
    .replace(/[^a-z\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildChanges(input: {
  recipeId: string;
  parentRecipeId: string;
  titleBefore: string;
  titleAfter: string;
  parentIngredients: string[];
  nextIngredients: string[];
  parentSteps: string[];
  nextSteps: string[];
  note: string;
}): RecipeChange[] {
  const changes: RecipeChange[] = [];
  const addChange = (
    changeType: RecipeChangeType,
    fieldName: string,
    beforeValue?: string,
    afterValue?: string
  ) => {
    changes.push({
      id: `chg-${input.recipeId}-${changes.length + 1}`,
      recipeId: input.recipeId,
      parentRecipeId: input.parentRecipeId,
      changeType,
      fieldName,
      beforeValue,
      afterValue,
      note: input.note
    });
  };

  if (input.titleBefore !== input.titleAfter) {
    addChange("change_title", "title", input.titleBefore, input.titleAfter);
  }

  input.nextIngredients.forEach((ingredient) => {
    if (!input.parentIngredients.includes(ingredient)) {
      addChange("add_ingredient", "ingredient", undefined, ingredient);
    }
  });

  input.parentIngredients.forEach((ingredient) => {
    if (!input.nextIngredients.includes(ingredient)) {
      addChange("remove_ingredient", "ingredient", ingredient, undefined);
    }
  });

  input.nextSteps.forEach((step, index) => {
    if (input.parentSteps[index] && input.parentSteps[index] !== step) {
      addChange("edit_step", `step ${index + 1}`, input.parentSteps[index], step);
    } else if (!input.parentSteps[index]) {
      addChange("edit_step", `step ${index + 1}`, undefined, step);
    }
  });

  return changes;
}

function countNames(names: Array<string | undefined>) {
  const counts = new Map<string, number>();
  names.filter(Boolean).forEach((name) => counts.set(name!, (counts.get(name!) ?? 0) + 1));
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function mergeCountRows(primary: Array<{ name: string; count: number }>, secondary: Array<{ name: string; count: number }>) {
  const merged = new Map<string, number>();
  secondary.forEach((row) => merged.set(row.name, Math.max(merged.get(row.name) ?? 0, row.count)));
  primary.forEach((row) => merged.set(row.name, Math.max(merged.get(row.name) ?? 0, row.count)));
  return Array.from(merged.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
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

function relatedTechniques(data: SeedData, recipeIds: Set<string>): Technique[] {
  const techniqueIds = new Set(
    data.recipeTechniques.filter((item) => recipeIds.has(item.recipeId)).map((item) => item.techniqueId)
  );
  return data.techniques.filter((technique) => techniqueIds.has(technique.id));
}

function relatedIngredients(data: SeedData, recipeIds: Set<string>): Ingredient[] {
  const ingredientIds = new Set(
    data.recipeIngredients.filter((item) => recipeIds.has(item.recipeId)).map((item) => item.ingredientId)
  );
  return data.ingredients.filter((ingredient) => ingredientIds.has(ingredient.id));
}

export function buildSemanticGraph(data: SeedData) {
  const nodes: KnowledgeGraphNode[] = [];
  const edges: KnowledgeGraphEdge[] = [];
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const recipeCountByFamily = new Map<string, number>();
  const sourceRecipeCountByFamily = new Map<string, number>();
  const variationCountByFamily = new Map<string, number>();

  data.recipes.forEach((recipe) => {
    recipeCountByFamily.set(recipe.recipeFamilyId, (recipeCountByFamily.get(recipe.recipeFamilyId) ?? 0) + 1);
    if (recipe.isUserVariation) {
      variationCountByFamily.set(recipe.recipeFamilyId, (variationCountByFamily.get(recipe.recipeFamilyId) ?? 0) + 1);
    } else {
      sourceRecipeCountByFamily.set(recipe.recipeFamilyId, (sourceRecipeCountByFamily.get(recipe.recipeFamilyId) ?? 0) + 1);
    }
  });

  const cuisineById = new Map(data.cuisines.map((cuisine) => [cuisine.id, cuisine]));
  const categoryById = new Map(data.categories.map((category) => [category.id, category]));
  const ingredientCategoryById = new Map(data.ingredientCategories.map((category) => [category.id, category]));
  const techniqueCategoryById = new Map(data.techniqueCategories.map((category) => [category.id, category]));
  const methodById = new Map(data.cookingMethods.map((method) => [method.id, method]));
  const difficultyById = new Map(data.difficultyBands.map((difficulty) => [difficulty.id, difficulty]));

  const addNode = (node: KnowledgeGraphNode) => {
    if (nodeIds.has(node.id)) return;
    nodeIds.add(node.id);
    nodes.push(node);
  };

  const addEdge = (edge: KnowledgeGraphEdge) => {
    if (edgeIds.has(edge.id) || !nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return;
    edgeIds.add(edge.id);
    edges.push(edge);
  };

  data.cuisines.forEach((cuisine) => addNode(cuisineNode(cuisine, data.categories)));
  data.categories.forEach((category) => addNode(categoryNode(category, data.categories, data.families)));
  data.ingredientCategories.forEach((category) => addNode(ingredientCategoryNode(category, data.ingredientCategories, data.ingredients)));
  data.techniqueCategories.forEach((category) => addNode(techniqueCategoryNode(category, data.techniqueCategories, data.techniques)));
  data.cookingMethods.forEach((method) => addNode(methodNode(method, data.dishFamilyMethods)));
  data.difficultyBands.forEach((difficulty) => addNode(difficultyNode(difficulty, data.families)));
  data.creators.forEach((creator) => addNode(creatorNode(creator)));

  data.ingredients
    .filter((ingredient) => isReferencedIngredient(ingredient.id, data.dishFamilyIngredients, data.recipeIngredients))
    .forEach((ingredient) => addNode(ingredientNode(ingredient, data.dishFamilyIngredients, ingredientCategoryById)));

  data.techniques
    .filter((technique) => isReferencedTechnique(technique.id, data.dishFamilyTechniques, data.recipeTechniques))
    .forEach((technique) => addNode(techniqueNode(technique, data.dishFamilyTechniques, techniqueCategoryById)));

  data.families.forEach((family) => {
    const recipeCount = recipeCountByFamily.get(family.id) ?? 0;
    const sourceRecipeCount = sourceRecipeCountByFamily.get(family.id) ?? 0;
    const variationCount = variationCountByFamily.get(family.id) ?? 0;
    const primaryCuisineId = family.primaryCuisineId ?? family.cuisineId;
    const cuisine = primaryCuisineId ? cuisineById.get(primaryCuisineId) : undefined;
    const categoryId = resolveFamilyCategoryId(family, data.categories);
    const category = categoryId ? categoryById.get(categoryId) : undefined;
    const difficulty = family.difficultyBandId ? difficultyById.get(family.difficultyBandId) : undefined;
    const method = family.primaryMethodId ? methodById.get(family.primaryMethodId) : undefined;
    const tags = [
      cuisine?.displayName ?? family.cuisine,
      category?.displayName,
      difficulty?.displayName,
      method?.displayName,
      family.isCanonical ? "Canonical" : undefined
    ].filter(Boolean) as string[];

    addNode({
      id: family.id,
      label: family.displayName,
      kind: "family",
      href: `/families/${family.slug}`,
      description: family.description,
      meta: familyMeta(sourceRecipeCount, variationCount, recipeCount),
      tags,
      canonical: family.isCanonical ?? recipeCount === 0,
      cuisineId: primaryCuisineId,
      categoryId,
      difficultyBandId: family.difficultyBandId,
      primaryMethodId: family.primaryMethodId,
      category: family.category
    });
  });

  data.creators.forEach((creator) => {
    creator.familyLinks.forEach((slug) => {
      const family = data.families.find((candidate) => candidate.slug === slug);
      if (!family) return;
      addEdge({
        id: `edge-family-creator-${family.id}-${creator.id}`,
        source: family.id,
        target: creatorNodeId(creator.id),
        label: "creator",
        kind: "family_created_by",
        strength: creator.popularityScore ? Math.min(1, creator.popularityScore / 100) : 0.7
      });
    });

    creator.cuisineLinks.forEach((slug) => {
      const cuisine = data.cuisines.find((candidate) => candidate.slug === slug);
      if (!cuisine) return;
      addEdge({
        id: `edge-cuisine-creator-${cuisine.id}-${creator.id}`,
        source: cuisineNodeId(cuisine.id),
        target: creatorNodeId(creator.id),
        label: "creator",
        kind: "cuisine_has_creator",
        strength: creator.popularityScore ? Math.min(1, creator.popularityScore / 100) : 0.65
      });
    });
  });

  data.categories.forEach((category) => {
    if (category.parentCategoryId) {
      addEdge({
        id: `edge-category-${category.parentCategoryId}-${category.id}`,
        source: categoryNodeId(category.parentCategoryId),
        target: categoryNodeId(category.id),
        label: "subcategory",
        kind: "category_contains_category",
        strength: 0.88
      });
      return;
    }

    if (!category.cuisineId) return;
    addEdge({
      id: `edge-cuisine-category-${category.cuisineId}-${category.id}`,
      source: cuisineNodeId(category.cuisineId),
      target: categoryNodeId(category.id),
      label: "category",
      kind: "cuisine_contains_category",
      strength: 0.9
    });
  });

  data.ingredientCategories.forEach((category) => {
    if (!category.parentCategoryId) return;
    addEdge({
      id: `edge-ingredient-category-${category.parentCategoryId}-${category.id}`,
      source: ingredientCategoryNodeId(category.parentCategoryId),
      target: ingredientCategoryNodeId(category.id),
      label: "subcategory",
      kind: "ingredient_category_contains_category",
      strength: 0.86
    });
  });

  data.ingredients.forEach((ingredient) => {
    const categoryId = resolveIngredientCategoryId(ingredient);
    if (!categoryId) return;
    addEdge({
      id: `edge-ingredient-category-ingredient-${categoryId}-${ingredient.id}`,
      source: ingredientCategoryNodeId(categoryId),
      target: ingredientNodeId(ingredient.id),
      label: "ingredient",
      kind: "ingredient_category_contains_ingredient",
      strength: 0.9
    });
  });

  data.techniqueCategories.forEach((category) => {
    if (!category.parentCategoryId) return;
    addEdge({
      id: `edge-technique-category-${category.parentCategoryId}-${category.id}`,
      source: techniqueCategoryNodeId(category.parentCategoryId),
      target: techniqueCategoryNodeId(category.id),
      label: "subcategory",
      kind: "technique_category_contains_category",
      strength: 0.86
    });
  });

  data.techniques.forEach((technique) => {
    const categoryId = resolveTechniqueCategoryId(technique);
    if (!categoryId) return;
    addEdge({
      id: `edge-technique-category-technique-${categoryId}-${technique.id}`,
      source: techniqueCategoryNodeId(categoryId),
      target: techniqueNodeId(technique.id),
      label: "technique",
      kind: "technique_category_contains_technique",
      strength: 0.9
    });
  });

  data.families.forEach((family) => {
    const primaryCategoryId = resolveFamilyCategoryId(family, data.categories);
    if (primaryCategoryId) {
      addEdge({
        id: `edge-category-family-${primaryCategoryId}-${family.id}`,
        source: categoryNodeId(primaryCategoryId),
        target: family.id,
        label: "dish family",
        kind: "category_contains_dish_family",
        strength: 0.9
      });
    }

    const secondaryCategoryIds = (family.secondaryCategoryIds ?? []).filter((id) => id !== primaryCategoryId);
    secondaryCategoryIds.forEach((secondaryCategoryId) => {
      addEdge({
        id: `edge-family-category-associated-${secondaryCategoryId}-${family.id}`,
        source: categoryNodeId(secondaryCategoryId),
        target: family.id,
        label: "also in category",
        kind: "family_associated_with_category",
        strength: 0.72
      });
    });

    const primaryCuisineId = family.primaryCuisineId ?? family.cuisineId;
    if (primaryCuisineId) {
      addEdge({
        id: `edge-family-cuisine-associated-${primaryCuisineId}-${family.id}`,
        source: cuisineNodeId(primaryCuisineId),
        target: family.id,
        label: "cuisine family",
        kind: "family_associated_with_cuisine",
        strength: 0.8
      });
    }

    if (family.difficultyBandId) {
      addEdge({
        id: `edge-difficulty-${family.id}-${family.difficultyBandId}`,
        source: family.id,
        target: difficultyNodeId(family.difficultyBandId),
        label: "difficulty",
        kind: "dish_has_difficulty",
        strength: 0.72
      });
    }

    if (family.primaryMethodId) {
      addEdge({
        id: `edge-method-${family.id}-${family.primaryMethodId}`,
        source: family.id,
        target: methodNodeId(family.primaryMethodId),
        label: "method",
        kind: "dish_uses_method",
        strength: 0.72
      });
    }
  });

  data.dishFamilyIngredients.forEach((relationship) => {
    addEdge({
      id: `edge-family-ingredient-${relationship.dishFamilyId}-${relationship.ingredientId}`,
      source: relationship.dishFamilyId,
      target: ingredientNodeId(relationship.ingredientId),
      label: "uses",
      kind: "dish_uses_ingredient",
      strength: relationship.importanceScore
    });
  });

  data.dishFamilyTechniques.forEach((relationship) => {
    addEdge({
      id: `edge-family-technique-${relationship.dishFamilyId}-${relationship.techniqueId}`,
      source: relationship.dishFamilyId,
      target: techniqueNodeId(relationship.techniqueId),
      label: "technique",
      kind: "dish_uses_technique",
      strength: relationship.importanceScore
    });
  });

  data.dishFamilyMethods.forEach((relationship) => {
    addEdge({
      id: `edge-family-method-${relationship.dishFamilyId}-${relationship.cookingMethodId}`,
      source: relationship.dishFamilyId,
      target: methodNodeId(relationship.cookingMethodId),
      label: "method",
      kind: "dish_uses_method",
      strength: relationship.importanceScore
    });
  });

  data.cuisineDishFamilies.forEach((relationship) => {
    addEdge({
      id: `edge-family-cuisine-link-${relationship.cuisineId}-${relationship.dishFamilyId}`,
      source: cuisineNodeId(relationship.cuisineId),
      target: relationship.dishFamilyId,
      label: "related cuisine",
      kind: "family_associated_with_cuisine",
      strength: relationship.relationshipStrength
    });
  });

  data.dishFamilyRelatedDishFamilies.forEach((relationship) => {
    addEdge({
      id: `edge-related-${relationship.fromDishFamilyId}-${relationship.toDishFamilyId}`,
      source: relationship.fromDishFamilyId,
      target: relationship.toDishFamilyId,
      label: relationship.relationshipType.replace(/_/g, " "),
      kind: "dish_related_to_dish",
      strength: 0.68
    });
  });

  data.recipes.forEach((recipe) => {
    addNode({
      id: recipe.id,
      label: recipe.title,
      kind: recipe.isUserVariation ? "variation" : "recipe",
      href: `/recipes/${recipe.slug}`,
      description: recipe.description,
      meta: recipeBadgeLabel(recipe),
      tags: recipe.tags,
      canonical: recipe.isSourceRecipe,
      cuisineId: data.families.find((family) => family.id === recipe.recipeFamilyId)?.cuisineId
    });
    if (!recipe.isUserVariation) {
      addEdge({
        id: `edge-recipe-family-${recipe.recipeFamilyId}-${recipe.id}`,
        source: recipe.recipeFamilyId,
        target: recipe.id,
        label: "recipe",
        kind: "dish_family_contains_recipe",
        strength: 0.9
      });
    }
    if (recipe.parentRecipeId && recipe.isUserVariation) {
      addEdge({
        id: `edge-variation-${recipe.parentRecipeId}-${recipe.id}`,
        source: recipe.parentRecipeId,
        target: recipe.id,
        label: "variation",
        kind: "recipe_has_variation",
        strength: 0.95
      });
    }
  });

  return { nodes, edges };
}

function cuisineNodeId(id: string) {
  return `cuisine-${id}`;
}

function categoryNodeId(id: string) {
  return `category-${id}`;
}

function ingredientNodeId(id: string) {
  return `ingredient-${id}`;
}

function ingredientCategoryNodeId(id: string) {
  return `ingredient-category-${id}`;
}

function techniqueNodeId(id: string) {
  return `technique-${id}`;
}

function techniqueCategoryNodeId(id: string) {
  return `technique-category-${id}`;
}

function methodNodeId(id: string) {
  return `method-${id}`;
}

function difficultyNodeId(id: string) {
  return `difficulty-${id}`;
}

function creatorNodeId(id: string) {
  return `creator-${id}`;
}

function cuisineNode(cuisine: Cuisine, categories: Category[]): KnowledgeGraphNode {
  const categoryCount = categories.filter((category) => category.cuisineId === cuisine.id && !category.parentCategoryId).length;
  return {
    id: cuisineNodeId(cuisine.id),
    label: cuisine.displayName,
    kind: "cuisine",
    href: `/graph?mode=dish&focus=${cuisine.slug}`,
    description: cuisine.description,
    meta: `${categoryCount} categories`,
    tags: cuisine.regionGroup ? [cuisine.regionGroup] : [],
    canonical: true
  };
}

function categoryNode(category: Category, categories: Category[], families: Array<{ categoryId?: string }>): KnowledgeGraphNode {
  const childCategoryCount = categories.filter((candidate) => candidate.parentCategoryId === category.id).length;
  const familyCount = families.filter((family) => family.categoryId === category.id).length;
  const childSummary = [
    childCategoryCount ? `${childCategoryCount} subcategories` : undefined,
    familyCount ? `${familyCount} dish families` : undefined
  ].filter(Boolean);

  return {
    id: categoryNodeId(category.id),
    label: category.displayName,
    kind: "category",
    href: `/graph?mode=dish&focus=${category.slug}`,
    description: category.description,
    meta: childSummary.join(" · ") || "Category",
    canonical: true,
    cuisineId: category.cuisineId,
    categoryId: category.id,
    parentCategoryId: category.parentCategoryId,
    tags: category.parentCategoryId ? ["Subcategory"] : ["Category"]
  };
}

function ingredientCategoryNode(
  category: IngredientCategory,
  categories: IngredientCategory[],
  ingredients: Ingredient[]
): KnowledgeGraphNode {
  const childCategoryCount = categories.filter((candidate) => candidate.parentCategoryId === category.id).length;
  const ingredientCount = ingredients.filter((ingredient) => resolveIngredientCategoryId(ingredient) === category.id).length;
  const childSummary = [
    childCategoryCount ? `${childCategoryCount} subcategories` : undefined,
    ingredientCount ? `${ingredientCount} ingredients` : undefined
  ].filter(Boolean);

  return {
    id: ingredientCategoryNodeId(category.id),
    label: category.displayName,
    kind: "ingredientCategory",
    href: `/graph?mode=ingredient&focus=${category.slug}`,
    description: category.description,
    meta: childSummary.join(" · ") || "Ingredient category",
    canonical: true,
    taxonomyId: category.id,
    parentTaxonomyId: category.parentCategoryId,
    tags: category.parentCategoryId ? ["Ingredient subcategory"] : ["Ingredient category"]
  };
}

function techniqueCategoryNode(
  category: TechniqueCategory,
  categories: TechniqueCategory[],
  techniques: Technique[]
): KnowledgeGraphNode {
  const childCategoryCount = categories.filter((candidate) => candidate.parentCategoryId === category.id).length;
  const techniqueCount = techniques.filter((technique) => resolveTechniqueCategoryId(technique) === category.id).length;
  const childSummary = [
    childCategoryCount ? `${childCategoryCount} subcategories` : undefined,
    techniqueCount ? `${techniqueCount} techniques` : undefined
  ].filter(Boolean);

  return {
    id: techniqueCategoryNodeId(category.id),
    label: category.displayName,
    kind: "techniqueCategory",
    href: `/graph?mode=technique&focus=${category.slug}`,
    description: category.description,
    meta: childSummary.join(" · ") || "Technique category",
    canonical: true,
    taxonomyId: category.id,
    parentTaxonomyId: category.parentCategoryId,
    tags: category.parentCategoryId ? ["Technique subcategory"] : ["Technique category"]
  };
}

function methodNode(method: CookingMethod, relationships: DishFamilyMethod[]): KnowledgeGraphNode {
  const dishCount = relationships.filter((relationship) => relationship.cookingMethodId === method.id).length;
  return {
    id: methodNodeId(method.id),
    label: method.displayName,
    kind: "method",
    href: `/graph?mode=method&focus=${method.slug}`,
    description: method.description,
    meta: `${dishCount} dish families`,
    canonical: true
  };
}

function difficultyNode(difficulty: DifficultyBand, families: Array<{ difficultyBandId?: string }>): KnowledgeGraphNode {
  const dishCount = families.filter((family) => family.difficultyBandId === difficulty.id).length;
  return {
    id: difficultyNodeId(difficulty.id),
    label: difficulty.displayName,
    kind: "difficulty",
    href: `/graph?mode=difficulty&focus=${difficulty.slug}`,
    description: difficulty.description,
    meta: `${dishCount} dish families`,
    canonical: true
  };
}

function creatorNode(creator: Creator): KnowledgeGraphNode {
  return {
    id: creatorNodeId(creator.id),
    label: creator.displayName,
    kind: "creator",
    href: `/creators/${creator.slug}`,
    description: creator.shortBio,
    meta: creator.region ?? creator.creatorCategory,
    tags: [creator.creatorCategory, ...(creator.cuisineLinks ?? []).slice(0, 2)].filter(Boolean),
    canonical: true
  };
}

function ingredientNode(
  ingredient: Ingredient,
  relationships: DishFamilyIngredient[],
  categories: Map<string, IngredientCategory>
): KnowledgeGraphNode {
  const dishCount = relationships.filter((relationship) => relationship.ingredientId === ingredient.id).length;
  const categoryId = resolveIngredientCategoryId(ingredient);
  const category = categoryId ? categories.get(categoryId) : undefined;
  return {
    id: ingredientNodeId(ingredient.id),
    label: ingredient.displayName,
    kind: "ingredient",
    href: `/ingredients/${slugify(ingredient.canonicalName)}`,
    description: ingredient.aliases.length ? `Also recognized as ${ingredient.aliases.join(", ")}.` : undefined,
    meta: category ? `${category.displayName} ingredient` : `${dishCount} dish families`,
    tags: [category?.displayName ?? ingredient.category, `${dishCount} dishes`].filter(Boolean) as string[],
    category: ingredient.category,
    categoryId,
    canonical: true
  };
}

function techniqueNode(
  technique: Technique,
  relationships: DishFamilyTechnique[],
  categories: Map<string, TechniqueCategory>
): KnowledgeGraphNode {
  const dishCount = relationships.filter((relationship) => relationship.techniqueId === technique.id).length;
  const categoryId = resolveTechniqueCategoryId(technique);
  const category = categoryId ? categories.get(categoryId) : undefined;
  return {
    id: techniqueNodeId(technique.id),
    label: technique.displayName,
    kind: "technique",
    href: `/techniques/${slugify(technique.canonicalName)}`,
    description: technique.description,
    meta: category ? `${category.displayName} technique` : `${dishCount} dish families`,
    tags: [category?.displayName ?? technique.techniqueGroup, `${dishCount} dishes`].filter(Boolean) as string[],
    category: technique.techniqueGroup,
    categoryId,
    canonical: true
  };
}

function familyMeta(sourceRecipeCount: number, variationCount: number, totalCount: number) {
  if (!totalCount) return "Skeleton dish family";
  return [
    sourceRecipeCount ? `${sourceRecipeCount} recipe${sourceRecipeCount === 1 ? "" : "s"}` : undefined,
    variationCount ? `${variationCount} variation${variationCount === 1 ? "" : "s"}` : undefined
  ]
    .filter(Boolean)
    .join(" · ");
}

function isReferencedIngredient(
  ingredientId: string,
  dishFamilyIngredients: DishFamilyIngredient[],
  recipeIngredients: Array<{ ingredientId: string }>
) {
  return (
    dishFamilyIngredients.some((relationship) => relationship.ingredientId === ingredientId) ||
    recipeIngredients.some((relationship) => relationship.ingredientId === ingredientId)
  );
}

function isReferencedTechnique(
  techniqueId: string,
  dishFamilyTechniques: DishFamilyTechnique[],
  recipeTechniques: Array<{ techniqueId: string }>
) {
  return (
    dishFamilyTechniques.some((relationship) => relationship.techniqueId === techniqueId) ||
    recipeTechniques.some((relationship) => relationship.techniqueId === techniqueId)
  );
}

const ingredientCategoryIdsByLabel: Record<string, string> = {
  protein: "ingcat-protein",
  legume: "ingcat-legume",
  vegetable: "ingcat-vegetable",
  grain: "ingcat-grain",
  aromatic: "ingcat-aromatic",
  spice: "ingcat-spice",
  herb: "ingcat-herb",
  dairy: "ingcat-dairy",
  fat: "ingcat-fat",
  acid: "ingcat-acid",
  sauce: "ingcat-sauce",
  fruit: "ingcat-fruit",
  sweetener: "ingcat-sweetener",
  nut: "ingcat-nut"
};

function resolveIngredientCategoryId(ingredient: Pick<Ingredient, "category" | "categoryId">) {
  if (ingredient.categoryId) return ingredient.categoryId;
  return ingredient.category ? ingredientCategoryIdsByLabel[ingredient.category] : undefined;
}

const techniqueCategoryIdsByLabel: Record<string, string> = {
  heat: "techcat-heat",
  prep: "techcat-prep",
  "sauce-building": "techcat-sauce-building",
  preservation: "techcat-preservation",
  assembly: "techcat-assembly",
  finishing: "techcat-finishing"
};

function resolveTechniqueCategoryId(technique: Pick<Technique, "techniqueGroup" | "techniqueGroupId">) {
  if (technique.techniqueGroupId) return technique.techniqueGroupId;
  return technique.techniqueGroup ? techniqueCategoryIdsByLabel[technique.techniqueGroup] : undefined;
}

function resolveFamilyCategoryId(
  family: { category?: string; categoryId?: string; primaryCategoryId?: string; cuisineId?: string; primaryCuisineId?: string },
  categories: Category[]
) {
  if (family.primaryCategoryId) return family.primaryCategoryId;
  if (family.categoryId) return family.categoryId;
  if (family.category) {
    const explicitMatch = categories.find((category) => category.slug === family.category);
    if (explicitMatch) return explicitMatch.id;
  }
  const cuisineId = family.primaryCuisineId ?? family.cuisineId;
  if (family.category === "pasta") {
    return cuisineId === "cui-american" ? "cat-american-pasta-casseroles" : "cat-italian-pasta";
  }
  if (family.category === "chili") {
    return cuisineId === "cui-mexican" ? "cat-mexican-stews-braises" : "cat-american-stews";
  }
  return categories.find((category) => category.cuisineId === cuisineId && !category.parentCategoryId)?.id;
}

export function buildFamilyGraph(data: SeedData, familyId?: string) {
  const scopedRecipes = familyId ? data.recipes.filter((recipe) => recipe.recipeFamilyId === familyId) : data.recipes;
  const scopedRecipeIds = new Set(scopedRecipes.map((recipe) => recipe.id));
  const nodes: KnowledgeGraphNode[] = [];
  const edges: KnowledgeGraphEdge[] = [];

  scopedRecipes.forEach((recipe) => {
    nodes.push({
      id: recipe.id,
      label: recipe.title,
      kind: recipe.isUserVariation ? "variation" : "recipe",
      href: `/recipes/${recipe.slug}`
    });

    if (recipe.parentRecipeId && scopedRecipeIds.has(recipe.parentRecipeId)) {
      edges.push({
        id: `edge-${recipe.id}-${recipe.parentRecipeId}`,
        source: recipe.parentRecipeId,
        target: recipe.id,
        label: "variation"
      });
    }
  });

  const familyIds = new Set(scopedRecipes.map((recipe) => recipe.recipeFamilyId));
  data.families
    .filter((family) => familyIds.has(family.id))
    .forEach((family) => {
      nodes.push({
        id: family.id,
        label: family.displayName,
        kind: "family",
        href: `/families/${family.slug}`
      });
      scopedRecipes
        .filter((recipe) => recipe.recipeFamilyId === family.id)
        .forEach((recipe) => {
          edges.push({
            id: `edge-${family.id}-${recipe.id}`,
            source: family.id,
            target: recipe.id,
            label: "family"
          });
        });
    });

  data.recipeIngredients
    .filter((item) => scopedRecipeIds.has(item.recipeId))
    .slice(0, 60)
    .forEach((item) => {
      const ingredient = data.ingredients.find((candidate) => candidate.id === item.ingredientId);
      if (!ingredient) return;
      const nodeId = `ingredient-${ingredient.id}`;
      if (!nodes.some((node) => node.id === nodeId)) {
        nodes.push({
          id: nodeId,
          label: ingredient.displayName,
          kind: "ingredient",
          href: `/ingredients/${slugify(ingredient.canonicalName)}`
        });
      }
      edges.push({
        id: `edge-${item.recipeId}-${nodeId}`,
        source: item.recipeId,
        target: nodeId,
        label: "uses"
      });
    });

  data.recipeTechniques
    .filter((item) => scopedRecipeIds.has(item.recipeId))
    .forEach((item) => {
      const technique = data.techniques.find((candidate) => candidate.id === item.techniqueId);
      if (!technique) return;
      const nodeId = `technique-${technique.id}`;
      if (!nodes.some((node) => node.id === nodeId)) {
        nodes.push({
          id: nodeId,
          label: technique.displayName,
          kind: "technique",
          href: `/techniques/${slugify(technique.canonicalName)}`
        });
      }
      edges.push({
        id: `edge-${item.recipeId}-${nodeId}`,
        source: item.recipeId,
        target: nodeId,
        label: "technique"
      });
    });

  return { nodes, edges };
}
