import Link from "next/link";
import { notFound } from "next/navigation";
import { getDishDetailBySlug } from "@/lib/data/dishes";

export default async function DishPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dish = await getDishDetailBySlug(slug);
  if (!dish) notFound();

  return (
    <main className="container section stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">Canonical Dish</p>
          <h1>{dish.displayName}</h1>
          <p className="lede">{dish.description}</p>
          <p className="meta">
            {dish.cuisine?.displayName ?? "Unknown cuisine"} · {dish.category?.displayName ?? "Uncategorized"} ·{" "}
            {dish.recipeCount} linked recipes
          </p>
        </div>
        <div className="tag-list">
          {dish.aliases.slice(0, 6).map((alias) => (
            <span className="tag" key={alias}>
              {alias}
            </span>
          ))}
        </div>
      </div>

      <section className="card stack">
        <h2>Canonical Ingredients</h2>
        {dish.canonicalIngredients.length ? (
          <ul className="stack">
            {dish.canonicalIngredients.map((item) => (
              <li key={item.ingredientId} className="meta">
                <strong>{item.displayName}</strong> ({item.role}) · core: {item.isCore ? "yes" : "no"} · importance:{" "}
                {item.importance.toFixed(2)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="meta">No canonical ingredients linked yet.</p>
        )}
      </section>

      <section className="card stack">
        <h2>Linked Recipes</h2>
        {dish.recipes.length ? (
          <ul className="stack">
            {dish.recipes.map((recipe) => (
              <li key={recipe.id}>
                <Link href={`/recipes/${recipe.slug}`}>{recipe.title}</Link>
                <p className="meta">
                  {recipe.isSourceRecipe ? "Source" : "Derived"} · {recipe.isUserVariation ? "Variation" : "Canonical"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="meta">No recipe rows linked to this dish.</p>
        )}
      </section>
    </main>
  );
}
