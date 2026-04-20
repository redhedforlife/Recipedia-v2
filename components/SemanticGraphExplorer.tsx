"use client";

import Link from "next/link";
import {
  BookOpen,
  CircleDot,
  Compass,
  Flame,
  Focus,
  Gauge,
  Layers3,
  MapPinned,
  Maximize2,
  Network,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Utensils,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ComponentType, type CSSProperties } from "react";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps
} from "@xyflow/react";
import { MapExplorePanel } from "@/components/MapExplorePanel";
import { buildExploreProfile } from "@/lib/explore/buildExploreProfile";
import { scoreNode } from "@/lib/ranking/scoreNode";
import type {
  ExploreDimension,
  GraphMode,
  GraphNodeKind,
  ExploreProfile,
  KnowledgeGraphEdge,
  KnowledgeGraphNode
} from "@/lib/types";

type SemanticGraph = {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
};

type SemanticNodeData = Record<string, unknown> & {
  node: KnowledgeGraphNode;
  active: boolean;
  matched: boolean;
  dimmed: boolean;
};

type SemanticFlowNode = Node<SemanticNodeData, "semantic">;

const modes: Array<{ id: GraphMode; label: string; icon: ComponentType<{ size?: number }> }> = [
  { id: "explore", label: "Explore", icon: Compass },
  { id: "cuisine", label: "Cuisine", icon: MapPinned },
  { id: "dish", label: "Dish", icon: Utensils },
  { id: "ingredient", label: "Ingredient", icon: Sparkles },
  { id: "technique", label: "Technique", icon: Flame },
  { id: "difficulty", label: "Difficulty", icon: Gauge },
  { id: "method", label: "Method", icon: SlidersHorizontal }
];

const primaryKindByMode: Record<GraphMode, GraphNodeKind> = {
  explore: "cuisine",
  cuisine: "cuisine",
  dish: "category",
  ingredient: "ingredient",
  technique: "technique",
  difficulty: "difficulty",
  method: "method"
};

const hierarchyEdgeKinds = new Set([
  "cuisine_contains_category",
  "category_contains_category",
  "category_contains_dish_family",
  "dish_family_contains_recipe",
  "recipe_has_variation",
  "ingredient_category_contains_category",
  "ingredient_category_contains_ingredient",
  "technique_category_contains_category",
  "technique_category_contains_technique"
]);

const contextEdgeKinds = new Set([
  "dish_uses_ingredient",
  "dish_uses_technique",
  "dish_uses_method",
  "dish_has_difficulty",
  "dish_related_to_dish",
  "family_associated_with_category",
  "family_associated_with_cuisine",
  "family_created_by",
  "cuisine_has_creator"
]);

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
  recipe: "Recipe",
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
  creator: Compass,
  recipe: BookOpen,
  variation: Network,
  ingredientCategory: Layers3,
  ingredient: Sparkles,
  techniqueCategory: Layers3,
  technique: Flame,
  method: SlidersHorizontal,
  difficulty: Gauge
};

const contextEdgeKindByMode: Partial<Record<GraphMode, string>> = {
  ingredient: "dish_uses_ingredient",
  technique: "dish_uses_technique",
  method: "dish_uses_method",
  difficulty: "dish_has_difficulty"
};

const contextualModes: GraphMode[] = ["ingredient", "technique", "difficulty", "method"];
const hierarchyScopeKinds: GraphNodeKind[] = ["cuisine", "category", "family", "recipe", "variation"];

const semanticNodeTypes = { semantic: SemanticNode };

export function SemanticGraphExplorer({
  graph,
  initialMode = "explore",
  initialFocus = ""
}: {
  graph: SemanticGraph;
  initialMode?: string;
  initialFocus?: string;
}) {
  return (
    <ReactFlowProvider>
      <SemanticGraphExplorerInner
        graph={graph}
        initialFocus={initialFocus}
        initialMode={initialMode}
      />
    </ReactFlowProvider>
  );
}

function SemanticGraphExplorerInner({
  graph,
  initialMode,
  initialFocus
}: {
  graph: SemanticGraph;
  initialMode: string;
  initialFocus: string;
}) {
  const parsedInitialMode = parseMode(initialMode);
  const defaultSelected = findNodeByFocus(graph.nodes, initialFocus);

  const [mode, setMode] = useState<GraphMode>(parsedInitialMode);
  const [query, setQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState(defaultSelected?.id);
  const [scopeNodeId, setScopeNodeId] = useState(defaultSelected?.id);
  const [canonicalOnly, setCanonicalOnly] = useState(false);
  const [showContextEdges, setShowContextEdges] = useState(false);
  const [exploreFilter, setExploreFilter] = useState<ExploreDimension>("all");
  const [exploreVisibleCounts, setExploreVisibleCounts] = useState<Record<string, number>>({});
  const [rootVisibleCounts, setRootVisibleCounts] = useState<Record<string, number>>({});
  const reactFlow = useReactFlow();

  const nodesById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes]);
  const hierarchyParents = useMemo(() => hierarchyParentMap(graph.edges), [graph.edges]);
  const scopedNodeId = contextualModes.includes(mode) ? scopeNodeId ?? selectedNodeId : selectedNodeId;
  const breadcrumbNodeId = contextualModes.includes(mode) ? scopeNodeId ?? selectedNodeId : selectedNodeId;
  const trimmedQuery = query.trim().toLowerCase();
  const rootVisibleCount = rootVisibleCounts[mode] ?? 10;
  const nodeRankScores = useMemo(() => buildNodeRankScores(graph), [graph]);
  const rootNodesForMode = useMemo(
    () => topNodesForMode(mode, graph.nodes, nodeRankScores).slice(0, rootVisibleCount),
    [graph.nodes, mode, nodeRankScores, rootVisibleCount]
  );
  const matchingNodeIds = useMemo(() => {
    if (!trimmedQuery) return new Set<string>();
    return new Set(
      graph.nodes
        .filter((node) => searchableText(node).includes(trimmedQuery))
        .map((node) => node.id)
    );
  }, [graph.nodes, trimmedQuery]);

  const adjacency = useMemo(() => {
    const related = new Map<string, Set<string>>();
    graph.edges.forEach((edge) => {
      if (!related.has(edge.source)) related.set(edge.source, new Set());
      if (!related.has(edge.target)) related.set(edge.target, new Set());
      related.get(edge.source)!.add(edge.target);
      related.get(edge.target)!.add(edge.source);
    });
    return related;
  }, [graph.edges]);

  const selectedNode = selectedNodeId ? nodesById.get(selectedNodeId) : undefined;
  const currentExploreExperience = useMemo<ExploreProfile | undefined>(() => {
    if (mode !== "explore" || !selectedNode) return undefined;
    return buildExploreProfile(selectedNode, graph);
  }, [graph, mode, selectedNode]);
  const visibleExploreSections = useMemo(
    () =>
      currentExploreExperience?.sections.filter((section) => exploreFilter === "all" || section.id === exploreFilter) ?? [],
    [currentExploreExperience, exploreFilter]
  );

  const visibleNodeIds = useMemo(() => {
    if (!trimmedQuery && !selectedNode) {
      return new Set(rootNodesForMode.map((node) => node.id));
    }

    if (!trimmedQuery && mode === "explore" && selectedNode) {
      const ids = new Set<string>([selectedNode.id]);
      addAncestors(ids, selectedNode.id, hierarchyParents);
      visibleExploreSections.forEach((section) => {
        const visibleCount = exploreVisibleCounts[section.id] ?? section.defaultVisibleCount ?? Math.min(section.items.length, 6);
        section.items.slice(0, visibleCount).forEach((item) => {
          const node = nodesById.get(item.nodeId);
          if (!node) return;
          ids.add(node.id);
          addAncestors(ids, node.id, hierarchyParents);
        });
      });
      return ids;
    }

    const ids = trimmedQuery
      ? searchNeighborhood(graph, matchingNodeIds)
      : modeNeighborhood(graph, mode, scopedNodeId, showContextEdges);

    if (canonicalOnly) {
      Array.from(ids).forEach((id) => {
        const node = nodesById.get(id);
        if (node && node.canonical === false) ids.delete(id);
      });
    }

    return ids;
  }, [
    canonicalOnly,
    exploreVisibleCounts,
    graph,
    hierarchyParents,
    matchingNodeIds,
    mode,
    nodesById,
    rootNodesForMode,
    scopedNodeId,
    selectedNode,
    showContextEdges,
    trimmedQuery,
    visibleExploreSections
  ]);

  const visibleEdges = useMemo(() => {
    if (!trimmedQuery && !selectedNode) {
      return [];
    }
    return graph.edges.filter((edge) => {
      if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) return false;
      if (hierarchyEdgeKinds.has(edge.kind ?? "")) return true;
      if (edge.kind === contextEdgeKindByMode[mode]) return true;
      if (trimmedQuery) return contextEdgeKinds.has(edge.kind ?? "");
      return showContextEdges && contextEdgeKinds.has(edge.kind ?? "");
    });
  }, [graph.edges, mode, selectedNode, showContextEdges, trimmedQuery, visibleNodeIds]);

  const visibleNodes = useMemo(
    () => graph.nodes.filter((node) => visibleNodeIds.has(node.id)),
    [graph.nodes, visibleNodeIds]
  );

  const activeNodeId = selectedNodeId;
  const activeNeighbors = useMemo(() => (activeNodeId ? adjacency.get(activeNodeId) ?? new Set<string>() : new Set<string>()), [activeNodeId, adjacency]);

  const positionedNodes = useMemo(
    () => layoutNodes(visibleNodes, mode),
    [mode, visibleNodes]
  );

  const flowNodes = useMemo<SemanticFlowNode[]>(
    () =>
      positionedNodes.map((node) => ({
        id: node.id,
        type: "semantic",
        position: node.position,
        data: {
          node: node.data,
          active: node.id === activeNodeId,
          matched: matchingNodeIds.has(node.id),
          dimmed: Boolean(activeNodeId && node.id !== activeNodeId && !activeNeighbors.has(node.id))
        },
        selected: node.id === selectedNodeId,
        draggable: false
      })),
    [activeNeighbors, activeNodeId, matchingNodeIds, positionedNodes, selectedNodeId]
  );

  const flowEdges = useMemo<Edge[]>(
    () =>
      visibleEdges.map((edge) => {
        const active = Boolean(activeNodeId && (edge.source === activeNodeId || edge.target === activeNodeId));
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: active ? edge.label : undefined,
          animated: active,
          style: {
            stroke: edgeColor(edge),
            strokeWidth: active ? 2.4 : 1.35,
            opacity: activeNodeId && !active ? 0.22 : 0.72
          }
        };
      }),
    [activeNodeId, visibleEdges]
  );

  const relatedNodes = useMemo(
    () => relatedNodeList(graph, selectedNodeId, nodesById),
    [graph, nodesById, selectedNodeId]
  );
  const breadcrumbs = useMemo(
    () => buildBreadcrumbs(graph, breadcrumbNodeId, nodesById),
    [breadcrumbNodeId, graph, nodesById]
  );
  const visibleCounts = useMemo(() => summarizeKinds(visibleNodes), [visibleNodes]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      reactFlow.fitView({ padding: 0.18, duration: 220 });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mode, trimmedQuery, showContextEdges, canonicalOnly, rootVisibleCount, visibleNodes.length, reactFlow]);

  const submitSearch = useCallback(() => {
    const firstMatch = rankedSearchResults(graph.nodes, trimmedQuery)[0];
    if (!firstMatch) return;
    setExploreFilter("all");
    setExploreVisibleCounts({});
    setSelectedNodeId(firstMatch.id);
    setScopeNodeId(firstMatch.id);
    setMode(modeForNode(firstMatch) === "cuisine" ? "explore" : modeForNode(firstMatch));
  }, [graph.nodes, trimmedQuery]);

  const resetGraph = () => {
    setMode("explore");
    setQuery("");
    setSelectedNodeId(undefined);
    setScopeNodeId(undefined);
    setCanonicalOnly(false);
    setShowContextEdges(false);
    setExploreFilter("all");
    setExploreVisibleCounts({});
  };

  const focusNode = useCallback(
    (node: KnowledgeGraphNode, options?: { nextMode?: GraphMode }) => {
      setExploreFilter("all");
      setExploreVisibleCounts({});
      setSelectedNodeId(node.id);
      setScopeNodeId(node.id);
      if (options?.nextMode) {
        setMode(options.nextMode);
      } else {
        setMode(modeForNode(node));
      }
    },
    []
  );

  const focusExploreNode = useCallback((node: KnowledgeGraphNode) => focusNode(node, { nextMode: "explore" }), [focusNode]);

  const recenterSelected = () => {
    if (!selectedNodeId) {
      reactFlow.fitView({ padding: 0.2, duration: 500 });
      return;
    }
    const node = reactFlow.getNode(selectedNodeId);
    if (!node) return;
    reactFlow.setCenter(node.position.x + 110, node.position.y + 38, { zoom: 1.28, duration: 520 });
  };

  return (
    <section className="graph-explorer" aria-label="Recipedia knowledge graph explorer">
      <aside className="graph-sidebar">
        <div>
          <p className="eyebrow">Recipedia map</p>
          <h1>Explore the graph with ranked entry points.</h1>
          <p className="lede">
            Start broad in Explore mode, then narrow the map by cuisine, dish, ingredient, technique, difficulty, or
            method when you want a cleaner slice.
          </p>
        </div>

        {!selectedNode ? (
          <div className="graph-launchpad card stack">
            <div className="row">
              <span className={`entity-chip entity-chip--${launchpadChipKind(mode)}`}>
                {launchpadLabel(mode)}
              </span>
              <span className="tag">{rootNodesForMode.length} shown</span>
            </div>
            <div className="graph-launchpad-list">
              {rootNodesForMode.map((node) => (
                <button
                  className={node.id === selectedNodeId ? "graph-launchpad-button active" : "graph-launchpad-button"}
                  key={node.id}
                  onClick={() => (mode === "explore" ? focusExploreNode(node) : focusNode(node, { nextMode: mode }))}
                  type="button"
                >
                  {node.label}
                </button>
              ))}
            </div>
            {rootNodesForMode.length < topNodesForMode(mode, graph.nodes, nodeRankScores).length ? (
              <button
                className="ghost-button"
                onClick={() =>
                  setRootVisibleCounts((current) => ({
                    ...current,
                    [mode]: (current[mode] ?? 10) + 5
                  }))
                }
                type="button"
              >
                <Compass size={15} /> See more
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="mode-switcher" role="radiogroup" aria-label="Graph mode">
          {modes.map((item) => {
            const Icon = item.icon;
            return (
              <button
                aria-checked={mode === item.id}
                className={mode === item.id ? "mode-button active" : "mode-button"}
                key={item.id}
                onClick={() => {
                  setExploreFilter("all");
                  setExploreVisibleCounts({});
                  setMode(item.id);
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
            submitSearch();
          }}
        >
          <Search size={17} />
          <input
            aria-label="Search graph"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Carbonara, beef, roast, easy dinner..."
          />
          {query ? (
            <button aria-label="Clear search" onClick={() => setQuery("")} title="Clear search" type="button">
              <X size={15} />
            </button>
          ) : null}
        </form>

        <div className="graph-toolbar" aria-label="Graph controls">
          <button onClick={resetGraph} title="Reset graph" type="button">
            <RotateCcw size={17} />
            Reset
          </button>
          <button onClick={recenterSelected} title="Recenter selected node" type="button">
            <Focus size={17} />
            Recenter
          </button>
          <button onClick={() => reactFlow.fitView({ padding: 0.2, duration: 500 })} title="Zoom to fit" type="button">
            <Maximize2 size={17} />
            Fit
          </button>
        </div>

        {breadcrumbs.length ? (
          <nav className="graph-breadcrumbs" aria-label="Graph breadcrumb">
            {breadcrumbs.map((node, index) => (
              <button
                className={node.id === selectedNodeId ? "active" : ""}
                key={node.id}
                onClick={() => {
                  focusNode(node, { nextMode: mode === "explore" ? "explore" : modeForClick(node, mode) });
                }}
                type="button"
              >
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                {node.label}
              </button>
            ))}
          </nav>
        ) : null}

        <div className="graph-filter-stack">
          <label className="toggle-row">
            <input checked={canonicalOnly} onChange={(event) => setCanonicalOnly(event.target.checked)} type="checkbox" />
            Canonical nodes
          </label>
          <label className="toggle-row">
            <input checked={showContextEdges} onChange={(event) => setShowContextEdges(event.target.checked)} type="checkbox" />
            Context edges
          </label>
        </div>

        <div className="graph-stats" aria-label="Visible graph summary">
          {Object.entries(visibleCounts).map(([kind, count]) => (
            <span className="graph-stat" key={kind}>
              {kindLabels[kind as GraphNodeKind]} {count}
            </span>
          ))}
        </div>
      </aside>

      <div className="graph-stage">
        <ReactFlow
          colorMode="light"
          edges={flowEdges}
          minZoom={0.18}
          maxZoom={1.9}
          nodes={flowNodes}
          nodesDraggable={false}
          nodeTypes={semanticNodeTypes}
          onNodeClick={(_, flowNode) => {
            const graphNode = flowNode.data.node;
            focusNode(graphNode, { nextMode: mode === "explore" ? "explore" : modeForClick(graphNode, mode) });
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
        {mode === "explore" && currentExploreExperience ? (
          <MapExplorePanel
            activeFilter={exploreFilter}
            expandedCounts={exploreVisibleCounts}
            experience={currentExploreExperience}
            nodesById={nodesById}
            onFilterChange={setExploreFilter}
            onFocusNode={focusExploreNode}
            onSeeMore={(sectionId) =>
              setExploreVisibleCounts((current) => {
                const section = currentExploreExperience.sections.find((entry) => entry.id === sectionId);
                if (!section) return current;
                const currentCount = current[sectionId] ?? section.defaultVisibleCount ?? Math.min(section.items.length, 6);
                return {
                  ...current,
                  [sectionId]: Math.min(currentCount + 5, section.items.length)
                };
              })
            }
            showFilters={Boolean(selectedNode)}
          />
        ) : selectedNode ? (
          <>
            <div className="detail-kicker">
              <span className="node-kind-dot" style={{ background: nodeColors[selectedNode.kind] }} />
              {kindLabels[selectedNode.kind]}
            </div>
            <h2>{selectedNode.label}</h2>
            {selectedNode.meta ? <p className="meta">{selectedNode.meta}</p> : null}
            {selectedNode.description ? <p>{selectedNode.description}</p> : null}
            {selectedNode.tags?.length ? (
              <div className="tag-list">
                {selectedNode.tags.slice(0, 5).map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <Link className="button" href={selectedNode.href}>
              Explore further
            </Link>
            <div className="related-stack">
              <h3>Connected nodes</h3>
              {relatedNodes.length ? (
                <div className="related-list">
                  {relatedNodes.slice(0, 10).map((node) => (
                    <button key={node.id} onClick={() => setSelectedNodeId(node.id)} type="button">
                      <span className="node-kind-dot" style={{ background: nodeColors[node.kind] }} />
                      <span>{node.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="meta">No direct connections in the current graph.</p>
              )}
            </div>
          </>
        ) : (
          <div className="empty">Select a node to see its details and nearby relationships.</div>
        )}
      </aside>
    </section>
  );
}

function SemanticNode({ data, selected }: NodeProps<SemanticFlowNode>) {
  const graphNode = data.node;
  const Icon = kindIcons[graphNode.kind] ?? CircleDot;
  return (
    <div
      className={[
        "semantic-node",
        `semantic-node-${graphNode.kind}`,
        selected || data.active ? "active" : "",
        data.matched ? "matched" : "",
        data.dimmed ? "dimmed" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--node-color": nodeColors[graphNode.kind] } as CSSProperties}
    >
      <Handle className="semantic-handle" isConnectable={false} position={Position.Top} type="target" />
      <div className="semantic-node-head">
        <span className="semantic-node-icon">
          <Icon size={15} />
        </span>
        <span>{kindLabels[graphNode.kind]}</span>
      </div>
      <strong>{graphNode.label}</strong>
      {graphNode.meta ? <small>{graphNode.meta}</small> : null}
      <Handle className="semantic-handle" isConnectable={false} position={Position.Bottom} type="source" />
    </div>
  );
}

function parseMode(mode: string | null): GraphMode {
  return modes.some((item) => item.id === mode) ? (mode as GraphMode) : "explore";
}

function findNodeByFocus(nodes: KnowledgeGraphNode[], focus: string) {
  if (!focus) return undefined;
  const normalized = focus.replace(/-/g, " ").toLowerCase();
  return nodes.find((node) => node.label.toLowerCase() === normalized || node.href.toLowerCase().includes(focus));
}

function searchableText(node: KnowledgeGraphNode) {
  return [node.label, node.href, node.description, node.meta, node.category, ...(node.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function searchNeighborhood(graph: SemanticGraph, matchingNodeIds: Set<string>) {
  const ids = new Set<string>();
  const hierarchyParents = hierarchyParentMap(graph.edges);
  matchingNodeIds.forEach((id) => {
    ids.add(id);
    addAncestors(ids, id, hierarchyParents);
  });
  graph.edges.forEach((edge) => {
    if (hierarchyEdgeKinds.has(edge.kind ?? "") && (matchingNodeIds.has(edge.source) || matchingNodeIds.has(edge.target))) {
      ids.add(edge.source);
      ids.add(edge.target);
    }
  });
  return ids;
}

function modeNeighborhood(
  graph: SemanticGraph,
  mode: GraphMode,
  selectedNodeId: string | undefined,
  showContextEdges: boolean
) {
  const ids = new Set<string>();
  const selected = selectedNodeId ? graph.nodes.find((node) => node.id === selectedNodeId) : undefined;
  const hierarchyParents = hierarchyParentMap(graph.edges);
  const hierarchyChildren = hierarchyChildrenMap(graph.edges);

  if (mode === "ingredient" || mode === "technique" || mode === "difficulty" || mode === "method") {
    return contextualModeNeighborhood(graph, mode, selected, hierarchyParents, hierarchyChildren);
  }

  graph.nodes.forEach((node) => {
    if (node.kind === "cuisine") ids.add(node.id);
  });

  if (!selected) {
    if (mode === "dish") {
      graph.nodes.forEach((node) => {
        if (node.kind === "category" && !node.parentCategoryId) ids.add(node.id);
      });
      graph.edges.forEach((edge) => {
        if (edge.kind === "cuisine_contains_category") {
          ids.add(edge.source);
          ids.add(edge.target);
        }
      });
    }
    return ids;
  }

  ids.add(selected.id);
  addAncestors(ids, selected.id, hierarchyParents);

  graph.edges.forEach((edge) => {
    if (!hierarchyEdgeKinds.has(edge.kind ?? "")) return;
    if (edge.source === selected.id) {
      ids.add(edge.target);
    }
  });

  if (showContextEdges && selected.kind === "family") {
    graph.edges.forEach((edge) => {
      if (contextEdgeKinds.has(edge.kind ?? "") && (edge.source === selected.id || edge.target === selected.id)) {
        ids.add(edge.source);
        ids.add(edge.target);
      }
    });
  }

  return ids;
}

function hierarchyParentMap(edges: KnowledgeGraphEdge[]) {
  const parents = new Map<string, string>();
  edges.forEach((edge) => {
    if (hierarchyEdgeKinds.has(edge.kind ?? "")) {
      parents.set(edge.target, edge.source);
    }
  });
  return parents;
}

function hierarchyChildrenMap(edges: KnowledgeGraphEdge[]) {
  const children = new Map<string, Set<string>>();
  edges.forEach((edge) => {
    if (!hierarchyEdgeKinds.has(edge.kind ?? "")) return;
    if (!children.has(edge.source)) children.set(edge.source, new Set());
    children.get(edge.source)!.add(edge.target);
  });
  return children;
}

function contextualModeNeighborhood(
  graph: SemanticGraph,
  mode: GraphMode,
  selected: KnowledgeGraphNode | undefined,
  hierarchyParents: Map<string, string>,
  hierarchyChildren: Map<string, Set<string>>
) {
  const ids = new Set<string>();
  const primaryKind = primaryKindByMode[mode];
  const categoryKind = mode === "ingredient" ? "ingredientCategory" : mode === "technique" ? "techniqueCategory" : undefined;
  const contextEdgeKind = contextEdgeKindByMode[mode];

  if (!selected) {
    graph.nodes.forEach((node) => {
      if (categoryKind ? node.kind === categoryKind && !node.parentTaxonomyId : node.kind === primaryKind) {
        ids.add(node.id);
      }
    });
    return ids;
  }

  ids.add(selected.id);
  addAncestors(ids, selected.id, hierarchyParents);

  if (categoryKind && (selected.kind === categoryKind || selected.kind === primaryKind)) {
    if (selected.kind === primaryKind) {
      return ids;
    }
    immediateHierarchyChildren(selected.id, hierarchyChildren).forEach((childId) => ids.add(childId));
    return ids;
  }

  const familyIds = familyIdsForContext(graph, selected, hierarchyParents, hierarchyChildren);

  if (!familyIds.size && selected.kind === primaryKind) {
    graph.edges.forEach((edge) => {
      if (edge.kind !== contextEdgeKind || edge.target !== selected.id) return;
      familyIds.add(edge.source);
    });
  }

  familyIds.forEach((familyId) => {
    ids.add(familyId);
    addAncestors(ids, familyId, hierarchyParents);
  });

  if (!contextEdgeKind) return ids;

  graph.edges.forEach((edge) => {
    if (edge.kind !== contextEdgeKind || !familyIds.has(edge.source)) return;
    ids.add(edge.source);
    ids.add(edge.target);
    addAncestors(ids, edge.source, hierarchyParents);
    addAncestors(ids, edge.target, hierarchyParents);
  });

  if (!familyIds.size) {
    graph.nodes.forEach((node) => {
      if (categoryKind ? node.kind === categoryKind && !node.parentTaxonomyId : node.kind === primaryKind) {
        ids.add(node.id);
      }
    });
  }

  return ids;
}

function familyIdsForContext(
  graph: SemanticGraph,
  selected: KnowledgeGraphNode,
  hierarchyParents: Map<string, string>,
  hierarchyChildren: Map<string, Set<string>>
) {
  const familyIds = new Set<string>();

  if (selected.kind === "family") {
    familyIds.add(selected.id);
    return familyIds;
  }

  if (selected.kind === "cuisine" || selected.kind === "category") {
    collectHierarchyDescendants(selected.id, hierarchyChildren).forEach((id) => {
      if (graph.nodes.find((node) => node.id === id)?.kind === "family") familyIds.add(id);
    });
    graph.edges.forEach((edge) => {
      if (selected.kind === "cuisine" && edge.kind === "family_associated_with_cuisine" && edge.source === selected.id) {
        familyIds.add(edge.target);
      }
      if (selected.kind === "category" && edge.kind === "family_associated_with_category" && edge.source === selected.id) {
        familyIds.add(edge.target);
      }
    });
    return familyIds;
  }

  if (selected.kind === "recipe" || selected.kind === "variation") {
    let current = hierarchyParents.get(selected.id);
    while (current) {
      const node = graph.nodes.find((candidate) => candidate.id === current);
      if (node?.kind === "family") {
        familyIds.add(current);
        return familyIds;
      }
      current = hierarchyParents.get(current);
    }
  }

  graph.edges.forEach((edge) => {
    if (!contextEdgeKinds.has(edge.kind ?? "")) return;
    if (edge.target === selected.id) familyIds.add(edge.source);
    if (edge.source === selected.id) familyIds.add(edge.target);
  });

  return familyIds;
}

function immediateHierarchyChildren(nodeId: string, children: Map<string, Set<string>>) {
  return children.get(nodeId) ?? new Set<string>();
}

function collectHierarchyDescendants(nodeId: string, children: Map<string, Set<string>>) {
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

function addAncestors(ids: Set<string>, nodeId: string, parents: Map<string, string>) {
  let current = parents.get(nodeId);
  while (current) {
    ids.add(current);
    current = parents.get(current);
  }
}

function buildBreadcrumbs(
  graph: SemanticGraph,
  selectedNodeId: string | undefined,
  nodesById: Map<string, KnowledgeGraphNode>
) {
  if (!selectedNodeId) return [];
  const parents = hierarchyParentMap(graph.edges);
  const nodes: KnowledgeGraphNode[] = [];
  let current: string | undefined = selectedNodeId;
  while (current) {
    const node = nodesById.get(current);
    if (node) nodes.unshift(node);
    current = parents.get(current);
  }
  return nodes;
}

function rankedSearchResults(nodes: KnowledgeGraphNode[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return nodes
    .map((node) => {
      const label = node.label.toLowerCase();
      const haystack = searchableText(node);
      let score = 0;
      if (label === needle) score += 100;
      if (label.startsWith(needle)) score += 60;
      if (label.includes(needle)) score += 35;
      if (haystack.includes(needle)) score += 15;
      if (node.kind === "family") score += 6;
      if (node.kind === "category") score += 5;
      if (node.kind === "cuisine") score += 4;
      return { node, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.node.label.localeCompare(b.node.label))
    .map((item) => item.node);
}

function modeForNode(node: KnowledgeGraphNode): GraphMode {
  if (node.kind === "ingredientCategory") return "ingredient";
  if (node.kind === "ingredient") return "ingredient";
  if (node.kind === "techniqueCategory") return "technique";
  if (node.kind === "technique") return "technique";
  if (node.kind === "difficulty") return "difficulty";
  if (node.kind === "method") return "method";
  return node.kind === "cuisine" ? "cuisine" : "dish";
}

function modeForClick(node: KnowledgeGraphNode, currentMode: GraphMode): GraphMode {
  if (node.kind === "cuisine") return "explore";
  if (contextualModes.includes(currentMode) && hierarchyScopeKinds.includes(node.kind)) {
    return currentMode;
  }
  return modeForNode(node);
}

function layoutNodes(
  nodes: KnowledgeGraphNode[],
  mode: GraphMode
): Array<{ id: string; position: { x: number; y: number }; data: KnowledgeGraphNode }> {
  const sortedNodes = [...nodes].sort((a, b) => kindSort(a.kind) - kindSort(b.kind) || a.label.localeCompare(b.label));
  if (mode === "cuisine" || mode === "dish") {
    const columns: GraphNodeKind[] = ["cuisine", "category", "family", "recipe", "variation"];
    const hierarchy = columns.flatMap((kind, column) => {
      const columnNodes = sortedNodes.filter((node) => node.kind === kind);
      return columnLayout(columnNodes, -610 + column * 305, kind === "cuisine" ? 150 : 128);
    });
    const context = sortedNodes.filter((node) => !columns.includes(node.kind));
    return [...hierarchy, ...columnLayout(context, 930, 116)];
  }

  if (mode === "ingredient" || mode === "technique") {
    const columns: GraphNodeKind[] =
      mode === "ingredient"
        ? ["cuisine", "category", "family", "ingredientCategory", "ingredient"]
        : ["cuisine", "category", "family", "techniqueCategory", "technique"];
    const taxonomyLayout = columns.flatMap((kind, column) => {
      const columnNodes = sortedNodes.filter((node) => node.kind === kind);
      return columnLayout(columnNodes, -610 + column * 305, kind === "cuisine" ? 150 : 120);
    });
    const remaining = sortedNodes.filter((node) => !columns.includes(node.kind));
    return [...taxonomyLayout, ...columnLayout(remaining, 930, 116)];
  }

  const primaryKind = primaryKindByMode[mode];
  const primary = sortedNodes.filter((node) => node.kind === primaryKind);
  const secondary = sortedNodes.filter((node) => node.kind !== primaryKind);
  const primaryLayout =
    primary.length > 28
      ? gridLayout(primary, 6, -650, -320, 225, 128)
      : ringLayout(primary, primary.length > 12 ? 430 : 300, 0, 0);

  return [...primaryLayout, ...ringLayout(secondary, secondary.length > 36 ? 790 : 620, 0, 24)];
}

function ringLayout(nodes: KnowledgeGraphNode[], radius: number, centerX: number, centerY: number) {
  if (!nodes.length) return [];
  return nodes.map((node, index) => {
    const angle = -Math.PI / 2 + (index / nodes.length) * Math.PI * 2;
    return {
      id: node.id,
      position: {
        x: Math.cos(angle) * radius + centerX,
        y: Math.sin(angle) * radius + centerY
      },
      data: node
    };
  });
}

function columnLayout(nodes: KnowledgeGraphNode[], x: number, yGap: number) {
  const startY = -((nodes.length - 1) * yGap) / 2;
  return nodes.map((node, index) => ({
    id: node.id,
    position: {
      x,
      y: startY + index * yGap
    },
    data: node
  }));
}

function gridLayout(
  nodes: KnowledgeGraphNode[],
  columns: number,
  startX: number,
  startY: number,
  xGap: number,
  yGap: number
) {
  return nodes.map((node, index) => ({
    id: node.id,
    position: {
      x: startX + (index % columns) * xGap,
      y: startY + Math.floor(index / columns) * yGap
    },
    data: node
  }));
}

function relatedNodeList(
  graph: SemanticGraph,
  selectedNodeId: string | undefined,
  nodesById: Map<string, KnowledgeGraphNode>
) {
  if (!selectedNodeId) return [];
  const scored = graph.edges
    .filter((edge) => edge.source === selectedNodeId || edge.target === selectedNodeId)
    .map((edge) => ({
      node: nodesById.get(edge.source === selectedNodeId ? edge.target : edge.source),
      hierarchy: hierarchyEdgeKinds.has(edge.kind ?? ""),
      strength: edge.strength ?? 0
    }))
    .filter((item): item is { node: KnowledgeGraphNode; hierarchy: boolean; strength: number } => Boolean(item.node))
    .sort((a, b) => Number(b.hierarchy) - Number(a.hierarchy) || b.strength - a.strength || a.node.label.localeCompare(b.node.label));

  const seen = new Set<string>();
  return scored
    .map((item) => item.node)
    .filter((node) => {
      if (seen.has(node.id)) return false;
      seen.add(node.id);
      return true;
    });
}

function summarizeKinds(nodes: KnowledgeGraphNode[]) {
  return nodes.reduce<Partial<Record<GraphNodeKind, number>>>((counts, node) => {
    counts[node.kind] = (counts[node.kind] ?? 0) + 1;
    return counts;
  }, {});
}

function kindSort(kind: GraphNodeKind) {
  return [
    "cuisine",
    "category",
    "family",
    "creator",
    "recipe",
    "variation",
    "ingredientCategory",
    "ingredient",
    "techniqueCategory",
    "technique",
    "method",
    "difficulty"
  ].indexOf(kind);
}

function edgeColor(edge: KnowledgeGraphEdge) {
  if (edge.kind === "cuisine_contains_category") return "#b56f48";
  if (edge.kind === "category_contains_category") return "#8d87b8";
  if (edge.kind === "category_contains_dish_family") return "#5b86a0";
  if (edge.kind === "dish_family_contains_recipe") return "#78906d";
  if (edge.kind === "recipe_has_variation") return "#c75f3e";
  if (edge.kind === "ingredient_category_contains_category") return "#6f9b83";
  if (edge.kind === "ingredient_category_contains_ingredient") return "#579179";
  if (edge.kind === "technique_category_contains_category") return "#c1954f";
  if (edge.kind === "technique_category_contains_technique") return "#b38338";
  if (edge.kind === "dish_uses_ingredient") return "#579179";
  if (edge.kind === "dish_uses_technique") return "#b38338";
  if (edge.kind === "dish_uses_method") return "#7470a2";
  if (edge.kind === "dish_has_difficulty") return "#9a6581";
  if (edge.kind === "dish_related_to_dish") return "#8b8378";
  if (edge.kind === "family_associated_with_category") return "#6888a0";
  if (edge.kind === "family_associated_with_cuisine") return "#ad664f";
  if (edge.kind === "family_created_by" || edge.kind === "cuisine_has_creator") return "#8b6a52";
  return "#968b80";
}

function nodePriority(node: KnowledgeGraphNode) {
  let score = 0;
  if (node.canonical !== false) score += 12;
  score += node.tags?.length ?? 0;
  score += node.meta ? 5 : 0;
  score += node.description ? 4 : 0;
  if (node.kind === "family") score += 8;
  if (node.kind === "recipe" || node.kind === "variation") score += 6;
  if (node.kind === "technique" || node.kind === "ingredient") score += 4;
  return score;
}

function topNodesForMode(
  mode: GraphMode,
  nodes: KnowledgeGraphNode[],
  nodeRankScores: Map<string, number>
) {
  const kind: GraphNodeKind =
    mode === "explore" || mode === "cuisine"
      ? "cuisine"
      : mode === "dish"
        ? "family"
      : mode === "ingredient"
        ? "ingredient"
        : mode === "technique"
          ? "technique"
          : mode === "difficulty"
            ? "difficulty"
            : "method";

  return nodes
    .filter((node) => node.kind === kind)
    .sort((left, right) => {
      const leftScore = nodeRankScores.get(left.id) ?? nodePriority(left);
      const rightScore = nodeRankScores.get(right.id) ?? nodePriority(right);
      return rightScore - leftScore || left.label.localeCompare(right.label);
    });
}

function launchpadLabel(mode: GraphMode) {
  if (mode === "explore" || mode === "cuisine") return "Top cuisines";
  if (mode === "dish") return "Top dishes";
  if (mode === "ingredient") return "Top ingredients";
  if (mode === "technique") return "Top techniques";
  if (mode === "difficulty") return "Top difficulty cues";
  return "Top methods";
}

function launchpadChipKind(mode: GraphMode): "cuisine" | "dish" | "ingredient" | "technique" | "method" {
  if (mode === "explore" || mode === "cuisine") return "cuisine";
  if (mode === "dish") return "dish";
  if (mode === "ingredient") return "ingredient";
  if (mode === "technique") return "technique";
  return "method";
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
