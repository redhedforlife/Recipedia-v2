import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RecipeCard } from "@/components/RecipeCard";
import { getCuisine, getData } from "@/lib/data";

export default async function CuisinePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const cuisineData = await getCuisine(slug);
  const data = await getData();
  if (!cuisineData) notFound();

  const sourceRecipes = cuisineData.recipes.filter((recipe) => recipe.isSourceRecipe).slice(0, 8);

  return (
    <main className="container section">
      <Breadcrumbs
        items={[
          { label: "Explore", href: "/" },
          { label: cuisineData.cuisine.displayName }
        ]}
      />

      <div className="section-head">
        <div>
          <p className="eyebrow">{cuisineData.cuisine.regionGroup ?? "Cuisine"}</p>
          <h1>{cuisineData.cuisine.displayName}</h1>
          <p className="lede">{cuisineData.cuisine.description}</p>
        </div>
        <Link className="button" href={`/graph?mode=dish&focus=${cuisineData.cuisine.slug}`}>
          Explore map
        </Link>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>Categories</h2>
        </div>
        <div className="grid">
          {cuisineData.categories.map((category) => (
            <Link className="card stack" href={`/categories/${category.slug}`} key={category.id}>
              <span className="eyebrow">{category.parentCategoryId ? "Subcategory" : "Category"}</span>
              <h3>{category.displayName}</h3>
              <p className="meta">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Dish families</h2>
        </div>
        <div className="grid">
          {cuisineData.families.slice(0, 12).map((family) => (
            <Link className="card stack" href={`/families/${family.slug}`} key={family.id}>
              <span className="eyebrow">
                {family.category === "uncategorized" ? "Dish family" : family.category.replace(/-/g, " ")}
              </span>
              <h3>{family.displayName}</h3>
              <p className="meta">{family.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Canonical dishes</h2>
        </div>
        <div className="grid two">
          {sourceRecipes.map((recipe) => (
            <RecipeCard
              cookReports={data.cookReports}
              family={data.families.find((family) => family.id === recipe.recipeFamilyId)}
              key={recipe.id}
              recipe={recipe}
              relationships={data.relationships}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
