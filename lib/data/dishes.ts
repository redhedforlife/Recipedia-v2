import { prisma } from "@/lib/db";

export type DishDetail = {
  id: string;
  slug: string;
  displayName: string;
  description: string;
  confidenceScore?: number;
  recipeCount: number;
  cuisine?: {
    id: string;
    slug: string;
    displayName: string;
  };
  category?: {
    id: string;
    slug: string;
    displayName: string;
  };
  family?: {
    id: string;
    slug: string;
    displayName: string;
  };
  aliases: string[];
  canonicalIngredients: Array<{
    ingredientId: string;
    displayName: string;
    canonicalName: string;
    role: string;
    isCore: boolean;
    importance: number;
  }>;
  recipes: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    isSourceRecipe: boolean;
    isUserVariation: boolean;
  }>;
};

export async function getDishDetailBySlug(slug: string): Promise<DishDetail | undefined> {
  const dish = await prisma.dish.findUnique({
    where: { slug },
    include: {
      cuisine: true,
      category: true,
      family: true,
      aliases: {
        orderBy: [{ isPreferred: "desc" }, { alias: "asc" }]
      },
      canonicalIngredients: {
        include: { ingredient: true },
        orderBy: [{ isCore: "desc" }, { importance: "desc" }, { ingredientId: "asc" }]
      },
      recipes: {
        orderBy: [{ isSourceRecipe: "desc" }, { createdAt: "desc" }]
      }
    }
  });

  if (!dish) return undefined;

  return {
    id: dish.id,
    slug: dish.slug,
    displayName: dish.displayName,
    description: dish.description,
    confidenceScore: dish.confidenceScore ?? undefined,
    recipeCount: dish.recipeCount,
    cuisine: dish.cuisine
      ? {
          id: dish.cuisine.id,
          slug: dish.cuisine.slug,
          displayName: dish.cuisine.displayName
        }
      : undefined,
    category: dish.category
      ? {
          id: dish.category.id,
          slug: dish.category.slug,
          displayName: dish.category.displayName
        }
      : undefined,
    family: dish.family
      ? {
          id: dish.family.id,
          slug: dish.family.slug,
          displayName: dish.family.displayName
        }
      : undefined,
    aliases: dish.aliases.map((alias) => alias.alias),
    canonicalIngredients: dish.canonicalIngredients.map((item) => ({
      ingredientId: item.ingredientId,
      displayName: item.ingredient.displayName,
      canonicalName: item.ingredient.canonicalName,
      role: item.role,
      isCore: item.isCore,
      importance: item.importance
    })),
    recipes: dish.recipes.map((recipe) => ({
      id: recipe.id,
      slug: recipe.slug,
      title: recipe.title,
      description: recipe.description,
      isSourceRecipe: recipe.isSourceRecipe,
      isUserVariation: recipe.isUserVariation
    }))
  };
}
