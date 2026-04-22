import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type SourceRef = {
  sourceName: string;
  sourceType: string;
  externalId?: string;
  url?: string;
  importedAt?: string;
  transforms?: string[];
  licenseNotes?: string;
};

type PublishedDishIngredient = {
  dishId: string;
  ingredientId: string;
  role: string;
  frequency: number;
  confidenceScore: number;
  sourceRecipeCount: number;
};

type PublishedDish = {
  id: string;
  name: string;
  slug: string;
  description: string;
  cuisineId?: string;
  categoryId?: string;
  familyId?: string;
  aliases?: string[];
  canonicalIngredients: PublishedDishIngredient[];
  optionalCommonIngredients: PublishedDishIngredient[];
  sourceRefs: SourceRef[];
  confidenceScore?: number;
  recipeCount?: number;
  coverageStatus?: string;
  reviewedAt?: string;
};

type PublishedRecipe = {
  id: string;
  dishId: string;
  title: string;
  sourceUrl?: string;
  sourceName?: string;
  sourceType?: string;
  ingredients: unknown[];
  instructions: string[];
  confidenceScore?: number;
  isCanonicalCandidate?: boolean;
  sourceRefs: SourceRef[];
};

type PublishedIngredient = {
  id: string;
  name: string;
  slug: string;
  aliases?: string[];
  category?: string;
};

const MAX_RECIPES_PER_DISH = Number(process.env.RECIPEDIA_IMPORT_RECIPE_LIMIT_PER_DISH ?? "3");

async function main() {
  const root = process.cwd();
  const [dishes, recipes, ingredients] = await Promise.all([
    readJson<PublishedDish[]>(path.join(root, "data", "published", "graph", "dishes.json")),
    readJson<PublishedRecipe[]>(path.join(root, "data", "published", "recipes", "recipes.json")),
    readJson<PublishedIngredient[]>(path.join(root, "data", "published", "graph", "ingredients.json"))
  ]);

  const selectedRecipes = selectRecipes(recipes, MAX_RECIPES_PER_DISH);
  const recipesByDish = groupBy(selectedRecipes, (recipe) => recipe.dishId);
  const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

  await prisma.$transaction(async (tx) => {
    const cuisineIds = new Set<string>();
    const categoryIds = new Set<string>();
    const families = new Map<string, { id: string; slug: string; displayName: string; description: string; cuisineId?: string; categoryId?: string }>();

    dishes.forEach((dish) => {
      if (dish.cuisineId) cuisineIds.add(dish.cuisineId);
      if (dish.categoryId) categoryIds.add(dish.categoryId);
      const familyId = dish.familyId ?? `fam-${dish.slug}`;
      if (!families.has(familyId)) {
        const categoryId = dish.categoryId && categoryIds.has(dish.categoryId) ? dish.categoryId : undefined;
        const cuisineId = dish.cuisineId && cuisineIds.has(dish.cuisineId) ? dish.cuisineId : undefined;
        families.set(familyId, {
          id: familyId,
          slug: familyId.startsWith("fam-") ? familyId.slice(4) : familyId,
          displayName: titleCase(dish.name),
          description: `Canonical family for ${titleCase(dish.name)}.`,
          cuisineId,
          categoryId
        });
      }
    });

    let order = 1;
    for (const cuisineId of cuisineIds) {
      const slug = cuisineId.replace(/^cui-/, "");
      await tx.cuisine.upsert({
        where: { id: cuisineId },
        create: {
          id: cuisineId,
          slug,
          displayName: titleCase(slug.replace(/-/g, " ")),
          description: `${titleCase(slug.replace(/-/g, " "))} cuisine.`,
          regionGroup: "Global"
        },
        update: {}
      });
      order += 1;
    }

    order = 1;
    for (const categoryId of categoryIds) {
      const slug = categoryId.replace(/^cat-/, "");
      const sampleDish = dishes.find((dish) => dish.categoryId === categoryId);
      await tx.category.upsert({
        where: { id: categoryId },
        create: {
          id: categoryId,
          slug,
          displayName: titleCase(slug.replace(/-/g, " ")),
          description: `Canonical category for ${titleCase(slug.replace(/-/g, " "))}.`,
          cuisineId: sampleDish?.cuisineId,
          sortOrder: order
        },
        update: {
          cuisineId: sampleDish?.cuisineId
        }
      });
      order += 1;
    }

    for (const family of families.values()) {
      await tx.family.upsert({
        where: { id: family.id },
        create: {
          id: family.id,
          slug: family.slug,
          displayName: family.displayName,
          description: family.description,
          cuisineId: family.cuisineId,
          categoryId: family.categoryId
        },
        update: {
          displayName: family.displayName,
          description: family.description,
          cuisineId: family.cuisineId,
          categoryId: family.categoryId
        }
      });

      await tx.recipeFamily.upsert({
        where: { id: family.id },
        create: {
          id: family.id,
          slug: family.slug,
          displayName: family.displayName,
          category: family.categoryId ?? "uncategorized",
          categoryId: family.categoryId,
          cuisine: family.cuisineId ?? "unknown",
          description: family.description,
          cuisineId: family.cuisineId,
          isCanonical: true
        },
        update: {
          displayName: family.displayName,
          category: family.categoryId ?? "uncategorized",
          categoryId: family.categoryId,
          cuisine: family.cuisineId ?? "unknown",
          cuisineId: family.cuisineId,
          description: family.description
        }
      });
    }

    for (const ingredient of ingredients) {
      await tx.ingredient.upsert({
        where: { id: ingredient.id },
        create: {
          id: ingredient.id,
          canonicalName: normalizeIngredient(ingredient.name),
          displayName: titleCase(ingredient.name),
          category: ingredient.category ?? null,
          aliases: ingredient.aliases ?? []
        },
        update: {
          canonicalName: normalizeIngredient(ingredient.name),
          displayName: titleCase(ingredient.name),
          category: ingredient.category ?? null,
          aliases: ingredient.aliases ?? []
        }
      });
    }

    for (const dish of dishes) {
      const familyKey = dish.familyId ?? `fam-${dish.slug}`;
      const familyId = families.has(familyKey) ? familyKey : null;
      const categoryId = dish.categoryId && categoryIds.has(dish.categoryId) ? dish.categoryId : null;
      const cuisineId = dish.cuisineId && cuisineIds.has(dish.cuisineId) ? dish.cuisineId : null;

      await tx.dish.upsert({
        where: { id: dish.id },
        create: {
          id: dish.id,
          slug: dish.slug,
          displayName: titleCase(dish.name),
          description: dish.description,
          categoryId,
          cuisineId,
          familyId,
          confidenceScore: dish.confidenceScore ?? null,
          recipeCount: dish.recipeCount ?? recipesByDish.get(dish.id)?.length ?? 0,
          isPublished: true
        },
        update: {
          slug: dish.slug,
          displayName: titleCase(dish.name),
          description: dish.description,
          categoryId,
          cuisineId,
          familyId,
          confidenceScore: dish.confidenceScore ?? null,
          recipeCount: dish.recipeCount ?? recipesByDish.get(dish.id)?.length ?? 0,
          isPublished: true
        }
      });

      for (const alias of dish.aliases ?? []) {
        await tx.dishAlias.upsert({
          where: {
            id: `${dish.id}::${normalizeIngredient(alias)}`
          },
          create: {
            id: `${dish.id}::${normalizeIngredient(alias)}`,
            dishId: dish.id,
            alias,
            normalizedAlias: normalizeIngredient(alias),
            isPreferred: false
          },
          update: {
            alias,
            normalizedAlias: normalizeIngredient(alias)
          }
        });
      }

      const canonicalIngredients = [...dish.canonicalIngredients, ...dish.optionalCommonIngredients];
      for (const row of canonicalIngredients) {
        const fallback = ingredientById.get(row.ingredientId);
        if (!fallback) {
          await tx.ingredient.upsert({
            where: { id: row.ingredientId },
            create: {
              id: row.ingredientId,
              canonicalName: row.ingredientId.replace(/^ing-/, "").replace(/-/g, " "),
              displayName: titleCase(row.ingredientId.replace(/^ing-/, "").replace(/-/g, " ")),
              aliases: []
            },
            update: {}
          });
        }

        await tx.dishCanonicalIngredient.upsert({
          where: {
            dishId_ingredientId: {
              dishId: dish.id,
              ingredientId: row.ingredientId
            }
          },
          create: {
            dishId: dish.id,
            ingredientId: row.ingredientId,
            familyId,
            role: row.role,
            isCore: row.role === "canonical",
            importance: row.frequency
          },
          update: {
            familyId,
            role: row.role,
            isCore: row.role === "canonical",
            importance: row.frequency
          }
        });
      }
    }

    for (const recipe of selectedRecipes) {
      const dish = dishes.find((candidate) => candidate.id === recipe.dishId);
      if (!dish) continue;
      const familyKey = dish.familyId ?? `fam-${dish.slug}`;
      if (!families.has(familyKey)) continue;
      const familyId = familyKey;

      const sourceRef = recipe.sourceRefs[0] ?? dish.sourceRefs[0];
      const sourceUrl = sourceRef?.url ?? recipe.sourceUrl ?? `urn:recipe:${recipe.id}`;
      const sourceId = sourceRef?.externalId || `src-${stableId(sourceUrl).slice(0, 16)}`;
      const sourceName = sourceRef?.sourceName ?? recipe.sourceName ?? "Unknown source";
      const sourceAuthor = sourceRef?.sourceType ?? recipe.sourceType ?? "unknown";
      const importedAt = sourceRef?.importedAt ? new Date(sourceRef.importedAt) : new Date();

      await tx.source.upsert({
        where: { id: sourceId },
        create: {
          id: sourceId,
          siteName: sourceName,
          sourceUrl,
          authorName: sourceAuthor,
          licenseNote: sourceRef?.licenseNotes ?? "Imported canonical source",
          importedAt,
          extractionMethod: sourceRef?.transforms?.join("|") ?? "import-script",
          extractionConfidence: recipe.confidenceScore ?? 0.75
        },
        update: {
          siteName: sourceName,
          authorName: sourceAuthor,
          extractionMethod: sourceRef?.transforms?.join("|") ?? "import-script",
          extractionConfidence: recipe.confidenceScore ?? 0.75
        }
      });

      await tx.sourceImport.upsert({
        where: { sourceUrl },
        create: {
          id: `srcimp-${stableId(sourceUrl).slice(0, 20)}`,
          sourceUrl,
          siteName: sourceName,
          authorName: sourceAuthor,
          extractionMethod: sourceRef?.transforms?.join("|") ?? "import-script",
          extractionConfidence: recipe.confidenceScore ?? 0.75,
          importedAt
        },
        update: {
          siteName: sourceName,
          authorName: sourceAuthor,
          extractionMethod: sourceRef?.transforms?.join("|") ?? "import-script",
          extractionConfidence: recipe.confidenceScore ?? 0.75
        }
      });

      const slug = uniqueRecipeSlug(recipe.title, recipe.id);
      await tx.recipe.upsert({
        where: { id: recipe.id },
        create: {
          id: recipe.id,
          slug,
          recipeFamilyId: familyId,
          dishId: dish.id,
          sourceId,
          sourceImportId: `srcimp-${stableId(sourceUrl).slice(0, 20)}`,
          title: recipe.title,
          description: recipe.instructions[0] ?? `Imported recipe for ${titleCase(dish.name)}`,
          serves: "Imported",
          isSourceRecipe: Boolean(recipe.isCanonicalCandidate),
          isUserVariation: false
        },
        update: {
          slug,
          recipeFamilyId: familyId,
          dishId: dish.id,
          sourceId,
          sourceImportId: `srcimp-${stableId(sourceUrl).slice(0, 20)}`,
          title: recipe.title,
          description: recipe.instructions[0] ?? `Imported recipe for ${titleCase(dish.name)}`,
          isSourceRecipe: Boolean(recipe.isCanonicalCandidate),
          isUserVariation: false
        }
      });

      for (const [index, step] of recipe.instructions.filter(Boolean).entries()) {
        await tx.recipeStep.upsert({
          where: {
            recipeId_stepNumber: {
              recipeId: recipe.id,
              stepNumber: index + 1
            }
          },
          create: {
            recipeId: recipe.id,
            stepNumber: index + 1,
            instructionText: step
          },
          update: {
            instructionText: step
          }
        });
      }

      for (const [index, rawIngredient] of recipe.ingredients.filter(Boolean).entries()) {
        const rawText =
          typeof rawIngredient === "string"
            ? rawIngredient
            : typeof rawIngredient === "number"
              ? String(rawIngredient)
              : JSON.stringify(rawIngredient);
        const ingredient = await findOrCreateIngredient(tx, rawText);
        const linkId = `ri-${recipe.id}-${index + 1}`;
        await tx.recipeIngredient.upsert({
          where: { id: linkId },
          create: {
            id: linkId,
            recipeId: recipe.id,
            ingredientId: ingredient.id,
            rawText,
            sortOrder: index + 1
          },
          update: {
            ingredientId: ingredient.id,
            rawText,
            sortOrder: index + 1
          }
        });
      }
    }

    await rebuildGraphTables(tx, dishes);
  });

  const club = await prisma.dish.findUnique({
    where: { slug: "club-sandwich" },
    include: {
      recipes: true,
      canonicalIngredients: { include: { ingredient: true } }
    }
  });

  console.log("Canonical import complete.");
  console.log(`Dishes: ${dishes.length}`);
  console.log(`Recipes imported: ${selectedRecipes.length}`);
  console.log(`Ingredients: ${ingredients.length}`);
  console.log(
    JSON.stringify(
      {
        clubDish: club?.displayName,
        linkedRecipes: club?.recipes.length ?? 0,
        canonicalIngredients: (club?.canonicalIngredients ?? []).map((row) => row.ingredient.displayName)
      },
      null,
      2
    )
  );
}

async function rebuildGraphTables(tx: Prisma.TransactionClient, dishes: PublishedDish[]) {
  await tx.graphEdge.deleteMany({});
  await tx.graphNode.deleteMany({});

  const categoryById = new Map<string, { id: string; slug: string; label: string; cuisineId?: string }>();
  const cuisineById = new Map<string, { id: string; slug: string; label: string }>();

  dishes.forEach((dish) => {
    if (dish.cuisineId && !cuisineById.has(dish.cuisineId)) {
      const slug = dish.cuisineId.replace(/^cui-/, "");
      cuisineById.set(dish.cuisineId, {
        id: dish.cuisineId,
        slug,
        label: titleCase(slug.replace(/-/g, " "))
      });
    }

    if (dish.categoryId && !categoryById.has(dish.categoryId)) {
      const slug = dish.categoryId.replace(/^cat-/, "");
      categoryById.set(dish.categoryId, {
        id: dish.categoryId,
        slug,
        label: titleCase(slug.replace(/-/g, " ")),
        cuisineId: dish.cuisineId
      });
    }
  });

  for (const cuisine of cuisineById.values()) {
    await tx.graphNode.create({
      data: {
        id: cuisine.id,
        kind: "cuisine",
        label: cuisine.label,
        href: `/graph?mode=dish&focus=${cuisine.slug}`,
        canonical: true
      }
    });
  }

  for (const category of categoryById.values()) {
    await tx.graphNode.create({
      data: {
        id: category.id,
        kind: "category",
        label: category.label,
        href: `/graph?mode=dish&focus=${category.slug}`,
        canonical: true,
        cuisineId: category.cuisineId ?? null,
        categoryId: category.id
      }
    });
  }

  for (const dish of dishes) {
    await tx.graphNode.create({
      data: {
        id: dish.id,
        kind: "dish",
        label: titleCase(dish.name),
        href: `/dishes/${dish.slug}`,
        description: dish.description,
        meta: `${dish.recipeCount ?? 0} linked recipes`,
        canonical: true,
        cuisineId: dish.cuisineId ?? null,
        categoryId: dish.categoryId ?? null
      }
    });
  }

  for (const category of categoryById.values()) {
    if (!category.cuisineId) continue;
    await tx.graphEdge.create({
      data: {
        id: `edge-${category.cuisineId}-${category.id}`,
        source: category.cuisineId,
        target: category.id,
        label: "category",
        kind: "cuisine_contains_category",
        strength: 1
      }
    });
  }

  for (const dish of dishes) {
    if (!dish.categoryId) continue;
    await tx.graphEdge.create({
      data: {
        id: `edge-${dish.categoryId}-${dish.id}`,
        source: dish.categoryId,
        target: dish.id,
        label: "dish",
        kind: "category_contains_dish",
        strength: 1
      }
    });
  }
}

function uniqueRecipeSlug(title: string, id: string) {
  const normalized = normalizeIngredient(title).replace(/\s+/g, "-");
  return `${normalized}-${id.slice(-8).toLowerCase()}`;
}

async function findOrCreateIngredient(tx: Prisma.TransactionClient, rawText: string) {
  const normalized = normalizeIngredient(rawText);
  const existing = await tx.ingredient.findFirst({
    where: {
      OR: [{ canonicalName: normalized }, { displayName: { equals: titleCase(normalized), mode: "insensitive" } }]
    }
  });
  if (existing) return existing;

  const id = `ing-${normalized.replace(/\s+/g, "-").slice(0, 48)}`;
  return tx.ingredient.upsert({
    where: { id },
    create: {
      id,
      canonicalName: normalized,
      displayName: titleCase(normalized),
      aliases: []
    },
    update: {
      canonicalName: normalized,
      displayName: titleCase(normalized)
    }
  });
}

function normalizeIngredient(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function stableId(value: string) {
  return createHash("sha1").update(value).digest("hex");
}

function groupBy<T>(values: T[], getKey: (value: T) => string) {
  const map = new Map<string, T[]>();
  values.forEach((value) => {
    const key = getKey(value);
    const row = map.get(key);
    if (row) {
      row.push(value);
      return;
    }
    map.set(key, [value]);
  });
  return map;
}

function selectRecipes(recipes: PublishedRecipe[], maxPerDish: number) {
  const result: PublishedRecipe[] = [];
  const counts = new Map<string, number>();
  recipes.forEach((recipe) => {
    const used = counts.get(recipe.dishId) ?? 0;
    if (used >= maxPerDish) return;
    counts.set(recipe.dishId, used + 1);
    result.push(recipe);
  });
  return result;
}

async function readJson<T>(filePath: string): Promise<T> {
  const text = await readFile(filePath, "utf8");
  return JSON.parse(text) as T;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
