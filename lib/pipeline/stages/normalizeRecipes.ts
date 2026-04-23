import type { Ingredient, NormalizedRecipeRecord, RawRecipeRecord } from "@/lib/pipeline/types";
import { normalizeIngredientName } from "@/lib/pipeline/ingredientNormalization";
import { SOURCE_QUALITY, STOPWORDS } from "@/lib/pipeline/config";
import { normalizeText, slugify, tokenize } from "@/lib/pipeline/utils";
import { readJsonFile, workspacePath, writeJsonFile } from "@/lib/pipeline/io";

function normalizeTitle(value: string) {
  const normalized = normalizeText(value);
  return normalized
    .split(" ")
    .filter((token) => token && !STOPWORDS.has(token))
    .join(" ");
}



const MANDATORY_PILOT_INGREDIENTS: Array<{ name: string; category: string }> = [
  { name: "mayonnaise", category: "condiment" },
  { name: "lettuce", category: "vegetable" },
  { name: "tomato", category: "vegetable" },
  { name: "bread", category: "bread" },
  { name: "bun", category: "bread" },
  { name: "beef", category: "protein" },
  { name: "cheese", category: "dairy" }
];

function tokenizeInstructions(steps: string[]) {
  return steps
    .flatMap((step) => tokenize(step))
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

export async function normalizeRecipes() {
  const rawPath = workspacePath("data", "raw", "recipes", "raw_recipes.json");
  const rawRecords = await readJsonFile<RawRecipeRecord[]>(rawPath);

  const ingredientsBySlug = new Map<string, Ingredient>();

  const normalized: NormalizedRecipeRecord[] = rawRecords.map((record) => {
    const titleTokens = tokenize(record.title).filter((token) => !STOPWORDS.has(token));

    const ingredientItems = record.rawIngredientStrings.map((rawText) => {
      const result = normalizeIngredientName(rawText);
      const ingredientId = `ing-${result.slug}`;

      const existing = ingredientsBySlug.get(result.slug);
      if (!existing) {
        ingredientsBySlug.set(result.slug, {
          id: ingredientId,
          name: result.normalizedName,
          slug: result.slug,
          aliases: [rawText],
          normalizedFrom: [rawText],
          category: result.category
        });
      } else {
        if (!existing.aliases.includes(rawText)) existing.aliases.push(rawText);
        if (!existing.normalizedFrom.includes(rawText)) existing.normalizedFrom.push(rawText);
      }

      return {
        rawText,
        ingredientId,
        ingredientName: result.normalizedName,
        normalizedConfidence: result.confidence
      };
    });

    return {
      id: record.id,
      title: record.title,
      normalizedTitle: normalizeTitle(record.title),
      titleTokens,
      sourceName: record.sourceName,
      sourceType: record.sourceType,
      sourceId: record.sourceId,
      url: record.url,
      ingredientItems,
      normalizedIngredientIds: ingredientItems
        .map((item) => item.ingredientId)
        .filter((item): item is string => Boolean(item)),
      normalizedInstructionTokens: tokenizeInstructions(record.rawInstructions),
      rawCuisine: record.rawCuisine,
      rawCategory: record.rawCategory,
      dishHint: record.dishHint,
      importedAt: record.importedAt,
      sourceQualityScore: SOURCE_QUALITY[record.sourceType] ?? 0.6,
      provenance: {
        ...record.provenance,
        transform: "normalize_recipes"
      }
    };
  });

  for (const required of MANDATORY_PILOT_INGREDIENTS) {
    const slug = slugify(required.name);
    if (!ingredientsBySlug.has(slug)) {
      ingredientsBySlug.set(slug, {
        id: `ing-${slug}`,
        name: required.name,
        slug,
        aliases: [required.name],
        normalizedFrom: [required.name],
        category: required.category
      });
    }
  }

  const ingredientList = Array.from(ingredientsBySlug.values()).sort((a, b) => a.name.localeCompare(b.name));

  await writeJsonFile(workspacePath("data", "normalized", "recipes", "normalized_recipes.json"), normalized);
  await writeJsonFile(workspacePath("data", "normalized", "ingredients", "ingredients.json"), ingredientList);

  return {
    normalizedRecipeCount: normalized.length,
    ingredientCount: ingredientList.length
  };
}
