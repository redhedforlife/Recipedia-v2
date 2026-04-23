import { INGREDIENT_SYNONYMS } from "@/lib/pipeline/config";
import { normalizeText, slugify } from "@/lib/pipeline/utils";

const QUANTITY_PREFIX = /^\s*\d+[\d\s\/.\-]*\s*/;
const UNIT_PREFIX = /^(cup|cups|tbsp|tsp|teaspoon|teaspoons|tablespoon|tablespoons|oz|ounce|ounces|lb|pound|pounds|g|kg|ml|l)\b\s*/;
const PREP_SUFFIX = /,\s*(chopped|diced|minced|sliced|shredded|ground|fresh|dried|to taste).*$/;

const CATEGORY_KEYWORDS: Array<{ category: string; pattern: RegExp }> = [
  { category: "protein", pattern: /beef|pork|chicken|turkey|fish|shrimp|lobster|crab|bacon|ham|sausage/ },
  { category: "dairy", pattern: /milk|cream|cheese|butter|yogurt/ },
  { category: "herb", pattern: /parsley|cilantro|basil|oregano|thyme|rosemary|dill/ },
  { category: "bread", pattern: /bread|bun|roll|baguette|toast|rye/ },
  { category: "condiment", pattern: /mayo|mayonnaise|mustard|ketchup|vinegar|soy sauce|hot sauce/ },
  { category: "vegetable", pattern: /lettuce|tomato|onion|pepper|celery|carrot|cabbage|potato/ }
];

export type IngredientNormalizationResult = {
  normalizedName: string;
  slug: string;
  category: string;
  confidence: number;
};

export function normalizeIngredientName(raw: string): IngredientNormalizationResult {
  const original = normalizeText(raw);
  if (!original) {
    return {
      normalizedName: "unknown ingredient",
      slug: "unknown-ingredient",
      category: "other",
      confidence: 0.2
    };
  }

  let candidate = original
    .replace(QUANTITY_PREFIX, "")
    .replace(UNIT_PREFIX, "")
    .replace(PREP_SUFFIX, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (candidate.endsWith("es") && candidate.length > 4) candidate = candidate.slice(0, -2);
  else if (candidate.endsWith("s") && candidate.length > 3) candidate = candidate.slice(0, -1);

  const synonym = INGREDIENT_SYNONYMS[candidate] ?? INGREDIENT_SYNONYMS[original];
  const normalizedName = synonym ?? candidate;

  const category = CATEGORY_KEYWORDS.find((entry) => entry.pattern.test(normalizedName))?.category ?? "other";
  const confidence = synonym ? 0.92 : normalizedName === candidate ? 0.82 : 0.68;

  return {
    normalizedName,
    slug: slugify(normalizedName),
    category,
    confidence
  };
}
