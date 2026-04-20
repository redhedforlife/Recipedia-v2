import { americanHero, americanSections } from "@/data/editorial/american";
import { burgerSections, burgerSubtypeDetails, burgersHero } from "@/data/editorial/burgers";
import { creators } from "@/data/editorial/creators";
import { featuredCuisineOrder } from "@/data/editorial/featured";
import { getData } from "@/lib/data";
import type {
  Creator,
  Cuisine,
  EditorialCardItem,
  EditorialSection,
  ExploreExperience,
  ExploreLanding,
  ExploreLandingCard,
  SeedData
} from "@/lib/types";

type CreatorProfile = {
  creator: Creator;
  sections: EditorialSection[];
};

const cuisineConfigBySlug = new Map(featuredCuisineOrder.map((item) => [item.slug, item]));
const creatorBySlug = new Map(creators.map((creator) => [creator.slug, creator]));

export function getTopEntitiesByType(items: EditorialCardItem[], limit?: number) {
  const sorted = [...items].sort(
    (left, right) =>
      (right.priorityScore ?? 0) - (left.priorityScore ?? 0) ||
      (right.editorialRank ?? 0) - (left.editorialRank ?? 0) ||
      left.title.localeCompare(right.title)
  );
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export async function getFeaturedCuisineSections(): Promise<ExploreLanding> {
  const data = await getData();
  const cards = data.cuisines
    .map((cuisine) => buildCuisineCard(data, cuisine))
    .sort(
      (left, right) =>
        (right.priorityScore ?? 0) - (left.priorityScore ?? 0) ||
        (right.editorialRank ?? 0) - (left.editorialRank ?? 0) ||
        left.title.localeCompare(right.title)
    );

  return {
    spotlight: cards.find((item) => item.slug === "american"),
    featured: cards.slice(0, 10),
    more: cards.slice(10)
  };
}

export async function getGraphLandingExperience(): Promise<ExploreExperience> {
  const data = await getData();
  const landing = await getFeaturedCuisineSections();

  return {
    title: "Explore the food map",
    eyebrow: "Ranked entry point",
    description:
      "Start with the most important cuisine nodes first, then move into categories, dish families, techniques, and recipes as you narrow the map.",
    highlights: ["Map-first by default", "Ranked top cuisines", "Deep paths open as you click in"],
    stats: [
      { label: "Top cuisines", value: String(landing.featured.length) },
      { label: "Total cuisines", value: String(data.cuisines.length) },
      { label: "Dish families", value: String(data.families.length) }
    ],
    sections: [
      {
        id: "families",
        title: "Top cuisines right now",
        description: "These are the first cuisine nodes surfaced on the map. Use “More cuisines” to expand the cluster.",
        initialVisibleCount: landing.featured.length,
        items: [...landing.featured, ...landing.more].map((item) => ({
          ...item,
          description: item.subtitle ?? item.description
        }))
      }
    ],
    graphHref: "/graph"
  };
}

export async function getAmericanExploreExperience(): Promise<ExploreExperience | undefined> {
  const data = await getData();
  const cuisine = data.cuisines.find((candidate) => candidate.slug === "american");
  if (!cuisine) return undefined;

  const cuisineContext = getCuisineContext(data, cuisine.slug);
  const creatorItems = getRankedCreatorsForNode("american");
  const sections = americanSections.map((section) =>
    section.id === "creators" ? { ...section, items: creatorItems } : section
  );

  return {
    title: cuisine.displayName,
    eyebrow: americanHero.eyebrow,
    description: americanHero.description,
    highlights: ["Families and dishes ranked together", "Cross-links between dishes and techniques", "Creators visible as a core dimension"],
    stats: [
      { label: "Linked families", value: String(cuisineContext.familyCount) },
      { label: "Curated sections", value: String(sections.length) },
      { label: "Launch creators", value: String(creatorItems.length) }
    ],
    sections,
    graphHref: "/graph?mode=cuisine&focus=american"
  };
}

export async function getBurgerExploreExperience(): Promise<ExploreExperience | undefined> {
  const data = await getData();
  const category = data.categories.find((candidate) => candidate.slug === "burgers");
  const family = data.families.find((candidate) => candidate.slug === "hamburger");
  if (!category || !family) return undefined;

  const creatorItems = getRankedCreatorsForNode("burgers");
  const sections = burgerSections.map((section) =>
    section.id === "creators" ? { ...section, items: creatorItems } : section
  );

  const burgerRecipes = data.recipes.filter((recipe) => recipe.recipeFamilyId === family.id);

  return {
    title: "Burgers",
    eyebrow: burgersHero.eyebrow,
    description: burgersHero.description,
    highlights: ["Lead with iconic burger styles", "Keep technique visible", "Use this branch as the example implementation"],
    stats: [
      { label: "Core family", value: family.displayName },
      { label: "Subtype cards", value: String(getRankedDishesForFamily("burgers").length) },
      { label: "Seed recipes", value: String(burgerRecipes.length) }
    ],
    sections,
    graphHref: "/graph?mode=dish&focus=hamburger"
  };
}

export function getRankedFamiliesForCuisine(slug: string) {
  if (slug === "american") {
    return getTopEntitiesByType(americanSections.find((section) => section.id === "families")?.items ?? []);
  }
  return [];
}

export function getRankedDishesForFamily(slug: string) {
  if (slug === "burgers") {
    return getTopEntitiesByType(burgerSections.find((section) => section.id === "dishes")?.items ?? []);
  }
  return [];
}

export function getRankedCreatorsForNode(slug: string) {
  return getTopEntitiesByType(
    creators
      .filter((creator) =>
        creator.cuisineLinks.includes(slug) ||
        creator.familyLinks.includes(slug) ||
        creator.dishLinks.includes(slug) ||
        creator.techniqueLinks.includes(slug)
      )
      .map((creator) => creatorCard(creator))
  );
}

export async function getCreatorProfile(slug: string): Promise<CreatorProfile | undefined> {
  const creator = creatorBySlug.get(slug);
  if (!creator) return undefined;

  const cuisineItems = creator.cuisineLinks
    .map((cuisineSlug) => creatorCuisineCard(cuisineSlug))
    .filter(Boolean) as EditorialCardItem[];
  const familyItems = creator.familyLinks
    .map((familySlug) => creatorFamilyCard(familySlug))
    .filter(Boolean) as EditorialCardItem[];
  const dishItems = creator.dishLinks
    .map((dishSlug) => dishCardBySlug(dishSlug))
    .filter(Boolean) as EditorialCardItem[];
  const techniqueItems = creator.techniqueLinks
    .map((techniqueSlug) => creatorTechniqueCard(techniqueSlug))
    .filter(Boolean) as EditorialCardItem[];

  return {
    creator,
    sections: [
      {
        id: "families",
        title: "Linked cuisines",
        description: "The cuisine lanes this creator helps make legible inside the current Recipedia wedge.",
        items: cuisineItems
      },
      {
        id: "dishes",
        title: "Notable dishes",
        description: "Dish styles this creator most clearly helps explain or popularize in the current wedge.",
        items: dishItems
      },
      {
        id: "techniques",
        title: "Techniques",
        description: "Technique ideas that show up repeatedly around this creator’s work or teaching style.",
        items: techniqueItems
      },
      {
        id: "recipes",
        title: "Related families",
        description: "Family lanes worth exploring next from this creator’s perspective.",
        items: familyItems
      }
    ]
  };
}

export function getDishSpotlight(slug: string) {
  const detail = burgerSubtypeDetails[slug as keyof typeof burgerSubtypeDetails];
  if (!detail) return undefined;

  return {
    slug,
    ...detail,
    creatorCards: detail.creators
      .map((creatorSlug) => creatorBySlug.get(creatorSlug))
      .filter(Boolean)
      .map((creator) => creatorCard(creator!)),
    relatedStyleCards: detail.relatedStyles
      .map((styleSlug) => dishCardBySlug(styleSlug))
      .filter(Boolean) as EditorialCardItem[],
    recommendedRecipes: [
      {
        id: `${slug}-recipe-canonical`,
        slug: "hamburger",
        title: "Canonical hamburger reference",
        href: "/recipes/hamburger",
        description: "Use the existing seed recipe as the current baseline, then branch into a personal version.",
        eyebrow: "Recipe",
        entityType: "recipe",
        editorialRank: 90,
        priorityScore: 90
      },
      {
        id: `${slug}-recipe-variation`,
        slug: "hamburger-variation",
        title: "Create your own variation",
        href: "/recipes/hamburger/variation",
        description: "The quickest way to turn a burger style into a personal lineage branch inside the app.",
        eyebrow: "Variation flow",
        entityType: "recipe",
        editorialRank: 86,
        priorityScore: 86
      }
    ]
  };
}

function buildCuisineCard(data: SeedData, cuisine: Cuisine): ExploreLandingCard {
  const config = cuisineConfigBySlug.get(cuisine.slug);
  const context = getCuisineContext(data, cuisine.slug);
  const editorialRank = config?.editorialRank ?? 0;
  const priorityScore =
    editorialRank * 4 +
    (config?.launchPriority ?? 0) * 5 +
    Math.min(context.familyCount, 18) * 1.4 +
    Math.min(context.recipeCount, 16) * 1.2;

  return {
    id: `explore-cuisine-${cuisine.slug}`,
    slug: cuisine.slug,
    title: cuisine.displayName,
    href: `/cuisines/${cuisine.slug}`,
    description: cuisine.description,
    eyebrow: cuisine.regionGroup ?? "Cuisine",
    subtitle: config?.subtitle ?? cuisine.description,
    meta: `${context.familyCount} families · ${context.recipeCount} recipes`,
    tags: context.topCategories,
    entityType: "cuisine",
    editorialRank,
    priorityScore,
    isFeatured: config?.isFeatured,
    launchPriority: config?.launchPriority,
    preview: config?.preview ?? context.topCategories,
    tone: config?.tone ?? "ember"
  };
}

function getCuisineContext(data: SeedData, slug: string) {
  const cuisine = data.cuisines.find((candidate) => candidate.slug === slug);
  if (!cuisine) {
    return { familyCount: 0, recipeCount: 0, topCategories: [] as string[] };
  }

  const familyIds = new Set(
    data.cuisineDishFamilies
      .filter((link) => link.cuisineId === cuisine.id)
      .map((link) => link.dishFamilyId)
  );
  data.families
    .filter((family) => family.cuisineId === cuisine.id)
    .forEach((family) => familyIds.add(family.id));

  const families = data.families.filter((family) => familyIds.has(family.id));
  const recipes = data.recipes.filter((recipe) => familyIds.has(recipe.recipeFamilyId));
  const topCategories = Array.from(
    new Set(
      families
        .map((family) => family.category)
        .filter(Boolean)
        .map((category) => category.replace(/-/g, " "))
    )
  ).slice(0, 3);

  return {
    familyCount: families.length,
    recipeCount: recipes.length,
    topCategories
  };
}

function creatorCard(creator: Creator): EditorialCardItem {
  return {
    id: creator.id,
    slug: creator.slug,
    title: creator.displayName,
    href: `/creators/${creator.slug}`,
    description: creator.shortBio,
    eyebrow: creator.creatorCategory,
    meta: creator.region,
    tags: creator.familyLinks.slice(0, 3).map((item) => titleize(item)),
    entityType: "creator",
    editorialRank: creator.editorialRank,
    priorityScore: creator.popularityScore ?? creator.priorityScore,
    isFeatured: creator.isFeatured,
    launchPriority: creator.launchPriority
  };
}

function creatorCuisineCard(slug: string) {
  const config = featuredCuisineOrder.find((item) => item.slug === slug);
  if (!config) return undefined;
  return {
    id: `creator-cuisine-${slug}`,
    slug,
    title: titleize(slug),
    href: `/cuisines/${slug}`,
    description: config.subtitle,
    eyebrow: "Cuisine",
    tags: config.preview,
    entityType: "cuisine" as const,
    editorialRank: config.editorialRank,
    priorityScore: config.editorialRank
  };
}

function creatorFamilyCard(slug: string) {
  if (slug === "burgers") {
    return {
      id: "creator-family-burgers",
      slug,
      title: "Burgers",
      href: "/families/burgers",
      description: "The current flagship family wedge in Recipedia.",
      eyebrow: "Family",
      entityType: "family" as const,
      editorialRank: 100,
      priorityScore: 100
    };
  }

  if (slug === "sandwiches") {
    return {
      id: "creator-family-sandwiches",
      slug,
      title: "Sandwiches",
      href: "/categories/sandwiches",
      description: "The broader handheld lane surrounding burgers, melts, dips, and stacked builds.",
      eyebrow: "Family lane",
      entityType: "family" as const,
      editorialRank: 84,
      priorityScore: 82
    };
  }

  if (slug === "barbecue") {
    return {
      id: "creator-family-barbecue",
      slug,
      title: "Barbecue",
      description: "Smoke, bark, and long-form American live-fire cooking.",
      eyebrow: "Family lane",
      entityType: "family" as const,
      editorialRank: 90,
      priorityScore: 88
    };
  }

  if (slug === "hamburger") {
    return {
      id: "creator-family-hamburger",
      slug,
      title: "Hamburger",
      href: "/families/hamburger",
      description: "The seed-backed family record behind the burgers wedge.",
      eyebrow: "Family",
      entityType: "family" as const,
      editorialRank: 88,
      priorityScore: 86
    };
  }

  if (slug === "chili") {
    return {
      id: "creator-family-chili",
      slug,
      title: "Chili",
      href: "/families/chili",
      description: "A bowl-oriented American lineage with strong regional identity.",
      eyebrow: "Family",
      entityType: "family" as const,
      editorialRank: 80,
      priorityScore: 78
    };
  }

  if (slug === "fried-chicken") {
    return {
      id: "creator-family-fried-chicken",
      slug,
      title: "Fried chicken",
      href: "/categories/fried-chicken-dishes",
      description: "The crisp, seasoned comfort-food branch of the cuisine.",
      eyebrow: "Family lane",
      entityType: "family" as const,
      editorialRank: 78,
      priorityScore: 76
    };
  }

  return undefined;
}

function creatorTechniqueCard(slug: string) {
  const title = titleize(slug.replace(/-/g, " "));
  return {
    id: `creator-technique-${slug}`,
    slug,
    title,
    href: `/techniques/${slug}`,
    description: `Explore ${title.toLowerCase()} as part of the current wedge.`,
    eyebrow: "Technique",
    entityType: "technique" as const,
    editorialRank: 70,
    priorityScore: 70
  };
}

function dishCardBySlug(slug: string) {
  const detail = burgerSubtypeDetails[slug as keyof typeof burgerSubtypeDetails];
  if (!detail) return undefined;
  return {
    id: `dish-card-${slug}`,
    slug,
    title: detail.title,
    href: `/dishes/${slug}`,
    description: detail.summary,
    eyebrow: "Dish",
    tags: detail.relatedStyles.map((item) => titleize(item)).slice(0, 3),
    entityType: "dish" as const,
    editorialRank: 90,
    priorityScore: 90
  };
}

function titleize(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
