import test from "node:test";
import assert from "node:assert/strict";
import { buildSemanticGraph, getData } from "@/lib/data";
import { scoreNode } from "@/lib/ranking/scoreNode";

test("rank score formula is deterministic for a fixed node set", async () => {
  const data = await getData();
  const graph = buildSemanticGraph(data);

  const degree = new Map<string, number>();
  graph.nodes.forEach((node) => degree.set(node.id, 0));
  graph.edges.forEach((edge) => {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  });
  const maxDegree = Math.max(...Array.from(degree.values()), 1);

  const first = graph.nodes.map((node) => ({
    id: node.id,
    rank: scoreNode({
      node,
      degree: degree.get(node.id) ?? 0,
      maxDegree,
      hasDescription: Boolean(node.description),
      hasMeta: Boolean(node.meta),
      tagCount: node.tags?.length ?? 0,
      canonical: node.canonical !== false,
      kind: node.kind,
      manualBoost: 0
    }).rankScore
  }));

  const second = graph.nodes.map((node) => ({
    id: node.id,
    rank: scoreNode({
      node,
      degree: degree.get(node.id) ?? 0,
      maxDegree,
      hasDescription: Boolean(node.description),
      hasMeta: Boolean(node.meta),
      tagCount: node.tags?.length ?? 0,
      canonical: node.canonical !== false,
      kind: node.kind,
      manualBoost: 0
    }).rankScore
  }));

  assert.deepEqual(first, second);
});
