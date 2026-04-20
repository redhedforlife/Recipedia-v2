import type {
  Category,
  CookingMethod,
  Cuisine,
  CuisineDishFamily,
  DifficultyBand,
  DishFamilyIngredient,
  DishFamilyMethod,
  DishFamilyRelatedDishFamily,
  DishFamilyTechnique,
  Ingredient,
  IngredientCategory,
  RecipeFamily,
  Technique,
  TechniqueCategory
} from "@/lib/types";

type DishSeed = {
  displayName: string;
  cuisineId: string;
  description: string;
  difficultyBandId: string;
  methodId: string;
  ingredientIds: string[];
  techniqueIds: string[];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const familyId = (displayName: string) => `fam-${slugify(displayName)}`;

export const cuisineSeeds: Cuisine[] = [
  {
    id: "cui-italian",
    slug: "italian",
    displayName: "Italian",
    regionGroup: "Europe",
    description: "Pasta, rice, breads, braises, and regional sauces built around focused technique and pantry clarity."
  },
  {
    id: "cui-mexican",
    slug: "mexican",
    displayName: "Mexican",
    regionGroup: "North America",
    description: "Corn, chiles, beans, salsas, braises, and masa-based dishes with deep regional variety."
  },
  {
    id: "cui-chinese",
    slug: "chinese",
    displayName: "Chinese",
    regionGroup: "East Asia",
    description: "Stir-fries, noodles, dumplings, rice dishes, hot pots, and layered sauces across many regional traditions."
  },
  {
    id: "cui-japanese",
    slug: "japanese",
    displayName: "Japanese",
    regionGroup: "East Asia",
    description: "Noodles, rice bowls, grilled skewers, fried cutlets, simmered dishes, and precise seasoning."
  },
  {
    id: "cui-indian",
    slug: "indian",
    displayName: "Indian",
    regionGroup: "South Asia",
    description: "Spice-forward curries, breads, rice dishes, dals, vegetables, and slow-built aromatics."
  },
  {
    id: "cui-american",
    slug: "american",
    displayName: "American",
    regionGroup: "North America",
    description: "Regional comfort dishes, barbecue, burgers, pies, roasts, and weeknight stovetop staples."
  },
  {
    id: "cui-french",
    slug: "french",
    displayName: "French",
    regionGroup: "Europe",
    description: "Braises, sauces, soups, pastries, tarts, bistro classics, and careful heat control."
  },
  {
    id: "cui-thai",
    slug: "thai",
    displayName: "Thai",
    regionGroup: "Southeast Asia",
    description: "Curries, salads, noodles, soups, and grilled dishes balanced through heat, sourness, sweetness, and herbs."
  },
  {
    id: "cui-middle-eastern",
    slug: "middle-eastern",
    displayName: "Middle Eastern",
    regionGroup: "Middle East",
    description: "Legumes, flatbreads, grilled meats, salads, rice dishes, warm spices, and tahini-based sauces."
  },
  {
    id: "cui-mediterranean",
    slug: "mediterranean",
    displayName: "Mediterranean",
    regionGroup: "Mediterranean",
    description: "Seafood, olive oil, grains, vegetables, herbs, pies, salads, and coastal stews."
  }
];

const cuisineById = new Map(cuisineSeeds.map((cuisine) => [cuisine.id, cuisine]));

export const categorySeeds: Category[] = [
  { id: "cat-italian-pasta", slug: "italian-pasta", displayName: "Pasta", cuisineId: "cui-italian", sortOrder: 10, description: "Italian noodle and pasta-sauce families." },
  { id: "cat-italian-pizza-bread", slug: "italian-pizza-bread", displayName: "Pizza & bread", cuisineId: "cui-italian", sortOrder: 20, description: "Dough-based Italian staples cooked with strong heat." },
  { id: "cat-italian-rice", slug: "italian-rice", displayName: "Rice", cuisineId: "cui-italian", sortOrder: 30, description: "Rice-centered Italian dishes and creamy grain preparations." },
  { id: "cat-italian-braises", slug: "italian-braises", displayName: "Braises", cuisineId: "cui-italian", sortOrder: 40, description: "Slow-cooked meat dishes and deeply sauced mains." },
  { id: "cat-mexican-tacos-tortillas", slug: "mexican-tacos-tortillas", displayName: "Tacos & tortillas", cuisineId: "cui-mexican", sortOrder: 10, description: "Tortilla-centered dishes with fillings, salsa, and garnishes." },
  { id: "cat-mexican-stews-braises", slug: "mexican-stews-braises", displayName: "Stews & braises", cuisineId: "cui-mexican", sortOrder: 20, description: "Chile-forward soups, stews, and slow-cooked meats." },
  { id: "cat-mexican-masa", slug: "mexican-masa", displayName: "Masa", cuisineId: "cui-mexican", sortOrder: 30, description: "Masa-based wrapped, steamed, or griddled dishes." },
  { id: "cat-mexican-sauces", slug: "mexican-sauces", displayName: "Sauces", cuisineId: "cui-mexican", sortOrder: 40, description: "Canonical chile sauces and sauce-first dish families." },
  { id: "cat-chinese-rice-noodles", slug: "chinese-rice-noodles", displayName: "Rice & noodles", cuisineId: "cui-chinese", sortOrder: 10, description: "Chinese rice and noodle dishes built around wok heat and sauce." },
  { id: "cat-chinese-dumplings", slug: "chinese-dumplings", displayName: "Dumplings", cuisineId: "cui-chinese", sortOrder: 20, description: "Filled wrappers that can be steamed, boiled, or pan-fried." },
  { id: "cat-chinese-stir-fries", slug: "chinese-stir-fries", displayName: "Stir-fries", cuisineId: "cui-chinese", sortOrder: 30, description: "Fast, high-heat dishes with savory sauces and crisp-tender texture." },
  { id: "cat-chinese-hot-pot-braises", slug: "chinese-hot-pot-braises", displayName: "Hot pot & braises", cuisineId: "cui-chinese", sortOrder: 40, description: "Communal simmering, roasted meats, and sauced braises." },
  { id: "cat-japanese-noodles", slug: "japanese-noodles", displayName: "Noodles", cuisineId: "cui-japanese", sortOrder: 10, description: "Japanese noodle soups, stir-fries, and chilled preparations." },
  { id: "cat-japanese-rice-bowls", slug: "japanese-rice-bowls", displayName: "Rice & bowls", cuisineId: "cui-japanese", sortOrder: 20, description: "Rice bowls, composed rice dishes, and curry plates." },
  { id: "cat-japanese-grill-fry", slug: "japanese-grill-fry", displayName: "Grill & fry", cuisineId: "cui-japanese", sortOrder: 30, description: "Grilled skewers, battered frying, and griddled dishes." },
  { id: "cat-japanese-sushi", slug: "japanese-sushi", displayName: "Sushi", cuisineId: "cui-japanese", sortOrder: 40, description: "Seasoned rice with fish, vegetables, and precise assembly." },
  { id: "cat-indian-curries", slug: "indian-curries", displayName: "Curries", cuisineId: "cui-indian", sortOrder: 10, description: "Sauce-centered Indian dishes with spice bases and aromatics." },
  { id: "cat-indian-rice-biryani", slug: "indian-rice-biryani", displayName: "Rice & biryani", cuisineId: "cui-indian", sortOrder: 20, description: "Layered, steamed, and spiced rice dishes." },
  { id: "cat-indian-breads", slug: "indian-breads", displayName: "Breads", cuisineId: "cui-indian", sortOrder: 30, description: "Flatbreads and doughs cooked with direct or radiant heat." },
  { id: "cat-indian-legumes", slug: "indian-legumes", displayName: "Lentils & legumes", cuisineId: "cui-indian", sortOrder: 40, description: "Dal, chickpeas, and legume-based meals." },
  { id: "cat-american-sandwiches", slug: "american-sandwiches", displayName: "Sandwiches", cuisineId: "cui-american", sortOrder: 10, description: "Bun, bread, and hand-held American dish families." },
  { id: "cat-american-pasta-casseroles", slug: "american-pasta-casseroles", displayName: "Pasta & casseroles", cuisineId: "cui-american", sortOrder: 20, description: "Creamy pasta, baked casseroles, and comfort-food bakes." },
  { id: "cat-american-roasts", slug: "american-roasts", displayName: "Roasts", cuisineId: "cui-american", sortOrder: 30, description: "Oven-centered mains and weeknight family classics." },
  { id: "cat-american-barbecue", slug: "american-barbecue", displayName: "Barbecue", cuisineId: "cui-american", sortOrder: 40, description: "Smoke, fire, and regional low-and-slow traditions." },
  { id: "cat-american-smoked-meats", slug: "american-smoked-meats", displayName: "Smoked meats", parentCategoryId: "cat-american-barbecue", sortOrder: 41, description: "Long-smoked cuts with rub, smoke, and careful heat control." },
  { id: "cat-american-breakfast", slug: "american-breakfast", displayName: "Breakfast", cuisineId: "cui-american", sortOrder: 50, description: "Griddle, batter, and morning-table classics." },
  { id: "cat-american-pies", slug: "american-pies", displayName: "Pies", cuisineId: "cui-american", sortOrder: 60, description: "Fruit and pastry dishes baked until set and bubbling." },
  { id: "cat-american-stews", slug: "american-stews", displayName: "Stews", cuisineId: "cui-american", sortOrder: 70, description: "American stew, chili, and one-pot bowl families." },
  { id: "cat-french-braises", slug: "french-braises", displayName: "Braises", cuisineId: "cui-french", sortOrder: 10, description: "Wine-rich braises and slow-cooked bistro classics." },
  { id: "cat-french-soups", slug: "french-soups", displayName: "Soups", cuisineId: "cui-french", sortOrder: 20, description: "Brothy and gratineed French soup families." },
  { id: "cat-french-pastry-tarts", slug: "french-pastry-tarts", displayName: "Pastry & tarts", cuisineId: "cui-french", sortOrder: 30, description: "Savory and sweet dishes that depend on pastry or batter." },
  { id: "cat-french-bistro", slug: "french-bistro", displayName: "Bistro", cuisineId: "cui-french", sortOrder: 40, description: "Everyday cafe and bistro comfort dishes." },
  { id: "cat-thai-noodles", slug: "thai-noodles", displayName: "Noodles", cuisineId: "cui-thai", sortOrder: 10, description: "Thai stir-fried and soup noodle dishes." },
  { id: "cat-thai-curries", slug: "thai-curries", displayName: "Curries", cuisineId: "cui-thai", sortOrder: 20, description: "Coconut and chile paste curries." },
  { id: "cat-thai-soups", slug: "thai-soups", displayName: "Soups", cuisineId: "cui-thai", sortOrder: 30, description: "Hot-sour and aromatic Thai soups." },
  { id: "cat-thai-salads", slug: "thai-salads", displayName: "Salads", cuisineId: "cui-thai", sortOrder: 40, description: "Fresh or warm salads balanced by lime, chile, herbs, and crunch." },
  { id: "cat-thai-sweets", slug: "thai-sweets", displayName: "Sweets", cuisineId: "cui-thai", sortOrder: 50, description: "Rice, coconut, and fruit-centered desserts." },
  { id: "cat-middle-eastern-dips", slug: "middle-eastern-dips", displayName: "Dips & spreads", cuisineId: "cui-middle-eastern", sortOrder: 10, description: "Legume and sauce-like dishes served with bread or vegetables." },
  { id: "cat-middle-eastern-street-food", slug: "middle-eastern-street-food", displayName: "Street food", cuisineId: "cui-middle-eastern", sortOrder: 20, description: "Hand-held and quick-serve dishes with bread, sauces, and crisp elements." },
  { id: "cat-middle-eastern-grills", slug: "middle-eastern-grills", displayName: "Grills", cuisineId: "cui-middle-eastern", sortOrder: 30, description: "Skewered, sliced, and spice-rubbed grilled meat families." },
  { id: "cat-middle-eastern-rice-legumes", slug: "middle-eastern-rice-legumes", displayName: "Rice & legumes", cuisineId: "cui-middle-eastern", sortOrder: 40, description: "Grain and legume dishes with aromatics and browned onions." },
  { id: "cat-middle-eastern-pastry", slug: "middle-eastern-pastry", displayName: "Pastry", cuisineId: "cui-middle-eastern", sortOrder: 50, description: "Layered pastry, syrup, nuts, and baked sweets." },
  { id: "cat-middle-eastern-salads", slug: "middle-eastern-salads", displayName: "Salads", cuisineId: "cui-middle-eastern", sortOrder: 60, description: "Bread salads, fresh vegetables, herbs, and bright dressings." },
  { id: "cat-mediterranean-salads", slug: "mediterranean-salads", displayName: "Salads", cuisineId: "cui-mediterranean", sortOrder: 10, description: "Vegetable-forward salads with olive oil, herbs, acid, and bread." },
  { id: "cat-mediterranean-rice", slug: "mediterranean-rice", displayName: "Rice dishes", cuisineId: "cui-mediterranean", sortOrder: 20, description: "Rice dishes cooked with seafood, meat, broth, or vegetables." },
  { id: "cat-mediterranean-baked-pies", slug: "mediterranean-baked-pies", displayName: "Baked pies", cuisineId: "cui-mediterranean", sortOrder: 30, description: "Layered vegetable, pastry, and custard-like bakes." },
  { id: "cat-mediterranean-seafood", slug: "mediterranean-seafood", displayName: "Seafood", cuisineId: "cui-mediterranean", sortOrder: 40, description: "Fish and shellfish dishes shaped by olive oil, citrus, and coastal stews." },
  { id: "cat-mediterranean-breads", slug: "mediterranean-breads", displayName: "Breads", cuisineId: "cui-mediterranean", sortOrder: 50, description: "Flatbreads and doughs for scooping, filling, or serving alongside meals." }
];

const categoryByDishName: Record<string, string> = {
  Carbonara: "cat-italian-pasta",
  "Cacio e pepe": "cat-italian-pasta",
  Lasagna: "cat-italian-pasta",
  Bolognese: "cat-italian-pasta",
  Alfredo: "cat-italian-pasta",
  Risotto: "cat-italian-rice",
  "Margherita pizza": "cat-italian-pizza-bread",
  "Osso buco": "cat-italian-braises",
  Tacos: "cat-mexican-tacos-tortillas",
  Enchiladas: "cat-mexican-tacos-tortillas",
  Chili: "cat-mexican-stews-braises",
  Pozole: "cat-mexican-stews-braises",
  Mole: "cat-mexican-sauces",
  Tamales: "cat-mexican-masa",
  Quesadillas: "cat-mexican-tacos-tortillas",
  Carnitas: "cat-mexican-tacos-tortillas",
  "Fried rice": "cat-chinese-rice-noodles",
  Dumplings: "cat-chinese-dumplings",
  "Mapo tofu": "cat-chinese-stir-fries",
  "Chow mein": "cat-chinese-rice-noodles",
  "Char siu": "cat-chinese-hot-pot-braises",
  "Hot pot": "cat-chinese-hot-pot-braises",
  "Sweet and sour pork": "cat-chinese-stir-fries",
  "Scallion noodles": "cat-chinese-rice-noodles",
  Ramen: "cat-japanese-noodles",
  Udon: "cat-japanese-noodles",
  Sushi: "cat-japanese-sushi",
  "Katsu curry": "cat-japanese-rice-bowls",
  Donburi: "cat-japanese-rice-bowls",
  Yakitori: "cat-japanese-grill-fry",
  Tempura: "cat-japanese-grill-fry",
  Okonomiyaki: "cat-japanese-grill-fry",
  "Butter chicken": "cat-indian-curries",
  Biryani: "cat-indian-rice-biryani",
  Dal: "cat-indian-legumes",
  "Tikka masala": "cat-indian-curries",
  "Saag paneer": "cat-indian-curries",
  "Chana masala": "cat-indian-legumes",
  Vindaloo: "cat-indian-curries",
  Naan: "cat-indian-breads",
  Cheeseburger: "cat-american-sandwiches",
  "Mac and cheese": "cat-american-pasta-casseroles",
  "Roast chicken": "cat-american-roasts",
  Meatloaf: "cat-american-roasts",
  "Buffalo wings": "cat-american-roasts",
  "Barbecue brisket": "cat-american-smoked-meats",
  Pancakes: "cat-american-breakfast",
  "Apple pie": "cat-american-pies",
  "Coq au vin": "cat-french-braises",
  "Beef bourguignon": "cat-french-braises",
  Ratatouille: "cat-french-bistro",
  Quiche: "cat-french-pastry-tarts",
  "French onion soup": "cat-french-soups",
  "Croque monsieur": "cat-french-bistro",
  Crepes: "cat-french-pastry-tarts",
  Bouillabaisse: "cat-french-soups",
  "Pad thai": "cat-thai-noodles",
  "Green curry": "cat-thai-curries",
  "Tom yum": "cat-thai-soups",
  "Som tam": "cat-thai-salads",
  "Massaman curry": "cat-thai-curries",
  Larb: "cat-thai-salads",
  "Khao soi": "cat-thai-noodles",
  "Mango sticky rice": "cat-thai-sweets",
  Hummus: "cat-middle-eastern-dips",
  Falafel: "cat-middle-eastern-street-food",
  Shawarma: "cat-middle-eastern-grills",
  Kebabs: "cat-middle-eastern-grills",
  Mujadara: "cat-middle-eastern-rice-legumes",
  Shakshuka: "cat-middle-eastern-dips",
  Baklava: "cat-middle-eastern-pastry",
  Fattoush: "cat-middle-eastern-salads",
  "Greek salad": "cat-mediterranean-salads",
  Paella: "cat-mediterranean-rice",
  Moussaka: "cat-mediterranean-baked-pies",
  Spanakopita: "cat-mediterranean-baked-pies",
  Gazpacho: "cat-mediterranean-salads",
  Pita: "cat-mediterranean-breads",
  "Seafood stew": "cat-mediterranean-seafood",
  "Grilled fish": "cat-mediterranean-seafood"
};

const categoryIdForDish = (displayName: string, cuisineId: string) => {
  return categoryByDishName[displayName] ?? categorySeeds.find((category) => category.cuisineId === cuisineId)?.id;
};

export const difficultyBandSeeds: DifficultyBand[] = [
  {
    id: "diff-easy",
    slug: "easy",
    displayName: "Easy",
    sortOrder: 1,
    description: "Short prep, forgiving timing, and familiar techniques."
  },
  {
    id: "diff-intermediate",
    slug: "intermediate",
    displayName: "Intermediate",
    sortOrder: 2,
    description: "A few coordinated steps or techniques that reward attention."
  },
  {
    id: "diff-advanced",
    slug: "advanced",
    displayName: "Advanced",
    sortOrder: 3,
    description: "Multiple components, precise texture targets, or less forgiving heat control."
  },
  {
    id: "diff-project",
    slug: "project",
    displayName: "Project",
    sortOrder: 4,
    description: "Long timelines, special preparation, or ambitious multi-stage cooking."
  }
];

export const cookingMethodSeeds: CookingMethod[] = [
  {
    id: "method-stovetop",
    slug: "stovetop",
    displayName: "Stovetop",
    description: "Built primarily in a pot, skillet, wok, or saucepan."
  },
  {
    id: "method-oven",
    slug: "oven",
    displayName: "Oven",
    description: "Baked or roasted with steady dry heat."
  },
  {
    id: "method-grill",
    slug: "grill",
    displayName: "Grill",
    description: "Cooked over direct or indirect high heat."
  },
  {
    id: "method-smoker",
    slug: "smoker",
    displayName: "Smoker",
    description: "Cooked with smoke, airflow, and long heat management."
  },
  {
    id: "method-no-cook",
    slug: "no-cook",
    displayName: "No-cook",
    description: "Assembled, cured, dressed, or marinated without active cooking."
  },
  {
    id: "method-one-pot",
    slug: "one-pot",
    displayName: "One-pot",
    description: "Layered mostly in one cooking vessel."
  },
  {
    id: "method-slow-cook",
    slug: "slow-cook",
    displayName: "Slow cook",
    description: "Long simmering, braising, or gentle heat over time."
  },
  {
    id: "method-pressure-cook",
    slug: "pressure-cook",
    displayName: "Pressure cook",
    description: "Pressure-assisted cooking for fast tenderization or extraction."
  }
];

export const ingredientCategorySeeds: IngredientCategory[] = [
  {
    id: "ingcat-protein",
    slug: "protein",
    displayName: "Proteins",
    description: "Meat, seafood, eggs, tofu, and other primary protein ingredients.",
    sortOrder: 10
  },
  {
    id: "ingcat-legume",
    slug: "legumes",
    displayName: "Legumes",
    description: "Beans, lentils, chickpeas, and related pulse ingredients.",
    parentCategoryId: "ingcat-protein",
    sortOrder: 20
  },
  {
    id: "ingcat-vegetable",
    slug: "vegetables",
    displayName: "Vegetables",
    description: "Fresh, roasted, simmered, or pickled vegetable ingredients.",
    sortOrder: 30
  },
  {
    id: "ingcat-grain",
    slug: "grains-and-starches",
    displayName: "Grains and starches",
    description: "Rice, pasta, bread, masa, flour, and other starchy foundations.",
    sortOrder: 40
  },
  {
    id: "ingcat-aromatic",
    slug: "aromatics",
    displayName: "Aromatics",
    description: "Ingredients used early to build fragrance and savory base notes.",
    parentCategoryId: "ingcat-vegetable",
    sortOrder: 50
  },
  {
    id: "ingcat-spice",
    slug: "spices-and-chiles",
    displayName: "Spices and chiles",
    description: "Dried spices, chile products, and concentrated seasoning ingredients.",
    sortOrder: 60
  },
  {
    id: "ingcat-herb",
    slug: "herbs",
    displayName: "Herbs",
    description: "Leafy herbs used for brightness, aroma, or garnish.",
    parentCategoryId: "ingcat-vegetable",
    sortOrder: 70
  },
  {
    id: "ingcat-dairy",
    slug: "dairy",
    displayName: "Dairy",
    description: "Cheese, cream, yogurt, and other dairy ingredients.",
    sortOrder: 80
  },
  {
    id: "ingcat-fat",
    slug: "fats-and-oils",
    displayName: "Fats and oils",
    description: "Cooking fats and finishing oils that carry flavor and texture.",
    sortOrder: 90
  },
  {
    id: "ingcat-acid",
    slug: "acids",
    displayName: "Acids",
    description: "Citrus, vinegar, and other bright balancing ingredients.",
    sortOrder: 100
  },
  {
    id: "ingcat-sauce",
    slug: "sauces-and-liquids",
    displayName: "Sauces and liquids",
    description: "Sauces, wines, and prepared flavor bases.",
    sortOrder: 110
  },
  {
    id: "ingcat-fruit",
    slug: "fruit",
    displayName: "Fruit",
    description: "Sweet, tart, or aromatic fruit ingredients.",
    sortOrder: 120
  },
  {
    id: "ingcat-sweetener",
    slug: "sweeteners",
    displayName: "Sweeteners",
    description: "Sugar, honey, and other ingredients that add sweetness.",
    sortOrder: 130
  },
  {
    id: "ingcat-nut",
    slug: "nuts-and-seeds",
    displayName: "Nuts and seeds",
    description: "Nutty or seedy ingredients used for flavor, crunch, or body.",
    sortOrder: 140
  }
];

export const techniqueCategorySeeds: TechniqueCategory[] = [
  {
    id: "techcat-heat",
    slug: "heat",
    displayName: "Heat",
    description: "Techniques controlled by direct, indirect, wet, or dry heat.",
    sortOrder: 10
  },
  {
    id: "techcat-prep",
    slug: "prep",
    displayName: "Prep",
    description: "Techniques that prepare ingredients before final cooking or assembly.",
    sortOrder: 20
  },
  {
    id: "techcat-sauce-building",
    slug: "sauce-building",
    displayName: "Sauce building",
    description: "Techniques that bind, thicken, reduce, or stabilize sauces.",
    sortOrder: 30
  },
  {
    id: "techcat-preservation",
    slug: "preservation",
    displayName: "Preservation",
    description: "Techniques that use time, salt, acid, fermentation, or curing.",
    sortOrder: 40
  },
  {
    id: "techcat-assembly",
    slug: "assembly",
    displayName: "Assembly",
    description: "Techniques for building, layering, folding, filling, or arranging dishes.",
    sortOrder: 50
  },
  {
    id: "techcat-finishing",
    slug: "finishing",
    displayName: "Finishing",
    description: "Late-stage techniques that refine texture, gloss, or presentation.",
    sortOrder: 60
  }
];

export const ontologyIngredientSeeds: Ingredient[] = [
  { id: "ing-rice", canonicalName: "rice", displayName: "Rice", category: "grain", aliases: ["jasmine rice", "short-grain rice"] },
  { id: "ing-garlic", canonicalName: "garlic", displayName: "Garlic", category: "aromatic", aliases: [] },
  { id: "ing-onion", canonicalName: "onion", displayName: "Onion", category: "aromatic", aliases: ["onions"] },
  { id: "ing-flour", canonicalName: "flour", displayName: "Flour", category: "grain", aliases: ["wheat flour"] },
  { id: "ing-corn", canonicalName: "corn", displayName: "Corn", category: "vegetable", aliases: ["sweet corn"] },
  { id: "ing-soy-sauce", canonicalName: "soy sauce", displayName: "Soy sauce", category: "sauce", aliases: [] },
  { id: "ing-ginger", canonicalName: "ginger", displayName: "Ginger", category: "aromatic", aliases: [] },
  { id: "ing-tofu", canonicalName: "tofu", displayName: "Tofu", category: "protein", aliases: [] },
  { id: "ing-noodles", canonicalName: "noodles", displayName: "Noodles", category: "grain", aliases: ["wheat noodles", "ramen noodles"] },
  { id: "ing-potato", canonicalName: "potato", displayName: "Potato", category: "vegetable", aliases: ["potatoes"] },
  { id: "ing-coconut-milk", canonicalName: "coconut milk", displayName: "Coconut milk", category: "dairy", aliases: [] },
  { id: "ing-basil", canonicalName: "basil", displayName: "Basil", category: "herb", aliases: ["thai basil"] },
  { id: "ing-chickpeas", canonicalName: "chickpeas", displayName: "Chickpeas", category: "legume", aliases: ["garbanzo beans"] },
  { id: "ing-yogurt", canonicalName: "yogurt", displayName: "Yogurt", category: "dairy", aliases: [] },
  { id: "ing-fish", canonicalName: "fish", displayName: "Fish", category: "protein", aliases: [] },
  { id: "ing-lentils", canonicalName: "lentils", displayName: "Lentils", category: "legume", aliases: ["dal"] },
  { id: "ing-cheddar", canonicalName: "cheddar", displayName: "Cheddar", category: "dairy", aliases: [] },
  { id: "ing-cream", canonicalName: "cream", displayName: "Cream", category: "dairy", aliases: [] },
  { id: "ing-bread", canonicalName: "bread", displayName: "Bread", category: "grain", aliases: ["bun", "sourdough"] },
  { id: "ing-mushroom", canonicalName: "mushroom", displayName: "Mushroom", category: "vegetable", aliases: ["mushrooms"] },
  { id: "ing-eggplant", canonicalName: "eggplant", displayName: "Eggplant", category: "vegetable", aliases: ["aubergine"] },
  { id: "ing-chiles", canonicalName: "chiles", displayName: "Chiles", category: "spice", aliases: ["chilies", "chili peppers"] },
  { id: "ing-lamb", canonicalName: "lamb", displayName: "Lamb", category: "protein", aliases: [] },
  { id: "ing-tortilla", canonicalName: "tortilla", displayName: "Tortilla", category: "grain", aliases: ["corn tortilla", "flour tortilla"] },
  { id: "ing-masa", canonicalName: "masa", displayName: "Masa", category: "grain", aliases: ["masa harina"] },
  { id: "ing-cilantro", canonicalName: "cilantro", displayName: "Cilantro", category: "herb", aliases: ["coriander leaf"] },
  { id: "ing-vinegar", canonicalName: "vinegar", displayName: "Vinegar", category: "acid", aliases: [] },
  { id: "ing-seafood", canonicalName: "seafood", displayName: "Seafood", category: "protein", aliases: ["shellfish", "shrimp"] },
  { id: "ing-cucumber", canonicalName: "cucumber", displayName: "Cucumber", category: "vegetable", aliases: [] },
  { id: "ing-pita", canonicalName: "pita", displayName: "Pita", category: "grain", aliases: ["flatbread"] },
  { id: "ing-honey", canonicalName: "honey", displayName: "Honey", category: "sweetener", aliases: [] },
  { id: "ing-cabbage", canonicalName: "cabbage", displayName: "Cabbage", category: "vegetable", aliases: [] },
  { id: "ing-peanut", canonicalName: "peanut", displayName: "Peanut", category: "nut", aliases: ["peanuts"] },
  { id: "ing-curry-spices", canonicalName: "curry spices", displayName: "Curry spices", category: "spice", aliases: ["garam masala", "curry powder"] },
  { id: "ing-olive-oil", canonicalName: "olive oil", displayName: "Olive oil", category: "fat", aliases: [] },
  { id: "ing-apple", canonicalName: "apple", displayName: "Apple", category: "fruit", aliases: ["apples"] },
  { id: "ing-sugar", canonicalName: "sugar", displayName: "Sugar", category: "sweetener", aliases: [] },
  { id: "ing-wine", canonicalName: "wine", displayName: "Wine", category: "sauce", aliases: ["red wine", "white wine"] }
];

export const ontologyTechniqueSeeds: Technique[] = [
  { id: "tech-fry", canonicalName: "fry", displayName: "Fry", techniqueGroup: "heat", description: "Cook in hot fat for browning and crisp texture." },
  { id: "tech-simmer", canonicalName: "simmer", displayName: "Simmer", techniqueGroup: "heat", description: "Cook gently in liquid below a full boil." },
  { id: "tech-smoke", canonicalName: "smoke", displayName: "Smoke", techniqueGroup: "heat", description: "Use wood smoke and indirect heat to season and cook." },
  { id: "tech-grill", canonicalName: "grill", displayName: "Grill", techniqueGroup: "heat", description: "Cook with direct or indirect heat from below." },
  { id: "tech-sear", canonicalName: "sear", displayName: "Sear", techniqueGroup: "heat", description: "Brown the exterior quickly with high heat." },
  { id: "tech-boil", canonicalName: "boil", displayName: "Boil", techniqueGroup: "heat", description: "Cook in vigorously bubbling liquid." },
  { id: "tech-stir-fry", canonicalName: "stir fry", displayName: "Stir-fry", techniqueGroup: "heat", description: "Cook quickly in a hot pan while moving food constantly." },
  { id: "tech-steam", canonicalName: "steam", displayName: "Steam", techniqueGroup: "heat", description: "Cook with vapor for gentle heat and moisture." },
  { id: "tech-ferment", canonicalName: "ferment", displayName: "Ferment", techniqueGroup: "preservation", description: "Use controlled microbial activity to transform flavor and texture." },
  { id: "tech-pickle", canonicalName: "pickle", displayName: "Pickle", techniqueGroup: "preservation", description: "Preserve or season ingredients with acid, salt, or brine." },
  { id: "tech-cure", canonicalName: "cure", displayName: "Cure", techniqueGroup: "preservation", description: "Season or preserve with salt, sugar, acid, or time." },
  { id: "tech-knead", canonicalName: "knead", displayName: "Knead", techniqueGroup: "prep", description: "Work dough to build structure." },
  { id: "tech-batter", canonicalName: "batter", displayName: "Batter", techniqueGroup: "prep", description: "Coat or mix with a pourable starch-based mixture." },
  { id: "tech-layer", canonicalName: "layer", displayName: "Layer", techniqueGroup: "assembly", description: "Build a dish through repeated layers before baking or serving." },
  { id: "tech-fold", canonicalName: "fold", displayName: "Fold", techniqueGroup: "finishing", description: "Combine gently to preserve texture or aeration." },
  { id: "tech-poach", canonicalName: "poach", displayName: "Poach", techniqueGroup: "heat", description: "Cook gently in barely moving liquid." }
];

export const skeletonDishSeeds: DishSeed[] = [
  { displayName: "Carbonara", cuisineId: "cui-italian", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-spaghetti", "ing-egg", "ing-guanciale", "ing-pecorino", "ing-black-pepper"], techniqueIds: ["tech-emulsify", "tech-boil"], description: "Roman pasta built from eggs, cured pork, cheese, pepper, and careful residual heat." },
  { displayName: "Cacio e pepe", cuisineId: "cui-italian", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-spaghetti", "ing-pecorino", "ing-black-pepper"], techniqueIds: ["tech-emulsify", "tech-boil"], description: "Minimal pasta where cheese, pepper, and starchy water become a glossy sauce." },
  { displayName: "Lasagna", cuisineId: "cui-italian", difficultyBandId: "diff-project", methodId: "method-oven", ingredientIds: ["ing-noodles", "ing-tomato", "ing-beef", "ing-mozzarella", "ing-parmesan"], techniqueIds: ["tech-layer", "tech-bake", "tech-simmer"], description: "Layered pasta, sauce, cheese, and filling baked into a sliceable casserole." },
  { displayName: "Bolognese", cuisineId: "cui-italian", difficultyBandId: "diff-advanced", methodId: "method-slow-cook", ingredientIds: ["ing-beef", "ing-pork", "ing-tomato", "ing-onion", "ing-wine"], techniqueIds: ["tech-simmer", "tech-sear"], description: "Slow-cooked meat sauce where browning, aromatics, dairy, and time create depth." },
  { displayName: "Alfredo", cuisineId: "cui-italian", difficultyBandId: "diff-easy", methodId: "method-stovetop", ingredientIds: ["ing-spaghetti", "ing-butter", "ing-parmesan"], techniqueIds: ["tech-emulsify", "tech-boil"], description: "Butter, cheese, and pasta water turned into a rich, simple sauce." },
  { displayName: "Risotto", cuisineId: "cui-italian", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-rice", "ing-butter", "ing-parmesan", "ing-mushroom"], techniqueIds: ["tech-simmer", "tech-fold"], description: "Short-grain rice cooked with gradual liquid additions until creamy and flowing." },
  { displayName: "Margherita pizza", cuisineId: "cui-italian", difficultyBandId: "diff-project", methodId: "method-oven", ingredientIds: ["ing-flour", "ing-tomato", "ing-mozzarella", "ing-basil", "ing-olive-oil"], techniqueIds: ["tech-knead", "tech-bake"], description: "Thin dough, tomato, mozzarella, basil, and high heat in a canonical pizza form." },
  { displayName: "Osso buco", cuisineId: "cui-italian", difficultyBandId: "diff-advanced", methodId: "method-slow-cook", ingredientIds: ["ing-beef", "ing-onion", "ing-tomato", "ing-wine"], techniqueIds: ["tech-braise", "tech-sear"], description: "Cross-cut shanks braised until tender with aromatics and wine." },
  { displayName: "Tacos", cuisineId: "cui-mexican", difficultyBandId: "diff-easy", methodId: "method-stovetop", ingredientIds: ["ing-tortilla", "ing-beef", "ing-onion", "ing-cilantro", "ing-lime"], techniqueIds: ["tech-sear", "tech-simmer"], description: "Tortillas filled with seasoned proteins, vegetables, salsa, herbs, and acid." },
  { displayName: "Enchiladas", cuisineId: "cui-mexican", difficultyBandId: "diff-intermediate", methodId: "method-oven", ingredientIds: ["ing-tortilla", "ing-chicken", "ing-chiles", "ing-tomato", "ing-cheddar"], techniqueIds: ["tech-simmer", "tech-bake"], description: "Rolled tortillas sauced with chile-rich salsa and baked with filling and cheese." },
  { displayName: "Chili", cuisineId: "cui-mexican", difficultyBandId: "diff-intermediate", methodId: "method-slow-cook", ingredientIds: ["ing-beef", "ing-dried-chiles", "ing-beans", "ing-cumin", "ing-tomato"], techniqueIds: ["tech-toast-chiles", "tech-simmer", "tech-braise"], description: "A chile-centered stew family with beef, beans, tomato, and regional branches." },
  { displayName: "Pozole", cuisineId: "cui-mexican", difficultyBandId: "diff-advanced", methodId: "method-slow-cook", ingredientIds: ["ing-pork", "ing-corn", "ing-chiles", "ing-cabbage", "ing-lime"], techniqueIds: ["tech-simmer", "tech-braise"], description: "Hominy stew with pork, chiles, bright garnishes, and long-simmered broth." },
  { displayName: "Mole", cuisineId: "cui-mexican", difficultyBandId: "diff-project", methodId: "method-stovetop", ingredientIds: ["ing-chiles", "ing-dried-chiles", "ing-chicken", "ing-tomato", "ing-curry-spices"], techniqueIds: ["tech-toast-chiles", "tech-simmer"], description: "Complex chile sauce family built through toasted ingredients, spices, and slow reduction." },
  { displayName: "Tamales", cuisineId: "cui-mexican", difficultyBandId: "diff-project", methodId: "method-stovetop", ingredientIds: ["ing-masa", "ing-pork", "ing-chiles", "ing-corn"], techniqueIds: ["tech-steam", "tech-fold"], description: "Masa dough wrapped around fillings and steamed until tender." },
  { displayName: "Quesadillas", cuisineId: "cui-mexican", difficultyBandId: "diff-easy", methodId: "method-stovetop", ingredientIds: ["ing-tortilla", "ing-cheddar", "ing-mushroom", "ing-chiles"], techniqueIds: ["tech-sear", "tech-fold"], description: "Folded or layered tortillas griddled with cheese and fillings." },
  { displayName: "Carnitas", cuisineId: "cui-mexican", difficultyBandId: "diff-intermediate", methodId: "method-slow-cook", ingredientIds: ["ing-pork", "ing-lime", "ing-onion", "ing-tortilla"], techniqueIds: ["tech-braise", "tech-sear"], description: "Pork cooked until tender, then crisped for tacos, bowls, or plates." },
  { displayName: "Fried rice", cuisineId: "cui-chinese", difficultyBandId: "diff-easy", methodId: "method-stovetop", ingredientIds: ["ing-rice", "ing-egg", "ing-soy-sauce", "ing-onion", "ing-garlic"], techniqueIds: ["tech-stir-fry", "tech-sear"], description: "Day-old rice stir-fried with egg, aromatics, vegetables, and savory seasoning." },
  { displayName: "Dumplings", cuisineId: "cui-chinese", difficultyBandId: "diff-project", methodId: "method-stovetop", ingredientIds: ["ing-flour", "ing-pork", "ing-ginger", "ing-soy-sauce", "ing-cabbage"], techniqueIds: ["tech-fold", "tech-steam", "tech-sear"], description: "Filled wrappers cooked by steaming, boiling, pan-frying, or combinations of all three." },
  { displayName: "Mapo tofu", cuisineId: "cui-chinese", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-tofu", "ing-pork", "ing-chiles", "ing-garlic", "ing-ginger"], techniqueIds: ["tech-simmer", "tech-stir-fry"], description: "Tofu and meat simmered in a spicy, aromatic sauce." },
  { displayName: "Chow mein", cuisineId: "cui-chinese", difficultyBandId: "diff-easy", methodId: "method-stovetop", ingredientIds: ["ing-noodles", "ing-chicken", "ing-soy-sauce", "ing-cabbage"], techniqueIds: ["tech-stir-fry", "tech-boil"], description: "Stir-fried noodles with protein, vegetables, and glossy savory sauce." },
  { displayName: "Char siu", cuisineId: "cui-chinese", difficultyBandId: "diff-intermediate", methodId: "method-oven", ingredientIds: ["ing-pork", "ing-soy-sauce", "ing-honey", "ing-garlic"], techniqueIds: ["tech-roast", "tech-batter"], description: "Sweet-savory glazed pork roasted until lacquered and tender." },
  { displayName: "Hot pot", cuisineId: "cui-chinese", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-beef", "ing-tofu", "ing-mushroom", "ing-noodles"], techniqueIds: ["tech-simmer", "tech-poach"], description: "Communal simmering broth used to cook thin meats, vegetables, tofu, and noodles." },
  { displayName: "Sweet and sour pork", cuisineId: "cui-chinese", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-pork", "ing-vinegar", "ing-sugar", "ing-tomato"], techniqueIds: ["tech-fry", "tech-simmer"], description: "Crisp pork coated in a bright sweet-sour sauce." },
  { displayName: "Scallion noodles", cuisineId: "cui-chinese", difficultyBandId: "diff-easy", methodId: "method-stovetop", ingredientIds: ["ing-noodles", "ing-soy-sauce", "ing-onion"], techniqueIds: ["tech-boil", "tech-stir-fry"], description: "Noodles tossed with aromatic oil and savory sauce." },
  { displayName: "Ramen", cuisineId: "cui-japanese", difficultyBandId: "diff-project", methodId: "method-stovetop", ingredientIds: ["ing-noodles", "ing-pork", "ing-egg", "ing-soy-sauce"], techniqueIds: ["tech-simmer", "tech-boil"], description: "Noodles in seasoned broth with tare, fat, toppings, and regional styles." },
  { displayName: "Udon", cuisineId: "cui-japanese", difficultyBandId: "diff-easy", methodId: "method-stovetop", ingredientIds: ["ing-noodles", "ing-soy-sauce", "ing-ginger"], techniqueIds: ["tech-boil", "tech-simmer"], description: "Thick wheat noodles served in broth, sauce, stir-fry, or chilled forms." },
  { displayName: "Sushi", cuisineId: "cui-japanese", difficultyBandId: "diff-advanced", methodId: "method-no-cook", ingredientIds: ["ing-rice", "ing-fish", "ing-vinegar", "ing-cucumber"], techniqueIds: ["tech-fold", "tech-cure"], description: "Seasoned rice paired with fish, vegetables, seaweed, or composed toppings." },
  { displayName: "Katsu curry", cuisineId: "cui-japanese", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-chicken", "ing-bread", "ing-potato", "ing-curry-spices", "ing-rice"], techniqueIds: ["tech-fry", "tech-simmer"], description: "Breaded cutlet served with mild curry sauce and rice." },
  { displayName: "Donburi", cuisineId: "cui-japanese", difficultyBandId: "diff-easy", methodId: "method-stovetop", ingredientIds: ["ing-rice", "ing-egg", "ing-chicken", "ing-onion"], techniqueIds: ["tech-simmer", "tech-poach"], description: "Rice bowls topped with simmered, grilled, fried, or sauced ingredients." },
  { displayName: "Yakitori", cuisineId: "cui-japanese", difficultyBandId: "diff-intermediate", methodId: "method-grill", ingredientIds: ["ing-chicken", "ing-soy-sauce", "ing-sugar"], techniqueIds: ["tech-grill", "tech-sear"], description: "Skewered chicken grilled over high heat with salt or tare." },
  { displayName: "Tempura", cuisineId: "cui-japanese", difficultyBandId: "diff-advanced", methodId: "method-stovetop", ingredientIds: ["ing-flour", "ing-egg", "ing-seafood", "ing-mushroom"], techniqueIds: ["tech-fry", "tech-batter"], description: "Lightly battered seafood or vegetables fried for a crisp, delicate shell." },
  { displayName: "Okonomiyaki", cuisineId: "cui-japanese", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-flour", "ing-egg", "ing-cabbage", "ing-pork"], techniqueIds: ["tech-batter", "tech-sear"], description: "Savory cabbage pancake griddled with fillings and finished with sauce." },
  { displayName: "Butter chicken", cuisineId: "cui-indian", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-chicken", "ing-butter", "ing-tomato", "ing-cream", "ing-curry-spices"], techniqueIds: ["tech-simmer", "tech-sear"], description: "Chicken in a rich tomato-butter sauce with warm spices." },
  { displayName: "Biryani", cuisineId: "cui-indian", difficultyBandId: "diff-project", methodId: "method-one-pot", ingredientIds: ["ing-rice", "ing-chicken", "ing-yogurt", "ing-onion", "ing-curry-spices"], techniqueIds: ["tech-layer", "tech-steam"], description: "Layered rice and spiced protein steamed together into a fragrant centerpiece." },
  { displayName: "Dal", cuisineId: "cui-indian", difficultyBandId: "diff-easy", methodId: "method-stovetop", ingredientIds: ["ing-lentils", "ing-garlic", "ing-ginger", "ing-curry-spices"], techniqueIds: ["tech-simmer"], description: "Lentils cooked until tender and seasoned with spices, aromatics, or tadka." },
  { displayName: "Tikka masala", cuisineId: "cui-indian", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-chicken", "ing-yogurt", "ing-tomato", "ing-cream", "ing-curry-spices"], techniqueIds: ["tech-sear", "tech-simmer"], description: "Marinated chicken in creamy tomato-spice sauce." },
  { displayName: "Saag paneer", cuisineId: "cui-indian", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-greens", "ing-cream", "ing-garlic", "ing-curry-spices"], techniqueIds: ["tech-simmer", "tech-fold"], description: "Greens cooked with spices and finished with paneer or a creamy element." },
  { displayName: "Chana masala", cuisineId: "cui-indian", difficultyBandId: "diff-easy", methodId: "method-stovetop", ingredientIds: ["ing-chickpeas", "ing-tomato", "ing-onion", "ing-garlic", "ing-curry-spices"], techniqueIds: ["tech-simmer"], description: "Chickpeas simmered in a tomato-onion spice base." },
  { displayName: "Vindaloo", cuisineId: "cui-indian", difficultyBandId: "diff-advanced", methodId: "method-stovetop", ingredientIds: ["ing-pork", "ing-vinegar", "ing-chiles", "ing-curry-spices"], techniqueIds: ["tech-simmer", "tech-sear"], description: "Tangy, chile-forward curry with vinegar and assertive spice." },
  { displayName: "Naan", cuisineId: "cui-indian", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-flour", "ing-yogurt", "ing-butter", "ing-garlic"], techniqueIds: ["tech-knead", "tech-sear"], description: "Soft flatbread cooked against intense heat and often finished with butter." },
  { displayName: "Cheeseburger", cuisineId: "cui-american", difficultyBandId: "diff-easy", methodId: "method-grill", ingredientIds: ["ing-beef", "ing-cheddar", "ing-bread", "ing-onion"], techniqueIds: ["tech-sear", "tech-grill"], description: "Ground beef patty, cheese, bun, and condiments shaped by sear and assembly." },
  { displayName: "Mac and cheese", cuisineId: "cui-american", difficultyBandId: "diff-easy", methodId: "method-stovetop", ingredientIds: ["ing-noodles", "ing-cheddar", "ing-butter", "ing-roux"], techniqueIds: ["tech-emulsify", "tech-roux"], description: "Pasta folded into a cheese sauce, from stovetop glossy to baked casserole." },
  { displayName: "Roast chicken", cuisineId: "cui-american", difficultyBandId: "diff-intermediate", methodId: "method-oven", ingredientIds: ["ing-chicken", "ing-butter", "ing-garlic", "ing-lemon"], techniqueIds: ["tech-roast", "tech-sear"], description: "Whole or parted chicken roasted for crisp skin and juicy meat." },
  { displayName: "Meatloaf", cuisineId: "cui-american", difficultyBandId: "diff-easy", methodId: "method-oven", ingredientIds: ["ing-beef", "ing-bread", "ing-egg", "ing-tomato"], techniqueIds: ["tech-bake", "tech-fold"], description: "Ground meat, binder, seasoning, and glaze baked into a sliceable loaf." },
  { displayName: "Buffalo wings", cuisineId: "cui-american", difficultyBandId: "diff-intermediate", methodId: "method-oven", ingredientIds: ["ing-chicken", "ing-butter", "ing-vinegar", "ing-chiles"], techniqueIds: ["tech-fry", "tech-bake"], description: "Crisp chicken wings tossed in buttery, tangy hot sauce." },
  { displayName: "Barbecue brisket", cuisineId: "cui-american", difficultyBandId: "diff-project", methodId: "method-smoker", ingredientIds: ["ing-beef", "ing-black-pepper", "ing-smoked-paprika"], techniqueIds: ["tech-smoke", "tech-simmer"], description: "Large beef cut smoked low and slow until tender and deeply seasoned." },
  { displayName: "Pancakes", cuisineId: "cui-american", difficultyBandId: "diff-easy", methodId: "method-stovetop", ingredientIds: ["ing-flour", "ing-egg", "ing-butter", "ing-sugar"], techniqueIds: ["tech-batter", "tech-sear"], description: "Griddled batter cakes with tender centers and browned surfaces." },
  { displayName: "Apple pie", cuisineId: "cui-american", difficultyBandId: "diff-project", methodId: "method-oven", ingredientIds: ["ing-apple", "ing-flour", "ing-butter", "ing-sugar"], techniqueIds: ["tech-bake", "tech-layer"], description: "Fruit filling encased in pastry and baked until bubbling and flaky." },
  { displayName: "Coq au vin", cuisineId: "cui-french", difficultyBandId: "diff-advanced", methodId: "method-slow-cook", ingredientIds: ["ing-chicken", "ing-wine", "ing-mushroom", "ing-onion"], techniqueIds: ["tech-braise", "tech-sear"], description: "Chicken braised with wine, mushrooms, and aromatics." },
  { displayName: "Beef bourguignon", cuisineId: "cui-french", difficultyBandId: "diff-project", methodId: "method-slow-cook", ingredientIds: ["ing-beef", "ing-wine", "ing-mushroom", "ing-onion"], techniqueIds: ["tech-braise", "tech-sear"], description: "Beef slowly braised in wine with vegetables and mushrooms." },
  { displayName: "Ratatouille", cuisineId: "cui-french", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-eggplant", "ing-tomato", "ing-onion", "ing-basil"], techniqueIds: ["tech-simmer", "tech-sear"], description: "Vegetable stew centered on eggplant, tomato, aromatics, and olive oil." },
  { displayName: "Quiche", cuisineId: "cui-french", difficultyBandId: "diff-intermediate", methodId: "method-oven", ingredientIds: ["ing-egg", "ing-cream", "ing-flour", "ing-butter"], techniqueIds: ["tech-bake", "tech-layer"], description: "Savory custard baked in a pastry shell with vegetables, cheese, or meat." },
  { displayName: "French onion soup", cuisineId: "cui-french", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-onion", "ing-bread", "ing-cheddar", "ing-wine"], techniqueIds: ["tech-simmer", "tech-sear"], description: "Deeply browned onions simmered into soup and finished with bread and melted cheese." },
  { displayName: "Croque monsieur", cuisineId: "cui-french", difficultyBandId: "diff-easy", methodId: "method-oven", ingredientIds: ["ing-bread", "ing-cheddar", "ing-butter", "ing-roux"], techniqueIds: ["tech-bake", "tech-roux"], description: "Toasted ham-and-cheese sandwich enriched with bechamel." },
  { displayName: "Crepes", cuisineId: "cui-french", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-flour", "ing-egg", "ing-butter", "ing-cream"], techniqueIds: ["tech-batter", "tech-sear"], description: "Thin skillet pancakes filled or folded sweet or savory." },
  { displayName: "Bouillabaisse", cuisineId: "cui-french", difficultyBandId: "diff-project", methodId: "method-stovetop", ingredientIds: ["ing-seafood", "ing-tomato", "ing-garlic", "ing-fish"], techniqueIds: ["tech-simmer", "tech-poach"], description: "Seafood stew built from fish, shellfish, aromatics, and broth." },
  { displayName: "Pad thai", cuisineId: "cui-thai", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-noodles", "ing-egg", "ing-peanut", "ing-lime", "ing-soy-sauce"], techniqueIds: ["tech-stir-fry", "tech-boil"], description: "Stir-fried rice noodles balanced with sweet, sour, salty, and nutty elements." },
  { displayName: "Green curry", cuisineId: "cui-thai", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-coconut-milk", "ing-chicken", "ing-chiles", "ing-basil"], techniqueIds: ["tech-simmer"], description: "Coconut curry with green chiles, herbs, vegetables, and protein." },
  { displayName: "Tom yum", cuisineId: "cui-thai", difficultyBandId: "diff-easy", methodId: "method-stovetop", ingredientIds: ["ing-seafood", "ing-lime", "ing-chiles", "ing-ginger"], techniqueIds: ["tech-simmer", "tech-poach"], description: "Hot-sour soup driven by aromatics, lime, chile, and seafood or chicken." },
  { displayName: "Som tam", cuisineId: "cui-thai", difficultyBandId: "diff-easy", methodId: "method-no-cook", ingredientIds: ["ing-cabbage", "ing-lime", "ing-chiles", "ing-peanut"], techniqueIds: ["tech-fold"], description: "Crisp pounded salad balanced by lime, chile, sugar, and savory seasoning." },
  { displayName: "Massaman curry", cuisineId: "cui-thai", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-coconut-milk", "ing-beef", "ing-potato", "ing-curry-spices"], techniqueIds: ["tech-simmer", "tech-braise"], description: "Mild, aromatic curry with coconut milk, spices, potato, and tender meat." },
  { displayName: "Larb", cuisineId: "cui-thai", difficultyBandId: "diff-easy", methodId: "method-stovetop", ingredientIds: ["ing-pork", "ing-lime", "ing-cilantro", "ing-chiles"], techniqueIds: ["tech-sear", "tech-fold"], description: "Minced meat salad seasoned with lime, herbs, chile, and toasted rice powder." },
  { displayName: "Khao soi", cuisineId: "cui-thai", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-noodles", "ing-coconut-milk", "ing-chicken", "ing-curry-spices"], techniqueIds: ["tech-simmer", "tech-fry"], description: "Curry noodle soup finished with crisp noodles and bright garnishes." },
  { displayName: "Mango sticky rice", cuisineId: "cui-thai", difficultyBandId: "diff-easy", methodId: "method-stovetop", ingredientIds: ["ing-rice", "ing-coconut-milk", "ing-sugar"], techniqueIds: ["tech-steam", "tech-simmer"], description: "Sweet coconut sticky rice served with ripe fruit." },
  { displayName: "Hummus", cuisineId: "cui-middle-eastern", difficultyBandId: "diff-easy", methodId: "method-no-cook", ingredientIds: ["ing-chickpeas", "ing-garlic", "ing-lemon", "ing-olive-oil"], techniqueIds: ["tech-emulsify"], description: "Pureed chickpeas, tahini-adjacent richness, garlic, lemon, and olive oil." },
  { displayName: "Falafel", cuisineId: "cui-middle-eastern", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-chickpeas", "ing-cilantro", "ing-garlic", "ing-pita"], techniqueIds: ["tech-fry", "tech-batter"], description: "Herbed legume mixture shaped and fried until crisp outside and tender inside." },
  { displayName: "Shawarma", cuisineId: "cui-middle-eastern", difficultyBandId: "diff-intermediate", methodId: "method-grill", ingredientIds: ["ing-chicken", "ing-yogurt", "ing-garlic", "ing-pita"], techniqueIds: ["tech-grill", "tech-sear"], description: "Spiced sliced meat served with flatbread, sauces, and crisp vegetables." },
  { displayName: "Kebabs", cuisineId: "cui-middle-eastern", difficultyBandId: "diff-easy", methodId: "method-grill", ingredientIds: ["ing-lamb", "ing-beef", "ing-onion", "ing-curry-spices"], techniqueIds: ["tech-grill", "tech-sear"], description: "Skewered or shaped meats grilled with aromatics and warm spices." },
  { displayName: "Mujadara", cuisineId: "cui-middle-eastern", difficultyBandId: "diff-easy", methodId: "method-one-pot", ingredientIds: ["ing-lentils", "ing-rice", "ing-onion", "ing-olive-oil"], techniqueIds: ["tech-simmer", "tech-sear"], description: "Lentils and rice topped with deeply browned onions." },
  { displayName: "Shakshuka", cuisineId: "cui-middle-eastern", difficultyBandId: "diff-easy", methodId: "method-stovetop", ingredientIds: ["ing-egg", "ing-tomato", "ing-chiles", "ing-onion"], techniqueIds: ["tech-simmer", "tech-poach"], description: "Eggs poached in a spiced tomato and pepper sauce." },
  { displayName: "Baklava", cuisineId: "cui-middle-eastern", difficultyBandId: "diff-project", methodId: "method-oven", ingredientIds: ["ing-flour", "ing-butter", "ing-honey", "ing-sugar"], techniqueIds: ["tech-layer", "tech-bake"], description: "Layered pastry with nuts, butter, and syrup." },
  { displayName: "Fattoush", cuisineId: "cui-middle-eastern", difficultyBandId: "diff-easy", methodId: "method-no-cook", ingredientIds: ["ing-cucumber", "ing-tomato", "ing-pita", "ing-lemon"], techniqueIds: ["tech-fold"], description: "Bread salad with crisp vegetables, herbs, toasted pita, and tart dressing." },
  { displayName: "Greek salad", cuisineId: "cui-mediterranean", difficultyBandId: "diff-easy", methodId: "method-no-cook", ingredientIds: ["ing-cucumber", "ing-tomato", "ing-onion", "ing-olive-oil"], techniqueIds: ["tech-fold"], description: "Fresh vegetables, olive oil, briny cheese, herbs, and simple assembly." },
  { displayName: "Paella", cuisineId: "cui-mediterranean", difficultyBandId: "diff-project", methodId: "method-stovetop", ingredientIds: ["ing-rice", "ing-seafood", "ing-chicken", "ing-tomato"], techniqueIds: ["tech-simmer", "tech-sear"], description: "Wide-pan rice dish where broth, seafood, meat, and socarrat define the result." },
  { displayName: "Moussaka", cuisineId: "cui-mediterranean", difficultyBandId: "diff-project", methodId: "method-oven", ingredientIds: ["ing-eggplant", "ing-lamb", "ing-tomato", "ing-roux"], techniqueIds: ["tech-layer", "tech-bake", "tech-roux"], description: "Layered eggplant, spiced meat sauce, and creamy topping baked together." },
  { displayName: "Spanakopita", cuisineId: "cui-mediterranean", difficultyBandId: "diff-intermediate", methodId: "method-oven", ingredientIds: ["ing-greens", "ing-flour", "ing-butter", "ing-egg"], techniqueIds: ["tech-layer", "tech-bake"], description: "Greens and cheese wrapped in crisp layered pastry." },
  { displayName: "Gazpacho", cuisineId: "cui-mediterranean", difficultyBandId: "diff-easy", methodId: "method-no-cook", ingredientIds: ["ing-tomato", "ing-cucumber", "ing-garlic", "ing-vinegar"], techniqueIds: ["tech-emulsify"], description: "Cold tomato and vegetable soup blended with bread, oil, and vinegar." },
  { displayName: "Pita", cuisineId: "cui-mediterranean", difficultyBandId: "diff-intermediate", methodId: "method-oven", ingredientIds: ["ing-flour", "ing-olive-oil", "ing-yogurt"], techniqueIds: ["tech-knead", "tech-bake"], description: "Pocketed or flat bread built from simple dough and strong heat." },
  { displayName: "Seafood stew", cuisineId: "cui-mediterranean", difficultyBandId: "diff-intermediate", methodId: "method-stovetop", ingredientIds: ["ing-seafood", "ing-tomato", "ing-garlic", "ing-wine"], techniqueIds: ["tech-simmer", "tech-poach"], description: "Coastal stew of fish or shellfish simmered with tomatoes, wine, and aromatics." },
  { displayName: "Grilled fish", cuisineId: "cui-mediterranean", difficultyBandId: "diff-easy", methodId: "method-grill", ingredientIds: ["ing-fish", "ing-lemon", "ing-olive-oil", "ing-garlic"], techniqueIds: ["tech-grill", "tech-sear"], description: "Simple fish cooked over heat and finished with citrus, herbs, and olive oil." }
];

export const skeletonFamilies: RecipeFamily[] = skeletonDishSeeds.map((seed) => {
  const cuisine = cuisineById.get(seed.cuisineId);
  return {
    id: familyId(seed.displayName),
    slug: slugify(seed.displayName),
    displayName: seed.displayName,
    category: cuisine?.slug ?? "skeleton",
    categoryId: categoryIdForDish(seed.displayName, seed.cuisineId),
    cuisine: cuisine?.displayName ?? "Global",
    cuisineId: seed.cuisineId,
    description: seed.description,
    difficultyBandId: seed.difficultyBandId,
    primaryMethodId: seed.methodId,
    isCanonical: true
  };
});

export const skeletonCuisineDishFamilies: CuisineDishFamily[] = skeletonDishSeeds.map((seed) => ({
  cuisineId: seed.cuisineId,
  dishFamilyId: familyId(seed.displayName),
  relationshipStrength: 0.88
}));

export const skeletonDishFamilyIngredients: DishFamilyIngredient[] = skeletonDishSeeds.flatMap((seed) =>
  seed.ingredientIds.map((ingredientId, index) => ({
    dishFamilyId: familyId(seed.displayName),
    ingredientId,
    importanceScore: Number((1 - index * 0.08).toFixed(2))
  }))
);

export const skeletonDishFamilyTechniques: DishFamilyTechnique[] = skeletonDishSeeds.flatMap((seed) =>
  seed.techniqueIds.map((techniqueId, index) => ({
    dishFamilyId: familyId(seed.displayName),
    techniqueId,
    importanceScore: Number((0.95 - index * 0.1).toFixed(2))
  }))
);

export const skeletonDishFamilyMethods: DishFamilyMethod[] = skeletonDishSeeds.map((seed) => ({
  dishFamilyId: familyId(seed.displayName),
  cookingMethodId: seed.methodId,
  importanceScore: 0.92
}));

export const existingCuisineDishFamilies: CuisineDishFamily[] = [
  { cuisineId: "cui-american", dishFamilyId: "fam-chili-con-carne", relationshipStrength: 0.9 },
  { cuisineId: "cui-mexican", dishFamilyId: "fam-green-chili", relationshipStrength: 0.86 },
  { cuisineId: "cui-italian", dishFamilyId: "fam-roman-pasta", relationshipStrength: 0.95 },
  { cuisineId: "cui-american", dishFamilyId: "fam-baked-creamy-pasta", relationshipStrength: 0.76 },
  { cuisineId: "cui-italian", dishFamilyId: "fam-baked-creamy-pasta", relationshipStrength: 0.72 }
];

export const existingDishFamilyIngredients: DishFamilyIngredient[] = [
  { dishFamilyId: "fam-chili-con-carne", ingredientId: "ing-beef", importanceScore: 1 },
  { dishFamilyId: "fam-chili-con-carne", ingredientId: "ing-dried-chiles", importanceScore: 0.96 },
  { dishFamilyId: "fam-chili-con-carne", ingredientId: "ing-beans", importanceScore: 0.78 },
  { dishFamilyId: "fam-chili-con-carne", ingredientId: "ing-tomato", importanceScore: 0.72 },
  { dishFamilyId: "fam-green-chili", ingredientId: "ing-tomatillo", importanceScore: 1 },
  { dishFamilyId: "fam-green-chili", ingredientId: "ing-green-chile", importanceScore: 0.96 },
  { dishFamilyId: "fam-green-chili", ingredientId: "ing-pork", importanceScore: 0.84 },
  { dishFamilyId: "fam-green-chili", ingredientId: "ing-chicken", importanceScore: 0.7 },
  { dishFamilyId: "fam-roman-pasta", ingredientId: "ing-spaghetti", importanceScore: 1 },
  { dishFamilyId: "fam-roman-pasta", ingredientId: "ing-pecorino", importanceScore: 0.94 },
  { dishFamilyId: "fam-roman-pasta", ingredientId: "ing-black-pepper", importanceScore: 0.88 },
  { dishFamilyId: "fam-roman-pasta", ingredientId: "ing-guanciale", importanceScore: 0.76 },
  { dishFamilyId: "fam-baked-creamy-pasta", ingredientId: "ing-parmesan", importanceScore: 0.94 },
  { dishFamilyId: "fam-baked-creamy-pasta", ingredientId: "ing-mozzarella", importanceScore: 0.84 },
  { dishFamilyId: "fam-baked-creamy-pasta", ingredientId: "ing-butter", importanceScore: 0.78 },
  { dishFamilyId: "fam-baked-creamy-pasta", ingredientId: "ing-roux", importanceScore: 0.72 }
];

export const existingDishFamilyTechniques: DishFamilyTechnique[] = [
  { dishFamilyId: "fam-chili-con-carne", techniqueId: "tech-toast-chiles", importanceScore: 0.96 },
  { dishFamilyId: "fam-chili-con-carne", techniqueId: "tech-braise", importanceScore: 0.9 },
  { dishFamilyId: "fam-chili-con-carne", techniqueId: "tech-simmer", importanceScore: 0.86 },
  { dishFamilyId: "fam-green-chili", techniqueId: "tech-roast", importanceScore: 0.92 },
  { dishFamilyId: "fam-green-chili", techniqueId: "tech-braise", importanceScore: 0.86 },
  { dishFamilyId: "fam-roman-pasta", techniqueId: "tech-emulsify", importanceScore: 1 },
  { dishFamilyId: "fam-roman-pasta", techniqueId: "tech-boil", importanceScore: 0.72 },
  { dishFamilyId: "fam-baked-creamy-pasta", techniqueId: "tech-emulsify", importanceScore: 0.88 },
  { dishFamilyId: "fam-baked-creamy-pasta", techniqueId: "tech-bake", importanceScore: 0.82 },
  { dishFamilyId: "fam-baked-creamy-pasta", techniqueId: "tech-roux", importanceScore: 0.76 }
];

export const existingDishFamilyMethods: DishFamilyMethod[] = [
  { dishFamilyId: "fam-chili-con-carne", cookingMethodId: "method-slow-cook", importanceScore: 0.9 },
  { dishFamilyId: "fam-green-chili", cookingMethodId: "method-slow-cook", importanceScore: 0.84 },
  { dishFamilyId: "fam-roman-pasta", cookingMethodId: "method-stovetop", importanceScore: 0.98 },
  { dishFamilyId: "fam-baked-creamy-pasta", cookingMethodId: "method-oven", importanceScore: 0.78 },
  { dishFamilyId: "fam-baked-creamy-pasta", cookingMethodId: "method-stovetop", importanceScore: 0.72 }
];

const relatedDishFamilySeeds: DishFamilyRelatedDishFamily[] = [
  { fromDishFamilyId: "fam-carbonara", toDishFamilyId: "fam-cacio-e-pepe", relationshipType: "same_family_as" },
  { fromDishFamilyId: "fam-carbonara", toDishFamilyId: "fam-roman-pasta", relationshipType: "same_family_as" },
  { fromDishFamilyId: "fam-cacio-e-pepe", toDishFamilyId: "fam-roman-pasta", relationshipType: "same_family_as" },
  { fromDishFamilyId: "fam-alfredo", toDishFamilyId: "fam-baked-creamy-pasta", relationshipType: "often_compared_with" },
  { fromDishFamilyId: "fam-mac-and-cheese", toDishFamilyId: "fam-baked-creamy-pasta", relationshipType: "same_family_as" },
  { fromDishFamilyId: "fam-chili", toDishFamilyId: "fam-chili-con-carne", relationshipType: "variation_of" },
  { fromDishFamilyId: "fam-chili", toDishFamilyId: "fam-green-chili", relationshipType: "regional_cousin_of" },
  { fromDishFamilyId: "fam-tacos", toDishFamilyId: "fam-carnitas", relationshipType: "related_to" },
  { fromDishFamilyId: "fam-dumplings", toDishFamilyId: "fam-gyoza", relationshipType: "regional_cousin_of" },
  { fromDishFamilyId: "fam-fried-rice", toDishFamilyId: "fam-donburi", relationshipType: "often_compared_with" },
  { fromDishFamilyId: "fam-butter-chicken", toDishFamilyId: "fam-tikka-masala", relationshipType: "often_compared_with" },
  { fromDishFamilyId: "fam-hummus", toDishFamilyId: "fam-falafel", relationshipType: "related_to" },
  { fromDishFamilyId: "fam-greek-salad", toDishFamilyId: "fam-fattoush", relationshipType: "regional_cousin_of" }
];

export const dishFamilyRelatedDishFamilySeeds: DishFamilyRelatedDishFamily[] = relatedDishFamilySeeds.filter((relationship) =>
  relationship.toDishFamilyId === "fam-roman-pasta" ||
  relationship.toDishFamilyId === "fam-baked-creamy-pasta" ||
  relationship.toDishFamilyId === "fam-chili-con-carne" ||
  relationship.toDishFamilyId === "fam-green-chili" ||
  skeletonFamilies.some((family) => family.id === relationship.toDishFamilyId)
);
