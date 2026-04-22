import type { GraphNodeKind, KnowledgeGraphEdge, KnowledgeGraphNode, SeedData } from "@/lib/types";
import { prisma } from "@/lib/db";

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

const graphKinds = new Set<GraphNodeKind>([
  "cuisine",
  "category",
  "family",
  "creator",
  "recipe",
  "variation",
  "ingredientCategory",
  "ingredient",
  "techniqueCategory",
  "technique",
  "method",
  "difficulty",
  "dish"
]);

export async function loadSeedDataFromDatabase(): Promise<SeedData> {
  const [
    cuisines,
    categories,
    ingredientCategories,
    techniqueCategories,
    cookingMethods,
    difficultyBands,
    sources,
    families,
    recipes,
    ingredients,
    techniques,
    cuisineDishFamilies,
    dishFamilyIngredients,
    dishFamilyTechniques,
    dishFamilyMethods,
    dishFamilyRelatedDishFamilies,
    recipeIngredients,
    steps,
    recipeTechniques,
    changes,
    cookReports,
    relationships
  ] = await prisma.$transaction([
    prisma.cuisine.findMany({ orderBy: { displayName: "asc" } }),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { displayName: "asc" }] }),
    prisma.ingredientCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { displayName: "asc" }] }),
    prisma.techniqueCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { displayName: "asc" }] }),
    prisma.cookingMethod.findMany({ orderBy: { displayName: "asc" } }),
    prisma.difficultyBand.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.source.findMany({ orderBy: { importedAt: "desc" } }),
    prisma.recipeFamily.findMany({ orderBy: { displayName: "asc" } }),
    prisma.recipe.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.ingredient.findMany({ orderBy: { displayName: "asc" } }),
    prisma.technique.findMany({ orderBy: { displayName: "asc" } }),
    prisma.cuisineDishFamily.findMany(),
    prisma.dishFamilyIngredient.findMany(),
    prisma.dishFamilyTechnique.findMany(),
    prisma.dishFamilyMethod.findMany(),
    prisma.dishFamilyRelatedDishFamily.findMany(),
    prisma.recipeIngredient.findMany({ orderBy: [{ recipeId: "asc" }, { sortOrder: "asc" }] }),
    prisma.recipeStep.findMany({ orderBy: [{ recipeId: "asc" }, { stepNumber: "asc" }] }),
    prisma.recipeTechnique.findMany(),
    prisma.recipeChange.findMany(),
    prisma.cookReport.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.recipeRelationship.findMany()
  ]);

  if (
    cuisines.length === 0 &&
    categories.length === 0 &&
    families.length === 0 &&
    recipes.length === 0 &&
    ingredients.length === 0
  ) {
    return emptySeedData();
  }

  return {
    cuisines: cuisines.map((cuisine) => ({
      id: cuisine.id,
      slug: cuisine.slug,
      displayName: cuisine.displayName,
      description: cuisine.description,
      regionGroup: cuisine.regionGroup ?? undefined
    })),
    categories: categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      displayName: category.displayName,
      description: category.description,
      cuisineId: category.cuisineId ?? undefined,
      parentCategoryId: category.parentCategoryId ?? undefined,
      sortOrder: category.sortOrder
    })),
    ingredientCategories: ingredientCategories.map((category) => ({
      id: category.id,
      slug: category.slug,
      displayName: category.displayName,
      description: category.description,
      parentCategoryId: category.parentCategoryId ?? undefined,
      sortOrder: category.sortOrder
    })),
    techniqueCategories: techniqueCategories.map((category) => ({
      id: category.id,
      slug: category.slug,
      displayName: category.displayName,
      description: category.description,
      parentCategoryId: category.parentCategoryId ?? undefined,
      sortOrder: category.sortOrder
    })),
    cookingMethods: cookingMethods.map((method) => ({
      id: method.id,
      slug: method.slug,
      displayName: method.displayName,
      description: method.description
    })),
    difficultyBands: difficultyBands.map((difficulty) => ({
      id: difficulty.id,
      slug: difficulty.slug,
      displayName: difficulty.displayName,
      description: difficulty.description,
      sortOrder: difficulty.sortOrder
    })),
    sources: sources.map((source) => ({
      id: source.id,
      siteName: source.siteName,
      sourceUrl: source.sourceUrl,
      authorName: source.authorName,
      licenseNote: source.licenseNote,
      importedAt: source.importedAt.toISOString(),
      extractionMethod: source.extractionMethod,
      extractionConfidence: source.extractionConfidence
    })),
    creators: [],
    families: families.map((family) => ({
      id: family.id,
      slug: family.slug,
      displayName: family.displayName,
      category: family.category,
      categoryId: family.categoryId ?? undefined,
      cuisine: family.cuisine ?? "",
      description: family.description,
      cuisineId: family.cuisineId ?? undefined,
      difficultyBandId: family.difficultyBandId ?? undefined,
      primaryMethodId: family.primaryMethodId ?? undefined,
      isCanonical: family.isCanonical
    })),
    recipes: recipes.map((recipe) => ({
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
      variationKind: recipe.isUserVariation ? "personal" : undefined,
      tags: [],
      createdAt: recipe.createdAt.toISOString(),
      updatedAt: recipe.updatedAt.toISOString()
    })),
    ingredients: ingredients.map((ingredient) => ({
      id: ingredient.id,
      canonicalName: ingredient.canonicalName,
      displayName: ingredient.displayName,
      category: ingredient.category ?? undefined,
      categoryId: ingredient.categoryId ?? undefined,
      aliases: jsonStringArray(ingredient.aliases)
    })),
    techniques: techniques.map((technique) => ({
      id: technique.id,
      canonicalName: technique.canonicalName,
      displayName: technique.displayName,
      description: technique.description,
      techniqueGroup: technique.techniqueGroup ?? undefined,
      techniqueGroupId: technique.techniqueGroupId ?? undefined
    })),
    cuisineDishFamilies: cuisineDishFamilies.map((row) => ({
      cuisineId: row.cuisineId,
      dishFamilyId: row.dishFamilyId,
      relationshipStrength: row.relationshipStrength
    })),
    dishFamilyIngredients: dishFamilyIngredients.map((row) => ({
      dishFamilyId: row.dishFamilyId,
      ingredientId: row.ingredientId,
      importanceScore: row.importanceScore
    })),
    dishFamilyTechniques: dishFamilyTechniques.map((row) => ({
      dishFamilyId: row.dishFamilyId,
      techniqueId: row.techniqueId,
      importanceScore: row.importanceScore
    })),
    dishFamilyMethods: dishFamilyMethods.map((row) => ({
      dishFamilyId: row.dishFamilyId,
      cookingMethodId: row.cookingMethodId,
      importanceScore: row.importanceScore
    })),
    dishFamilyRelatedDishFamilies: dishFamilyRelatedDishFamilies.map((row) => ({
      fromDishFamilyId: row.fromDishFamilyId,
      toDishFamilyId: row.toDishFamilyId,
      relationshipType: row.relationshipType as
        | "related_to"
        | "variation_of"
        | "often_compared_with"
        | "same_family_as"
        | "regional_cousin_of"
    })),
    recipeIngredients: recipeIngredients.map((row) => ({
      id: row.id,
      recipeId: row.recipeId,
      ingredientId: row.ingredientId,
      rawText: row.rawText,
      quantity: row.quantity ?? undefined,
      unit: row.unit ?? undefined,
      preparationNote: row.preparationNote ?? undefined,
      sortOrder: row.sortOrder
    })),
    steps: steps.map((step) => ({
      id: step.id,
      recipeId: step.recipeId,
      stepNumber: step.stepNumber,
      instructionText: step.instructionText
    })),
    recipeTechniques: recipeTechniques.map((row) => ({
      recipeId: row.recipeId,
      techniqueId: row.techniqueId
    })),
    changes: changes.map((change) => ({
      id: change.id,
      recipeId: change.recipeId,
      parentRecipeId: change.parentRecipeId,
      changeType: change.changeType as
        | "add_ingredient"
        | "remove_ingredient"
        | "change_quantity"
        | "substitute_ingredient"
        | "edit_step"
        | "change_time"
        | "change_title"
        | "change_technique",
      fieldName: change.fieldName,
      beforeValue: change.beforeValue ?? undefined,
      afterValue: change.afterValue ?? undefined,
      note: change.note ?? undefined
    })),
    cookReports: cookReports.map((report) => ({
      id: report.id,
      recipeId: report.recipeId,
      userId: report.userId,
      madeIt: report.madeIt,
      rating: report.rating,
      wouldMakeAgain: report.wouldMakeAgain,
      difficultyRating: report.difficultyRating,
      notes: report.notes,
      createdAt: report.createdAt.toISOString()
    })),
    relationships: relationships.map((relationship) => ({
      id: relationship.id,
      fromRecipeId: relationship.fromRecipeId,
      toRecipeId: relationship.toRecipeId,
      relationshipType: relationship.relationshipType as "variation_of" | "inspired_by" | "similar_to" | "sibling_of"
    }))
  };
}

export async function loadGraphFromDatabase(): Promise<{ nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] }> {
  const [nodes, edges] = await prisma.$transaction([
    prisma.graphNode.findMany({ orderBy: [{ kind: "asc" }, { label: "asc" }] }),
    prisma.graphEdge.findMany({ orderBy: { id: "asc" } })
  ]);

  return {
    nodes: nodes
      .filter((row): row is typeof row & { kind: GraphNodeKind } => graphKinds.has(row.kind as GraphNodeKind))
      .map((row) => ({
        id: row.id,
        label: row.label,
        kind: row.kind,
        href: row.href,
        description: row.description ?? undefined,
        meta: row.meta ?? undefined,
        tags: row.tags ? jsonStringArray(row.tags) : undefined,
        canonical: row.canonical,
        cuisineId: row.cuisineId ?? undefined,
        categoryId: row.categoryId ?? undefined,
        taxonomyId: row.taxonomyId ?? undefined,
        parentTaxonomyId: row.parentTaxonomyId ?? undefined,
        parentCategoryId: row.parentCategoryId ?? undefined,
        difficultyBandId: row.difficultyBandId ?? undefined,
        primaryMethodId: row.primaryMethodId ?? undefined,
        category: row.category ?? undefined
      })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      kind: edge.kind ?? undefined,
      strength: edge.strength ?? undefined
    }))
  };
}

function jsonStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}
