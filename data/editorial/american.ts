import type { EditorialSection } from "@/lib/types";

export const americanHero = {
  eyebrow: "Launch wedge",
  title: "American cuisine, ranked for discovery",
  description:
    "This first pass turns American food into a guided explore experience: iconic families first, notable dishes next, then the techniques, ingredients, methods, and creators that make the cuisine legible."
};

export const americanSections: EditorialSection[] = [
  {
    id: "families",
    title: "Top dish families",
    description: "Lead with the big, recognizable American lanes instead of dumping the full taxonomy.",
    initialVisibleCount: 6,
    items: [
      {
        id: "american-family-burgers",
        slug: "burgers",
        title: "Burgers",
        href: "/families/burgers",
        description: "The strongest wedge in the product: burger lineage, styles, methods, and creators.",
        eyebrow: "Primary wedge",
        subtitle: "Cheeseburger, smashburger, patty melt",
        tags: ["Featured", "Iconic", "Launch"],
        entityType: "family",
        editorialRank: 100,
        priorityScore: 100,
        isFeatured: true,
        launchPriority: 100
      },
      {
        id: "american-family-barbecue",
        slug: "barbecue",
        title: "Barbecue",
        description: "Smoke, bark, low-and-slow cooking, and regional identity from brisket to ribs.",
        eyebrow: "American family",
        subtitle: "Brisket, pork, smoke",
        tags: ["Smoke", "Regional"],
        entityType: "family",
        editorialRank: 96,
        priorityScore: 94,
        launchPriority: 85
      },
      {
        id: "american-family-sandwiches",
        slug: "sandwiches",
        title: "Sandwiches",
        href: "/categories/sandwiches",
        description: "Club sandwiches, French dips, patties on buns, and the broader handheld side of the cuisine.",
        eyebrow: "American family",
        subtitle: "Club, dip, handheld classics",
        tags: ["Handheld", "Everyday"],
        entityType: "family",
        editorialRank: 92,
        priorityScore: 90
      },
      {
        id: "american-family-fried-chicken",
        slug: "fried-chicken",
        title: "Fried chicken",
        href: "/categories/fried-chicken-dishes",
        description: "Crunch, seasoning, and regional comfort-food authority in one lane.",
        eyebrow: "American family",
        subtitle: "Crisp crust, juicy meat",
        tags: ["Southern", "Comfort"],
        entityType: "family",
        editorialRank: 88,
        priorityScore: 86
      },
      {
        id: "american-family-chili",
        slug: "chili",
        href: "/families/chili",
        title: "Chili",
        description: "A bowl-first lineage with arguments about heat, beans, meat, and regional identity baked in.",
        eyebrow: "American family",
        subtitle: "Texas debates and weeknight bowls",
        tags: ["Stew", "Regional"],
        entityType: "family",
        editorialRank: 84,
        priorityScore: 82
      },
      {
        id: "american-family-mac-and-cheese",
        slug: "mac-and-cheese",
        title: "Mac and cheese",
        description: "A classic American comfort lane that belongs in the wedge even before the deeper lineage is built out.",
        eyebrow: "American family",
        subtitle: "Baked, stovetop, creamy",
        tags: ["Comfort", "Coming soon"],
        entityType: "family",
        isStub: true,
        editorialRank: 80,
        priorityScore: 76
      }
    ]
  },
  {
    id: "dishes",
    title: "Notable dishes",
    description: "Show the recognizable entry points users are most likely to click first.",
    initialVisibleCount: 6,
    items: [
      {
        id: "american-dish-cheeseburger",
        slug: "cheeseburger",
        title: "Cheeseburger",
        href: "/dishes/cheeseburger",
        description: "The default American burger branch: beef, cheese, bun, and a huge amount of room for variation.",
        eyebrow: "Burger subtype",
        subtitle: "Iconic entry point",
        tags: ["Burgers", "Launch"],
        entityType: "dish",
        editorialRank: 100,
        priorityScore: 100
      },
      {
        id: "american-dish-oklahoma-onion-burger",
        slug: "oklahoma-onion-burger",
        title: "Oklahoma onion burger",
        href: "/dishes/oklahoma-onion-burger",
        description: "The burger style that best explains why onions, smashing, and griddle technique matter.",
        eyebrow: "Burger subtype",
        subtitle: "Onion-steamed griddle classic",
        tags: ["Burgers", "Regional"],
        entityType: "dish",
        editorialRank: 98,
        priorityScore: 98
      },
      {
        id: "american-dish-patty-melt",
        slug: "patty-melt",
        title: "Patty melt",
        href: "/dishes/patty-melt",
        description: "Diner-adjacent burger lineage that pulls sandwiches and burgers into the same conversation.",
        eyebrow: "Burger subtype",
        subtitle: "Griddled bread, onions, beef",
        tags: ["Burgers", "Sandwiches"],
        entityType: "dish",
        editorialRank: 96,
        priorityScore: 96
      },
      {
        id: "american-dish-texas-brisket",
        slug: "texas-brisket",
        title: "Texas brisket",
        description: "The barbecue anchor for the American page: smoke, patience, bark, and slicing technique.",
        eyebrow: "Barbecue staple",
        subtitle: "Smoke and bark",
        tags: ["Barbecue", "Texas"],
        entityType: "dish",
        isStub: true,
        editorialRank: 88,
        priorityScore: 86
      },
      {
        id: "american-dish-pulled-pork-sandwich",
        slug: "pulled-pork-sandwich",
        title: "Pulled pork sandwich",
        description: "A great bridge between sandwiches and barbecue in the American wedge.",
        eyebrow: "Sandwich staple",
        subtitle: "Slow-cooked pork, slaw, bun",
        tags: ["Barbecue", "Sandwiches"],
        entityType: "dish",
        isStub: true,
        editorialRank: 84,
        priorityScore: 82
      },
      {
        id: "american-dish-buffalo-wings",
        slug: "buffalo-wings",
        title: "Buffalo wings",
        description: "An iconic snack lane that broadens the American page beyond buns and smoke.",
        eyebrow: "American classic",
        subtitle: "Fry, sauce, repeat",
        tags: ["Frying", "Bar food"],
        entityType: "dish",
        isStub: true,
        editorialRank: 80,
        priorityScore: 78
      }
    ]
  },
  {
    id: "techniques",
    title: "Top techniques",
    description: "Keep the technique layer visible so the cuisine feels teachable, not just browsable.",
    initialVisibleCount: 5,
    items: [
      {
        id: "american-technique-smoke",
        slug: "smoke",
        title: "Smoking",
        href: "/techniques/smoke",
        description: "The defining technique behind barbecue culture and long-form American meat cooking.",
        eyebrow: "Technique",
        entityType: "technique",
        editorialRank: 96,
        priorityScore: 96
      },
      {
        id: "american-technique-grill",
        slug: "grill",
        href: "/techniques/grill",
        title: "Grilling",
        description: "A core technique for burgers, steaks, skewers, and weekend cookout food.",
        eyebrow: "Technique",
        entityType: "technique",
        editorialRank: 94,
        priorityScore: 92
      },
      {
        id: "american-technique-sear",
        slug: "sear",
        href: "/techniques/sear",
        title: "Searing",
        description: "The high-heat move that shapes burger crust, steak browning, and pan-first cooking.",
        eyebrow: "Technique",
        entityType: "technique",
        editorialRank: 92,
        priorityScore: 90
      },
      {
        id: "american-technique-griddle",
        slug: "griddle",
        href: "/techniques/griddle",
        title: "Griddling",
        description: "Flat-top cooking for burgers, patties, onions, and diner-style sandwiches.",
        eyebrow: "Technique",
        entityType: "technique",
        editorialRank: 90,
        priorityScore: 88
      },
      {
        id: "american-technique-deep-fry",
        slug: "deep-fry",
        href: "/techniques/deep-fry",
        title: "Frying",
        description: "The technique lane that supports wings, fried chicken, fries, and countless comfort classics.",
        eyebrow: "Technique",
        entityType: "technique",
        editorialRank: 86,
        priorityScore: 84
      }
    ]
  },
  {
    id: "ingredients",
    title: "Key ingredients",
    description: "Ingredients make the cuisine page feel tactile and immediately useful.",
    initialVisibleCount: 6,
    items: [
      {
        id: "american-ingredient-beef",
        slug: "beef",
        href: "/ingredients/beef",
        title: "Beef",
        description: "The protein that anchors burgers, chili, steaks, and a big part of the American comfort canon.",
        eyebrow: "Ingredient",
        entityType: "ingredient",
        editorialRank: 96,
        priorityScore: 96
      },
      {
        id: "american-ingredient-pork",
        slug: "pork",
        href: "/ingredients/pork",
        title: "Pork",
        description: "Central to barbecue, pulled pork, bacon-heavy sandwiches, and Southern cooking lanes.",
        eyebrow: "Ingredient",
        entityType: "ingredient",
        editorialRank: 90,
        priorityScore: 88
      },
      {
        id: "american-ingredient-cheese",
        slug: "cheese",
        href: "/ingredients/cheese",
        title: "Cheese",
        description: "American cuisine feels incomplete without melts, slices, casseroles, and burger toppings.",
        eyebrow: "Ingredient",
        entityType: "ingredient",
        editorialRank: 88,
        priorityScore: 86
      },
      {
        id: "american-ingredient-onion",
        slug: "onion",
        href: "/ingredients/onion",
        title: "Onion",
        description: "Raw, caramelized, griddled, or fried, onion ties burgers and sandwiches together.",
        eyebrow: "Ingredient",
        entityType: "ingredient",
        editorialRank: 86,
        priorityScore: 84
      },
      {
        id: "american-ingredient-pickles",
        slug: "dill-pickles",
        href: "/ingredients/dill-pickles",
        title: "Pickles",
        description: "Acid and crunch that balance burgers, sandwiches, and bar-food flavors.",
        eyebrow: "Ingredient",
        entityType: "ingredient",
        editorialRank: 84,
        priorityScore: 82
      },
      {
        id: "american-ingredient-potatoes",
        slug: "potatoes",
        href: "/ingredients/potatoes",
        title: "Potatoes",
        description: "Fries, buns, sides, and comfort-food starch that belong in the American wedge.",
        eyebrow: "Ingredient",
        entityType: "ingredient",
        editorialRank: 82,
        priorityScore: 80
      }
    ]
  },
  {
    id: "methods",
    title: "Cooking methods",
    description: "Methods keep the explore page legible for beginners who think in outcomes rather than taxonomy.",
    initialVisibleCount: 4,
    items: [
      {
        id: "american-method-smoked",
        slug: "smoked",
        title: "Smoked",
        description: "Low-and-slow, bark-building American barbecue cooking.",
        eyebrow: "Method",
        entityType: "method",
        editorialRank: 92,
        priorityScore: 92
      },
      {
        id: "american-method-grilled",
        slug: "grilled",
        title: "Grilled",
        description: "Cookout-friendly heat for burgers, meats, vegetables, and skewers.",
        eyebrow: "Method",
        entityType: "method",
        editorialRank: 90,
        priorityScore: 88
      },
      {
        id: "american-method-fried",
        slug: "fried",
        title: "Fried",
        description: "Crisp, comforting, and central to bar snacks and Southern favorites.",
        eyebrow: "Method",
        entityType: "method",
        editorialRank: 84,
        priorityScore: 82
      },
      {
        id: "american-method-slow-cooked",
        slug: "slow-cooked",
        title: "Slow-cooked",
        description: "Braised, simmered, or held over heat long enough to turn comfort food into a category of its own.",
        eyebrow: "Method",
        entityType: "method",
        editorialRank: 82,
        priorityScore: 80
      }
    ]
  },
  {
    id: "creators",
    title: "Notable creators",
    description: "Food exploration feels warmer and more opinionated when people are part of the graph.",
    initialVisibleCount: 6,
    items: []
  }
];
