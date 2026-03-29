export type ErrorBar = {
  count: number;
  size: string;
};

export type MeshStats = {
  dof: number;
  edges: number;
  emptyCircumcircleValid: boolean;
  executionTime: number;
  nodes: number;
  tris: number;
};

export type MeshAnalysis = {
  errorData: ErrorBar[];
  stats: MeshStats;
};
