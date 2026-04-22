import { publishPilotDataset } from "@/lib/pipeline/stages/publishPilot";

async function main() {
  const result = await publishPilotDataset();
  console.log("Publish complete", {
    dishCount: result.dishCount,
    recipeCount: result.recipeCount,
    ingredientCount: result.ingredientCount,
    coverage: result.coverage
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
