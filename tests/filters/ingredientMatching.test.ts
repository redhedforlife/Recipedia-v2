import test from "node:test";
import assert from "node:assert/strict";
import { categoryMatchesIngredient, cuisineMatchesIngredient, familyMatchesIngredient } from "@/lib/ingredients/effectiveIngredients";
import { getData } from "@/lib/data";

function findFamilyBySlug(data: Awaited<ReturnType<typeof getData>>, slugs: string[]) {
  return data.families.find((family) => slugs.includes(family.slug) || slugs.some((slug) => family.slug.includes(slug)));
}

test("French dip matches beef", async () => {
  const data = await getData();
  const family = findFamilyBySlug(data, ["french-dip-sandwich"]);
  assert.ok(family, "expected french dip family");
  assert.equal(familyMatchesIngredient(family!.id, "beef", data), true);
});

test("hamburger matches beef", async () => {
  const data = await getData();
  const family = findFamilyBySlug(data, ["hamburger"]);
  assert.ok(family, "expected hamburger family");
  assert.equal(familyMatchesIngredient(family!.id, "beef", data), true);
});

test("cheeseburger branch matches beef and cheese", async () => {
  const data = await getData();
  const family = findFamilyBySlug(data, ["cheeseburger"]);
  assert.ok(family, "expected cheeseburger family");
  assert.equal(familyMatchesIngredient(family!.id, "beef", data), true);
  assert.equal(familyMatchesIngredient(family!.id, "cheese", data), true);
});

test("PB&J matches peanut butter", async () => {
  const data = await getData();
  const family = findFamilyBySlug(data, ["peanut-butter-and-jelly-sandwich"]);
  assert.ok(family, "expected PB&J family");
  assert.equal(familyMatchesIngredient(family!.id, "peanut butter", data), true);
});

test("crab cake matches crab", async () => {
  const data = await getData();
  const family = findFamilyBySlug(data, ["crab-cake"]);
  assert.ok(family, "expected crab cake family");
  assert.equal(familyMatchesIngredient(family!.id, "crab", data), true);
});

test("Sandwiches category matches beef through descendants", async () => {
  const data = await getData();
  const sandwiches = data.categories.find((category) => category.slug.includes("sandwich"));
  assert.ok(sandwiches, "expected sandwiches category");
  assert.equal(categoryMatchesIngredient(sandwiches!.id, "beef", data), true);
});

test("American cuisine matches beef through descendants", async () => {
  const data = await getData();
  const american = data.cuisines.find((cuisine) => cuisine.slug === "american");
  assert.ok(american, "expected american cuisine");
  assert.equal(cuisineMatchesIngredient(american!.id, "beef", data), true);
});
