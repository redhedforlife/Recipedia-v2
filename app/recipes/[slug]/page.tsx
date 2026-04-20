import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink, GitCompareArrows } from "lucide-react";
import { CookReportForm } from "@/components/CookReportForm";
import { getRecipeDetails, isCanonicalVariation, isPersonalVariation, recipeBadgeLabel, slugify } from "@/lib/data";

const changeLabels: Record<string, string> = {
  add_ingredient: "Added ingredient",
  remove_ingredient: "Removed ingredient",
  change_quantity: "Changed quantity",
  substitute_ingredient: "Substituted ingredient",
  edit_step: "Edited step",
  change_time: "Changed time",
  change_title: "Changed title",
  change_technique: "Changed technique"
};

export default async function RecipePage({
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
          <p className="eyebrow">{recipe.family.displayName} · {recipeBadgeLabel(recipe)}</p>
          <h1>{recipe.title}</h1>
          <p className="lede">{recipe.description}</p>
        </div>
        <Link className="button" href={`/recipes/${recipe.slug}/variation`}>
          Make your version
        </Link>
      </div>

      <div className="split">
        <article className="stack">
          <section className="card stack">
            <div className="section-head">
              <h2>Ingredients</h2>
              <span className="tag">{recipe.serves}</span>
            </div>
            <ul className="list">
              {recipe.ingredients.map((item) => (
                <li className="row" key={item.id}>
                  <span>{item.rawText}</span>
                  <Link className="tag" href={`/ingredients/${slugify(item.ingredient.canonicalName)}`}>
                    {item.ingredient.displayName}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="card stack">
            <h2>Steps</h2>
            <ol className="numbered">
              {recipe.steps.map((step) => (
                <li key={step.id}>{step.instructionText}</li>
              ))}
            </ol>
          </section>

          {recipe.changes.length ? (
            <section className="card stack">
              <div className="section-head">
                <div>
                  <p className="eyebrow">What changed</p>
                  <h2>Compared with {recipe.parent?.title ?? "the parent recipe"}</h2>
                </div>
                <GitCompareArrows color="var(--accent)" />
              </div>
              <ul className="list">
                {recipe.changes.map((change) => (
                  <li className="stack" key={change.id}>
                    <strong>{changeLabels[change.changeType] ?? change.changeType}</strong>
                    <span className="meta">
                      {change.beforeValue ? `Before: ${change.beforeValue}` : null}
                      {change.beforeValue && change.afterValue ? " | " : null}
                      {change.afterValue ? `After: ${change.afterValue}` : null}
                    </span>
                    {change.note ? <span className="notice">{change.note}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="card stack">
            <h2>Cook reports</h2>
            {recipe.cookReports.length ? (
              <ul className="list">
                {recipe.cookReports.map((report) => (
                  <li className="stack" key={report.id}>
                    <div className="row">
                      <strong>{report.rating}/5 rating</strong>
                      <span className="tag">{report.wouldMakeAgain ? "Would make again" : "Would adjust"}</span>
                    </div>
                    <p className="meta">{report.notes}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty">No cook reports yet.</p>
            )}
            <CookReportForm recipeSlug={recipe.slug} />
          </section>
        </article>

        <aside className="stack">
          <section className="card stack">
            <h3>Source</h3>
            {recipe.source ? (
              <>
                <p className="meta">
                  {recipe.source.siteName} by {recipe.source.authorName}
                </p>
                <a className="ghost-button" href={recipe.source.sourceUrl} rel="noreferrer" target="_blank">
                  {isCanonicalVariation(recipe) ? "Open canonical source" : "View source"} <ExternalLink size={15} />
                </a>
                <span className="tag">Confidence {(recipe.source.extractionConfidence * 100).toFixed(0)}%</span>
              </>
            ) : (
              <p className="meta">
                {isPersonalVariation(recipe) ? "Personal variation created in Recipedia." : "Lineage entry without a direct leaf source attachment."}
              </p>
            )}
          </section>

          <section className="card stack">
            <h3>Recipe family</h3>
            <Link className="ghost-button" href={`/families/${recipe.family.slug}`}>
              {recipe.family.displayName} <ArrowRight size={15} />
            </Link>
            {recipe.parent ? (
              <Link className="pill" href={`/recipes/${recipe.parent.slug}`}>
                Base recipe: {recipe.parent.title}
              </Link>
            ) : null}
          </section>

          <section className="card stack">
            <h3>Child variations</h3>
            {recipe.children.length ? (
              <ul className="list">
                {recipe.children.map((child) => (
                  <li key={child.id}>
                    <Link href={`/recipes/${child.slug}`}>{child.title}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="meta">No descendants yet.</p>
            )}
          </section>

          <section className="card stack">
            <h3>Techniques</h3>
            <div className="tag-list">
              {recipe.techniques.map((technique) => (
                <Link className="tag" href={`/techniques/${slugify(technique.canonicalName)}`} key={technique.id}>
                  {technique.displayName}
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
