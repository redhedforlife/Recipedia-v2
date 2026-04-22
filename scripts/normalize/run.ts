import { normalizeRecipes } from "@/lib/pipeline/stages/normalizeRecipes";
import { dedupeRecipes } from "@/lib/pipeline/stages/dedupeRecipes";
import { mapRecipesToDishes } from "@/lib/pipeline/stages/mapRecipesToDishes";
import { computeDishIngredientProfiles } from "@/lib/pipeline/stages/computeProfiles";

async function main() {
  const normalizeResult = await normalizeRecipes();
  const dedupeResult = await dedupeRecipes();
  const mapResult = await mapRecipesToDishes();
  const profileResult = await computeDishIngredientProfiles();

  console.log("Normalize complete", {
    normalizeResult,
    dedupeResult,
    mapResult,
    profileResult
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
