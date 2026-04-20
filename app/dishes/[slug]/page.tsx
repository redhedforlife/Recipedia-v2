import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getDishSpotlight } from "@/lib/editorial";

export default async function DishSpotlightPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dish = getDishSpotlight(slug);
  if (!dish) notFound();

  return (
    <main className="container section">
      <Breadcrumbs
        items={[
          { label: "Explore", href: "/" },
          { label: "American", href: "/cuisines/american" },
          { label: "Burgers", href: "/families/burgers" },
          { label: dish.title }
        ]}
      />

      <section className="page-hero page-hero--compact">
        <div className="stack">
          <p className="eyebrow">Burger subtype</p>
          <h1>{dish.title}</h1>
          <p className="lede">{dish.summary}</p>
        </div>
        <aside className="hero-rail">
          <div className="card stack">
            <h3>Why it matters</h3>
            <p className="meta">{dish.whyItMatters}</p>
          </div>
        </aside>
      </section>

      <div className="split">
        <section className="stack">
          <div className="card stack">
            <h2>Defining technique</h2>
            <p className="meta">{dish.definingTechnique}</p>
          </div>

          <div className="card stack">
            <h2>Key ingredients</h2>
            <div className="tag-list">
              {dish.keyIngredients.map((ingredient) => (
                <span className="tag" key={ingredient}>
                  {ingredient}
                </span>
              ))}
            </div>
          </div>

          <div className="card stack">
            <div className="section-head">
              <h2>Related burger styles</h2>
            </div>
            <div className="editorial-grid">
              {dish.relatedStyleCards.map((item) => (
                <Link className="card compact stack editorial-card" href={item.href ?? "#"} key={item.id}>
                  <span className="entity-chip entity-chip--dish">{item.eyebrow}</span>
                  <h3>{item.title}</h3>
                  <p className="meta">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <aside className="stack">
          <div className="card stack">
            <h3>Parent lineage</h3>
            <Link className="ghost-button" href="/families/burgers">
              Burgers <ArrowRight size={15} />
            </Link>
            <Link className="ghost-button" href="/cuisines/american">
              American cuisine <ArrowRight size={15} />
            </Link>
          </div>

          <div className="card stack">
            <h3>Creators</h3>
            <div className="list">
              {dish.creatorCards.map((creator) => (
                <Link className="row" href={creator.href ?? "#"} key={creator.id}>
                  <span>{creator.title}</span>
                  <span className="tag">{creator.eyebrow}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="card stack">
            <h3>Recommended recipes</h3>
            <div className="list">
              {dish.recommendedRecipes.map((recipe) => (
                <Link className="row" href={recipe.href ?? "#"} key={recipe.id}>
                  <span>{recipe.title}</span>
                  <span className="tag">{recipe.eyebrow}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
