# Recipedia Refactor Audit

## Editorial Logic Dependencies
- `/Users/andrew/Documents/Codex/Recipedia/app/graph/page.tsx`
  - Imports `getFeaturedCuisineSections`, `getAmericanExploreExperience`, `getBurgerExploreExperience`, and `getGraphLandingExperience` from `lib/editorial.ts`.
- `/Users/andrew/Documents/Codex/Recipedia/components/SemanticGraphExplorer.tsx`
  - Accepts and branches on `landing`, `landingExperience`, `americanExperience`, and `burgerExperience`.
  - Contains hard-coded `isAmericanNode` and `isBurgerNode` conditionals.
- `/Users/andrew/Documents/Codex/Recipedia/lib/data.ts`
  - Imports editorial creators from `data/editorial/creators.ts` and merges them as core data.
- `/Users/andrew/Documents/Codex/Recipedia/app/cuisines/[slug]/page.tsx`
  - Hard-coded American editorial route behavior using `getAmericanExploreExperience` and `CuratedSectionBrowser`.
- `/Users/andrew/Documents/Codex/Recipedia/app/families/burgers/page.tsx`
  - Full burger editorial experience via `getBurgerExploreExperience`.
- `/Users/andrew/Documents/Codex/Recipedia/app/dishes/[slug]/page.tsx`
  - Uses `getDishSpotlight` from `lib/editorial.ts`.
- `/Users/andrew/Documents/Codex/Recipedia/app/creators/[slug]/page.tsx`
  - Uses `getCreatorProfile` from `lib/editorial.ts`.

## Special-Cased Explore Behavior
- `/Users/andrew/Documents/Codex/Recipedia/components/SemanticGraphExplorer.tsx`
  - `isAmericanNode` and `isBurgerNode` gates.
  - Landing fallback path unrelated to selected graph node.
  - Explore root list from editorial landing cards.
- `/Users/andrew/Documents/Codex/Recipedia/app/cuisines/[slug]/page.tsx`
  - `slug === "american"` special case.
- `/Users/andrew/Documents/Codex/Recipedia/app/families/burgers/page.tsx`
  - Burger-only dedicated path and content model.

## Current Ranking Construction
- `/Users/andrew/Documents/Codex/Recipedia/lib/editorial.ts`
  - Primary ordering based on `editorialRank`, `launchPriority`, and `priorityScore`.
- `/Users/andrew/Documents/Codex/Recipedia/data/editorial/*.ts`
  - Manual rank and launch values driving Explore ordering.
- `/Users/andrew/Documents/Codex/Recipedia/components/CuratedSectionBrowser.tsx`
  - Displays rank labels from `priorityScore`.

## Files Likely Deletable After Refactor
- `/Users/andrew/Documents/Codex/Recipedia/lib/editorial.ts`
- `/Users/andrew/Documents/Codex/Recipedia/data/editorial/american.ts`
- `/Users/andrew/Documents/Codex/Recipedia/data/editorial/burgers.ts`
- `/Users/andrew/Documents/Codex/Recipedia/data/editorial/creators.ts`
- `/Users/andrew/Documents/Codex/Recipedia/data/editorial/featured.ts`
- `/Users/andrew/Documents/Codex/Recipedia/app/families/burgers/page.tsx` (if burger-specific route is removed or replaced)
- `/Users/andrew/Documents/Codex/Recipedia/components/ExploreCluster.tsx` (currently editorial-first component)

## Notes
- Refactor priority is to remove editorial dependencies from graph route + explorer first, then clean route-level editorial pages.
- Keep graph primitives and Explore UX while shifting content generation to graph-derived profile builders + explicit ranking module.
