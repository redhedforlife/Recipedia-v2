import Link from "next/link";
import { notFound } from "next/navigation";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";
import { RecipeCard } from "@/components/RecipeCard";
import { getData, getFamily, isCanonicalVariation, isPersonalVariation } from "@/lib/data";

export default async function FamilyPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const familyData = await getFamily(slug);
  const data = await getData();
  if (!familyData) notFound();
  const { family, recipes, ingredientCounts, techniqueCounts, graph } = familyData;
  const sourceRecipes = recipes.filter((recipe) => recipe.isSourceRecipe);
  const canonicalVariations = recipes.filter((recipe) => isCanonicalVariation(recipe));
  const personalVariations = recipes.filter((recipe) => isPersonalVariation(recipe));

  return (
    <main className="container section">
      <div className="section-head">
        <div>
          <p className="eyebrow">{family.cuisine} · {family.category.replace(/-/g, " ")}</p>
          <h1>{family.displayName}</h1>
          <p className="lede">{family.description}</p>
        </div>
        {recipes[0] ? (
          <Link className="button" href={`/recipes/${recipes[0].slug}/variation`}>
            Make your version
          </Link>
        ) : (
          <span className="tag">Canonical skeleton</span>
        )}
      </div>

      <div className="split">
        <section className="stack">
          <div className="card stack">
            <div className="section-head">
              <div>
                <p className="eyebrow">Lineage tree</p>
                <h2>How these recipes connect</h2>
              </div>
              <Link className="ghost-button" href="/graph">
                Full map
              </Link>
            </div>
            {recipes.length ? (
              <KnowledgeGraph nodes={graph.nodes} edges={graph.edges} />
            ) : (
              <div className="empty">Recipe lineage will appear here when source recipes are attached to this dish family.</div>
            )}
          </div>

          <div className="section">
            <div className="section-head">
              <h2>Canonical dishes</h2>
            </div>
            {sourceRecipes.length ? (
              <div className="grid two">
                {sourceRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    family={family}
                    cookReports={data.cookReports}
                    relationships={data.relationships}
                  />
                ))}
              </div>
            ) : (
              <div className="empty">No canonical dish profiles are attached yet. This node is part of the curated hierarchy seed.</div>
            )}
          </div>

          <div className="section">
            <div className="section-head">
              <h2>Canonical variations</h2>
            </div>
            {canonicalVariations.length ? (
              <div className="grid two">
                {canonicalVariations.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    family={family}
                    cookReports={data.cookReports}
                    relationships={data.relationships}
                  />
                ))}
              </div>
            ) : (
              <div className="empty">No canonical variations yet for this family.</div>
            )}
          </div>

          <div className="section">
            <div className="section-head">
              <h2>Personal variations</h2>
            </div>
            {personalVariations.length ? (
              <div className="grid two">
                {personalVariations.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    family={family}
                    cookReports={data.cookReports}
                    relationships={data.relationships}
                  />
                ))}
              </div>
            ) : (
              <div className="empty">No personal versions yet. Open a canonical dish or variation and make your version.</div>
            )}
          </div>
        </section>

        <aside className="stack">
          <div className="card stack">
            <h3>Top ingredients</h3>
            <ul className="list">
              {ingredientCounts.map((item) => (
                <li className="row" key={item.name}>
                  <span>{item.name}</span>
                  <span className="tag">{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card stack">
            <h3>Key techniques</h3>
            <ul className="list">
              {techniqueCounts.map((item) => (
                <li className="row" key={item.name}>
                  <span>{item.name}</span>
                  <span className="tag">{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
