"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node
} from "@xyflow/react";
import type { KnowledgeGraphEdge, KnowledgeGraphNode } from "@/lib/types";

const colors: Record<KnowledgeGraphNode["kind"], string> = {
  cuisine: "#9f3c2f",
  category: "#5c597f",
  family: "#812918",
  dish: "#812918",
  creator: "#7b5a42",
  recipe: "#335d7e",
  variation: "#b43d27",
  ingredientCategory: "#4f7f6c",
  ingredient: "#376c55",
  techniqueCategory: "#ad7c2a",
  technique: "#9a6a19",
  method: "#5c597f",
  difficulty: "#784b66"
};

export function KnowledgeGraph({
  nodes,
  edges
}: {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}) {
  const flowNodes = useMemo<Node[]>(() => {
    const columns = new Map<string, number>();
    return nodes.map((node, index) => {
      const column = node.kind;
      const count = columns.get(column) ?? 0;
      columns.set(column, count + 1);
      const xByKind = {
        cuisine: -290,
        category: -145,
        family: 0,
        dish: 80,
        creator: 145,
        recipe: 290,
        variation: 580,
        ingredientCategory: 870,
        ingredient: 1080,
        techniqueCategory: 870,
        technique: 1080,
        method: 1160,
        difficulty: 1160
      } satisfies Record<KnowledgeGraphNode["kind"], number>;
      const y =
        count * 112 +
        (node.kind === "technique" || node.kind === "ingredient" ? 56 : 0);
      return {
        id: node.id,
        position: { x: xByKind[node.kind], y: y || index * 82 },
        data: {
          label: (
            <Link href={node.href} style={{ color: "inherit", fontWeight: 750 }}>
              {node.label}
            </Link>
          )
        },
        style: {
          border: `2px solid ${colors[node.kind]}`,
          borderRadius: 8,
          color: colors[node.kind],
          background: "#fffdf8",
          width: 210,
          padding: 10,
          fontSize: 13,
          boxShadow: "0 10px 30px rgba(79, 48, 25, 0.1)"
        }
      };
    });
  }, [nodes]);

  const flowEdges = useMemo<Edge[]>(
    () =>
      edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: edge.label === "variation",
        style: { stroke: edge.label === "variation" ? "#b43d27" : "#9b8f80" }
      })),
    [edges]
  );

  return (
    <div className="graph-frame">
      <ReactFlow nodes={flowNodes} edges={flowEdges} fitView proOptions={{ hideAttribution: true }}>
        <Background />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </div>
  );
}
