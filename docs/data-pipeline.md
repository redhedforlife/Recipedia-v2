# Recipedia Data Enrichment Pipeline

This pipeline separates dish concepts from recipe instances and publishes only vetted outputs.

## Folder layout

```text
/data
  /raw
    /recipes
      raw_recipes.json
    /dish_taxonomy
  /normalized
    /recipes
      normalized_recipes.json
      dedupe_clusters.json
      mapped_recipes.json
    /ingredients
      ingredients.json
    /dishes
      dishes.json
      dishes_with_profiles.json
      recipe_dish_mappings.json
      review_queue.json
  /published
    /graph
      nodes.json
      edges.json
      dishes.json
      ingredients.json
    /recipes
      recipes.json
    /stats
      summary.json
      coverage.json
      qa_report.json
    review_queue.json
```

## Run commands

1. Ingest raw records:

```bash
npm run pipeline:ingest
```

2. Normalize, dedupe, map, and compute dish ingredient profiles:

```bash
npm run pipeline:normalize
```

3. Publish American pilot outputs:

```bash
npm run pipeline:publish
```

4. Run QA checks:

```bash
npm run pipeline:qa
```

5. Full pipeline in one command:

```bash
npm run pipeline:run
```

## What each stage does

- `ingest`: loads source-backed recipe-like records into `data/raw/recipes/raw_recipes.json`
- `normalize`: standardizes titles and ingredient strings into normalized ingredient IDs
- `dedupe`: prevents near-duplicate recipes from inflating dish recipe counts
- `map`: clusters recipes into dish concepts with confidence scores and low-confidence review queue entries
- `profiles`: computes canonical and optional-common dish ingredient profiles
- `publish`: outputs concept-first graph data and recipe panel data for American pilot
- `qa`: enforces publish-time data integrity and business logic checks

## Review queue

Low-confidence mappings and poor ingredient normalization cases are written to:

- `data/normalized/dishes/review_queue.json`
- `data/published/review_queue.json`

Each item includes issue type, summary, confidence score, candidate resolutions, and source examples.

## Coverage stats

Coverage metrics are written to `data/published/stats/coverage.json` and include:

- total dishes
- dishes with canonical ingredients
- dishes with 1+ recipes
- dishes with 3+ recipes
- reviewed dishes
- category-level stats for American pilot categories
