# Ranking

## Module layout
- `lib/ranking/types.ts`
- `lib/ranking/constants.ts`
- `lib/ranking/scoreNode.ts`

## Score outputs
Each ranked node yields:
- `popularityScore`
- `graphStrengthScore`
- `manualBoost`
- `rankScore`

## Formula
`rankScore = popularityScore * 0.6 + graphStrengthScore * 0.3 + manualBoost * 0.1`

## Signal sources (current)
- Graph connectivity (node degree normalized by max degree)
- Completeness proxies
  - has description
  - has meta
  - tag count
  - canonical status
  - node-kind baseline

## Manual boost rules
- Defaults to `0`
- Clamped small (`0..20`)
- Intended for minor tuning only, not primary ordering

## Integration points
- Explore section ordering in `lib/explore/buildExploreProfile.ts`
- Launch/root ordering in `components/SemanticGraphExplorer.tsx`

## Future external popularity
The score API is structured so we can swap in external popularity signals (search volume, engagement, usage, etc.) by extending rank context inputs without changing downstream section contracts.
