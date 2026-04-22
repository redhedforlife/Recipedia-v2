"use client";

import Link from "next/link";
import {
  CircleDot,
  Compass,
  Flame,
  Focus,
  Gauge,
  Layers3,
  MapPinned,
  Maximize2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  User,
  Utensils,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties } from "react";
import {
  BaseEdge,
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  getSmoothStepPath,
  useReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps
} from "@xyflow/react";
import { useRouter } from "next/navigation";
import type { IngredientFilterIndex } from "@/lib/ingredients/effectiveIngredients";
import { scoreNode } from "@/lib/ranking/scoreNode";
import type { SemanticGraph } from "@/lib/graph/types";
import type { GraphNodeKind, KnowledgeGraphEdge, KnowledgeGraphNode } from "@/lib/types";

type ViewMode = "dishes" | "chefs" | "techniques" | "ingredients";

type SemanticNodeRole = "context" | "inPath" | "selected" | "result";

type SemanticNodeData = Record<string, unknown> & {
  node: KnowledgeGraphNode;
  role: SemanticNodeRole;
};

type SemanticFlowNode = Node<SemanticNodeData, "semantic">;

type FilterState = {
  chefIds: string[];
  ingredientIds: string[];
  difficultyIds: string[];
};

const HIERARCHY_EDGE_KINDS = new Set([
  "cuisine_contains_category",
  "category_contains_category",
  "category_contains_dish_family",
  "dish_family_contains_recipe",
  "recipe_has_variation"
]);

const RESULT_CAP = 6;
const NODE_WIDTH = 214;
const NODE_HEIGHT = 104;
const SELECTED_X = -40;
const CONTEXT_STEP_X = 240;
const RESULT_START_X = 320;
const RESULT_COLUMN_GAP = 340;
const RESULT_ROW_GAP = 122;
const RESULTS_PER_COLUMN = 4;
const RESULT_COLUMN_STAGGER_Y = RESULT_ROW_GAP / 2;
const EDGE_LANE_GAP = 26;
const EDGE_ROUTE_GUTTER = 94;
const EDGE_GUTTER_MARGIN = 28;
const CONTEXT_MEMORY_LIMIT = 12;
const EDGE_MEMORY_LIMIT = 48;

type SemanticEdgeData = {
  laneOffset?: number;
  centerX?: number;
  baseEdgeId?: string;
};

const viewModes: Array<{ id: ViewMode; label: string; icon: ComponentType<{ size?: number }> }> = [
  { id: "dishes", label: "Dishes", icon: Utensils },
  { id: "chefs", label: "Chefs", icon: User },
  { id: "techniques", label: "Techniques", icon: Flame },
  { id: "ingredients", label: "Ingredients", icon: Sparkles }
];

const nodeColors: Record<GraphNodeKind, string> = {
  cuisine: "#9f3c2f",
  category: "#5c597f",
  family: "#2f5f79",
  creator: "#7b5a42",
  recipe: "#59644a",
  variation: "#ba5a35",
  ingredientCategory: "#4f7f6c",
  ingredient: "#37745e",
  techniqueCategory: "#ad7c2a",
  technique: "#9a6a19",
  method: "#5c597f",
  difficulty: "#784b66"
};

const kindLabels: Record<GraphNodeKind, string> = {
  cuisine: "Cuisine",
  category: "Category",
  family: "Dish family",
  creator: "Creator",
  recipe: "Dish",
  variation: "Variation",
  ingredientCategory: "Ingredient category",
  ingredient: "Ingredient",
  techniqueCategory: "Technique category",
  technique: "Technique",
  method: "Cooking method",
  difficulty: "Difficulty"
};

const kindIcons: Record<GraphNodeKind, ComponentType<{ size?: number }>> = {
  cuisine: MapPinned,
  category: Layers3,
  family: Utensils,
  creator: User,
  recipe: Utensils,
  variation: CircleDot,
  ingredientCategory: Layers3,
  ingredient: Sparkles,
  techniqueCategory: Layers3,
  technique: Flame,
  method: SlidersHorizontal,
  difficulty: Gauge
};

const semanticNodeTypes = { semantic: SemanticNode };
const semanticEdgeTypes = { semantic: SemanticRoutedEdge };

export function SemanticGraphExplorer({
  graph,
  ingredientFilterIndex,
  initialMode = "dish",
  initialFocus = ""
}: {
  graph: SemanticGraph;
  ingredientFilterIndex: IngredientFilterIndex;
  initialMode?: string;
  initialFocus?: string;
}) {
  return (
    <ReactFlowProvider>
      <SemanticGraphExplorerInner
        graph={graph}
        ingredientFilterIndex={ingredientFilterIndex}
        initialFocus={initialFocus}
        initialMode={initialMode}
      />
    </ReactFlowProvider>
  );
}

function SemanticGraphExplorerInner({
  graph,
  ingredientFilterIndex,
  initialMode,
  initialFocus
}: {
  graph: SemanticGraph;
  ingredientFilterIndex: IngredientFilterIndex;
  initialMode: string;
  initialFocus: string;
}) {
  const router = useRouter();
  const reactFlow = useReactFlow();
  const didInitialFit = useRef(false);

  const nodesById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes]);
  const hierarchyParents = useMemo(() => hierarchyParentMap(graph.edges), [graph.edges]);

  const topCuisines = useMemo(() => {
    const scores = buildNodeRankScores(graph);
    return graph.nodes
      .filter((node) => node.kind === "cuisine")
      .filter((node) => !String(node.meta ?? "").startsWith("0 categories"))
      .sort((left, right) => (scores.get(right.id) ?? 0) - (scores.get(left.id) ?? 0) || left.label.localeCompare(right.label));
  }, [graph]);

  const defaultSelected = useMemo(() => findNodeByFocus(graph.nodes, initialFocus), [graph.nodes, initialFocus]);

  const [viewMode, setViewMode] = useState<ViewMode>(parseInitialViewMode(initialMode));
  const [query, setQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(defaultSelected?.id);
  const [resultVisibleCount, setResultVisibleCount] = useState(RESULT_CAP);
  const [navigationPath, setNavigationPath] = useState<string[]>(() =>
    defaultSelected ? buildBreadcrumbPath(defaultSelected.id, hierarchyParents, nodesById).map((node) => node.id) : []
  );
  const [contextNodeIds, setContextNodeIds] = useState<string[]>([]);
  const [contextEdgeIds, setContextEdgeIds] = useState<string[]>([]);
  const panTargetNodeIdRef = useRef<string | undefined>(defaultSelected?.id);
  const [filters, setFilters] = useState<FilterState>({
    chefIds: [],
    ingredientIds: [],
    difficultyIds: []
  });

  const selectedNode = selectedNodeId ? nodesById.get(selectedNodeId) : undefined;
  const breadcrumbs = useMemo(() => buildBreadcrumbPath(selectedNodeId, hierarchyParents, nodesById), [selectedNodeId, hierarchyParents, nodesById]);
  const breadcrumbNodes = useMemo(() => {
    const fromNavigation = navigationPath
      .map((nodeId) => nodesById.get(nodeId))
      .filter((node): node is KnowledgeGraphNode => Boolean(node));
    return fromNavigation.length ? fromNavigation : breadcrumbs;
  }, [breadcrumbs, navigationPath, nodesById]);

  const familyIdsInScope = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    return familiesForSelection(selectedNode, graph, hierarchyParents);
  }, [graph, hierarchyParents, selectedNode]);

  const filteredFamilyIds = useMemo(
    () => applyFamilyFilters(familyIdsInScope, filters, graph, ingredientFilterIndex),
    [familyIdsInScope, filters, graph, ingredientFilterIndex]
  );

  const resultNodes = useMemo(() => {
    if (!selectedNode) {
      return topCuisines.slice(0, resultVisibleCount);
    }
    return buildResultNodes({
      graph,
      selectedNode,
      viewMode,
      filteredFamilyIds,
      familyIdsInScope,
      resultVisibleCount,
      hierarchyParents
    });
  }, [filteredFamilyIds, familyIdsInScope, graph, hierarchyParents, resultVisibleCount, selectedNode, topCuisines, viewMode]);

  const totalResultCount = useMemo(() => {
    if (!selectedNode) return topCuisines.length;
    return buildResultNodes({
      graph,
      selectedNode,
      viewMode,
      filteredFamilyIds,
      familyIdsInScope,
      resultVisibleCount: Number.MAX_SAFE_INTEGER,
      hierarchyParents
    }).length;
  }, [filteredFamilyIds, familyIdsInScope, graph, hierarchyParents, selectedNode, topCuisines.length, viewMode]);

  const queryMatches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return resultNodes;
    return resultNodes.filter((node) => searchableText(node).includes(needle));
  }, [query, resultNodes]);

  const pathNodes = useMemo(() => breadcrumbs.slice(0, -1), [breadcrumbs]);
  const inPathNodes = useMemo(() => pathNodes.slice(Math.max(0, pathNodes.length - 4)), [pathNodes]);
  const isDrilldown = Boolean(selectedNode);
  const activeResultNodes = useMemo(
    () => queryMatches.filter((node) => !selectedNode || node.id !== selectedNode.id),
    [queryMatches, selectedNode]
  );
  const displayedResultNodes = useMemo(
    () => activeResultNodes.slice(0, resultVisibleCount),
    [activeResultNodes, resultVisibleCount]
  );

  const activeNodeIds = useMemo(() => {
    const ids = new Set<string>();
    inPathNodes.forEach((node) => ids.add(node.id));
    if (selectedNode) ids.add(selectedNode.id);
    displayedResultNodes.forEach((node) => ids.add(node.id));
    return ids;
  }, [displayedResultNodes, inPathNodes, selectedNode]);

  const contextNodes = useMemo(() => {
    return contextNodeIds
      .filter((id) => !activeNodeIds.has(id))
      .map((id) => nodesById.get(id))
      .filter((node): node is KnowledgeGraphNode => Boolean(node))
      .slice(-CONTEXT_MEMORY_LIMIT);
  }, [activeNodeIds, contextNodeIds, nodesById]);

  const visibleNodes = useMemo(() => {
    const roleByNodeId = new Map<string, SemanticNodeRole>();
    contextNodes.forEach((node) => roleByNodeId.set(node.id, "context"));
    inPathNodes.forEach((node) => roleByNodeId.set(node.id, "inPath"));
    displayedResultNodes.forEach((node) => roleByNodeId.set(node.id, "result"));
    if (selectedNode) roleByNodeId.set(selectedNode.id, "selected");

    const orderedIds = [
      ...contextNodes.map((node) => node.id),
      ...inPathNodes.map((node) => node.id),
      ...(selectedNode ? [selectedNode.id] : []),
      ...displayedResultNodes.map((node) => node.id)
    ];

    const dedupedOrderedIds = Array.from(new Set(orderedIds));

    return dedupedOrderedIds
      .map((id) => {
        const node = nodesById.get(id);
        const role = roleByNodeId.get(id);
        if (!node || !role) return undefined;
        return { node, role };
      })
      .filter((entry): entry is { node: KnowledgeGraphNode; role: SemanticNodeRole } => Boolean(entry));
  }, [contextNodes, displayedResultNodes, inPathNodes, nodesById, selectedNode]);

  const flowNodes = useMemo<SemanticFlowNode[]>(() => {
    const inPathIndex = new Map(inPathNodes.map((node, index) => [node.id, index]));
    const resultIndex = new Map(displayedResultNodes.map((node, index) => [node.id, index]));
    const contextIndex = new Map(contextNodes.map((node, index) => [node.id, index]));
    const contextRailX = SELECTED_X - (inPathNodes.length + 1) * CONTEXT_STEP_X - 270;
    const positioned = visibleNodes.map((entry) => {
      if (entry.role === "inPath") {
        const pathIndex = inPathIndex.get(entry.node.id) ?? 0;
        return {
          ...entry,
          position: {
            x: SELECTED_X - (inPathNodes.length - pathIndex) * CONTEXT_STEP_X,
            y: 0
          }
        };
      }
      if (entry.role === "selected") {
        return {
          ...entry,
          position: { x: SELECTED_X, y: 0 }
        };
      }
      if (entry.role === "context") {
        const staleIndex = contextIndex.get(entry.node.id) ?? 0;
        const column = Math.floor(staleIndex / 6);
        const row = staleIndex % 6;
        return {
          ...entry,
          position: {
            x: contextRailX - column * 220,
            y: -280 + row * 112
          }
        };
      }

      const normalizedIndex = Math.max(resultIndex.get(entry.node.id) ?? 0, 0);
      const column = isDrilldown ? 0 : Math.floor(normalizedIndex / RESULTS_PER_COLUMN);
      const row = isDrilldown ? normalizedIndex : normalizedIndex % RESULTS_PER_COLUMN;
      const columnYOffset = isDrilldown ? 0 : column % 2 === 0 ? 0 : RESULT_COLUMN_STAGGER_Y;
      const verticalCenterOffset = isDrilldown
        ? (displayedResultNodes.length - 1) / 2
        : (RESULTS_PER_COLUMN - 1) / 2;
      return {
        ...entry,
        position: {
          x: RESULT_START_X + column * RESULT_COLUMN_GAP,
          y: (row - verticalCenterOffset) * RESULT_ROW_GAP + columnYOffset
        }
      };
    });

    return positioned.map((entry) => ({
      id: entry.node.id,
      type: "semantic",
      position: entry.position,
      data: {
        node: entry.node,
        role: entry.role
      },
      selected: selectedNodeId === entry.node.id,
      draggable: false,
      sourcePosition: Position.Right,
      targetPosition: Position.Left
    }));
  }, [contextNodes, displayedResultNodes, inPathNodes, isDrilldown, selectedNodeId, visibleNodes]);

  const flowNodeIds = useMemo(() => new Set(flowNodes.map((node) => node.id)), [flowNodes]);
  const flowNodeById = useMemo(() => new Map(flowNodes.map((node) => [node.id, node])), [flowNodes]);
  const activeFlowNodes = useMemo(() => flowNodes.filter((node) => activeNodeIds.has(node.id)), [activeNodeIds, flowNodes]);

  const activeBounds = useMemo(() => {
    if (!flowNodes.length) return undefined;

    const minNodeX = Math.min(...flowNodes.map((node) => node.position.x));
    const maxNodeX = Math.max(...flowNodes.map((node) => node.position.x + NODE_WIDTH));
    const minNodeY = Math.min(...flowNodes.map((node) => node.position.y));
    const maxNodeY = Math.max(...flowNodes.map((node) => node.position.y + NODE_HEIGHT));

    return {
      minX: minNodeX - 260,
      maxX: maxNodeX + 260,
      minY: minNodeY - 200,
      maxY: maxNodeY + 200
    };
  }, [flowNodes]);

  const translateExtent = useMemo<[[number, number], [number, number]]>(() => {
    if (!activeBounds) return [[-1400, -1000], [2200, 1400]];
    return [
      [activeBounds.minX, activeBounds.minY],
      [activeBounds.maxX, activeBounds.maxY]
    ];
  }, [activeBounds]);

  const flowEdges = useMemo<Edge<SemanticEdgeData>[]>(() => {
    const relationBetween = (leftId: string, rightId: string) =>
      graph.edges.find(
        (edge) => flowNodeIds.has(edge.source) && flowNodeIds.has(edge.target) && edge.source === leftId && edge.target === rightId
      ) ??
      graph.edges.find(
        (edge) => flowNodeIds.has(edge.source) && flowNodeIds.has(edge.target) && edge.source === rightId && edge.target === leftId
      );

    const graphEdgeById = new Map(graph.edges.map((edge) => [edge.id, edge]));
    const edges: Edge<SemanticEdgeData>[] = [];
    const activeEdgeSourceIds = new Set<string>();

    for (let index = 0; index < breadcrumbs.length - 1; index += 1) {
      const source = breadcrumbs[index];
      const target = breadcrumbs[index + 1];
      const relation = relationBetween(source.id, target.id);
      const sourceFlowNode = flowNodeById.get(source.id);
      if (relation?.id) activeEdgeSourceIds.add(relation.id);
      edges.push({
        id: `path-${source.id}-${target.id}`,
        source: source.id,
        target: target.id,
        type: "semantic",
        data: {
          centerX: sourceFlowNode ? sourceFlowNode.position.x + NODE_WIDTH + EDGE_ROUTE_GUTTER : undefined,
          baseEdgeId: relation?.id
        },
        style: {
          stroke: edgeColor(relation),
          strokeWidth: 3,
          opacity: 0.96
        },
        zIndex: 3
      });
    }

    if (selectedNode) {
      const siblingTargets = displayedResultNodes
        .map((resultNode) => {
          const relation = relationBetween(selectedNode.id, resultNode.id);
          if (!relation) return undefined;
          const targetY = flowNodeById.get(resultNode.id)?.position.y ?? 0;
          return { resultNode, relation, targetY };
        })
        .filter((item): item is { resultNode: KnowledgeGraphNode; relation: KnowledgeGraphEdge; targetY: number } => Boolean(item))
        .sort((left, right) => left.targetY - right.targetY);

      siblingTargets.forEach((item, laneIndex) => {
        const laneOffset = (laneIndex - (siblingTargets.length - 1) / 2) * EDGE_LANE_GAP;
        const sourceFlowNode = flowNodeById.get(selectedNode.id);
        const laneCenterX = sourceFlowNode
          ? Math.min(
              RESULT_START_X - EDGE_GUTTER_MARGIN,
              sourceFlowNode.position.x + NODE_WIDTH + EDGE_ROUTE_GUTTER + Math.abs(laneOffset) * 0.45
            )
          : undefined;
        if (item.relation.id) activeEdgeSourceIds.add(item.relation.id);
        edges.push({
          id: `result-${selectedNode.id}-${item.resultNode.id}`,
          source: selectedNode.id,
          target: item.resultNode.id,
          type: "semantic",
          data: {
            laneOffset,
            centerX: laneCenterX,
            baseEdgeId: item.relation.id
          },
          style: {
            stroke: edgeColor(item.relation),
            strokeWidth: 2.1,
            opacity: 0.82
          },
          zIndex: 2
        });
      });
    }

    contextEdgeIds.forEach((contextEdgeId) => {
      if (activeEdgeSourceIds.has(contextEdgeId)) return;
      const relation = graphEdgeById.get(contextEdgeId);
      if (!relation) return;
      if (!flowNodeIds.has(relation.source) || !flowNodeIds.has(relation.target)) return;

      const sourceFlowNode = flowNodeById.get(relation.source);
      const targetFlowNode = flowNodeById.get(relation.target);
      if (!sourceFlowNode || !targetFlowNode) return;

      const oriented = sourceFlowNode.position.x <= targetFlowNode.position.x
        ? { source: relation.source, target: relation.target }
        : { source: relation.target, target: relation.source };

      const orientedSourceNode = flowNodeById.get(oriented.source);
      const orientedTargetNode = flowNodeById.get(oriented.target);
      if (!orientedSourceNode || !orientedTargetNode) return;

      edges.push({
        id: `context-${contextEdgeId}`,
        source: oriented.source,
        target: oriented.target,
        type: "semantic",
        data: {
          centerX: Math.min(
            orientedTargetNode.position.x - EDGE_GUTTER_MARGIN,
            orientedSourceNode.position.x + NODE_WIDTH + EDGE_ROUTE_GUTTER * 0.78
          )
        },
        style: {
          stroke: edgeColor(relation),
          strokeWidth: 1.2,
          opacity: 0.26
        },
        zIndex: 1
      });
    });

    return edges;
  }, [breadcrumbs, contextEdgeIds, displayedResultNodes, flowNodeById, flowNodeIds, graph.edges, selectedNode]);

  const filterOptions = useMemo(() => {
    const chefs = graph.nodes.filter((node) => node.kind === "creator").sort((a, b) => a.label.localeCompare(b.label));
    const ingredients = ingredientFilterIndex.options
      .map((option) => ({ id: option.ingredientId, label: option.label }))
      .sort((a, b) => a.label.localeCompare(b.label));
    const difficulties = graph.nodes.filter((node) => node.kind === "difficulty").sort((a, b) => a.label.localeCompare(b.label));
    return { chefs, ingredients, difficulties };
  }, [graph.nodes, ingredientFilterIndex.options]);

  useEffect(() => {
    if (!didInitialFit.current && flowNodes.length) {
      didInitialFit.current = true;
      const frame = window.requestAnimationFrame(() => {
        reactFlow.fitView({ padding: 0.22, duration: 280 });
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, [flowNodes.length, reactFlow]);

  useEffect(() => {
    if (!selectedNodeId || !flowNodes.length) return;
    if (panTargetNodeIdRef.current !== selectedNodeId) return;
    const frame = window.requestAnimationFrame(() => {
      const branchNodes = activeFlowNodes.length ? activeFlowNodes : flowNodes.filter((node) => node.id === selectedNodeId);
      if (!branchNodes.length) return;
      reactFlow.fitView({
        nodes: branchNodes,
        padding: 0.24,
        duration: 260,
        maxZoom: 1.08
      });
      panTargetNodeIdRef.current = undefined;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeFlowNodes, flowNodes, reactFlow, selectedNodeId]);

  const focusNode = useCallback((node: KnowledgeGraphNode) => {
    const currentVisibleNodeIds = visibleNodes.map((entry) => entry.node.id).filter((id) => id !== node.id);
    const currentActiveEdgeIds = flowEdges
      .filter((edge) => !edge.id.startsWith("context-"))
      .map((edge) => edge.data?.baseEdgeId)
      .filter((edgeId): edgeId is string => Boolean(edgeId));

    setContextNodeIds((current) => mergeUniqueTail([...current, ...currentVisibleNodeIds], CONTEXT_MEMORY_LIMIT));
    setContextEdgeIds((current) => mergeUniqueTail([...current, ...currentActiveEdgeIds], EDGE_MEMORY_LIMIT));
    setNavigationPath((current) =>
      nextNavigationPath(current, node.id, hierarchyParents, nodesById)
    );
    panTargetNodeIdRef.current = node.id;
    setSelectedNodeId(node.id);
    setResultVisibleCount(RESULT_CAP);
  }, [flowEdges, hierarchyParents, nodesById, visibleNodes]);

  const recenter = useCallback(() => {
    const focusNodes = activeFlowNodes.length ? activeFlowNodes : flowNodes;
    if (!focusNodes.length) {
      return;
    }
    reactFlow.fitView({ nodes: focusNodes, padding: 0.24, duration: 420, maxZoom: 1.1 });
  }, [activeFlowNodes, flowNodes, reactFlow]);

  const clearFilters = () => {
    setFilters({ chefIds: [], ingredientIds: [], difficultyIds: [] });
  };

  const reset = () => {
    panTargetNodeIdRef.current = undefined;
    setSelectedNodeId(undefined);
    setNavigationPath([]);
    setContextNodeIds([]);
    setContextEdgeIds([]);
    setFilters({ chefIds: [], ingredientIds: [], difficultyIds: [] });
    setViewMode("dishes");
    setQuery("");
    setResultVisibleCount(RESULT_CAP);
  };

  const emptyState = Boolean(selectedNode && !queryMatches.length);

  return (
    <section className="graph-explorer" aria-label="Recipedia guided graph explorer">
      <aside className="graph-sidebar">
        <div>
          <p className="eyebrow">Recipedia map</p>
          <h1>Dish-first guided graph exploration.</h1>
          <p className="lede">
            Follow a stable path from cuisine to categories, families, and dishes. View modes and filters refine the
            right-side results without breaking orientation.
          </p>
        </div>

        <nav className="graph-breadcrumbs" aria-label="Current path">
          {breadcrumbNodes.length ? (
            breadcrumbNodes.map((node, index) => (
              <button
                className={node.id === selectedNodeId ? "active" : ""}
                key={node.id}
                onClick={() => focusNode(node)}
                type="button"
              >
                {index > 0 ? <span aria-hidden="true">&gt;</span> : null}
                {node.label}
              </button>
            ))
          ) : (
            <span className="meta">Select a cuisine to start the path</span>
          )}
        </nav>

        <div className="mode-switcher" role="radiogroup" aria-label="View mode">
          {viewModes.map((item) => {
            const Icon = item.icon;
            return (
              <button
                aria-checked={viewMode === item.id}
                className={viewMode === item.id ? "mode-button active" : "mode-button"}
                key={item.id}
                onClick={() => {
                  setViewMode(item.id);
                  setResultVisibleCount(RESULT_CAP);
                }}
                role="radio"
                type="button"
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>

        <form
          className="graph-search"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <Search size={17} />
          <input
            aria-label="Search current results"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search visible results"
          />
          {query ? (
            <button aria-label="Clear search" onClick={() => setQuery("")} title="Clear search" type="button">
              <X size={15} />
            </button>
          ) : null}
        </form>

        <div className="graph-filter-stack" aria-label="Live filters">
          <h3>Filters</h3>
          <FilterMultiSelect
            label="Chef"
            options={filterOptions.chefs}
            selectedIds={filters.chefIds}
            onChange={(ids) => {
              setFilters((current) => ({ ...current, chefIds: ids }));
              setResultVisibleCount(RESULT_CAP);
            }}
          />
          <FilterMultiSelect
            label="Ingredient"
            options={filterOptions.ingredients}
            selectedIds={filters.ingredientIds}
            onChange={(ids) => {
              setFilters((current) => ({ ...current, ingredientIds: ids }));
              setResultVisibleCount(RESULT_CAP);
            }}
          />
          <FilterMultiSelect
            label="Difficulty"
            options={filterOptions.difficulties}
            selectedIds={filters.difficultyIds}
            onChange={(ids) => {
              setFilters((current) => ({ ...current, difficultyIds: ids }));
              setResultVisibleCount(RESULT_CAP);
            }}
          />

          {filters.chefIds.length || filters.ingredientIds.length || filters.difficultyIds.length ? (
            <button className="ghost-button" onClick={clearFilters} type="button">
              <X size={15} /> Clear filters
            </button>
          ) : null}
        </div>

        <div className="graph-toolbar" aria-label="Graph controls">
          <button onClick={reset} title="Reset graph" type="button">
            <RotateCcw size={17} />
            Reset
          </button>
          <button onClick={recenter} title="Recenter selected node" type="button">
            <Focus size={17} />
            Recenter
          </button>
          <button onClick={() => reactFlow.fitView({ padding: 0.24, duration: 420, maxZoom: 1.1 })} title="Fit visible graph" type="button">
            <Maximize2 size={17} />
            Fit
          </button>
        </div>

        <div className="graph-stats" aria-label="Result summary">
          <span className="graph-stat">Results {queryMatches.length}</span>
          <span className="graph-stat">View {viewModes.find((item) => item.id === viewMode)?.label}</span>
        </div>
      </aside>

      <div className="graph-stage">
        <ReactFlow
          colorMode="light"
          edges={flowEdges}
          edgeTypes={semanticEdgeTypes}
          minZoom={0.35}
          maxZoom={1.6}
          nodes={flowNodes}
          translateExtent={translateExtent}
          nodesDraggable={false}
          nodeTypes={semanticNodeTypes}
          onNodeClick={(_, flowNode) => {
            const nextNode = flowNode.data.node;
            if (selectedNodeId === nextNode.id) {
              router.push(nextNode.href);
              return;
            }
            focusNode(nextNode);
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#d9d0c2" gap={28} />
          <MiniMap
            maskColor="rgba(255, 250, 242, 0.72)"
            nodeColor={(node) => nodeColors[(node.data?.node as KnowledgeGraphNode)?.kind ?? "family"]}
            pannable
            position="bottom-left"
            zoomable
          />
          <Controls position="bottom-right" />
        </ReactFlow>
      </div>

      <aside className="graph-detail-panel">
        {selectedNode ? (
          <>
            <div className="detail-kicker">
              <span className="node-kind-dot" style={{ background: nodeColors[selectedNode.kind] }} />
              {kindLabels[selectedNode.kind]}
            </div>
            <h2>{selectedNode.label}</h2>
            {selectedNode.meta ? <p className="meta">{selectedNode.meta}</p> : null}
            {selectedNode.description ? <p>{selectedNode.description}</p> : null}

            <div className="tag-list">
              {selectedNode.tags?.slice(0, 4).map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>

            {emptyState ? (
              <div className="card stack">
                <h3>No results match these filters</h3>
                <p className="meta">Try removing one or more filters.</p>
              </div>
            ) : null}

            {totalResultCount > resultVisibleCount ? (
              <button
                className="ghost-button"
                onClick={() => setResultVisibleCount((count) => Math.min(count + 4, totalResultCount))}
                type="button"
              >
                <Compass size={15} /> See more
              </button>
            ) : null}

            <Link className="button" href={selectedNode.href}>
              Open detail
            </Link>
          </>
        ) : (
          <div className="empty">Select a cuisine to start a dish-first path.</div>
        )}
      </aside>
    </section>
  );
}

function FilterMultiSelect({
  label,
  options,
  selectedIds,
  onChange
}: {
  label: string;
  options: Array<{ id: string; label: string }>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const visibleOptions = options.slice(0, 40);
  return (
    <div className="stack">
      <p className="meta">{label}</p>
      <div className="tag-list">
        {visibleOptions.map((option) => {
          const selected = selectedIds.includes(option.id);
          return (
            <button
              className={selected ? "filter-pill active" : "filter-pill"}
              key={option.id}
              onClick={() => {
                if (selected) {
                  onChange(selectedIds.filter((id) => id !== option.id));
                } else {
                  onChange([...selectedIds, option.id]);
                }
              }}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SemanticRoutedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data
}: EdgeProps<Edge<SemanticEdgeData>>) {
  const centerX = typeof data?.centerX === "number" ? Math.min(data.centerX, targetX - EDGE_GUTTER_MARGIN) : undefined;
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition: sourcePosition ?? Position.Right,
    targetPosition: targetPosition ?? Position.Left,
    centerX,
    centerY: typeof data?.laneOffset === "number" ? sourceY + data.laneOffset : undefined,
    borderRadius: 12,
    offset: 24
  });

  return <BaseEdge id={id} markerEnd={markerEnd} path={edgePath} style={style} />;
}

function SemanticNode({ data, selected }: NodeProps<SemanticFlowNode>) {
  const graphNode = data.node;
  const Icon = kindIcons[graphNode.kind] ?? CircleDot;
  return (
    <div
      className={[
        "semantic-node",
        `semantic-node-${graphNode.kind}`,
        `semantic-node-role-${data.role}`,
        selected || data.role === "selected" ? "active" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--node-color": nodeColors[graphNode.kind] } as CSSProperties}
    >
      <Handle className="semantic-handle" isConnectable={false} position={Position.Left} type="target" />
      <div className="semantic-node-head">
        <span className="semantic-node-icon">
          <Icon size={15} />
        </span>
        <span>{kindLabels[graphNode.kind]}</span>
      </div>
      <strong>{graphNode.label}</strong>
      {graphNode.meta ? <small>{graphNode.meta}</small> : null}
      <Handle className="semantic-handle" isConnectable={false} position={Position.Right} type="source" />
    </div>
  );
}

function mergeUniqueTail(ids: string[], limit: number) {
  return Array.from(new Set(ids)).slice(-limit);
}

function nextNavigationPath(
  currentPath: string[],
  nextNodeId: string,
  parents: Map<string, string>,
  nodesById: Map<string, KnowledgeGraphNode>
) {
  const existingIndex = currentPath.indexOf(nextNodeId);
  if (existingIndex >= 0) {
    return currentPath.slice(0, existingIndex + 1);
  }

  const hierarchyPath = buildBreadcrumbPath(nextNodeId, parents, nodesById).map((node) => node.id);
  if (hierarchyPath.length) return hierarchyPath;

  return mergeUniqueTail([...currentPath, nextNodeId], CONTEXT_MEMORY_LIMIT);
}

function parseInitialViewMode(value: string): ViewMode {
  const normalized = value.toLowerCase();
  if (normalized === "ingredient") return "ingredients";
  if (normalized === "technique") return "techniques";
  if (normalized === "chef") return "chefs";
  return "dishes";
}

function findNodeByFocus(nodes: KnowledgeGraphNode[], focus: string) {
  if (!focus) return undefined;
  const normalized = focus.replace(/-/g, " ").toLowerCase();
  return nodes.find((node) => node.label.toLowerCase() === normalized || node.href.toLowerCase().includes(focus));
}

function hierarchyParentMap(edges: KnowledgeGraphEdge[]) {
  const parents = new Map<string, string>();
  edges.forEach((edge) => {
    if (HIERARCHY_EDGE_KINDS.has(edge.kind ?? "")) {
      parents.set(edge.target, edge.source);
    }
  });
  return parents;
}

function buildBreadcrumbPath(
  selectedNodeId: string | undefined,
  parents: Map<string, string>,
  nodesById: Map<string, KnowledgeGraphNode>
) {
  if (!selectedNodeId) return [] as KnowledgeGraphNode[];
  const path: KnowledgeGraphNode[] = [];
  let current: string | undefined = selectedNodeId;
  while (current) {
    const node = nodesById.get(current);
    if (node) path.unshift(node);
    current = parents.get(current);
  }
  return path;
}

function collectHierarchyDescendants(nodeId: string, edges: KnowledgeGraphEdge[]) {
  const children = new Map<string, Set<string>>();
  edges.forEach((edge) => {
    if (!HIERARCHY_EDGE_KINDS.has(edge.kind ?? "")) return;
    if (!children.has(edge.source)) children.set(edge.source, new Set());
    children.get(edge.source)!.add(edge.target);
  });

  const descendants = new Set<string>();
  const stack = [...(children.get(nodeId) ?? [])];
  while (stack.length) {
    const id = stack.pop()!;
    if (descendants.has(id)) continue;
    descendants.add(id);
    stack.push(...(children.get(id) ?? []));
  }
  return descendants;
}

function familiesForSelection(
  selectedNode: KnowledgeGraphNode,
  graph: SemanticGraph,
  parents: Map<string, string>
) {
  const ids = new Set<string>();

  if (selectedNode.kind === "family") {
    ids.add(selectedNode.id);
    return ids;
  }

  if (selectedNode.kind === "recipe" || selectedNode.kind === "variation") {
    let current = parents.get(selectedNode.id);
    while (current) {
      const node = graph.nodes.find((candidate) => candidate.id === current);
      if (node?.kind === "family") {
        ids.add(current);
        break;
      }
      current = parents.get(current);
    }
    return ids;
  }

  if (selectedNode.kind === "cuisine" || selectedNode.kind === "category") {
    const descendants = collectHierarchyDescendants(selectedNode.id, graph.edges);
    descendants.forEach((id) => {
      const node = graph.nodes.find((candidate) => candidate.id === id);
      if (node?.kind === "family") ids.add(id);
    });
  }

  if (selectedNode.kind === "cuisine") {
    graph.edges.forEach((edge) => {
      if (edge.kind === "family_associated_with_cuisine" && edge.source === selectedNode.id) {
        ids.add(edge.target);
      }
    });
  }

  if (selectedNode.kind === "category") {
    graph.edges.forEach((edge) => {
      if (edge.kind === "family_associated_with_category" && edge.source === selectedNode.id) {
        ids.add(edge.target);
      }
    });
  }

  return ids;
}

function applyFamilyFilters(
  familyIds: Set<string>,
  filters: FilterState,
  graph: SemanticGraph,
  ingredientFilterIndex: IngredientFilterIndex
) {
  if (!familyIds.size) return familyIds;
  let filtered = new Set(familyIds);

  if (filters.chefIds.length) {
    const chefSet = new Set(filters.chefIds);
    filtered = new Set(
      Array.from(filtered).filter((familyId) =>
        graph.edges.some((edge) => edge.kind === "family_created_by" && edge.source === familyId && chefSet.has(edge.target))
      )
    );
  }

  if (filters.ingredientIds.length) {
    const ingredientSet = new Set(filters.ingredientIds);
    filtered = new Set(
      Array.from(filtered).filter((familyId) =>
        (ingredientFilterIndex.families[familyId] ?? []).some((ingredient) => ingredientSet.has(ingredient.ingredientId))
      )
    );
  }

  if (filters.difficultyIds.length) {
    const difficultySet = new Set(filters.difficultyIds);
    filtered = new Set(
      Array.from(filtered).filter((familyId) =>
        graph.edges.some((edge) => edge.kind === "dish_has_difficulty" && edge.source === familyId && difficultySet.has(edge.target))
      )
    );
  }

  return filtered;
}

function buildResultNodes({
  graph,
  selectedNode,
  viewMode,
  filteredFamilyIds,
  familyIdsInScope,
  resultVisibleCount,
  hierarchyParents
}: {
  graph: SemanticGraph;
  selectedNode: KnowledgeGraphNode;
  viewMode: ViewMode;
  filteredFamilyIds: Set<string>;
  familyIdsInScope: Set<string>;
  resultVisibleCount: number;
  hierarchyParents: Map<string, string>;
}) {
  const rankScores = buildNodeRankScores(graph);

  const ranked = (nodes: KnowledgeGraphNode[]) =>
    nodes
      .slice()
      .sort((left, right) => (rankScores.get(right.id) ?? 0) - (rankScores.get(left.id) ?? 0) || left.label.localeCompare(right.label));

  if (viewMode === "dishes") {
    if (selectedNode.kind === "cuisine") {
      const categories = graph.edges
        .filter((edge) => edge.kind === "cuisine_contains_category" && edge.source === selectedNode.id)
        .map((edge) => graph.nodes.find((node) => node.id === edge.target))
        .filter((node): node is KnowledgeGraphNode => Boolean(node));

      const filteredCategories = categories.filter((category) => {
        const families = collectHierarchyDescendants(category.id, graph.edges);
        return Array.from(families).some((id) => filteredFamilyIds.has(id));
      });

      return ranked(filteredCategories.length ? filteredCategories : categories).slice(0, resultVisibleCount);
    }

    if (selectedNode.kind === "category") {
      const families = graph.edges
        .filter((edge) => edge.kind === "category_contains_dish_family" && edge.source === selectedNode.id)
        .map((edge) => graph.nodes.find((node) => node.id === edge.target))
        .filter((node): node is KnowledgeGraphNode => Boolean(node));

      const associatedFamilies = graph.edges
        .filter((edge) => edge.kind === "family_associated_with_category" && edge.source === selectedNode.id)
        .map((edge) => graph.nodes.find((node) => node.id === edge.target))
        .filter((node): node is KnowledgeGraphNode => Boolean(node));

      const merged = dedupeNodes([...families, ...associatedFamilies]).filter((node) =>
        filteredFamilyIds.size ? filteredFamilyIds.has(node.id) : true
      );
      return ranked(merged).slice(0, resultVisibleCount);
    }

    const scopeFamilies = filteredFamilyIds.size ? filteredFamilyIds : familyIdsInScope;

    if (selectedNode.kind === "family") {
      const recipes = graph.edges
        .filter((edge) => edge.kind === "dish_family_contains_recipe" && edge.source === selectedNode.id)
        .map((edge) => graph.nodes.find((node) => node.id === edge.target))
        .filter((node): node is KnowledgeGraphNode => Boolean(node));

      const recipeIds = new Set(recipes.map((recipe) => recipe.id));
      const variations = graph.edges
        .filter((edge) => edge.kind === "recipe_has_variation" && recipeIds.has(edge.source))
        .map((edge) => graph.nodes.find((node) => node.id === edge.target))
        .filter((node): node is KnowledgeGraphNode => Boolean(node));

      if (!scopeFamilies.has(selectedNode.id)) return [];
      return ranked(dedupeNodes([...recipes, ...variations])).slice(0, resultVisibleCount);
    }

    if (selectedNode.kind === "recipe" || selectedNode.kind === "variation") {
      const familyId = familyIdForDish(selectedNode.id, hierarchyParents, graph);
      if (!familyId || !scopeFamilies.has(familyId)) return [];

      const related = graph.edges
        .filter((edge) => edge.kind === "recipe_has_variation" && (edge.source === selectedNode.id || edge.target === selectedNode.id))
        .map((edge) => graph.nodes.find((node) => node.id === (edge.source === selectedNode.id ? edge.target : edge.source)))
        .filter((node): node is KnowledgeGraphNode => Boolean(node));

      return ranked(related).slice(0, resultVisibleCount);
    }
  }

  const familyScope = filteredFamilyIds.size ? filteredFamilyIds : familyIdsInScope;

  const targetKind = viewMode === "chefs" ? "creator" : viewMode === "techniques" ? "technique" : "ingredient";
  const edgeKind =
    viewMode === "chefs" ? "family_created_by" : viewMode === "techniques" ? "dish_uses_technique" : "dish_uses_ingredient";

  const resultIds = new Set<string>();
  graph.edges.forEach((edge) => {
    if (edge.kind !== edgeKind || !familyScope.has(edge.source)) return;
    resultIds.add(edge.target);
  });

  const results = Array.from(resultIds)
    .map((id) => graph.nodes.find((node) => node.id === id))
    .filter((node): node is KnowledgeGraphNode => Boolean(node))
    .filter((node) => node.kind === targetKind);

  return ranked(results).slice(0, resultVisibleCount);
}

function familyIdForDish(dishId: string, hierarchyParents: Map<string, string>, graph: SemanticGraph) {
  let current = hierarchyParents.get(dishId);
  while (current) {
    const node = graph.nodes.find((candidate) => candidate.id === current);
    if (node?.kind === "family") return current;
    current = hierarchyParents.get(current);
  }
  return undefined;
}

function dedupeNodes(nodes: KnowledgeGraphNode[]) {
  const byId = new Map<string, KnowledgeGraphNode>();
  nodes.forEach((node) => byId.set(node.id, node));
  return Array.from(byId.values());
}

function searchableText(node: KnowledgeGraphNode) {
  return [node.label, node.href, node.description, node.meta, ...(node.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function buildNodeRankScores(graph: SemanticGraph) {
  const degree = new Map<string, number>();
  graph.nodes.forEach((node) => degree.set(node.id, 0));
  graph.edges.forEach((edge) => {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  });
  const maxDegree = Math.max(...Array.from(degree.values()), 1);

  const scores = new Map<string, number>();
  graph.nodes.forEach((node) => {
    const ranked = scoreNode({
      node,
      degree: degree.get(node.id) ?? 0,
      maxDegree,
      hasDescription: Boolean(node.description),
      hasMeta: Boolean(node.meta),
      tagCount: node.tags?.length ?? 0,
      canonical: node.canonical !== false,
      kind: node.kind,
      manualBoost: 0
    });
    scores.set(node.id, ranked.rankScore);
  });
  return scores;
}

function edgeColor(edge: KnowledgeGraphEdge | undefined) {
  if (!edge) return "#968b80";
  if (edge.kind === "cuisine_contains_category") return "#b56f48";
  if (edge.kind === "category_contains_category") return "#8d87b8";
  if (edge.kind === "category_contains_dish_family") return "#5b86a0";
  if (edge.kind === "dish_family_contains_recipe") return "#78906d";
  if (edge.kind === "recipe_has_variation") return "#c75f3e";
  if (edge.kind === "dish_uses_ingredient") return "#579179";
  if (edge.kind === "dish_uses_technique") return "#b38338";
  if (edge.kind === "family_created_by") return "#8b6a52";
  if (edge.kind === "dish_has_difficulty") return "#9a6581";
  return "#968b80";
}
