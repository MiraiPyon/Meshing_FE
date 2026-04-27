import type { MeshPreview } from "../../../meshing/domain/types";
import { buildMeshSummary } from "../../domain/services/build-mesh-summary";
import { calculateQualityDistribution } from "../../domain/services/calculate-quality-distribution";
import type { MeshAnalysis } from "../../domain/types";

function backendDistribution(preview: MeshPreview) {
  const bins = preview.dashboard?.element_size_distribution;
  if (!Array.isArray(bins)) {
    return null;
  }

  return bins
    .map((bin) => {
      if (
        typeof bin !== "object" ||
        bin === null ||
        !("count" in bin) ||
        !("left" in bin) ||
        !("right" in bin)
      ) {
        return null;
      }
      const count = Number((bin as { count: unknown }).count);
      const left = Number((bin as { left: unknown }).left);
      const right = Number((bin as { right: unknown }).right);
      if (!Number.isFinite(count) || !Number.isFinite(left) || !Number.isFinite(right)) {
        return null;
      }
      return {
        count,
        size: left === right ? left.toFixed(3) : `${left.toFixed(3)}-${right.toFixed(3)}`,
      };
    })
    .filter((item): item is { count: number; size: string } => item !== null);
}

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
  const summary = buildMeshSummary(preview);
  const distribution = backendDistribution(preview);

  return {
    errorData:
      distribution && distribution.length > 0
        ? distribution
        : calculateQualityDistribution(
            Math.max(preview.nodes.length, preview.boundarySegments),
          ),
    stats: summary,
  };
}
