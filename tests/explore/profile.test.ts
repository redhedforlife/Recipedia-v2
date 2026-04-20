import test from "node:test";
import assert from "node:assert/strict";
import { buildSemanticGraph, getData } from "@/lib/data";
import { buildExploreProfile } from "@/lib/explore/buildExploreProfile";

test("buildExploreProfile returns a cuisine profile with multiple dimensions", async () => {
  const data = await getData();
  const graph = buildSemanticGraph(data);
  const cuisine = graph.nodes.find((node) => node.kind === "cuisine");

  assert.ok(cuisine, "expected at least one cuisine node");
  const profile = buildExploreProfile(cuisine!, graph);

  assert.equal(profile.nodeId, cuisine!.id);
  assert.equal(profile.nodeType, "cuisine");
  assert.ok(profile.sections.length > 0);
  assert.ok(profile.sections.some((section) => section.id === "families"));
  assert.ok(profile.sections.some((section) => section.id === "ingredients" || section.id === "techniques"));
});

test("buildExploreProfile returns a family profile", async () => {
  const data = await getData();
  const graph = buildSemanticGraph(data);
  const family = graph.nodes.find((node) => node.kind === "family");

  assert.ok(family, "expected at least one family node");
  const profile = buildExploreProfile(family!, graph);

  assert.equal(profile.nodeType, "family");
  assert.ok(profile.sections.length > 0);
});

test("empty profile sections do not crash rendering contract", () => {
  const graph = {
    nodes: [
      {
        id: "cuisine-demo",
        label: "Demo Cuisine",
        kind: "cuisine" as const,
        href: "/graph?focus=demo"
      }
    ],
    edges: []
  };

  const profile = buildExploreProfile(graph.nodes[0], graph);
  assert.ok(profile.sections.every((section) => Array.isArray(section.items)));
});
