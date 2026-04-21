# Graph Routing and Viewport Audit

## Scope

This audit covers the guided graph view in `/app/graph/page.tsx`, which renders `SemanticGraphExplorer` from `/components/SemanticGraphExplorer.tsx`.

## 1. Where node `sourcePosition` and `targetPosition` are set

- Node anchor positions are set in `flowNodes` inside `SemanticGraphExplorerInner`.
- Each node now explicitly sets:
  - `sourcePosition: Position.Right`
  - `targetPosition: Position.Left`
- The custom semantic node renderer also uses hidden handles on:
  - `Position.Left` for target
  - `Position.Right` for source

## 2. Where graph layout positions are computed

- Layout is computed in the `flowNodes` `useMemo` in `/components/SemanticGraphExplorer.tsx`.
- Position model:
  - Context nodes: fixed left horizontal lane (`y = 0`)
  - Selected node: anchored center lane (`x = SELECTED_X`, `y = 0`)
  - Result nodes: right columns (`x = RESULT_START_X + column * RESULT_COLUMN_GAP`) with stable row spacing

## 3. Where edge types are defined

- Visible edges are built in the `flowEdges` `useMemo` in `/components/SemanticGraphExplorer.tsx`.
- Primary path edges and selected-to-result edges use:
  - `type: "smoothstep"`
  - horizontal-compatible path options (`borderRadius` and `offset`) to avoid loop-like curves
- Styling differentiates primary path edges (stronger) from result edges (lighter).

## 4. Where fit-view / recenter / panning behavior is triggered

- Initial page load: one-time `fitView` in the `didInitialFit` effect.
- Recenter button: `recenter` callback calls `fitView` on active `flowNodes` only (active neighborhood), not full stale graph state.
- Normal drill-down clicks:
  - `focusNode` updates selected id and results.
  - A follow-up effect recenters on selected node with `setCenter` to keep anchor stability.
- Panning constraints:
  - Active bounding box is computed from current `flowNodes`.
  - `translateExtent` is derived from that active box and passed to `ReactFlow`.

## 5. Why edges were attaching top/bottom in the visible path before this fix

Before the fix, `SemanticNode` hardcoded hidden handles at:

- `Position.Top` for `target`
- `Position.Bottom` for `source`

So edges naturally attached vertically, even when node positions were arranged in left-right columns. This created bottom-to-top edge flows and visual loops that broke navigational readability.

The fix enforces left-right anchors at both node-level position props and handle-level positions to keep the active drill-down path directionally consistent.
