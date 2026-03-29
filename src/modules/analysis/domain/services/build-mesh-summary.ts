import type { MeshPreview } from "../../../meshing/domain/types";
import type { MeshStats } from "../types";
import { calculateDegreesOfFreedom } from "./calculate-dof";

export function buildMeshSummary(preview: MeshPreview): MeshStats {
  return {
    dof: calculateDegreesOfFreedom(preview.elementType, preview.nodes.length),
    edges: preview.edges.length + preview.boundarySegments,
    emptyCircumcircleValid: preview.nodes.length > 0,
    executionTime: preview.executionTime,
    nodes: preview.nodes.length,
    tris: preview.tris,
  };
}
