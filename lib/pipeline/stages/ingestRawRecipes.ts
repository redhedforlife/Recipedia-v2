import path from "node:path";
import type { RawRecipeRecord, SourceType } from "@/lib/pipeline/types";
import { readJsonFile, workspacePath, writeJsonFile } from "@/lib/pipeline/io";
import { slugify } from "@/lib/pipeline/utils";

type LineageSeed = {
  sources: Array<{
    id: string;
    name: string;
    base_url?: string;
    license?: string;
    extraction_method?: string;
    created_at?: string;
  }>;
  categories: Array<{ id: string; name: string }>;
  dishes: Array<{
    id: string;
    name: string;
    dish_family_id: string;
    primary_category_id?: string;
    origin_text?: string;
  }>;
  variations: Array<{
    id: string;
    name: string;
    dish_id: string;
    source_id?: string;
    source_url?: string;
    created_at: string;
  }>;
  ingredients: Array<{ id: string; name: string }>;
  dish_family_ingredients: Array<{
    dish_family_id: string;
    ingredient_id: string;
  }>;
};

type WikipediaParse = {
  parse?: {
    title?: string;
    text?: {
      "*"?: string;
    };
  };
};

const WIKIPEDIA_LIST_FILES = [
  "list-of-regional-dishes-of-the-united-states.json",
  "list-of-sandwiches.json",
  "list-of-hamburgers.json",
  "list-of-soups.json",
  "list-of-stews.json"
];

function inferSourceType(sourceId: string | undefined): SourceType {
  if (!sourceId) return "derived";
  if (sourceId.includes("wikidata")) return "wikidata";
  if (sourceId.includes("wikipedia")) return "wikipedia";
  if (sourceId.includes("dbpedia")) return "dbpedia";
  if (sourceId.includes("mealdb")) return "mealdb";
  return "seed";
}

function stripTags(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractListEntries(html: string) {
  const entries: string[] = [];
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/g;
  let match = liRegex.exec(html);
  while (match) {
    const entry = stripTags(match[1] ?? "");
    if (entry && entry.length <= 120) entries.push(entry);
    match = liRegex.exec(html);
  }
  return Array.from(new Set(entries));
}

export async function ingestRawRecipes() {
  const now = new Date().toISOString();
  const lineagePath = workspacePath("data_out", "recipe_lineage_seed.json");
  const lineage = await readJsonFile<LineageSeed>(lineagePath);

  const sourceById = new Map(lineage.sources.map((source) => [source.id, source]));
  const dishById = new Map(lineage.dishes.map((dish) => [dish.id, dish]));
  const ingredientById = new Map(lineage.ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const categoryById = new Map(lineage.categories.map((category) => [category.id, category]));

  const ingredientIdsByFamily = lineage.dish_family_ingredients.reduce<Map<string, Set<string>>>((acc, row) => {
    if (!acc.has(row.dish_family_id)) acc.set(row.dish_family_id, new Set());
    acc.get(row.dish_family_id)?.add(row.ingredient_id);
    return acc;
  }, new Map());

  const rawRecords: RawRecipeRecord[] = lineage.variations.map((variation) => {
    const source = variation.source_id ? sourceById.get(variation.source_id) : undefined;
    const dish = dishById.get(variation.dish_id);
    const familyIngredientIds = dish ? Array.from(ingredientIdsByFamily.get(dish.dish_family_id) ?? []) : [];
    const ingredientNames = familyIngredientIds
      .map((ingredientId) => ingredientById.get(ingredientId)?.name)
      .filter((name): name is string => Boolean(name));

    return {
      id: `raw-${variation.id}`,
      sourceName: source?.name ?? "Recipedia Seed",
      sourceType: inferSourceType(variation.source_id),
      sourceId: variation.source_id,
      title: variation.name,
      rawIngredientStrings: ingredientNames,
      rawInstructions: [
        `Reference recipe imported from ${source?.name ?? "Recipedia Seed"}.`,
        "Concrete steps are pending enrichment from recipe sources."
      ],
      rawCuisine: dish?.origin_text,
      rawCategory: dish?.primary_category_id ? categoryById.get(dish.primary_category_id)?.name : undefined,
      url: variation.source_url,
      dishHint: dish?.name,
      importedAt: variation.created_at ?? now,
      provenance: {
        lineageDishId: dish?.id,
        lineageVariationId: variation.id,
        lineageFamilyId: dish?.dish_family_id,
        categoryId: dish?.primary_category_id,
        transform: "lineage_seed_ingest"
      }
    };
  });

  for (const wikiFile of WIKIPEDIA_LIST_FILES) {
    const wikiPath = workspacePath("raw_wikipedia", wikiFile);
    const parsed = await readJsonFile<WikipediaParse>(wikiPath);
    const html = parsed.parse?.text?.["*"] ?? "";
    const entries = extractListEntries(html);
    const sourceName = `Wikipedia ${parsed.parse?.title ?? wikiFile}`;

    entries.forEach((entry, index) => {
      rawRecords.push({
        id: `raw-wiki-${slugify(path.basename(wikiFile, ".json"))}-${index + 1}`,
        sourceName,
        sourceType: "taxonomy_list",
        sourceId: `wikipedia-${path.basename(wikiFile, ".json")}`,
        title: entry,
        rawIngredientStrings: [],
        rawInstructions: ["Taxonomy-only list import. Recipe details pending enrichment."],
        rawCuisine: wikiFile.includes("united-states") ? "American" : undefined,
        rawCategory: parsed.parse?.title,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(parsed.parse?.title ?? "")}`,
        dishHint: entry,
        importedAt: now,
        provenance: {
          wikipediaFile: wikiFile,
          transform: "wikipedia_list_ingest"
        }
      });
    });
  }

  const outPath = workspacePath("data", "raw", "recipes", "raw_recipes.json");
  await writeJsonFile(outPath, rawRecords);

  return {
    rawRecordCount: rawRecords.length,
    outputPath: outPath
  };
}
