export type FeaturedCuisineConfig = {
  slug: string;
  subtitle: string;
  preview: string[];
  tone: string;
  editorialRank: number;
  launchPriority?: number;
  isFeatured?: boolean;
};

export const featuredCuisineOrder: FeaturedCuisineConfig[] = [
  {
    slug: "american",
    subtitle: "Burgers, barbecue, pies",
    preview: ["Burgers", "Barbecue", "Sandwiches"],
    tone: "ember",
    editorialRank: 100,
    launchPriority: 100,
    isFeatured: true
  },
  {
    slug: "italian",
    subtitle: "Pasta, pizza, risotto",
    preview: ["Pasta", "Sauces", "Roman classics"],
    tone: "citrus",
    editorialRank: 96,
    isFeatured: true
  },
  {
    slug: "mexican",
    subtitle: "Tacos, masa, stews",
    preview: ["Tacos", "Moles", "Chiles"],
    tone: "paprika",
    editorialRank: 94,
    isFeatured: true
  },
  {
    slug: "japanese",
    subtitle: "Ramen, rice bowls, grills",
    preview: ["Ramen", "Katsu", "Yakitori"],
    tone: "ink",
    editorialRank: 92,
    isFeatured: true
  },
  {
    slug: "chinese",
    subtitle: "Noodles, stir-fries, dumplings",
    preview: ["Dumplings", "Wok cooking", "Rice dishes"],
    tone: "jade",
    editorialRank: 90,
    isFeatured: true
  },
  {
    slug: "indian",
    subtitle: "Curries, biryani, flatbreads",
    preview: ["Curries", "Rice", "Spiced legumes"],
    tone: "saffron",
    editorialRank: 88
  },
  {
    slug: "french",
    subtitle: "Braises, pastries, bistro fare",
    preview: ["Bistro", "Soups", "Sauces"],
    tone: "plum",
    editorialRank: 86
  },
  {
    slug: "thai",
    subtitle: "Curries, noodles, bright salads",
    preview: ["Noodles", "Curries", "Hot-sour soups"],
    tone: "leaf",
    editorialRank: 84
  },
  {
    slug: "korean",
    subtitle: "Barbecue, stews, fermented heat",
    preview: ["Barbecue", "Kimchi", "Rice bowls"],
    tone: "pepper",
    editorialRank: 82
  },
  {
    slug: "mediterranean",
    subtitle: "Seafood, grains, olive oil",
    preview: ["Rice dishes", "Salads", "Coastal stews"],
    tone: "sea",
    editorialRank: 80
  },
  {
    slug: "greek",
    subtitle: "Grills, pies, salads",
    preview: ["Skewers", "Pies", "Lemon-herb cooking"],
    tone: "marine",
    editorialRank: 78
  },
  {
    slug: "vietnamese",
    subtitle: "Broths, herbs, noodle bowls",
    preview: ["Pho", "Banh mi", "Fresh herbs"],
    tone: "spring",
    editorialRank: 76
  },
  {
    slug: "spanish",
    subtitle: "Rice, tapas, braises",
    preview: ["Paella", "Tapas", "Roasted peppers"],
    tone: "terracotta",
    editorialRank: 74
  },
  {
    slug: "british",
    subtitle: "Roasts, pies, pub classics",
    preview: ["Pies", "Roasts", "Comfort food"],
    tone: "slate",
    editorialRank: 70
  },
  {
    slug: "brazilian",
    subtitle: "Grills, stews, street snacks",
    preview: ["Churrasco", "Stews", "Cassava"],
    tone: "forest",
    editorialRank: 68
  },
  {
    slug: "ethiopian",
    subtitle: "Stews, injera, warm spices",
    preview: ["Wats", "Injera", "Lentils"],
    tone: "gold",
    editorialRank: 66
  }
];
