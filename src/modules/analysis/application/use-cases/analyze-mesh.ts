import type { MeshPreview } from "../../../meshing/domain/types";
import { buildMeshSummary } from "../../domain/services/build-mesh-summary";
import { calculateQualityDistribution } from "../../domain/services/calculate-quality-distribution";
import type { MeshAnalysis } from "../../domain/types";

export const EMPTY_MESH_ANALYSIS: MeshAnalysis = {
  errorData: calculateQualityDistribution(0),
  stats: {
    averageArea: 0,
    badElements: 0,
    boundaryEdges: 0,
    dof: 0,
    edges: 0,
    elements: 0,
    emptyCircumcircleValid: false,
    executionTime: 0,
    interiorEdges: 0,
    maxRatio: 0,
    minAngle: 0,
    nodes: 0,
    quads: 0,
    qualityDistribution: [
      { count: 0, name: "Excellent", value: 0 },
      { count: 0, name: "Good", value: 0 },
      { count: 0, name: "Fair", value: 0 },
      { count: 0, name: "Bad", value: 0 },
    ],
    tris: 0,
  },
};

export function analyzeMesh(preview: MeshPreview): MeshAnalysis {
  return {
    errorData: calculateQualityDistribution(preview.elements),
    stats: buildMeshSummary(preview),
  };
}
