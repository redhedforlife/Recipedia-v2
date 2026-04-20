import { scoreNode } from "@/lib/ranking/scoreNode";
import type { SemanticGraph } from "@/lib/graph/types";
import type { ExploreEntityType, ExploreItem, ExploreProfile, ExploreSection, GraphNodeKind, KnowledgeGraphNode } from "@/lib/types";

const HIERARCHY_EDGE_KINDS = new Set([
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

const SECTION_LIMIT = 18;

export function buildExploreProfile(selectedNode: KnowledgeGraphNode, graph: SemanticGraph): ExploreProfile {
  if (selectedNode.kind === "cuisine") {
    return buildCuisineExploreProfile(selectedNode, graph);
  }
  if (selectedNode.kind === "family") {
    return buildFamilyExploreProfile(selectedNode, graph);
  }
  if (selectedNode.kind === "ingredient") {
    return buildIngredientExploreProfile(selectedNode, graph);
  }
  if (selectedNode.kind === "technique") {
    return buildTechniqueExploreProfile(selectedNode, graph);
  }

  return buildGenericExploreProfile(selectedNode, graph);
}

export function buildCuisineExploreProfile(selectedNode: KnowledgeGraphNode, graph: SemanticGraph): ExploreProfile {
  const ranked = rankMap(graph);
  const categories = rankedNeighborsByKind(graph, selectedNode.id, ranked, "category", [
    "cuisine_contains_category",
    "family_associated_with_cuisine",
    "category_contains_dish_family"
  ]);
  const families = rankedNeighborsByKind(graph, selectedNode.id, ranked, "family", [
    "category_contains_dish_family",
    "family_associated_with_cuisine"
  ]);
  const techniques = contextNodesFromFamilies(graph, families.map((item) => item.nodeId), "dish_uses_technique", "technique", ranked);
  const ingredients = contextNodesFromFamilies(graph, families.map((item) => item.nodeId), "dish_uses_ingredient", "ingredient", ranked);
  const creators = contextNodesFromFamilies(graph, families.map((item) => item.nodeId), "family_created_by", "creator", ranked);
  const dishes = contextNodesFromFamilies(graph, families.map((item) => item.nodeId), "dish_family_contains_recipe", "dish", ranked, ["recipe", "variation"]);

  const sections: ExploreSection[] = [
    section("categories", "Top categories", "category", "Core category branches connected to this cuisine.", categories, 6),
    section("families", "Top dish families", "family", "Family-level patterns that define this cuisine.", families, 6),
    section("techniques", "Top techniques", "technique", "Techniques linked through the strongest families.", techniques, 5),
    section("creators", "Top chefs / creators", "creator", "Creators connected in this neighborhood of the graph.", creators, 4),
    section("ingredients", "Top ingredients", "ingredient", "Ingredients repeatedly associated with this cuisine cluster.", ingredients, 6),
    section("dishes", "Notable dishes", "dish", "Representative recipe leaves linked to this cuisine.", dishes, 6)
  ].filter((entry) => entry.items.length);

  return baseProfile(selectedNode, sections);
}

export function buildFamilyExploreProfile(selectedNode: KnowledgeGraphNode, graph: SemanticGraph): ExploreProfile {
  const ranked = rankMap(graph);
  const dishes = rankedNeighborsByKind(graph, selectedNode.id, ranked, "dish", ["dish_family_contains_recipe", "recipe_has_variation"], ["recipe", "variation"]);
  const techniques = rankedNeighborsByKind(graph, selectedNode.id, ranked, "technique", ["dish_uses_technique"]);
  const ingredients = rankedNeighborsByKind(graph, selectedNode.id, ranked, "ingredient", ["dish_uses_ingredient"]);
  const methods = rankedNeighborsByKind(graph, selectedNode.id, ranked, "method", ["dish_uses_method"]);
  const categories = rankedNeighborsByKind(graph, selectedNode.id, ranked, "category", ["category_contains_dish_family", "family_associated_with_category"]);

  const sections: ExploreSection[] = [
    section("dishes", "Notable dishes", "dish", "Recipe and variation leaves in this family.", dishes, 6),
    section("techniques", "Top techniques", "technique", "Technique links attached to this family.", techniques, 5),
    section("ingredients", "Top ingredients", "ingredient", "Ingredients with strongest family ties.", ingredients, 6),
    section("methods", "Top methods", "method", "Primary and supporting methods in this family.", methods, 4),
    section("categories", "Top categories", "category", "Category paths that reach this family.", categories, 5)
  ].filter((entry) => entry.items.length);

  return baseProfile(selectedNode, sections);
}

export function buildIngredientExploreProfile(selectedNode: KnowledgeGraphNode, graph: SemanticGraph): ExploreProfile {
  const ranked = rankMap(graph);
  const families = rankedNeighborsByKind(graph, selectedNode.id, ranked, "family", ["dish_uses_ingredient"]);
  const cuisines = contextNodesFromFamilies(graph, families.map((item) => item.nodeId), "family_associated_with_cuisine", "cuisine", ranked, ["cuisine"]);
  const techniques = contextNodesFromFamilies(graph, families.map((item) => item.nodeId), "dish_uses_technique", "technique", ranked);
  const dishes = contextNodesFromFamilies(graph, families.map((item) => item.nodeId), "dish_family_contains_recipe", "dish", ranked, ["recipe", "variation"]);

  const sections: ExploreSection[] = [
    section("families", "Top dish families", "family", "Families where this ingredient is most central.", families, 6),
    section("techniques", "Top techniques", "technique", "Techniques often paired with this ingredient.", techniques, 5),
    section("dishes", "Notable dishes", "dish", "Recipe leaves attached to matching families.", dishes, 6),
    section("categories", "Top cuisines", "cuisine", "Cuisine paths connected through matching families.", cuisines, 5)
  ].filter((entry) => entry.items.length);

  return baseProfile(selectedNode, sections);
}

export function buildTechniqueExploreProfile(selectedNode: KnowledgeGraphNode, graph: SemanticGraph): ExploreProfile {
  const ranked = rankMap(graph);
  const families = rankedNeighborsByKind(graph, selectedNode.id, ranked, "family", ["dish_uses_technique"]);
  const ingredients = contextNodesFromFamilies(graph, families.map((item) => item.nodeId), "dish_uses_ingredient", "ingredient", ranked);
  const dishes = contextNodesFromFamilies(graph, families.map((item) => item.nodeId), "dish_family_contains_recipe", "dish", ranked, ["recipe", "variation"]);
  const cuisines = contextNodesFromFamilies(graph, families.map((item) => item.nodeId), "family_associated_with_cuisine", "cuisine", ranked, ["cuisine"]);

  const sections: ExploreSection[] = [
    section("families", "Top dish families", "family", "Families where this technique is most prominent.", families, 6),
    section("ingredients", "Top ingredients", "ingredient", "Ingredients commonly paired with this technique.", ingredients, 6),
    section("dishes", "Notable dishes", "dish", "Recipe leaves linked through matching families.", dishes, 6),
    section("categories", "Top cuisines", "cuisine", "Cuisine paths connected to this technique.", cuisines, 5)
  ].filter((entry) => entry.items.length);

  return baseProfile(selectedNode, sections);
}

function buildGenericExploreProfile(selectedNode: KnowledgeGraphNode, graph: SemanticGraph): ExploreProfile {
  const ranked = rankMap(graph);
  const related = collectNeighborNodes(graph, selectedNode.id)
    .map((node) => toExploreItem(node, ranked.get(node.id)?.rankScore ?? 0))
    .sort((left, right) => right.rankScore - left.rankScore || left.label.localeCompare(right.label))
    .slice(0, SECTION_LIMIT);

  const sections = [section("families", "Top connections", "family", "Most connected nearby graph nodes.", related, 8)].filter(
    (entry) => entry.items.length
  );

  return baseProfile(selectedNode, sections);
}

function baseProfile(selectedNode: KnowledgeGraphNode, sections: ExploreSection[]): ExploreProfile {
  const stats = sections.map((entry) => ({ label: entry.title, value: String(entry.items.length) })).slice(0, 3);
  return {
    nodeId: selectedNode.id,
    nodeType: selectedNode.kind,
    title: selectedNode.label,
    eyebrow: `${selectedNode.kind} in Explore`,
    description: selectedNode.description ?? `Explore ${selectedNode.label} through graph-ranked relationships.`,
    highlights: selectedNode.tags?.slice(0, 4) ?? [],
    stats,
    sections,
    graphHref: selectedNode.href
  };
}

function section(
  id: ExploreSection["id"],
  title: string,
  entityType: ExploreSection["entityType"],
  description: string,
  items: ExploreItem[],
  defaultVisibleCount: number
): ExploreSection {
  return {
    id,
    title,
    entityType,
    description,
    items: items.slice(0, SECTION_LIMIT),
    defaultVisibleCount,
    showMoreEnabled: items.length > defaultVisibleCount
  };
}

function rankMap(graph: SemanticGraph) {
  const degreeByNode = new Map<string, number>();
  graph.nodes.forEach((node) => degreeByNode.set(node.id, 0));
  graph.edges.forEach((edge) => {
    degreeByNode.set(edge.source, (degreeByNode.get(edge.source) ?? 0) + 1);
    degreeByNode.set(edge.target, (degreeByNode.get(edge.target) ?? 0) + 1);
  });
  const maxDegree = Math.max(...Array.from(degreeByNode.values()), 1);

  const ranks = new Map<string, ReturnType<typeof scoreNode>>();
  graph.nodes.forEach((node) => {
    ranks.set(
      node.id,
      scoreNode({
        node,
        degree: degreeByNode.get(node.id) ?? 0,
        maxDegree,
        hasDescription: Boolean(node.description),
        hasMeta: Boolean(node.meta),
        tagCount: node.tags?.length ?? 0,
        canonical: node.canonical !== false,
        kind: node.kind,
        manualBoost: 0
      })
    );
  });

  return ranks;
}

function rankedNeighborsByKind(
  graph: SemanticGraph,
  nodeId: string,
  ranked: Map<string, ReturnType<typeof scoreNode>>,
  entityType: ExploreEntityType,
  edgeKinds: string[],
  allowedKinds?: GraphNodeKind[]
) {
  const edgeKindSet = new Set(edgeKinds);
  const ids = new Set<string>();

  graph.edges.forEach((edge) => {
    if (!edgeKindSet.has(edge.kind ?? "")) return;
    if (edge.source === nodeId) ids.add(edge.target);
    if (edge.target === nodeId) ids.add(edge.source);
  });

  return Array.from(ids)
    .map((id) => graph.nodes.find((node) => node.id === id))
    .filter((node): node is KnowledgeGraphNode => Boolean(node))
    .filter((node) => !allowedKinds || allowedKinds.includes(node.kind))
    .map((node) => toExploreItem(node, ranked.get(node.id)?.rankScore ?? 0, entityType))
    .sort((left, right) => right.rankScore - left.rankScore || left.label.localeCompare(right.label))
    .slice(0, SECTION_LIMIT);
}

function contextNodesFromFamilies(
  graph: SemanticGraph,
  familyIds: string[],
  edgeKind: string,
  entityType: ExploreEntityType,
  ranked: Map<string, ReturnType<typeof scoreNode>>,
  allowedKinds?: GraphNodeKind[]
) {
  const familyIdSet = new Set(familyIds);
  const ids = new Set<string>();

  graph.edges.forEach((edge) => {
    if (edge.kind !== edgeKind || !familyIdSet.has(edge.source)) return;
    ids.add(edge.target);
  });

  return Array.from(ids)
    .map((id) => graph.nodes.find((node) => node.id === id))
    .filter((node): node is KnowledgeGraphNode => Boolean(node))
    .filter((node) => !allowedKinds || allowedKinds.includes(node.kind))
    .map((node) => toExploreItem(node, ranked.get(node.id)?.rankScore ?? 0, entityType))
    .sort((left, right) => right.rankScore - left.rankScore || left.label.localeCompare(right.label))
    .slice(0, SECTION_LIMIT);
}

function collectNeighborNodes(graph: SemanticGraph, nodeId: string) {
  const ids = new Set<string>();
  graph.edges.forEach((edge) => {
    if (edge.source === nodeId) ids.add(edge.target);
    if (edge.target === nodeId) ids.add(edge.source);
  });
  return Array.from(ids)
    .map((id) => graph.nodes.find((node) => node.id === id))
    .filter((node): node is KnowledgeGraphNode => Boolean(node));
}

function toExploreItem(node: KnowledgeGraphNode, rankScore: number, entityType?: ExploreEntityType): ExploreItem {
  const resolvedType = entityType ?? nodeKindToExploreEntity(node.kind);
  return {
    nodeId: node.id,
    label: node.label,
    entityType: resolvedType,
    rankScore,
    href: node.href,
    description: node.description ?? node.meta,
    eyebrow: node.kind,
    meta: node.meta,
    tags: node.tags?.slice(0, 3)
  };
}

function nodeKindToExploreEntity(kind: GraphNodeKind): ExploreEntityType {
  if (kind === "creator") return "creator";
  if (kind === "category") return "category";
  if (kind === "family") return "family";
  if (kind === "recipe" || kind === "variation") return "dish";
  if (kind === "ingredient") return "ingredient";
  if (kind === "technique") return "technique";
  if (kind === "method") return "method";
  if (kind === "cuisine") return "cuisine";
  return "recipe";
}

export function hierarchyParentMap(edges: SemanticGraph["edges"]) {
  const parents = new Map<string, Set<string>>();
  edges.forEach((edge) => {
    if (!HIERARCHY_EDGE_KINDS.has(edge.kind ?? "")) return;
    if (!parents.has(edge.target)) parents.set(edge.target, new Set());
    parents.get(edge.target)!.add(edge.source);
  });
  return parents;
}
