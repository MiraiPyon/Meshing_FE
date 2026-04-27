import type { MeshPreview } from "../../../meshing/domain/types";
import type { MeshStats } from "../types";
import { calculateDegreesOfFreedom } from "./calculate-dof";

export function buildMeshSummary(preview: MeshPreview): MeshStats {
  const backendEmptyCircumcircle = preview.dashboard?.empty_circumcircle;

  return {
    dof:
      typeof preview.dofTotal === "number"
        ? preview.dofTotal
        : calculateDegreesOfFreedom(preview.elementType, preview.nodes.length),
    edges: preview.edges.length + preview.boundarySegments,
    emptyCircumcircleValid:
      typeof backendEmptyCircumcircle === "boolean"
        ? backendEmptyCircumcircle
        : preview.nodes.length > 0,
    executionTime: preview.executionTime,
    nodes: preview.nodes.length,
    tris: preview.tris,
  };
}
