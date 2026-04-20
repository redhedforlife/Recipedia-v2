import type { SeedData } from "@/lib/types";
import {
  categorySeeds,
  cookingMethodSeeds,
  cuisineSeeds,
  difficultyBandSeeds,
  dishFamilyRelatedDishFamilySeeds,
  existingCuisineDishFamilies,
  existingDishFamilyIngredients,
  existingDishFamilyMethods,
  existingDishFamilyTechniques,
  ingredientCategorySeeds,
  ontologyIngredientSeeds,
  ontologyTechniqueSeeds,
  techniqueCategorySeeds,
  skeletonCuisineDishFamilies,
  skeletonDishFamilyIngredients,
  skeletonDishFamilyMethods,
  skeletonDishFamilyTechniques,
  skeletonFamilies
} from "@/data/ontology";

const importedAt = "2026-04-15T12:00:00.000Z";
const now = importedAt;

export const seedData: SeedData = {
  cuisines: cuisineSeeds,
  categories: categorySeeds,
  ingredientCategories: ingredientCategorySeeds,
  techniqueCategories: techniqueCategorySeeds,
  cookingMethods: cookingMethodSeeds,
  difficultyBands: difficultyBandSeeds,
  creators: [],
  sources: [
    {
      id: "src-best-chili",
      siteName: "Serious Eats",
      sourceUrl: "https://www.seriouseats.com/the-best-chili-recipe",
      authorName: "J. Kenji Lopez-Alt",
      licenseNote: "Source attribution retained. Recipe text in this MVP seed is summarized for demonstration.",
      importedAt,
      extractionMethod: "manual-seed",
      extractionConfidence: 0.86
    },
    {
      id: "src-texas-chili",
      siteName: "Serious Eats",
      sourceUrl: "https://www.seriouseats.com/real-texas-chili-con-carne",
      authorName: "J. Kenji Lopez-Alt",
      licenseNote: "Source attribution retained. Recipe text in this MVP seed is summarized for demonstration.",
      importedAt,
      extractionMethod: "manual-seed",
      extractionConfidence: 0.82
    },
    {
      id: "src-pressure-chili",
      siteName: "Serious Eats",
      sourceUrl: "https://www.seriouseats.com/pressure-cooker-ground-beef-and-bean-chili",
      authorName: "J. Kenji Lopez-Alt",
      licenseNote: "Source attribution retained. Recipe text in this MVP seed is summarized for demonstration.",
      importedAt,
      extractionMethod: "manual-seed",
      extractionConfidence: 0.78
    },
    {
      id: "src-chile-verde",
      siteName: "Serious Eats",
      sourceUrl: "https://www.seriouseats.com/chile-verde-with-pork-recipe",
      authorName: "J. Kenji Lopez-Alt",
      licenseNote: "Source attribution retained. Recipe text in this MVP seed is summarized for demonstration.",
      importedAt,
      extractionMethod: "manual-seed",
      extractionConfidence: 0.8
    },
    {
      id: "src-white-chili",
      siteName: "Serious Eats",
      sourceUrl: "https://www.seriouseats.com/white-chili-with-chicken-best",
      authorName: "Serious Eats",
      licenseNote: "Source attribution retained. Recipe text in this MVP seed is summarized for demonstration.",
      importedAt,
      extractionMethod: "manual-seed",
      extractionConfidence: 0.7
    },
    {
      id: "src-cincinnati",
      siteName: "Serious Eats",
      sourceUrl: "https://www.seriouseats.com/cincinnati-chili-recipe",
      authorName: "Serious Eats",
      licenseNote: "Source attribution retained. Recipe text in this MVP seed is summarized for demonstration.",
      importedAt,
      extractionMethod: "manual-seed",
      extractionConfidence: 0.68
    },
    {
      id: "src-cacio",
      siteName: "Serious Eats",
      sourceUrl: "https://www.seriouseats.com/spaghetti-cacio-e-pepe-recipe",
      authorName: "J. Kenji Lopez-Alt",
      licenseNote: "Source attribution retained. Recipe text in this MVP seed is summarized for demonstration.",
      importedAt,
      extractionMethod: "manual-seed",
      extractionConfidence: 0.88
    },
    {
      id: "src-carbonara",
      siteName: "Serious Eats",
      sourceUrl: "https://www.seriouseats.com/pasta-carbonara-sauce-recipe",
      authorName: "Daniel Gritzer",
      licenseNote: "Source attribution retained. Recipe text in this MVP seed is summarized for demonstration.",
      importedAt,
      extractionMethod: "manual-seed",
      extractionConfidence: 0.88
    },
    {
      id: "src-alfredo",
      siteName: "Serious Eats",
      sourceUrl: "https://www.seriouseats.com/fettuccine-alfredo-sauce-italian-pasta-recipe",
      authorName: "Daniel Gritzer",
      licenseNote: "Source attribution retained. Recipe text in this MVP seed is summarized for demonstration.",
      importedAt,
      extractionMethod: "manual-seed",
      extractionConfidence: 0.84
    },
    {
      id: "src-gricia",
      siteName: "Serious Eats",
      sourceUrl: "https://www.seriouseats.com/pasta-alla-gricia",
      authorName: "Sasha Marx",
      licenseNote: "Source attribution retained. Recipe text in this MVP seed is summarized for demonstration.",
      importedAt,
      extractionMethod: "manual-seed",
      extractionConfidence: 0.82
    },
    {
      id: "src-baked-ziti",
      siteName: "Serious Eats",
      sourceUrl: "https://www.seriouseats.com/baked-ziti-with-two-mozzarellas-and-parmesan-cream-sauce-recipe",
      authorName: "Daniel Gritzer",
      licenseNote: "Source attribution retained. Recipe text in this MVP seed is summarized for demonstration.",
      importedAt,
      extractionMethod: "manual-seed",
      extractionConfidence: 0.83
    },
    {
      id: "src-mac-cheese",
      siteName: "Serious Eats",
      sourceUrl: "https://www.seriouseats.com/ultra-gooey-stovetop-mac-and-cheese-recipe",
      authorName: "J. Kenji Lopez-Alt",
      licenseNote: "Source attribution retained. Recipe text in this MVP seed is summarized for demonstration.",
      importedAt,
      extractionMethod: "manual-seed",
      extractionConfidence: 0.85
    }
  ],
  families: [
    {
      id: "fam-chili-con-carne",
      slug: "chili-con-carne",
      displayName: "Chili con Carne",
      category: "chili",
      categoryId: "cat-american-stews",
      cuisine: "American",
      cuisineId: "cui-american",
      difficultyBandId: "diff-intermediate",
      primaryMethodId: "method-slow-cook",
      isCanonical: true,
      description: "A beef-forward chili family where dried chiles, tomato, beans, and simmer time define the major paths."
    },
    {
      id: "fam-green-chili",
      slug: "green-chili",
      displayName: "Green Chili",
      category: "chili",
      categoryId: "cat-mexican-stews-braises",
      cuisine: "Southwestern",
      cuisineId: "cui-mexican",
      difficultyBandId: "diff-intermediate",
      primaryMethodId: "method-slow-cook",
      isCanonical: true,
      description: "Bright chile verde variations built around tomatillos, roasted green chiles, pork, or chicken."
    },
    {
      id: "fam-roman-pasta",
      slug: "roman-pasta",
      displayName: "Roman Pasta",
      category: "pasta",
      categoryId: "cat-italian-pasta",
      cuisine: "Italian",
      cuisineId: "cui-italian",
      difficultyBandId: "diff-intermediate",
      primaryMethodId: "method-stovetop",
      isCanonical: true,
      description: "Minimal Roman pasta families that turn pasta water, cheese, pepper, guanciale, and eggs into sauce."
    },
    {
      id: "fam-baked-creamy-pasta",
      slug: "baked-creamy-pasta",
      displayName: "Baked and Creamy Pasta",
      category: "pasta",
      categoryId: "cat-american-pasta-casseroles",
      cuisine: "Italian-American",
      cuisineId: "cui-american",
      difficultyBandId: "diff-easy",
      primaryMethodId: "method-oven",
      isCanonical: true,
      description: "Comforting pasta variations where cheese texture, starch, and oven time matter most."
    },
    ...skeletonFamilies
  ],
  recipes: [
    {
      id: "rec-best-chili",
      slug: "best-chili",
      recipeFamilyId: "fam-chili-con-carne",
      sourceId: "src-best-chili",
      title: "The Best Chili",
      description: "A benchmark beef chili with layered dried chiles, aromatics, beans, tomato, and long simmered depth.",
      serves: "6 to 8",
      prepTimeMinutes: 45,
      cookTimeMinutes: 180,
      totalTimeMinutes: 225,
      isSourceRecipe: true,
      isUserVariation: false,
      tags: ["chili", "beef", "beans", "dried chiles"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "rec-texas-chili",
      slug: "real-texas-chili",
      recipeFamilyId: "fam-chili-con-carne",
      sourceId: "src-texas-chili",
      title: "Real Texas Chili Con Carne",
      description: "A no-bean chile-rich stew that leans on beef chunks, dried chiles, cumin, and slow braising.",
      serves: "6",
      prepTimeMinutes: 35,
      cookTimeMinutes: 210,
      totalTimeMinutes: 245,
      isSourceRecipe: true,
      isUserVariation: false,
      tags: ["chili", "texas", "beef", "no beans"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "rec-pressure-chili",
      slug: "pressure-cooker-beef-bean-chili",
      recipeFamilyId: "fam-chili-con-carne",
      sourceId: "src-pressure-chili",
      parentRecipeId: "rec-best-chili",
      title: "Pressure Cooker Beef and Bean Chili",
      description: "A weeknight-friendly variation that keeps the beef, beans, and chile base but compresses the simmer.",
      serves: "6 to 8",
      prepTimeMinutes: 30,
      cookTimeMinutes: 60,
      totalTimeMinutes: 90,
      isSourceRecipe: true,
      isUserVariation: false,
      tags: ["chili", "pressure cooker", "beans"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "rec-smoky-chili-variation",
      slug: "smoky-weeknight-beef-chili",
      recipeFamilyId: "fam-chili-con-carne",
      parentRecipeId: "rec-pressure-chili",
      createdByUserId: "user-demo",
      title: "Smoky Weeknight Beef Chili",
      description: "A personal variation with smoked paprika, less bean liquid, and a brighter lime finish.",
      serves: "6",
      prepTimeMinutes: 25,
      cookTimeMinutes: 55,
      totalTimeMinutes: 80,
      isSourceRecipe: false,
      isUserVariation: true,
      tags: ["chili", "variation", "smoked paprika"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "rec-chile-verde",
      slug: "pork-chile-verde",
      recipeFamilyId: "fam-green-chili",
      sourceId: "src-chile-verde",
      title: "Chile Verde With Pork",
      description: "A green chili path built from pork shoulder, tomatillos, green chiles, and slow braising.",
      serves: "6",
      prepTimeMinutes: 40,
      cookTimeMinutes: 180,
      totalTimeMinutes: 220,
      isSourceRecipe: true,
      isUserVariation: false,
      tags: ["chili", "pork", "tomatillo", "green chile"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "rec-white-chili",
      slug: "white-chicken-chili",
      recipeFamilyId: "fam-green-chili",
      sourceId: "src-white-chili",
      title: "White Chicken Chili",
      description: "A lighter chili family member with chicken, white beans, green chiles, and a creamy body.",
      serves: "6",
      prepTimeMinutes: 25,
      cookTimeMinutes: 75,
      totalTimeMinutes: 100,
      isSourceRecipe: true,
      isUserVariation: false,
      tags: ["chili", "chicken", "white beans"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "rec-cincinnati",
      slug: "cincinnati-chili",
      recipeFamilyId: "fam-chili-con-carne",
      sourceId: "src-cincinnati",
      title: "Cincinnati Chili",
      description: "A spiced chili sauce variation served over spaghetti with cheese and onions.",
      serves: "6",
      prepTimeMinutes: 25,
      cookTimeMinutes: 120,
      totalTimeMinutes: 145,
      isSourceRecipe: true,
      isUserVariation: false,
      tags: ["chili", "spaghetti", "spiced"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "rec-cacio",
      slug: "spaghetti-cacio-e-pepe",
      recipeFamilyId: "fam-cacio-e-pepe",
      sourceId: "src-cacio",
      title: "Spaghetti Cacio e Pepe",
      description: "A three-ingredient Roman pasta where emulsification turns cheese, pepper, and pasta water glossy.",
      serves: "2 to 3",
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      totalTimeMinutes: 25,
      isSourceRecipe: true,
      isUserVariation: false,
      tags: ["pasta", "roman", "pecorino", "black pepper"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "rec-carbonara",
      slug: "pasta-carbonara",
      recipeFamilyId: "fam-carbonara",
      sourceId: "src-carbonara",
      parentRecipeId: "rec-cacio",
      title: "Pasta Carbonara",
      description: "A sibling Roman pasta that adds egg and guanciale to the cheese-and-pasta-water emulsion.",
      serves: "4",
      prepTimeMinutes: 15,
      cookTimeMinutes: 20,
      totalTimeMinutes: 35,
      isSourceRecipe: true,
      isUserVariation: false,
      tags: ["pasta", "roman", "egg", "guanciale"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "rec-gricia",
      slug: "pasta-alla-gricia",
      recipeFamilyId: "fam-roman-pasta",
      sourceId: "src-gricia",
      parentRecipeId: "rec-cacio",
      title: "Pasta alla Gricia",
      description: "A porky Roman pasta that keeps the cheese-and-pepper core and adds guanciale fat.",
      serves: "4",
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      totalTimeMinutes: 30,
      isSourceRecipe: true,
      isUserVariation: false,
      tags: ["pasta", "roman", "guanciale"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "rec-alfredo",
      slug: "fettuccine-alfredo",
      recipeFamilyId: "fam-alfredo",
      sourceId: "src-alfredo",
      title: "Fettuccine Alfredo",
      description: "A creamy pasta family member where butter, parmesan, and starchy water create a rich sauce.",
      serves: "4",
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      totalTimeMinutes: 25,
      isSourceRecipe: true,
      isUserVariation: false,
      tags: ["pasta", "parmesan", "butter"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "rec-baked-ziti",
      slug: "baked-ziti",
      recipeFamilyId: "fam-baked-creamy-pasta",
      sourceId: "src-baked-ziti",
      title: "Baked Ziti With Two Mozzarellas",
      description: "A baked pasta path with tomato sauce, mozzarella textures, parmesan cream, and browned edges.",
      serves: "6 to 8",
      prepTimeMinutes: 30,
      cookTimeMinutes: 55,
      totalTimeMinutes: 85,
      isSourceRecipe: true,
      isUserVariation: false,
      tags: ["pasta", "baked", "mozzarella"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "rec-mac-cheese",
      slug: "stovetop-mac-and-cheese",
      recipeFamilyId: "fam-mac-and-cheese",
      sourceId: "src-mac-cheese",
      title: "Ultra-Gooey Stovetop Mac and Cheese",
      description: "A creamy pasta variation using modern cheese-sauce technique for a glossy, stable texture.",
      serves: "4",
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      totalTimeMinutes: 25,
      isSourceRecipe: true,
      isUserVariation: false,
      tags: ["pasta", "mac and cheese", "cheese sauce"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "rec-carbonara-greens",
      slug: "carbonara-with-greens-and-lemon",
      recipeFamilyId: "fam-carbonara",
      parentRecipeId: "rec-carbonara",
      createdByUserId: "user-demo",
      title: "Carbonara With Greens and Lemon",
      description: "A personal variation that folds in sauteed greens and lemon zest while keeping the carbonara technique.",
      serves: "4",
      prepTimeMinutes: 20,
      cookTimeMinutes: 20,
      totalTimeMinutes: 40,
      isSourceRecipe: false,
      isUserVariation: true,
      tags: ["pasta", "variation", "greens", "lemon"],
      createdAt: now,
      updatedAt: now
    }
  ],
  ingredients: [
    { id: "ing-beef", canonicalName: "beef", displayName: "Beef", category: "protein", aliases: ["chuck", "ground beef"] },
    { id: "ing-beans", canonicalName: "beans", displayName: "Beans", category: "legume", aliases: ["kidney beans", "pinto beans"] },
    { id: "ing-dried-chiles", canonicalName: "dried chiles", displayName: "Dried chiles", category: "spice", aliases: ["ancho", "guajillo", "pasilla"] },
    { id: "ing-tomato", canonicalName: "tomato", displayName: "Tomato", category: "vegetable", aliases: ["tomatoes", "tomato paste"] },
    { id: "ing-cumin", canonicalName: "cumin", displayName: "Cumin", category: "spice", aliases: [] },
    { id: "ing-smoked-paprika", canonicalName: "smoked paprika", displayName: "Smoked paprika", category: "spice", aliases: ["pimenton"] },
    { id: "ing-lime", canonicalName: "lime", displayName: "Lime", category: "acid", aliases: [] },
    { id: "ing-pork", canonicalName: "pork", displayName: "Pork", category: "protein", aliases: ["pork shoulder"] },
    { id: "ing-tomatillo", canonicalName: "tomatillo", displayName: "Tomatillo", category: "vegetable", aliases: ["tomatillos"] },
    { id: "ing-green-chile", canonicalName: "green chile", displayName: "Green chile", category: "spice", aliases: ["green chiles"] },
    { id: "ing-chicken", canonicalName: "chicken", displayName: "Chicken", category: "protein", aliases: [] },
    { id: "ing-spaghetti", canonicalName: "spaghetti", displayName: "Spaghetti", category: "grain", aliases: ["pasta"] },
    { id: "ing-pecorino", canonicalName: "pecorino romano", displayName: "Pecorino Romano", category: "dairy", aliases: ["pecorino"] },
    { id: "ing-parmesan", canonicalName: "parmesan", displayName: "Parmesan", category: "dairy", aliases: ["parmigiano reggiano", "parm"] },
    { id: "ing-black-pepper", canonicalName: "black pepper", displayName: "Black pepper", category: "spice", aliases: ["pepper"] },
    { id: "ing-egg", canonicalName: "egg", displayName: "Egg", category: "protein", aliases: ["eggs", "egg yolk"] },
    { id: "ing-guanciale", canonicalName: "guanciale", displayName: "Guanciale", category: "protein", aliases: ["pancetta"] },
    { id: "ing-butter", canonicalName: "butter", displayName: "Butter", category: "fat", aliases: [] },
    { id: "ing-mozzarella", canonicalName: "mozzarella", displayName: "Mozzarella", category: "dairy", aliases: [] },
    { id: "ing-roux", canonicalName: "roux", displayName: "Roux", category: "sauce", aliases: ["rue", "white roux", "brown roux"] },
    { id: "ing-lemon", canonicalName: "lemon", displayName: "Lemon", category: "acid", aliases: ["lemon zest"] },
    { id: "ing-greens", canonicalName: "greens", displayName: "Greens", category: "vegetable", aliases: ["kale", "chard"] },
    ...ontologyIngredientSeeds
  ],
  techniques: [
    { id: "tech-braise", canonicalName: "braise", displayName: "Braise", techniqueGroup: "heat", description: "Cook gently in a covered pot with enough liquid to tenderize meat." },
    { id: "tech-toast-chiles", canonicalName: "toast dried chiles", displayName: "Toast dried chiles", techniqueGroup: "prep", description: "Warm dried chiles to deepen aroma before blending or steeping." },
    { id: "tech-pressure-cook", canonicalName: "pressure cook", displayName: "Pressure cook", techniqueGroup: "heat", description: "Use pressure to shorten long simmered flavors." },
    { id: "tech-roast", canonicalName: "roast", displayName: "Roast", techniqueGroup: "heat", description: "Brown ingredients with dry heat before simmering or saucing." },
    { id: "tech-emulsify", canonicalName: "emulsify", displayName: "Emulsify", techniqueGroup: "sauce-building", description: "Bind fat, cheese, and starchy pasta water into a glossy sauce." },
    { id: "tech-bake", canonicalName: "bake", displayName: "Bake", techniqueGroup: "heat", description: "Finish in the oven to set texture and brown the top." },
    { id: "tech-roux", canonicalName: "make a roux", displayName: "Make a roux", techniqueGroup: "sauce-building", description: "Cook flour in fat to thicken a sauce or stew." },
    ...ontologyTechniqueSeeds
  ],
  cuisineDishFamilies: [...existingCuisineDishFamilies, ...skeletonCuisineDishFamilies],
  dishFamilyIngredients: [...existingDishFamilyIngredients, ...skeletonDishFamilyIngredients],
  dishFamilyTechniques: [...existingDishFamilyTechniques, ...skeletonDishFamilyTechniques],
  dishFamilyMethods: [...existingDishFamilyMethods, ...skeletonDishFamilyMethods],
  dishFamilyRelatedDishFamilies: dishFamilyRelatedDishFamilySeeds,
  recipeIngredients: [],
  steps: [],
  recipeTechniques: [],
  changes: [
    {
      id: "chg-smoky-title",
      recipeId: "rec-smoky-chili-variation",
      parentRecipeId: "rec-pressure-chili",
      changeType: "change_title",
      fieldName: "title",
      beforeValue: "Pressure Cooker Beef and Bean Chili",
      afterValue: "Smoky Weeknight Beef Chili",
      note: "Make the weeknight adaptation easier to recognize."
    },
    {
      id: "chg-smoky-paprika",
      recipeId: "rec-smoky-chili-variation",
      parentRecipeId: "rec-pressure-chili",
      changeType: "add_ingredient",
      fieldName: "ingredient",
      afterValue: "Smoked paprika",
      note: "Adds smoke without opening the grill."
    },
    {
      id: "chg-smoky-lime",
      recipeId: "rec-smoky-chili-variation",
      parentRecipeId: "rec-pressure-chili",
      changeType: "add_ingredient",
      fieldName: "finish",
      afterValue: "Lime juice",
      note: "Brightens the final bowl."
    },
    {
      id: "chg-carbonara-greens",
      recipeId: "rec-carbonara-greens",
      parentRecipeId: "rec-carbonara",
      changeType: "add_ingredient",
      fieldName: "ingredient",
      afterValue: "Sauteed greens",
      note: "Adds bitterness and color without changing the sauce base."
    },
    {
      id: "chg-carbonara-lemon",
      recipeId: "rec-carbonara-greens",
      parentRecipeId: "rec-carbonara",
      changeType: "add_ingredient",
      fieldName: "finish",
      afterValue: "Lemon zest",
      note: "Keeps the rich sauce lively."
    }
  ],
  cookReports: [
    {
      id: "cr-best-chili-1",
      recipeId: "rec-best-chili",
      userId: "user-demo",
      madeIt: true,
      rating: 5,
      wouldMakeAgain: true,
      difficultyRating: 4,
      notes: "Worth the longer simmer. The chile paste makes the family tree click.",
      createdAt: now
    },
    {
      id: "cr-smoky-1",
      recipeId: "rec-smoky-chili-variation",
      userId: "user-demo",
      madeIt: true,
      rating: 4,
      wouldMakeAgain: true,
      difficultyRating: 2,
      notes: "Good Tuesday night version. Lime is the move.",
      createdAt: now
    },
    {
      id: "cr-carbonara-1",
      recipeId: "rec-carbonara",
      userId: "user-demo",
      madeIt: true,
      rating: 5,
      wouldMakeAgain: true,
      difficultyRating: 3,
      notes: "Tempering matters. Keep the pan off heat for the egg sauce.",
      createdAt: now
    }
  ],
  relationships: [
    { id: "rel-pressure-best", fromRecipeId: "rec-pressure-chili", toRecipeId: "rec-best-chili", relationshipType: "variation_of" },
    { id: "rel-smoky-pressure", fromRecipeId: "rec-smoky-chili-variation", toRecipeId: "rec-pressure-chili", relationshipType: "variation_of" },
    { id: "rel-carbonara-cacio", fromRecipeId: "rec-carbonara", toRecipeId: "rec-cacio", relationshipType: "variation_of" },
    { id: "rel-gricia-cacio", fromRecipeId: "rec-gricia", toRecipeId: "rec-cacio", relationshipType: "variation_of" },
    { id: "rel-greens-carbonara", fromRecipeId: "rec-carbonara-greens", toRecipeId: "rec-carbonara", relationshipType: "variation_of" },
    { id: "rel-texas-best", fromRecipeId: "rec-texas-chili", toRecipeId: "rec-best-chili", relationshipType: "sibling_of" }
  ]
};

const ingredientLinks: Array<[string, string, string]> = [
  ["rec-best-chili", "ing-beef", "2 pounds beef chuck, cut for chili"],
  ["rec-best-chili", "ing-beans", "2 cans beans, drained"],
  ["rec-best-chili", "ing-dried-chiles", "A blend of dried chiles"],
  ["rec-best-chili", "ing-tomato", "Tomato paste and crushed tomatoes"],
  ["rec-best-chili", "ing-cumin", "Ground cumin"],
  ["rec-texas-chili", "ing-beef", "Beef chuck in large chunks"],
  ["rec-texas-chili", "ing-dried-chiles", "Dried chile paste"],
  ["rec-texas-chili", "ing-cumin", "Toasted cumin"],
  ["rec-pressure-chili", "ing-beef", "Ground beef"],
  ["rec-pressure-chili", "ing-beans", "Kidney and pinto beans"],
  ["rec-pressure-chili", "ing-dried-chiles", "Chile powder blend"],
  ["rec-smoky-chili-variation", "ing-beef", "Ground beef"],
  ["rec-smoky-chili-variation", "ing-beans", "Pinto beans"],
  ["rec-smoky-chili-variation", "ing-smoked-paprika", "Smoked paprika"],
  ["rec-smoky-chili-variation", "ing-lime", "Lime juice"],
  ["rec-chile-verde", "ing-pork", "Pork shoulder"],
  ["rec-chile-verde", "ing-tomatillo", "Tomatillos"],
  ["rec-chile-verde", "ing-green-chile", "Roasted green chiles"],
  ["rec-white-chili", "ing-chicken", "Chicken thighs"],
  ["rec-white-chili", "ing-beans", "White beans"],
  ["rec-white-chili", "ing-green-chile", "Green chiles"],
  ["rec-cincinnati", "ing-beef", "Ground beef"],
  ["rec-cincinnati", "ing-spaghetti", "Spaghetti for serving"],
  ["rec-cacio", "ing-spaghetti", "Spaghetti"],
  ["rec-cacio", "ing-pecorino", "Pecorino Romano"],
  ["rec-cacio", "ing-black-pepper", "Black pepper"],
  ["rec-carbonara", "ing-spaghetti", "Spaghetti"],
  ["rec-carbonara", "ing-pecorino", "Pecorino Romano"],
  ["rec-carbonara", "ing-egg", "Eggs"],
  ["rec-carbonara", "ing-guanciale", "Guanciale"],
  ["rec-gricia", "ing-spaghetti", "Rigatoni or spaghetti"],
  ["rec-gricia", "ing-pecorino", "Pecorino Romano"],
  ["rec-gricia", "ing-guanciale", "Guanciale"],
  ["rec-alfredo", "ing-spaghetti", "Fettuccine"],
  ["rec-alfredo", "ing-butter", "Butter"],
  ["rec-alfredo", "ing-parmesan", "Parmesan"],
  ["rec-baked-ziti", "ing-mozzarella", "Low-moisture and fresh mozzarella"],
  ["rec-baked-ziti", "ing-parmesan", "Parmesan cream"],
  ["rec-baked-ziti", "ing-tomato", "Tomato sauce"],
  ["rec-mac-cheese", "ing-parmesan", "Aged cheese blend"],
  ["rec-mac-cheese", "ing-roux", "Starch-stabilized cheese sauce"],
  ["rec-carbonara-greens", "ing-spaghetti", "Spaghetti"],
  ["rec-carbonara-greens", "ing-egg", "Eggs"],
  ["rec-carbonara-greens", "ing-guanciale", "Guanciale"],
  ["rec-carbonara-greens", "ing-greens", "Sauteed greens"],
  ["rec-carbonara-greens", "ing-lemon", "Lemon zest"]
];

seedData.recipeIngredients = ingredientLinks.map(([recipeId, ingredientId, rawText], index) => ({
  id: `ri-${index + 1}`,
  recipeId,
  ingredientId,
  rawText,
  sortOrder: index + 1
}));

const stepText: Record<string, string[]> = {
  "rec-best-chili": [
    "Toast dried chiles, then blend them into a concentrated chile paste.",
    "Brown beef and aromatics, then add tomato, beans, spices, and chile paste.",
    "Simmer until the beef is tender and the flavors taste rounded."
  ],
  "rec-texas-chili": [
    "Toast and steep dried chiles, then puree into a smooth base.",
    "Brown beef chunks in batches.",
    "Braise beef in chile sauce until tender and glossy."
  ],
  "rec-pressure-chili": [
    "Brown beef and aromatics in the pressure cooker.",
    "Add beans, tomato, spices, and chile base.",
    "Pressure cook, then reduce briefly to thicken."
  ],
  "rec-smoky-chili-variation": [
    "Brown beef with onions and smoked paprika.",
    "Pressure cook with beans, tomato, and chile base.",
    "Finish with lime juice and rest for 10 minutes before serving."
  ],
  "rec-chile-verde": [
    "Roast tomatillos and green chiles until blistered.",
    "Brown pork shoulder and blend the roasted green sauce.",
    "Braise pork in green sauce until spoon-tender."
  ],
  "rec-white-chili": [
    "Simmer chicken with green chiles, beans, and aromatics.",
    "Shred chicken and return it to the pot.",
    "Finish creamy and adjust heat with more chile."
  ],
  "rec-cincinnati": [
    "Build a spiced beef sauce with warm spices and tomato.",
    "Simmer until loose, fragrant, and spoonable.",
    "Serve over spaghetti with cheese and onions."
  ],
  "rec-cacio": [
    "Toast black pepper in a skillet.",
    "Cook pasta and reserve starchy water.",
    "Emulsify pasta water, cheese, pepper, and noodles into a glossy sauce."
  ],
  "rec-carbonara": [
    "Render guanciale until crisp and reserve the fat.",
    "Whisk eggs and cheese in a bowl.",
    "Toss hot pasta off heat with guanciale fat, egg mixture, and pasta water."
  ],
  "rec-gricia": [
    "Render guanciale until crisp.",
    "Toss pasta with guanciale fat and pasta water.",
    "Finish with pecorino and black pepper."
  ],
  "rec-alfredo": [
    "Cook fettuccine until just shy of al dente.",
    "Toss with butter, parmesan, and pasta water.",
    "Keep tossing until the sauce turns creamy and glossy."
  ],
  "rec-baked-ziti": [
    "Cook pasta and combine with tomato sauce.",
    "Layer with mozzarella and parmesan cream.",
    "Bake until bubbling with browned edges."
  ],
  "rec-mac-cheese": [
    "Cook pasta in a minimal amount of water.",
    "Build a stable cheese sauce with starch and cheese.",
    "Fold pasta into sauce until ultra glossy."
  ],
  "rec-carbonara-greens": [
    "Saute greens and lemon zest while the pasta cooks.",
    "Render guanciale and make the egg-cheese base.",
    "Toss pasta off heat with sauce, greens, and enough pasta water to emulsify."
  ]
};

seedData.steps = Object.entries(stepText).flatMap(([recipeId, steps]) =>
  steps.map((instructionText, index) => ({
    id: `step-${recipeId}-${index + 1}`,
    recipeId,
    stepNumber: index + 1,
    instructionText
  }))
);

const techniqueLinks: Array<[string, string]> = [
  ["rec-best-chili", "tech-toast-chiles"],
  ["rec-best-chili", "tech-braise"],
  ["rec-texas-chili", "tech-toast-chiles"],
  ["rec-texas-chili", "tech-braise"],
  ["rec-pressure-chili", "tech-pressure-cook"],
  ["rec-smoky-chili-variation", "tech-pressure-cook"],
  ["rec-chile-verde", "tech-roast"],
  ["rec-chile-verde", "tech-braise"],
  ["rec-white-chili", "tech-braise"],
  ["rec-cincinnati", "tech-braise"],
  ["rec-cacio", "tech-emulsify"],
  ["rec-carbonara", "tech-emulsify"],
  ["rec-gricia", "tech-emulsify"],
  ["rec-alfredo", "tech-emulsify"],
  ["rec-baked-ziti", "tech-bake"],
  ["rec-mac-cheese", "tech-emulsify"],
  ["rec-mac-cheese", "tech-roux"],
  ["rec-carbonara-greens", "tech-emulsify"]
];

seedData.recipeTechniques = techniqueLinks.map(([recipeId, techniqueId]) => ({
  recipeId,
  techniqueId
}));
