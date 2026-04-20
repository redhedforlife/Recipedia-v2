# Recipe Lineage Starter Seed

This workspace now includes a dedicated graph-first seed pipeline for the recipe-lineage dataset described in the spec.

## Files

- `scripts/build_recipe_lineage_seed.py`
- `sql/recipe_lineage_seed_schema.sql`
- `prisma/recipe_lineage_seed.prisma`
- `raw_wikipedia/`
- `raw_wikidata/`
- `raw_foodon/`
- `raw_mealdb/`
- `raw_dbpedia/`
- `data_stage/`
- `data_out/`

## What The Generator Does

1. Registers the source registry in `sources.csv`.
2. Pulls raw records from Wikipedia, Wikidata, FoodOn, TheMealDB, and limited DBpedia lookups into cache directories.
3. Builds a canonical starter taxonomy:
   - cuisine
   - category
   - dish family
   - dish
   - variation
4. Normalizes names with deterministic slugs and IDs.
5. Emits canonical CSV, JSON, SQL import, and graph exports.
6. Writes staging CSVs for intermediate inspection.

## Run

```bash
python3 scripts/build_recipe_lineage_seed.py
```

Optional flags:

```bash
python3 scripts/build_recipe_lineage_seed.py --refresh
python3 scripts/build_recipe_lineage_seed.py --skip-foodon-owl
python3 scripts/build_recipe_lineage_seed.py --wikidata-limit 2400
python3 scripts/build_recipe_lineage_seed.py --dbpedia-limit 0
```

## Output Files

Final outputs land in `data_out/`:

- `sources.csv`
- `cuisines.csv`
- `categories.csv`
- `cuisine_categories.csv`
- `dish_families.csv`
- `dish_family_categories.csv`
- `dish_family_cuisines.csv`
- `dishes.csv`
- `variations.csv`
- `ingredients.csv`
- `techniques.csv`
- `dish_family_ingredients.csv`
- `dish_family_techniques.csv`
- `dish_relations.csv`
- `aliases.csv`
- `provenance.csv`
- `recipe_lineage_seed.json`
- `import_recipe_lineage_seed.sql`
- `graph_nodes.csv`
- `graph_edges.csv`

Intermediate staging files land in `data_stage/`.

## Notes

- The category tree is intentionally canonical-first and does not begin from a recipe dump.
- Wikidata and Wikipedia supply most starter dish coverage.
- FoodOn enriches ingredient and technique normalization where exact or synonym matches are available.
- TheMealDB is used as a validation and attachment source rather than taxonomy truth.
- DBpedia is used conservatively as a URI bridge for a limited subset of high-signal entities.
