import type { MeshPreview } from "../../../meshing/domain/types";
import { buildMeshSummary } from "../../domain/services/build-mesh-summary";
import { calculateQualityDistribution } from "../../domain/services/calculate-quality-distribution";
import type { MeshAnalysis } from "../../domain/types";

export const EMPTY_MESH_ANALYSIS: MeshAnalysis = {
  errorData: calculateQualityDistribution(0),
  stats: {
    dof: 0,
    edges: 0,
    emptyCircumcircleValid: false,
    executionTime: 0,
    nodes: 0,
    tris: 0,
  },
};

export function analyzeMesh(preview: MeshPreview): MeshAnalysis {
  return {
    errorData: calculateQualityDistribution(
      Math.max(preview.nodes.length, preview.boundarySegments),
    ),
    stats: buildMeshSummary(preview),
  };
}
