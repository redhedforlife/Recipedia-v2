# Explore

## What Explore is
Explore is a graph-first side panel profile for a selected node. It summarizes top connected entities by section and drives visible graph slices.

## Core builder
- `lib/explore/buildExploreProfile.ts`
- Entry: `buildExploreProfile(selectedNode, graph)`
- Type-specific builders:
  - `buildCuisineExploreProfile`
  - `buildFamilyExploreProfile`
  - `buildIngredientExploreProfile`
  - `buildTechniqueExploreProfile`

## Profile shape
- `nodeId`
- `nodeType`
- `title`
- `sections[]`

Each section includes:
- `id`
- `title`
- `entityType`
- `items[]`
- `defaultVisibleCount`
- `showMoreEnabled`

Each item includes:
- `nodeId`
- `label`
- `entityType`
- `rankScore`
- optional metadata (`description`, `eyebrow`, `meta`, `href`, `tags`)

## Default behavior
- Clicking a cuisine in graph explore mode opens a balanced multi-section profile (not dishes-only by default).
- Typical cuisine sections include categories, families, techniques, creators, ingredients, and notable dishes.

## Ranking and visibility
- Section item lists are graph-derived and sorted by `rankScore`.
- The graph view always includes selected node + visible items from active sections.
- Switching section filters changes which neighborhood slice is emphasized.
- “See more” increases visible item counts incrementally per section.
