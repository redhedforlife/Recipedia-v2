import { SemanticGraphExplorer } from "@/components/SemanticGraphExplorer";
import { buildSemanticGraph, getData } from "@/lib/data";

export default async function GraphPage({
  searchParams
}: {
  searchParams: Promise<{ focus?: string; mode?: string }>;
}) {
  const { focus, mode } = await searchParams;
  const data = await getData();
  const graph = buildSemanticGraph(data);

  return (
    <main>
      <SemanticGraphExplorer graph={graph} initialFocus={focus} initialMode={mode} />
    </main>
  );
}
