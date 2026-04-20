# Recipedia Project Summary

This summary reflects the current workspace as of April 17, 2026. There is no Git history in this folder, so it is based on the files and generated outputs that exist in the project today.

## What We Have Built

Recipedia is a graph-first recipe lineage app for home cooks. The product is centered on showing how cuisines, categories, dish families, canonical dishes, canonical variations, and personal variations connect to one another.

The current codebase includes two major layers:

1. A Next.js app for browsing recipe lineage, creating personal variations, logging cook reports, and importing source recipes.
2. A larger seed-data pipeline that builds a structured food taxonomy and graph dataset from multiple public sources.

## Current Product Experience

The app now supports:

- A home page with a semantic graph hero, quick search, featured cuisines, categories, dish families, and recent personal variations.
- Deep browse flows for cuisines, categories, dish families, recipes, ingredients, and techniques.
- A full graph explorer at `/graph` with multiple modes: cuisine, dish, ingredient, technique, difficulty, and cooking method.
- Family pages with lineage trees, canonical dishes, canonical variations, personal variations, top ingredients, and key techniques.
- Recipe detail pages with ingredients, steps, source attribution, child variations, linked techniques, cook reports, and a structured "What changed" section for variations.
- A “Make your version” flow that creates personal recipe variations from an existing parent recipe.
- A cook report form that records ratings, difficulty, make-again intent, and notes.
- An internal admin import screen for Serious Eats recipes.

## Data And Modeling Work

The app has a richer data model than the earlier MVP snapshot. The current workspace includes:

- A PostgreSQL-ready Prisma schema in `prisma/schema.prisma`.
- TypeScript domain types in `lib/types.ts`.
- Runtime data composition in `lib/data.ts`.
- A generated lineage seed adapter in `data/lineageSeed.ts`.
- Local JSON persistence for user-created content in `storage/local-data.json`.

The main entities now cover:

- Users
- Sources
- Cuisines
- Categories
- Cooking methods
- Difficulty bands
- Recipe families
- Recipes
- Ingredients
- Ingredient categories
- Techniques
- Technique categories
- Family-to-cuisine, family-to-category, family-to-ingredient, and family-to-technique relationships
- Recipe ingredients, steps, techniques, changes, cook reports, and lineage relationships

## Seed Pipeline And Knowledge Graph

The workspace now includes a dedicated graph-first seed generation pipeline.

Key pieces:

- `scripts/build_recipe_lineage_seed.py`
- `docs/recipe_lineage_seed.md`
- `sql/recipe_lineage_seed_schema.sql`
- `prisma/recipe_lineage_seed.prisma`
- `raw_wikipedia/`
- `raw_wikidata/`
- `raw_foodon/`
- `raw_mealdb/`
- `raw_dbpedia/`
- `data_stage/`
- `data_out/`

The generator pulls and normalizes data from Wikipedia, Wikidata, FoodOn, TheMealDB, and selected DBpedia lookups, then emits:

- Canonical CSV outputs
- A JSON seed used by the app
- SQL import output
- Graph node and edge exports
- Intermediate staging CSVs for inspection

## Current Generated Dataset Snapshot

Based on `data_out/recipe_lineage_seed.json`, the generated seed currently contains:

- 6 sources
- 60 cuisines
- 210 categories
- 2,083 dish families
- 2,083 dishes
- 2,083 variations
- 1,064 ingredients
- 158 techniques
- 6,714 aliases
- 5,915 provenance rows
- 7,741 graph nodes
- 10,330 graph edges

This is a substantial expansion from the earlier MVP seed and suggests the app has moved from a small hand-curated demo toward a broader structured culinary graph.

## Import And Mutation Flows

The codebase includes three working server-side mutation paths:

- `app/api/variations/route.ts`
  Creates a personal variation from a parent recipe using edited ingredients, steps, title, description, and a change note.
- `app/api/cook-reports/route.ts`
  Saves a structured cook report for a recipe.
- `app/api/import/route.ts`
  Imports a Serious Eats recipe into a chosen family using the Python ingestion script.

The Serious Eats ingestion path is backed by:

- `scripts/ingest_seriouseats.py`
- `scripts/serious_eats_seed_urls.txt`
- `requirements.txt`

The importer tries:

1. `recipe-scrapers`
2. Schema.org / JSON-LD extraction
3. Beautiful Soup fallback parsing

## Important App Files

- `app/page.tsx`
- `app/graph/page.tsx`
- `app/cuisines/[slug]/page.tsx`
- `app/categories/[slug]/page.tsx`
- `app/families/[slug]/page.tsx`
- `app/recipes/[slug]/page.tsx`
- `app/recipes/[slug]/variation/page.tsx`
- `app/admin/import/page.tsx`
- `components/SemanticGraphExplorer.tsx`
- `components/KnowledgeGraph.tsx`
- `components/RecipeCard.tsx`
- `components/SearchBox.tsx`
- `components/CookReportForm.tsx`
- `lib/data.ts`
- `lib/types.ts`
- `data/lineageSeed.ts`
- `prisma/schema.prisma`
- `Launch Recipedia.command`

## Current Status

Recipedia is no longer just a narrow chili-and-pasta MVP. The current workspace shows:

- A working app shell for browsing and interacting with recipe lineage
- A mutation layer for personal variations, cook reports, and admin imports
- A much larger taxonomy and graph seed than the original summary described
- A clear path toward a database-backed, importable culinary knowledge graph

## Suggested Next Steps

The most natural next steps from the current state are:

- Connect the live app to Prisma and PostgreSQL instead of relying on local JSON overlays.
- Add a proper review and moderation flow for imported recipes before they join the canonical graph.
- Improve search and relevance ranking across the larger generated taxonomy.
- Add side-by-side comparison views for parent and child recipes.
- Expand provenance and confidence handling in the UI so users can understand which graph nodes are richly sourced versus lightly inferred.
- Decide which portion of the 2,000+ family seed should be surfaced as first-class product content versus background ontology.
