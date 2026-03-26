export type Point = { x: number; y: number };

export type Tool = "select" | "boundary" | "hole" | "eraser";

export type DraftType = "outer" | "hole";

export type ElementType = "T3" | "Q4";

export type SelectedPoint =
  | { type: "outer"; index: number }
  | { type: "hole"; holeIndex: number; index: number }
  | null;

export type MeshStats = {
  nodes: number;
  edges: number;
  tris: number;
  dof: number;
  executionTime: number;
  emptyCircumcircleValid: boolean;
};

export type ErrorBar = {
  size: string;
  count: number;
};
