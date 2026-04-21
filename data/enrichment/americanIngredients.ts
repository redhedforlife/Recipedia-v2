export type AmericanIngredientEnrichmentEntry = {
  slug: string;
  coreIngredients: string[];
  commonIngredients?: string[];
  optionalIngredients?: string[];
  notes?: string;
};

export const americanIngredientEnrichment: AmericanIngredientEnrichmentEntry[] = [
  {
    slug: "french-dip-sandwich",
    coreIngredients: ["beef", "bread"],
    commonIngredients: ["onion", "beef stock"],
    optionalIngredients: ["cheese"],
    notes: "Explicit American sandwich backfill for reliable beef filtering."
  },
  {
    slug: "club-sandwich",
    coreIngredients: ["bread", "bacon", "tomato"],
    commonIngredients: ["lettuce", "chicken", "mayonnaise"],
    optionalIngredients: ["cheese"]
  },
  {
    slug: "blt",
    coreIngredients: ["bacon", "lettuce", "tomato"],
    commonIngredients: ["bread", "mayonnaise"]
  },
  {
    slug: "hamburger",
    coreIngredients: ["beef", "bun"],
    commonIngredients: ["onion", "lettuce", "tomato"],
    optionalIngredients: ["cheese", "pickle"]
  },
  {
    slug: "ciabatta-bacon-cheeseburger",
    coreIngredients: ["beef", "cheese", "bun"],
    commonIngredients: ["bacon", "onion", "tomato"],
    optionalIngredients: ["lettuce"]
  },
  {
    slug: "patty-melt",
    coreIngredients: ["beef", "bread", "onion", "cheese"],
    commonIngredients: ["butter"]
  },
  {
    slug: "monte-cristo-sandwich",
    coreIngredients: ["bread", "ham", "cheese"],
    commonIngredients: ["egg"],
    optionalIngredients: ["jam"]
  },
  {
    slug: "muffuletta",
    coreIngredients: ["bread", "ham", "salami"],
    commonIngredients: ["olive", "cheese"],
    optionalIngredients: ["mortadella"]
  },
  {
    slug: "peanut-butter-and-jelly-sandwich",
    coreIngredients: ["bread", "peanut butter", "jam"],
    commonIngredients: ["jelly"]
  },
  {
    slug: "grilled-cheese",
    coreIngredients: ["bread", "cheese", "butter"]
  },
  {
    slug: "philly-cheesesteak",
    coreIngredients: ["beef", "bread", "cheese"],
    commonIngredients: ["onion"]
  },
  {
    slug: "cheesesteak",
    coreIngredients: ["beef", "bread", "cheese"],
    commonIngredients: ["onion"]
  },
  {
    slug: "reuben-sandwich",
    coreIngredients: ["corned beef", "rye bread", "cheese"],
    commonIngredients: ["sauerkraut"]
  },
  {
    slug: "po-boy",
    coreIngredients: ["bread"],
    commonIngredients: ["shrimp", "lettuce", "tomato"],
    optionalIngredients: ["beef"]
  },
  {
    slug: "crab-cake",
    coreIngredients: ["crab", "egg"],
    commonIngredients: ["breadcrumbs", "onion"],
    optionalIngredients: ["mayonnaise"]
  },
  {
    slug: "clam-chowder",
    coreIngredients: ["clam", "onion"],
    commonIngredients: ["potato", "cream", "butter"]
  },
  {
    slug: "lobster-roll",
    coreIngredients: ["lobster", "bread"],
    commonIngredients: ["butter", "mayonnaise"],
    optionalIngredients: ["celery"]
  },
  {
    slug: "shrimp-and-grits",
    coreIngredients: ["shrimp", "grits"],
    commonIngredients: ["butter", "cheese"],
    optionalIngredients: ["bacon"]
  }
];
