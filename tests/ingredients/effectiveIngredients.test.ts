import test from "node:test";
import assert from "node:assert/strict";
import {
  buildIngredientFilterIndex,
  categoryMatchesIngredient,
  familyMatchesIngredient,
  explainFamilyIngredientMatch
} from "@/lib/ingredients/effectiveIngredients";
import { getData } from "@/lib/data";
import type { SeedData } from "@/lib/types";

function minimalSeedData(overrides?: Partial<SeedData>): SeedData {
  return {
    cuisines: [{ id: "cui-1", slug: "american", displayName: "American", description: "", regionGroup: "" }],
    categories: [{ id: "cat-1", slug: "sandwiches", displayName: "Sandwiches", description: "", cuisineId: "cui-1", sortOrder: 0 }],
    ingredientCategories: [],
    techniqueCategories: [],
    cookingMethods: [],
    difficultyBands: [],
    sources: [],
    creators: [],
    families: [
      {
        id: "fam-1",
        slug: "test-family",
        displayName: "Test Family",
        category: "sandwiches",
        categoryId: "cat-1",
        primaryCategoryId: "cat-1",
        secondaryCategoryIds: [],
        cuisine: "American",
        cuisineId: "cui-1",
        primaryCuisineId: "cui-1",
        description: "",
        isCanonical: true
      }
    ],
    recipes: [
      {
        id: "dish-1",
        slug: "test-dish",
        recipeFamilyId: "fam-1",
        title: "Test Dish",
        description: "",
        serves: "2",
        isSourceRecipe: true,
        isUserVariation: false,
        tags: [],
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01"
      },
      {
        id: "var-1",
        slug: "test-dish-variation",
        recipeFamilyId: "fam-1",
        parentRecipeId: "dish-1",
        title: "Test Dish Variation",
        description: "",
        serves: "2",
        isSourceRecipe: false,
        isUserVariation: true,
        variationKind: "canonical",
        tags: [],
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01"
      }
    ],
    ingredients: [
      { id: "ing-beef", canonicalName: "beef", displayName: "Beef", aliases: [] },
      { id: "ing-cheese", canonicalName: "cheese", displayName: "Cheese", aliases: [] }
    ],
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
    relationships: [],
    ...overrides
  };
}

test("family matches ingredient through direct family ingredient", () => {
  const data = minimalSeedData({
    dishFamilyIngredients: [{ dishFamilyId: "fam-1", ingredientId: "ing-beef", importanceScore: 1 }]
  });

  assert.equal(familyMatchesIngredient("fam-1", "beef", data), true);
});

test("family matches ingredient through descendant dish ingredient", () => {
  const data = minimalSeedData({
    recipeIngredients: [{ id: "ri-1", recipeId: "dish-1", ingredientId: "ing-beef", rawText: "beef", sortOrder: 1 }]
  });

  assert.equal(familyMatchesIngredient("fam-1", "beef", data), true);
});

test("family matches ingredient through descendant variation ingredient", () => {
  const data = minimalSeedData({
    recipeIngredients: [{ id: "ri-1", recipeId: "var-1", ingredientId: "ing-cheese", rawText: "cheese", sortOrder: 1 }]
  });

  assert.equal(familyMatchesIngredient("fam-1", "cheese", data), true);
});

test("category matches ingredient through descendants", () => {
  const data = minimalSeedData({
    recipeIngredients: [{ id: "ri-1", recipeId: "dish-1", ingredientId: "ing-beef", rawText: "beef", sortOrder: 1 }]
  });

  assert.equal(categoryMatchesIngredient("cat-1", "beef", data), true);
});

test("curated American backfill overrides weak source coverage", async () => {
  const data = await getData();
  const frenchDip = data.families.find((family) => family.slug === "french-dip-sandwich");
  assert.ok(frenchDip, "expected french-dip-sandwich family");

  assert.equal(familyMatchesIngredient(frenchDip!.id, "beef", data), true);

  const explanation = explainFamilyIngredientMatch(frenchDip!.id, "beef", data);
  assert.ok(explanation, "expected debug explanation for french dip beef match");
  assert.ok(explanation!.sourceTypes.includes("curated"), "expected curated provenance");
});

test("buildIngredientFilterIndex includes effective family ingredients", async () => {
  const data = await getData();
  const index = buildIngredientFilterIndex(data);
  const hamburger = data.families.find((family) => family.slug === "hamburger");
  assert.ok(hamburger, "expected hamburger family");

  const familyIngredients = index.families[hamburger!.id] ?? [];
  assert.ok(familyIngredients.some((ingredient) => ingredient.label.toLowerCase().includes("beef")));
});
