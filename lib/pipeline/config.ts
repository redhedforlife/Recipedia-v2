import type { PipelineThresholds } from "@/lib/pipeline/types";

export const PIPELINE_THRESHOLDS: PipelineThresholds = {
  canonicalMinFrequency: 0.7,
  optionalMinFrequency: 0.25,
  optionalMaxFrequency: 0.69,
  publishMinConfidence: 0.6,
  reviewQueueMaxConfidence: 0.59,
  minRecipesForFrequencyProfiles: 3
};

export const PILOT_CUISINE = {
  id: "cui-american",
  name: "American"
};

export const PILOT_CATEGORY_KEYWORDS: Array<{ id: string; name: string; pattern: RegExp }> = [
  { id: "cat-american-sandwiches", name: "Sandwiches", pattern: /sandwich|blt|dip|cheesesteak|melt|po boy|po-boy|sub|hoagie|reuben|club/i },
  { id: "cat-american-burgers", name: "Burgers", pattern: /burger|hamburger|slider|patty melt/i },
  { id: "cat-american-barbecue", name: "Barbecue", pattern: /barbecue|bbq|brisket|pulled pork|ribs|smoked/i },
  { id: "cat-american-fried-chicken", name: "Fried Chicken", pattern: /fried chicken|chicken fry|buffalo wing|hot chicken|wings/i },
  { id: "cat-american-soups-stews", name: "Soups and Stews", pattern: /soup|stew|chili|gumbo|chowder|bisque/i }
];

export const SOURCE_QUALITY: Record<string, number> = {
  wikidata: 0.83,
  wikipedia: 0.8,
  dbpedia: 0.65,
  mealdb: 0.72,
  seed: 0.9,
  taxonomy_list: 0.7,
  derived: 0.6
};

export const INGREDIENT_SYNONYMS: Record<string, string> = {
  mayo: "mayonnaise",
  mayonnaise: "mayonnaise",
  roma: "tomato",
  "roma tomatoes": "tomato",
  tomatoes: "tomato",
  tomatoe: "tomato",
  iceberg: "lettuce",
  "iceberg lettuce": "lettuce",
  "sandwich bread": "bread",
  "white sandwich bread": "bread",
  buns: "bun",
  burger: "beef",
  scallions: "green onion",
  "spring onions": "green onion",
  chilies: "chili pepper",
  chiles: "chili pepper",
  chillies: "chili pepper",
  ketchup: "tomato ketchup",
  catsup: "tomato ketchup"
};

export const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "style",
  "recipe",
  "best",
  "easy",
  "quick",
  "classic",
  "homemade",
  "authentic",
  "with",
  "and",
  "of",
  "for"
]);
