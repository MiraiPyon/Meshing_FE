import type { Edge, Point } from "../../geometry/domain/types";

export type ElementType = "T3" | "Q4";

export type MeshQualityStatus = "excellent" | "good" | "fair" | "bad";

export type MeshNode = Point & {
  boundary?: boolean;
  id: number;
};

export type MeshEdge = Edge;

export type MeshEdgeRecord = {
  adjacentElementIds: number[];
  boundary: boolean;
  id: number;
  length: number;
  nodeIds: [number, number];
};

export type MeshElement = {
  area: number;
  centroid: Point;
  circumradiusToShortestEdge: number;
  id: number;
  minAngle: number;
  nodeIds: number[];
  status: MeshQualityStatus;
  type: ElementType;
};

export type MeshPreview = {
  boundarySegments: number;
  edges: MeshEdge[];
  edgeRecords: MeshEdgeRecord[];
  elementType: ElementType;
  elements: MeshElement[];
  executionTime: number;
  nodes: MeshNode[];
  quads: number;
  tris: number;
};
