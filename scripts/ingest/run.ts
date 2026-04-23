import { ingestRawRecipes } from "@/lib/pipeline/stages/ingestRawRecipes";

async function main() {
  const result = await ingestRawRecipes();
  console.log("Ingest complete", result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
