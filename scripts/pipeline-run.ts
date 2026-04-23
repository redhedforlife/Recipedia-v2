import { ingestRawRecipes } from "@/lib/pipeline/stages/ingestRawRecipes";
import { normalizeRecipes } from "@/lib/pipeline/stages/normalizeRecipes";
import { dedupeRecipes } from "@/lib/pipeline/stages/dedupeRecipes";
import { mapRecipesToDishes } from "@/lib/pipeline/stages/mapRecipesToDishes";
import { computeDishIngredientProfiles } from "@/lib/pipeline/stages/computeProfiles";
import { publishPilotDataset } from "@/lib/pipeline/stages/publishPilot";
import { runPublishedQaChecks } from "@/lib/pipeline/stages/runQa";

async function main() {
  const ingest = await ingestRawRecipes();
  const normalized = await normalizeRecipes();
  const dedupe = await dedupeRecipes();
  const mapped = await mapRecipesToDishes();
  const profiles = await computeDishIngredientProfiles();
  const published = await publishPilotDataset();
  const qa = await runPublishedQaChecks();

  console.log("Pipeline complete", {
    ingest,
    normalized,
    dedupe,
    mapped,
    profiles,
    published: {
      dishCount: published.dishCount,
      recipeCount: published.recipeCount,
      ingredientCount: published.ingredientCount,
      totalDishes: published.coverage.totalDishes
    },
    qa: {
      totalIssues: qa.totalIssues,
      errorCount: qa.errorCount,
      warningCount: qa.warningCount
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
