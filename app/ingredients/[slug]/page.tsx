import Link from "next/link";
import { notFound } from "next/navigation";
import { RecipeCard } from "@/components/RecipeCard";
import { getData, getIngredient, slugify } from "@/lib/data";

export default async function IngredientPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getData();
  const ingredientData = await getIngredient(slug);
  if (!ingredientData) notFound();

  return (
    <main className="container section">
      <div className="section-head">
        <div>
          <p className="eyebrow">Ingredient</p>
          <h1>{ingredientData.ingredient.displayName}</h1>
          <p className="lede">
            Connected recipes, recipe families, and techniques using this ingredient. Aliases:{" "}
            {ingredientData.ingredient.aliases.join(", ") || "none yet"}.
          </p>
        </div>
      </div>

      <div className="split">
        <section className="stack">
          <h2>Connected recipes</h2>
          <div className="grid two">
            {ingredientData.recipes.map((recipe) => (
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
        <aside className="stack">
          <div className="card stack">
            <h3>Recipe families</h3>
            {ingredientData.families.map((family) => (
              <Link className="pill" href={`/families/${family.slug}`} key={family.id}>
                {family.displayName}
              </Link>
            ))}
          </div>
          <div className="card stack">
            <h3>Connected techniques</h3>
            {ingredientData.relatedTechniques.map((technique) => (
              <Link className="pill" href={`/techniques/${slugify(technique.canonicalName)}`} key={technique.id}>
                {technique.displayName}
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}

