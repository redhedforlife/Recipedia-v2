import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Network } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CuratedSectionBrowser } from "@/components/CuratedSectionBrowser";
import { RecipeCard } from "@/components/RecipeCard";
import { getAmericanExploreExperience } from "@/lib/editorial";
import { getCuisine, getData } from "@/lib/data";

export default async function CuisinePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (slug === "american") {
    const experience = await getAmericanExploreExperience();
    if (!experience) notFound();

    return (
      <main className="container section">
        <Breadcrumbs
          items={[
            { label: "Explore", href: "/" },
            { label: "American" }
          ]}
        />

        <section className="page-hero page-hero--editorial">
          <div className="stack">
            <p className="eyebrow">{experience.eyebrow}</p>
            <h1>{experience.title}</h1>
            <p className="lede">{experience.description}</p>
            <div className="tag-list">
              {experience.highlights.map((highlight) => (
                <span className="tag" key={highlight}>
                  {highlight}
                </span>
              ))}
            </div>
          </div>

          <aside className="hero-rail">
            <div className="card stack">
              <h3>Quick stats</h3>
              <div className="stats-grid">
                {experience.stats.map((stat) => (
                  <div className="stat-tile" key={stat.label}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card stack">
              <h3>Start here</h3>
              <Link className="button" href="/families/burgers">
                Open Burgers <ArrowRight size={15} />
              </Link>
              <Link className="ghost-button" href={experience.graphHref}>
                Open map for American <Network size={15} />
              </Link>
            </div>
          </aside>
        </section>

        <CuratedSectionBrowser sections={experience.sections} />
      </main>
    );
  }

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
        <Link className="button" href={`/graph?mode=cuisine&focus=${cuisineData.cuisine.slug}`}>
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
