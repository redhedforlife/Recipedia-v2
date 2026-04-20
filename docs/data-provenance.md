# Data Provenance

## Runtime sources
- Seed dataset: `data/lineageSeed.ts` (generated graph foundation)
- Local user mutations: `storage/local-data.json`
- Runtime merge: `lib/data.ts` via `getData()`

## Upstream seed inputs
- Wikipedia
- Wikidata
- FoodOn
- TheMealDB
- Selected DBpedia lookups

## Data classes
- Source-derived: cuisines, categories, families, recipes, ingredients, techniques, relationship links from generated seed.
- Inferred: fallback category/cuisine mapping, normalized taxonomy category ids, graph metadata fields (tags/meta text).
- User-created: local variations, cook reports, imported recipes, and any local entities written to storage.

## Conflict resolution
- `mergeById(base, extra)` keeps local overrides by id for id-keyed entities.
- Link-array records are appended from seed + local, then interpreted during graph construction.
- Graph build performs id de-duplication for nodes/edges and drops invalid edges referencing missing nodes.

## Graph contracts
- `buildSemanticGraph(data)` is the single runtime graph builder.
- Canonical hierarchy remains explicit via hierarchy edge kinds.
- Alternate browse paths are represented with non-hierarchy association edges (for example cuisine/category associations for families).
