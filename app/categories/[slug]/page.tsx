import Link from "next/link";
import { notFound } from "next/navigation";
import { RecipeCard } from "@/components/RecipeCard";
import { getCategory, getData } from "@/lib/data";

export default async function CategoryPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);
  const data = await getData();
  if (!category) notFound();

  return (
    <main className="container section">
      <div className="section-head">
        <div>
          <p className="eyebrow">Category</p>
          <h1>{category.category.displayName}</h1>
          <p className="lede">{category.category.description}</p>
        </div>
        <Link className="button" href={`/graph?mode=dish&focus=${category.category.slug}`}>
          Explore map
        </Link>
      </div>

      {category.cuisines.length ? (
        <section className="section">
          <div className="notice row">
            <span>
              {category.cuisines.length === 1 ? "Linked cuisine: " : "Associated cuisines: "}
              {category.cuisines.map((cuisine, index) => (
                <span key={cuisine.id}>
                  {index > 0 ? ", " : null}
                  <Link href={`/cuisines/${cuisine.slug}`}>{cuisine.displayName}</Link>
                </span>
              ))}
            </span>
          </div>
        </section>
      ) : null}

      {category.childCategories.length ? (
        <section className="section">
          <div className="section-head">
            <h2>Subcategories</h2>
          </div>
          <div className="grid">
            {category.childCategories.map((child) => (
              <Link className="card stack" href={`/categories/${child.slug}`} key={child.id}>
                <span className="eyebrow">Subcategory</span>
                <h3>{child.displayName}</h3>
                <p className="meta">{child.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="section-head">
          <h2>Dish families</h2>
        </div>
        <div className="grid">
          {category.families.map((family) => (
            <Link className="card stack" href={`/families/${family.slug}`} key={family.id}>
              <span className="eyebrow">{family.cuisine}</span>
              <h3>{family.displayName}</h3>
              <p className="meta">{family.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Canonical dishes and variations</h2>
        </div>
        <div className="grid">
          {category.recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              family={data.families.find((family) => family.id === recipe.recipeFamilyId)}
              cookReports={data.cookReports}
              relationships={data.relationships}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
