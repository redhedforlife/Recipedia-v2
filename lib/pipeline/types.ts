export type CoverageStatus =
  | "taxonomy_only"
  | "ingredients_only"
  | "has_recipe"
  | "multi_recipe"
  | "reviewed";

export type IngredientRole = "canonical" | "optional" | "variant";

export type SourceType =
  | "wikidata"
  | "wikipedia"
  | "dbpedia"
  | "mealdb"
  | "seed"
  | "taxonomy_list"
  | "derived";

export type SourceRef = {
  sourceName: string;
  sourceType: SourceType;
  externalId?: string;
  url?: string;
  licenseNotes?: string;
  importedAt: string;
  transforms?: string[];
};

export type RecipeIngredient = {
  rawText: string;
  ingredientId?: string;
  ingredientName?: string;
  quantityText?: string;
  normalizedConfidence: number;
};

export type DishIngredientProfile = {
  dishId: string;
  ingredientId: string;
  role: IngredientRole;
  frequency: number;
  confidenceScore: number;
  sourceRecipeCount: number;
};

export type Dish = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cuisineId?: string;
  categoryId?: string;
  familyId?: string;
  aliases: string[];
  canonicalIngredients: DishIngredientProfile[];
  optionalCommonIngredients: DishIngredientProfile[];
  techniques: string[];
  sourceRefs: SourceRef[];
  confidenceScore: number;
  recipeCount: number;
  coverageStatus: CoverageStatus;
  reviewedAt?: string;
  reviewedBy?: string;
};

export type Recipe = {
  id: string;
  dishId: string;
  title: string;
  variantName?: string;
  sourceUrl?: string;
  sourceName: string;
  sourceType: SourceType;
  ingredients: RecipeIngredient[];
  instructions: string[];
  yieldText?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  totalTimeMinutes?: number;
  confidenceScore: number;
  isCanonicalCandidate: boolean;
  sourceRefs: SourceRef[];
};

export type Ingredient = {
  id: string;
  name: string;
  slug: string;
  aliases: string[];
  normalizedFrom: string[];
  category?: string;
};

export type RawRecipeRecord = {
  id: string;
  sourceName: string;
  sourceType: SourceType;
  sourceId?: string;
  title: string;
  rawIngredientStrings: string[];
  rawInstructions: string[];
  rawCuisine?: string;
  rawCategory?: string;
  url?: string;
  dishHint?: string;
  importedAt: string;
  provenance: Record<string, string | number | boolean | undefined>;
};

export type NormalizedRecipeRecord = {
  id: string;
  title: string;
  normalizedTitle: string;
  titleTokens: string[];
  sourceName: string;
  sourceType: SourceType;
  sourceId?: string;
  url?: string;
  ingredientItems: RecipeIngredient[];
  normalizedIngredientIds: string[];
  normalizedInstructionTokens: string[];
  rawCuisine?: string;
  rawCategory?: string;
  dishHint?: string;
  importedAt: string;
  sourceQualityScore: number;
  provenance: Record<string, string | number | boolean | undefined>;
};

export type DedupeCluster = {
  clusterId: string;
  canonicalRecipeId: string;
  duplicateRecipeIds: string[];
  confidenceScore: number;
  evidence: {
    titleSimilarity: number;
    ingredientOverlap: number;
    instructionSimilarity: number;
  };
};

export type RecipeDishMapping = {
  recipeId: string;
  dishId: string;
  dishName: string;
  mappingMethod: "exact_alias" | "fuzzy_alias" | "dish_hint" | "created_from_title";
  titleMatchStrength: number;
  aliasMatchStrength: number;
  ingredientOverlapScore: number;
  sourceQualityScore: number;
  confidenceScore: number;
};

export type ReviewQueueItem = {
  id: string;
  itemType: "mapping" | "ingredient" | "dedupe" | "dish_profile" | "taxonomy";
  itemId: string;
  issueType:
    | "low_confidence_mapping"
    | "conflicting_profile"
    | "likely_bad_duplicate"
    | "poor_ingredient_normalization"
    | "unclear_assignment";
  summary: string;
  candidateResolutions: string[];
  confidenceScore: number;
  sourceExamples: string[];
  createdAt: string;
};

export type CoverageStats = {
  cuisineId: string;
  cuisineName: string;
  totalDishes: number;
  dishesWithCanonicalIngredients: number;
  dishesWithOneOrMoreRecipes: number;
  dishesWithThreeOrMoreRecipes: number;
  reviewedDishes: number;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    totalDishes: number;
    withCanonicalIngredients: number;
    withOneOrMoreRecipes: number;
    withThreeOrMoreRecipes: number;
    reviewed: number;
  }>;
};

export type PipelineThresholds = {
  canonicalMinFrequency: number;
  optionalMinFrequency: number;
  optionalMaxFrequency: number;
  publishMinConfidence: number;
  reviewQueueMaxConfidence: number;
  minRecipesForFrequencyProfiles: number;
};

export type PipelineOutputs = {
  dishes: Dish[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  reviewQueue: ReviewQueueItem[];
  coverage: CoverageStats;
};
