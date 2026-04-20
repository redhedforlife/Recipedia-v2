import type { EditorialSection } from "@/lib/types";

export const burgersHero = {
  eyebrow: "Primary family wedge",
  title: "Burgers, made editorial instead of encyclopedic",
  description:
    "This page is intentionally opinionated. It leads with the burger styles most people recognize, then gives the supporting techniques, ingredients, methods, creators, and recipe hooks that make the lineage worth exploring."
};

export const burgerSections: EditorialSection[] = [
  {
    id: "dishes",
    title: "Top burger styles",
    description: "Show the iconic branches first and keep the long tail behind expansion.",
    initialVisibleCount: 6,
    items: [
      {
        id: "burger-style-cheeseburger",
        slug: "cheeseburger",
        title: "Cheeseburger",
        href: "/dishes/cheeseburger",
        description: "The default burger branch: beef, cheese, bun, and the clearest introduction to burger variation.",
        eyebrow: "Iconic burger",
        subtitle: "The baseline burger style",
        tags: ["Iconic", "Starter"],
        entityType: "dish",
        editorialRank: 100,
        priorityScore: 100,
        isFeatured: true,
        launchPriority: 100
      },
      {
        id: "burger-style-smashburger",
        slug: "smashburger",
        title: "Smashburger",
        href: "/dishes/smashburger",
        description: "Thin patties pressed hard against the hot surface for lacy edges and deep crust.",
        eyebrow: "Technique-first style",
        subtitle: "Crust, speed, and high heat",
        tags: ["Crust", "Griddle"],
        entityType: "dish",
        editorialRank: 98,
        priorityScore: 98
      },
      {
        id: "burger-style-oklahoma-onion-burger",
        slug: "oklahoma-onion-burger",
        title: "Oklahoma onion burger",
        href: "/dishes/oklahoma-onion-burger",
        description: "The burger style that makes onions part of the cooking process instead of just the topping set.",
        eyebrow: "Regional classic",
        subtitle: "Paper-thin onions pressed in",
        tags: ["Regional", "Onions"],
        entityType: "dish",
        editorialRank: 96,
        priorityScore: 96
      },
      {
        id: "burger-style-patty-melt",
        slug: "patty-melt",
        title: "Patty melt",
        href: "/dishes/patty-melt",
        description: "A burger-sandwich hybrid that gives the wedge a diner branch instead of only a bun branch.",
        eyebrow: "Diner branch",
        subtitle: "Griddled bread and melted cheese",
        tags: ["Diner", "Sandwich crossover"],
        entityType: "dish",
        editorialRank: 94,
        priorityScore: 94
      },
      {
        id: "burger-style-double-burger",
        slug: "double-burger",
        title: "Double burger",
        href: "/dishes/double-burger",
        description: "The stacked format that turns ratio, melting, and bite structure into the main event.",
        eyebrow: "Format branch",
        subtitle: "More surface area, more melt",
        tags: ["Format", "Cheese"],
        entityType: "dish",
        editorialRank: 90,
        priorityScore: 90
      },
      {
        id: "burger-style-slider",
        slug: "slider",
        title: "Slider",
        href: "/dishes/slider",
        description: "Small-format burgers that foreground shareability, softness, and onion-heavy griddle cooking.",
        eyebrow: "Small-format style",
        subtitle: "Compact, soft, fast-cooking",
        tags: ["Small format", "Party food"],
        entityType: "dish",
        editorialRank: 88,
        priorityScore: 88
      },
      {
        id: "burger-style-bacon-cheeseburger",
        slug: "bacon-cheeseburger",
        title: "Bacon cheeseburger",
        href: "/dishes/bacon-cheeseburger",
        description: "The indulgent mainstream branch where smoky pork becomes part of the default flavor logic.",
        eyebrow: "Indulgent style",
        subtitle: "Smoke and salt on top of the baseline",
        tags: ["Bacon", "Stacked flavors"],
        entityType: "dish",
        editorialRank: 84,
        priorityScore: 84
      }
    ]
  },
  {
    id: "techniques",
    title: "Related techniques",
    description: "The burger page should teach users what makes one style different from another.",
    initialVisibleCount: 5,
    items: [
      {
        id: "burger-technique-sear",
        slug: "sear",
        href: "/techniques/sear",
        title: "Searing",
        description: "Controls crust and Maillard development.",
        eyebrow: "Technique",
        entityType: "technique",
        editorialRank: 96,
        priorityScore: 96
      },
      {
        id: "burger-technique-griddle",
        slug: "griddle",
        href: "/techniques/griddle",
        title: "Griddling",
        description: "The flat-top move behind diner burgers, onion burgers, and patty melts.",
        eyebrow: "Technique",
        entityType: "technique",
        editorialRank: 94,
        priorityScore: 94
      },
      {
        id: "burger-technique-smash",
        slug: "smash",
        href: "/techniques/smash",
        title: "Smashing",
        description: "Increases contact with the hot surface and changes texture dramatically.",
        eyebrow: "Technique",
        entityType: "technique",
        editorialRank: 92,
        priorityScore: 92
      },
      {
        id: "burger-technique-toast",
        slug: "toast",
        href: "/techniques/toast",
        title: "Toasting buns",
        description: "Protects structure and adds a buttery, crisp boundary around the burger.",
        eyebrow: "Technique",
        entityType: "technique",
        editorialRank: 86,
        priorityScore: 86
      },
      {
        id: "burger-technique-rest",
        slug: "rest-after-cooking",
        href: "/techniques/rest-after-cooking",
        title: "Resting patties",
        description: "Useful for thicker burgers where heat carryover and juice retention matter.",
        eyebrow: "Technique",
        entityType: "technique",
        editorialRank: 82,
        priorityScore: 82
      }
    ]
  },
  {
    id: "ingredients",
    title: "Key ingredients",
    description: "Keep the ingredient layer specific to the burger wedge rather than generic to all American food.",
    initialVisibleCount: 6,
    items: [
      {
        id: "burger-ingredient-ground-beef",
        slug: "ground-beef",
        href: "/ingredients/ground-beef",
        title: "Ground beef",
        description: "The core patty ingredient and the fastest way to communicate what kind of burger we are talking about.",
        eyebrow: "Ingredient",
        entityType: "ingredient",
        editorialRank: 100,
        priorityScore: 100
      },
      {
        id: "burger-ingredient-cheese-slices",
        slug: "cheese-slices",
        href: "/ingredients/cheese-slices",
        title: "American cheese",
        description: "The melt-friendly default for smashburgers, doubles, and diner burgers.",
        eyebrow: "Ingredient",
        entityType: "ingredient",
        editorialRank: 96,
        priorityScore: 96
      },
      {
        id: "burger-ingredient-onions",
        slug: "yellow-onion",
        href: "/ingredients/yellow-onion",
        title: "Onions",
        description: "Raw, griddled, or melted into the patty depending on the style.",
        eyebrow: "Ingredient",
        entityType: "ingredient",
        editorialRank: 94,
        priorityScore: 94
      },
      {
        id: "burger-ingredient-pickles",
        slug: "dill-pickles",
        href: "/ingredients/dill-pickles",
        title: "Pickles",
        description: "Crunch and acid that reset the richness of cheese and beef.",
        eyebrow: "Ingredient",
        entityType: "ingredient",
        editorialRank: 88,
        priorityScore: 88
      },
      {
        id: "burger-ingredient-mustard",
        slug: "mustard",
        href: "/ingredients/mustard",
        title: "Mustard",
        description: "Sharpness and tang for diner-style, roadside, and onion-heavy burgers.",
        eyebrow: "Ingredient",
        entityType: "ingredient",
        editorialRank: 84,
        priorityScore: 84
      },
      {
        id: "burger-ingredient-potato-bun",
        slug: "potatoe-buns",
        href: "/ingredients/potatoe-buns",
        title: "Potato bun",
        description: "Soft, slightly sweet structure that supports modern burger builds well.",
        eyebrow: "Ingredient",
        entityType: "ingredient",
        editorialRank: 82,
        priorityScore: 82
      }
    ]
  },
  {
    id: "methods",
    title: "Related methods",
    description: "Methods let the page group burger styles by the kind of experience they create.",
    initialVisibleCount: 4,
    items: [
      {
        id: "burger-method-griddled",
        slug: "griddled",
        title: "Griddled",
        description: "The default method for smashburgers, onion burgers, and patty melts.",
        eyebrow: "Method",
        entityType: "method",
        editorialRank: 96,
        priorityScore: 96
      },
      {
        id: "burger-method-flame-grilled",
        slug: "flame-grilled",
        title: "Flame grilled",
        description: "The cookout branch: smoke-kissed edges and outdoor-burger energy.",
        eyebrow: "Method",
        entityType: "method",
        editorialRank: 88,
        priorityScore: 88
      },
      {
        id: "burger-method-smashed",
        slug: "smashed",
        title: "Smashed",
        description: "A technique-so-dominant it functions like a method category in burger language.",
        eyebrow: "Method",
        entityType: "method",
        editorialRank: 90,
        priorityScore: 90
      },
      {
        id: "burger-method-cast-iron-seared",
        slug: "cast-iron-seared",
        title: "Cast-iron seared",
        description: "The home-cook-friendly path when a dedicated flat top is not available.",
        eyebrow: "Method",
        entityType: "method",
        editorialRank: 84,
        priorityScore: 84
      }
    ]
  },
  {
    id: "creators",
    title: "Notable burger creators",
    description: "Put people alongside food and technique so the page feels editorial, not faceless.",
    initialVisibleCount: 4,
    items: []
  },
  {
    id: "recipes",
    title: "Recipe starting points",
    description: "Even if the data is still thin, the wedge should already suggest where to start cooking.",
    initialVisibleCount: 3,
    items: [
      {
        id: "burger-recipe-canonical",
        slug: "hamburger",
        title: "Canonical hamburger reference",
        href: "/recipes/hamburger",
        description: "The current seed-backed burger reference already in Recipedia.",
        eyebrow: "Recipe",
        entityType: "recipe",
        editorialRank: 92,
        priorityScore: 92
      },
      {
        id: "burger-recipe-build-your-own",
        slug: "hamburger-variation",
        title: "Build your own burger variation",
        href: "/recipes/hamburger/variation",
        description: "Jump straight into the Recipedia variation workflow from the burger wedge.",
        eyebrow: "Recipe",
        entityType: "recipe",
        editorialRank: 88,
        priorityScore: 88
      },
      {
        id: "burger-recipe-starter",
        slug: "best-starter-burger-recipe",
        title: "Best starter burger recipe",
        description: "Editorial recipe slot reserved for the first truly guided burger recipe import.",
        eyebrow: "Recipe slot",
        tags: ["Coming soon"],
        entityType: "recipe",
        isStub: true,
        editorialRank: 80,
        priorityScore: 78
      }
    ]
  }
];

export const burgerSubtypeDetails = {
  cheeseburger: {
    title: "Cheeseburger",
    summary: "A cheeseburger is the default modern burger branch: beef patty, melted cheese, bun, and toppings balanced between richness, salt, acidity, and crunch.",
    whyItMatters:
      "It is the most recognizable burger style and the best entry point for understanding how burger variations work. Once you understand cheese choice, melt timing, bun selection, and topping balance, the rest of the burger tree gets easier to read.",
    definingTechnique: "Time the melt so the cheese becomes part of the patty rather than a separate layer laid on top at the last second.",
    keyIngredients: ["Ground beef", "American cheese", "Bun", "Pickles", "Onions"],
    relatedStyles: ["smashburger", "double-burger", "bacon-cheeseburger"],
    creators: ["j-kenji-lopez-alt", "binging-with-babish", "george-motz"]
  },
  smashburger: {
    title: "Smashburger",
    summary: "A smashburger is a thin burger patty pressed onto a hot surface to maximize crust, speed, and edge texture.",
    whyItMatters:
      "It shows how technique alone can create a new burger identity. The style is less about ingredients changing and more about the patty’s contact with the heat source.",
    definingTechnique: "Press the ball of beef firmly into the griddle early to create maximum browning and lacy, crisp edges.",
    keyIngredients: ["Ground beef", "American cheese", "Onions", "Pickles", "Potato bun"],
    relatedStyles: ["cheeseburger", "oklahoma-onion-burger", "double-burger"],
    creators: ["j-kenji-lopez-alt", "binging-with-babish", "george-motz"]
  },
  "oklahoma-onion-burger": {
    title: "Oklahoma onion burger",
    summary: "The Oklahoma onion burger is a griddled burger style where a mound of thin onions gets smashed directly into the patty as it cooks.",
    whyItMatters:
      "It is one of the clearest regional burger styles in American cooking and a perfect example of technique, thrift, and flavor all working together. The onions are not garnish here; they are part of the identity.",
    definingTechnique: "Pile the onions on the beef first, then smash them into the patty so they steam, soften, and caramelize against the griddle.",
    keyIngredients: ["Ground beef", "Yellow onion", "American cheese", "Mustard", "Soft bun"],
    relatedStyles: ["smashburger", "cheeseburger", "patty-melt"],
    creators: ["george-motz", "j-kenji-lopez-alt"]
  },
  "patty-melt": {
    title: "Patty melt",
    summary: "A patty melt is the diner branch of burger lineage: a burger patty served between griddled bread with melted cheese and onions.",
    whyItMatters:
      "It exposes the overlap between burgers and sandwiches, which is exactly the kind of cross-category lineage Recipedia should surface well. It also spotlights bread choice as a major style variable.",
    definingTechnique: "Griddle the bread until it crisps while the cheese and onions collapse into the patty.",
    keyIngredients: ["Ground beef", "Sliced bread", "Cheese", "Onions", "Butter"],
    relatedStyles: ["cheeseburger", "oklahoma-onion-burger", "double-burger"],
    creators: ["binging-with-babish", "j-kenji-lopez-alt"]
  },
  "double-burger": {
    title: "Double burger",
    summary: "A double burger uses two thinner patties instead of one thicker one to increase crust, cheese layers, and bite balance.",
    whyItMatters:
      "It demonstrates that burger format is a design decision, not a trivial scaling choice. More patties change texture, melt distribution, and how toppings sit inside the sandwich.",
    definingTechnique: "Cook thinner patties quickly and stack them while the cheese is still fusing to the meat.",
    keyIngredients: ["Ground beef", "Cheese", "Bun", "Pickles", "Sauce"],
    relatedStyles: ["cheeseburger", "smashburger", "bacon-cheeseburger"],
    creators: ["binging-with-babish", "matty-matheson"]
  },
  slider: {
    title: "Slider",
    summary: "A slider is a small-format burger built for softness, speed, and repeatable bites rather than one large centerpiece sandwich.",
    whyItMatters:
      "It broadens the burger wedge beyond a single idealized build. Size changes everything: crust ratio, bun choice, topping restraint, and serving context.",
    definingTechnique: "Keep the patties thin and the build restrained so the burger stays balanced at a smaller size.",
    keyIngredients: ["Ground beef", "Onions", "Soft rolls", "Pickles", "Cheese"],
    relatedStyles: ["cheeseburger", "double-burger", "oklahoma-onion-burger"],
    creators: ["george-motz"]
  },
  "bacon-cheeseburger": {
    title: "Bacon cheeseburger",
    summary: "A bacon cheeseburger layers smoky pork on top of the cheeseburger baseline for a richer, more indulgent branch.",
    whyItMatters:
      "It is one of the clearest examples of how a familiar burger becomes a subtype through one dominant add-on that changes the whole flavor balance.",
    definingTechnique: "Crisp the bacon enough to add snap without overwhelming the burger’s texture.",
    keyIngredients: ["Ground beef", "American cheese", "Bacon", "Onions", "Pickles"],
    relatedStyles: ["cheeseburger", "double-burger", "smashburger"],
    creators: ["matty-matheson", "binging-with-babish"]
  }
} as const;
