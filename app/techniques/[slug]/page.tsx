import Link from "next/link";
import { notFound } from "next/navigation";
import { RecipeCard } from "@/components/RecipeCard";
import { getData, getTechnique, slugify } from "@/lib/data";

export default async function TechniquePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getData();
  const techniqueData = await getTechnique(slug);
  if (!techniqueData) notFound();

  return (
    <main className="container section">
      <div className="section-head">
        <div>
          <p className="eyebrow">Technique</p>
          <h1>{techniqueData.technique.displayName}</h1>
          <p className="lede">{techniqueData.technique.description}</p>
        </div>
      </div>

      <div className="split">
        <section className="stack">
          <h2>Connected recipes</h2>
          <div className="grid two">
            {techniqueData.recipes.map((recipe) => (
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
            {techniqueData.families.map((family) => (
              <Link className="pill" href={`/families/${family.slug}`} key={family.id}>
                {family.displayName}
              </Link>
            ))}
          </div>
          <div className="card stack">
            <h3>Connected ingredients</h3>
            {techniqueData.relatedIngredients.slice(0, 10).map((ingredient) => (
              <Link className="pill" href={`/ingredients/${slugify(ingredient.canonicalName)}`} key={ingredient.id}>
                {ingredient.displayName}
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}

