import { notFound } from "next/navigation";
import { VariationForm } from "@/app/recipes/[slug]/variation/VariationForm";
import { getRecipeDetails } from "@/lib/data";

export default async function CreateVariationPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = await getRecipeDetails(slug);
  if (!recipe) notFound();

  return (
    <main className="container section">
      <div className="section-head">
        <div>
          <p className="eyebrow">Make your version</p>
          <h1>{recipe.title}</h1>
          <p className="lede">Edit ingredients or steps. Recipedia will save the structured changes from the base recipe.</p>
        </div>
      </div>
      <VariationForm recipe={recipe} />
    </main>
  );
}

