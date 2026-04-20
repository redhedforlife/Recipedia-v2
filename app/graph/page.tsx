import { SemanticGraphExplorer } from "@/components/SemanticGraphExplorer";
import { buildSemanticGraph, getData } from "@/lib/data";
import {
  getAmericanExploreExperience,
  getBurgerExploreExperience,
  getFeaturedCuisineSections,
  getGraphLandingExperience
} from "@/lib/editorial";

export default async function GraphPage({
  searchParams
}: {
  searchParams: Promise<{ focus?: string; mode?: string }>;
}) {
  const { focus, mode } = await searchParams;
  const data = await getData();
  const graph = buildSemanticGraph(data);
  const landing = await getFeaturedCuisineSections();
  const americanExperience = await getAmericanExploreExperience();
  const burgerExperience = await getBurgerExploreExperience();
  const landingExperience = await getGraphLandingExperience();

  return (
    <main>
      <SemanticGraphExplorer
        americanExperience={americanExperience}
        burgerExperience={burgerExperience}
        graph={graph}
        initialFocus={focus}
        initialMode={mode}
        landing={landing}
        landingExperience={landingExperience}
      />
    </main>
  );
}
