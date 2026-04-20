import type { KnowledgeGraphEdge, KnowledgeGraphNode } from "@/lib/types";

export type SemanticGraph = {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
};
