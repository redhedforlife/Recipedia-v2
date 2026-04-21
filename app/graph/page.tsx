import { SemanticGraphExplorer } from "@/components/SemanticGraphExplorer";
import { buildIngredientFilterIndex } from "@/lib/ingredients/effectiveIngredients";
import { buildSemanticGraph, getData } from "@/lib/data";

export default async function GraphPage({
  searchParams
}: {
  searchParams: Promise<{ focus?: string; mode?: string }>;
}) {
  const { focus, mode } = await searchParams;
  const data = await getData();
  const graph = buildSemanticGraph(data);
  const ingredientFilterIndex = buildIngredientFilterIndex(data);

  return (
    <main>
      <SemanticGraphExplorer
        graph={graph}
        ingredientFilterIndex={ingredientFilterIndex}
        initialFocus={focus}
        initialMode={mode}
      />
    </main>
  );
}
