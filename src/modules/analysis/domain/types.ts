export type ErrorBar = {
  count: number;
  size: string;
};

export type QualitySlice = {
  count: number;
  name: string;
  value: number;
};

export type MeshStats = {
  averageArea: number;
  badElements: number;
  boundaryEdges: number;
  dof: number;
  edges: number;
  elements: number;
  emptyCircumcircleValid: boolean;
  executionTime: number;
  interiorEdges: number;
  maxRatio: number;
  minAngle: number;
  nodes: number;
  quads: number;
  qualityDistribution: QualitySlice[];
  tris: number;
};

export type MeshAnalysis = {
  errorData: ErrorBar[];
  stats: MeshStats;
};
