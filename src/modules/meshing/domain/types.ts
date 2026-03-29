import type { Edge, Point } from "../../geometry/domain/types";

export type ElementType = "T3" | "Q4";

export type MeshEdge = Edge;

export type MeshPreview = {
  boundarySegments: number;
  edges: MeshEdge[];
  elementType: ElementType;
  executionTime: number;
  nodes: Point[];
  tris: number;
};
