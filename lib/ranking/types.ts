import type { GraphNodeKind, KnowledgeGraphNode } from "@/lib/types";

export type RankBreakdown = {
  popularityScore: number;
  graphStrengthScore: number;
  manualBoost: number;
  rankScore: number;
};

export type RankContext = {
  node: KnowledgeGraphNode;
  degree: number;
  maxDegree: number;
  hasDescription: boolean;
  hasMeta: boolean;
  tagCount: number;
  canonical: boolean;
  manualBoost?: number;
  kind: GraphNodeKind;
};
