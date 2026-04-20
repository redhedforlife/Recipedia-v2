import test from "node:test";
import assert from "node:assert/strict";
import { buildSemanticGraph, getData } from "@/lib/data";

test("graph has unique node and edge ids", async () => {
  const data = await getData();
  const graph = buildSemanticGraph(data);

  const nodeIds = graph.nodes.map((node) => node.id);
  const edgeIds = graph.edges.map((edge) => edge.id);

  assert.equal(new Set(nodeIds).size, nodeIds.length, "duplicate node ids found");
  assert.equal(new Set(edgeIds).size, edgeIds.length, "duplicate edge ids found");
});

test("all edges reference valid nodes", async () => {
  const data = await getData();
  const graph = buildSemanticGraph(data);
  const nodeIds = new Set(graph.nodes.map((node) => node.id));

  for (const edge of graph.edges) {
    assert.ok(nodeIds.has(edge.source), `missing source node: ${edge.source}`);
    assert.ok(nodeIds.has(edge.target), `missing target node: ${edge.target}`);
  }
});

test("family nodes are not orphaned", async () => {
  const data = await getData();
  const graph = buildSemanticGraph(data);
  const familyIds = graph.nodes.filter((node) => node.kind === "family").map((node) => node.id);
  const connectedFamilyIds = new Set<string>();

  graph.edges.forEach((edge) => {
    if (familyIds.includes(edge.source)) connectedFamilyIds.add(edge.source);
    if (familyIds.includes(edge.target)) connectedFamilyIds.add(edge.target);
  });

  assert.equal(connectedFamilyIds.size, familyIds.length, "some family nodes are fully disconnected");
});

test("family ingredient and technique relationships are represented in edges", async () => {
  const data = await getData();
  const graph = buildSemanticGraph(data);

  const ingredientKeys = new Set(data.dishFamilyIngredients.map((item) => `${item.dishFamilyId}->ingredient-${item.ingredientId}`));
  const techniqueKeys = new Set(data.dishFamilyTechniques.map((item) => `${item.dishFamilyId}->technique-${item.techniqueId}`));

  const graphIngredientKeys = new Set(
    graph.edges.filter((edge) => edge.kind === "dish_uses_ingredient").map((edge) => `${edge.source}->${edge.target}`)
  );
  const graphTechniqueKeys = new Set(
    graph.edges.filter((edge) => edge.kind === "dish_uses_technique").map((edge) => `${edge.source}->${edge.target}`)
  );

  for (const key of ingredientKeys) {
    assert.ok(graphIngredientKeys.has(key), `missing ingredient edge ${key}`);
  }
  for (const key of techniqueKeys) {
    assert.ok(graphTechniqueKeys.has(key), `missing technique edge ${key}`);
  }
});

test("category-family and cuisine-family relationships point to valid kinds", async () => {
  const data = await getData();
  const graph = buildSemanticGraph(data);
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));

  const categoryEdges = graph.edges.filter((edge) =>
    ["category_contains_dish_family", "family_associated_with_category"].includes(edge.kind ?? "")
  );
  const cuisineEdges = graph.edges.filter((edge) => edge.kind === "family_associated_with_cuisine");

  for (const edge of categoryEdges) {
    assert.equal(nodeById.get(edge.source)?.kind, "category", `invalid category source kind for ${edge.id}`);
    assert.equal(nodeById.get(edge.target)?.kind, "family", `invalid family target kind for ${edge.id}`);
  }

  for (const edge of cuisineEdges) {
    assert.equal(nodeById.get(edge.source)?.kind, "cuisine", `invalid cuisine source kind for ${edge.id}`);
    assert.equal(nodeById.get(edge.target)?.kind, "family", `invalid family target kind for ${edge.id}`);
  }
});
