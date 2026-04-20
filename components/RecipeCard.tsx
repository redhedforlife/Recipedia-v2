import Link from "next/link";
import { GitCompareArrows, Star } from "lucide-react";
import type { CookReport, Recipe, RecipeFamily, RecipeRelationship } from "@/lib/types";
import { isCanonicalVariation, isPersonalVariation, recipeBadgeLabel, recipeScore } from "@/lib/data";

export function RecipeCard({
  recipe,
  family,
  cookReports,
  relationships
}: {
  recipe: Recipe;
  family?: RecipeFamily;
  cookReports: CookReport[];
  relationships: RecipeRelationship[];
}) {
  const score = recipeScore(recipe, cookReports, relationships);
  return (
    <Link className="card compact stack" href={`/recipes/${recipe.slug}`}>
      <div className="row">
        <span className="eyebrow">{family?.displayName ?? recipeBadgeLabel(recipe)}</span>
        <span className="tag">
          <Star size={14} /> {score.toFixed(1)}
        </span>
      </div>
      <h3>{recipe.title}</h3>
      <p className="meta">{recipe.description}</p>
      <div className="tag-list">
        {isCanonicalVariation(recipe) ? (
          <span className="tag">Canonical variation</span>
        ) : isPersonalVariation(recipe) ? (
          <span className="tag">
            <GitCompareArrows size={14} /> Personal variation
          </span>
        ) : (
          <span className="tag">Canonical dish</span>
        )}
        {recipe.tags.slice(0, 3).map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
