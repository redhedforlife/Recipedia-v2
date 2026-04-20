export type RankingSignals = {
  priorityScore?: number;
  editorialRank?: number;
  isFeatured?: boolean;
  launchPriority?: number;
};

export type Source = {
  id: string;
  siteName: string;
  sourceUrl: string;
  authorName: string;
  licenseNote: string;
  importedAt: string;
  extractionMethod: string;
  extractionConfidence: number;
};

export type RecipeFamily = RankingSignals & {
  id: string;
  slug: string;
  displayName: string;
  category: string;
  categoryId?: string;
  primaryCategoryId?: string;
  secondaryCategoryIds?: string[];
  cuisine: string;
  description: string;
  cuisineId?: string;
  primaryCuisineId?: string;
  difficultyBandId?: string;
  primaryMethodId?: string;
  ingredientIds?: string[];
  techniqueIds?: string[];
  isCanonical?: boolean;
};

export type Ingredient = RankingSignals & {
  id: string;
  canonicalName: string;
  displayName: string;
  category?: string;
  categoryId?: string;
  aliases: string[];
};

export type Technique = RankingSignals & {
  id: string;
  canonicalName: string;
  displayName: string;
  description: string;
  techniqueGroup?: string;
  techniqueGroupId?: string;
};

export type Cuisine = RankingSignals & {
  id: string;
  slug: string;
  displayName: string;
  description: string;
  regionGroup?: string;
};

export type CookingMethod = RankingSignals & {
  id: string;
  slug: string;
  displayName: string;
  description: string;
};

export type DifficultyBand = RankingSignals & {
  id: string;
  slug: string;
  displayName: string;
  description: string;
  sortOrder: number;
};

export type Category = RankingSignals & {
  id: string;
  slug: string;
  displayName: string;
  description: string;
  cuisineId?: string;
  parentCategoryId?: string;
  sortOrder: number;
};

export type IngredientCategory = {
  id: string;
  slug: string;
  displayName: string;
  description: string;
  parentCategoryId?: string;
  sortOrder: number;
};

export type TechniqueCategory = {
  id: string;
  slug: string;
  displayName: string;
  description: string;
  parentCategoryId?: string;
  sortOrder: number;
};

export type CuisineDishFamily = {
  cuisineId: string;
  dishFamilyId: string;
  relationshipStrength: number;
};

export type DishFamilyIngredient = {
  dishFamilyId: string;
  ingredientId: string;
  importanceScore: number;
};

export type DishFamilyTechnique = {
  dishFamilyId: string;
  techniqueId: string;
  importanceScore: number;
};

export type DishFamilyMethod = {
  dishFamilyId: string;
  cookingMethodId: string;
  importanceScore: number;
};

export type DishFamilyRelationshipType =
  | "related_to"
  | "variation_of"
  | "often_compared_with"
  | "same_family_as"
  | "regional_cousin_of";

export type DishFamilyRelatedDishFamily = {
  fromDishFamilyId: string;
  toDishFamilyId: string;
  relationshipType: DishFamilyRelationshipType;
};

export type RecipeIngredient = {
  id: string;
  recipeId: string;
  ingredientId: string;
  rawText: string;
  quantity?: string;
  unit?: string;
  preparationNote?: string;
  sortOrder: number;
};

export type RecipeStep = {
  id: string;
  recipeId: string;
  stepNumber: number;
  instructionText: string;
};

export type RecipeChangeType =
  | "add_ingredient"
  | "remove_ingredient"
  | "change_quantity"
  | "substitute_ingredient"
  | "edit_step"
  | "change_time"
  | "change_title"
  | "change_technique";

export type RecipeChange = {
  id: string;
  recipeId: string;
  parentRecipeId: string;
  changeType: RecipeChangeType;
  fieldName: string;
  beforeValue?: string;
  afterValue?: string;
  note?: string;
};

export type CookReport = {
  id: string;
  recipeId: string;
  userId: string;
  madeIt: boolean;
  rating: number;
  wouldMakeAgain: boolean;
  difficultyRating: number;
  notes: string;
  createdAt: string;
};

export type RecipeRelationshipType =
  | "variation_of"
  | "inspired_by"
  | "similar_to"
  | "sibling_of";

export type RecipeRelationship = {
  id: string;
  fromRecipeId: string;
  toRecipeId: string;
  relationshipType: RecipeRelationshipType;
};

export type Recipe = RankingSignals & {
  id: string;
  slug: string;
  recipeFamilyId: string;
  sourceId?: string;
  parentRecipeId?: string;
  createdByUserId?: string;
  title: string;
  description: string;
  serves: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  totalTimeMinutes?: number;
  imageUrl?: string;
  isSourceRecipe: boolean;
  isUserVariation: boolean;
  variationKind?: "canonical" | "personal";
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreatorCategory =
  | "chef"
  | "pitmaster"
  | "tv personality"
  | "digital creator"
  | "writer / educator";

export type Creator = RankingSignals & {
  id: string;
  slug: string;
  displayName: string;
  type: "creator";
  shortBio: string;
  region?: string;
  cuisineLinks: string[];
  familyLinks: string[];
  dishLinks: string[];
  techniqueLinks: string[];
  sourceLinks: string[];
  popularityScore?: number;
  imageUrl?: string;
  creatorCategory: CreatorCategory;
};

export type ExploreDimension =
  | "all"
  | "categories"
  | "families"
  | "dishes"
  | "techniques"
  | "ingredients"
  | "methods"
  | "creators"
  | "recipes";

export type ExploreEntityType = "cuisine" | "category" | "family" | "dish" | "technique" | "ingredient" | "method" | "creator" | "recipe";

export type ExploreItem = {
  nodeId: string;
  label: string;
  entityType: ExploreEntityType;
  rankScore: number;
  href?: string;
  description?: string;
  eyebrow?: string;
  meta?: string;
  tags?: string[];
};

export type ExploreSection = {
  id: Exclude<ExploreDimension, "all">;
  title: string;
  entityType: ExploreEntityType;
  description: string;
  items: ExploreItem[];
  defaultVisibleCount: number;
  showMoreEnabled: boolean;
};

export type ExploreStat = {
  label: string;
  value: string;
};

export type ExploreProfile = {
  nodeId: string;
  nodeType: GraphNodeKind;
  title: string;
  eyebrow: string;
  description: string;
  stats: ExploreStat[];
  highlights: string[];
  sections: ExploreSection[];
  graphHref: string;
};

export type SeedData = {
  cuisines: Cuisine[];
  categories: Category[];
  ingredientCategories: IngredientCategory[];
  techniqueCategories: TechniqueCategory[];
  cookingMethods: CookingMethod[];
  difficultyBands: DifficultyBand[];
  sources: Source[];
  creators: Creator[];
  families: RecipeFamily[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  techniques: Technique[];
  cuisineDishFamilies: CuisineDishFamily[];
  dishFamilyIngredients: DishFamilyIngredient[];
  dishFamilyTechniques: DishFamilyTechnique[];
  dishFamilyMethods: DishFamilyMethod[];
  dishFamilyRelatedDishFamilies: DishFamilyRelatedDishFamily[];
  recipeIngredients: RecipeIngredient[];
  steps: RecipeStep[];
  recipeTechniques: Array<{ recipeId: string; techniqueId: string }>;
  changes: RecipeChange[];
  cookReports: CookReport[];
  relationships: RecipeRelationship[];
};

export type RecipeWithDetails = Recipe & {
  family: RecipeFamily;
  source?: Source;
  ingredients: Array<RecipeIngredient & { ingredient: Ingredient }>;
  steps: RecipeStep[];
  techniques: Technique[];
  changes: RecipeChange[];
  parent?: Recipe;
  children: Recipe[];
  cookReports: CookReport[];
};

export type GraphNodeKind =
  | "cuisine"
  | "category"
  | "family"
  | "creator"
  | "recipe"
  | "variation"
  | "ingredientCategory"
  | "ingredient"
  | "techniqueCategory"
  | "technique"
  | "method"
  | "difficulty";

export type GraphMode =
  | "explore"
  | "cuisine"
  | "dish"
  | "ingredient"
  | "technique"
  | "difficulty"
  | "method";

export type KnowledgeGraphNode = {
  id: string;
  label: string;
  kind: GraphNodeKind;
  href: string;
  description?: string;
  meta?: string;
  tags?: string[];
  canonical?: boolean;
  cuisineId?: string;
  categoryId?: string;
  taxonomyId?: string;
  parentTaxonomyId?: string;
  parentCategoryId?: string;
  difficultyBandId?: string;
  primaryMethodId?: string;
  category?: string;
};

export type KnowledgeGraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  kind?: string;
  strength?: number;
};
