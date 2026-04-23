# Ingredient Audit

## Current ingredient structures
- `SeedData.ingredients`
- `SeedData.recipeIngredients`
- `SeedData.dishFamilyIngredients`
- `SeedData.families[*].ingredientIds` (metadata-level list)
- Graph edges of kind `dish_uses_ingredient` (family -> ingredient)

## Node levels with direct ingredient assignments
- Direct family-level: `dishFamilyIngredients`
- Direct recipe/variation-level: `recipeIngredients`
- Category/cuisine-level: no direct ingredient table, must be derived from descendants

## Pre-refactor filter behavior
- UI ingredient filter in `SemanticGraphExplorer` only checked direct graph edges:
  - `dish_uses_ingredient` where `edge.source === familyId`
- Result: category/family filters were effectively direct-only and not descendant-aware.

## Coverage quality observations
- Some high-value families have weak or generic direct ingredient links.
- Some families have no direct family ingredient links at all.
- Some expected ingredients are missing from direct links for high-traffic American paths.

## Broken or weak American examples observed
- French dip sandwich should match beef.
- Hamburger should match beef.
- Cheeseburger branch should match beef and cheese.
- PB&J should match peanut butter.
- Crab cake should match crab.

## Refactor decisions implemented
- Added deterministic effective ingredient rollups in `lib/ingredients/effectiveIngredients.ts`.
- Added descendant-aware matching utilities:
  - `familyMatchesIngredient`
  - `categoryMatchesIngredient`
  - `cuisineMatchesIngredient`
- Added curated American enrichment pack:
  - `data/enrichment/americanIngredients.ts`
- Added normalization for alias fragmentation and synthetic fallback IDs for missing vocabulary terms.
- Updated graph UI ingredient filtering to use effective ingredient sets, not direct-only graph edges.
