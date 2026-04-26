import type { Point } from "../modules/geometry/domain/types";
import type { ElementType, MeshPreview } from "../modules/meshing/domain/types";
import { apiClient } from "../services/apiClient";
import { getAccessToken } from "../infrastructure/auth/local-storage-auth";
import { meshStore } from "../store/meshStore";

/** BE MeshResponse shape (partial — only what we use). */
interface BEMeshResponse {
  id: string;
  geometry_id: string;
  mesh_type: string;
  name: string;
  node_count: number;
  element_count: number;
  nodes: number[][];       // [[x, y], ...]
  elements: number[][];    // [[n1, n2, n3], ...] — 1-based
  bounds: { x_min: number; x_max: number; y_min: number; y_max: number };
  created_at: string;
}

/** Convert BE mesh response → FE MeshPreview (for canvas + stats). */
export function beMeshToPreview(
  beMesh: BEMeshResponse,
  elementType: ElementType,
  startMs: number,
): MeshPreview {
  const nodes: Point[] = beMesh.nodes.map(([x, y]) => ({ x, y }));

  // Build edges from element connectivity (deduplicated)
  const edgeSet = new Set<string>();
  const edges: [Point, Point][] = [];

  for (const elem of beMesh.elements) {
    const n = elem.length;
    for (let i = 0; i < n; i++) {
      const aIdx = elem[i] - 1;          // 1-based → 0-based
      const bIdx = elem[(i + 1) % n] - 1;
      if (aIdx < 0 || bIdx < 0 || aIdx >= nodes.length || bIdx >= nodes.length) continue;
      const key =
        Math.min(aIdx, bIdx) + "-" + Math.max(aIdx, bIdx);
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push([nodes[aIdx], nodes[bIdx]]);
      }
    }
  }

  return {
    boundarySegments: beMesh.element_count,
    edges,
    elementType,
    executionTime: Date.now() - startMs,
    nodes,
    tris: beMesh.element_count,
  };
}

export type BackendMeshResult = {
  meshId: string;
  geometryId: string;
  preview: MeshPreview;
  nodeCount: number;
  elementCount: number;
};

/**
 * Hook for all BE mesh operations.
 * Returns helpers to generate mesh from sketch and export mesh.
 */
export function useMeshAPI() {
  const isLoggedIn = !!getAccessToken();

  async function generateMeshFromSketch(
    outerLoop: Point[],
    holeLoops: Point[][],
    elementType: ElementType,
    params: { maxLength: number; thetaMin: number; nx?: number; ny?: number },
  ): Promise<BackendMeshResult> {
    const startMs = Date.now();

    const outerBoundary = outerLoop.map((p) => [p.x, p.y]);
    const holes = holeLoops.map((loop) => loop.map((p) => [p.x, p.y]));

    // max_area from maxLength: equilateral triangle area with side = maxLength
    const maxArea = (params.maxLength ** 2 * Math.sqrt(3)) / 4;

    const beMesh: BEMeshResponse = await apiClient.createMeshFromSketch({
      name: `sketch_${Date.now()}`,
      outer_boundary: outerBoundary,
      holes,
      element_type: elementType === "Q4" ? "quad" : "delaunay",
      max_area: elementType === "T3" ? maxArea : undefined,
      min_angle: elementType === "T3" ? params.thetaMin : undefined,
      nx: params.nx ?? 10,
      ny: params.ny ?? 10,
    });

    // Save IDs globally
    meshStore.setMeshId(beMesh.id);
    meshStore.setGeometryId(beMesh.geometry_id);

    const preview = beMeshToPreview(beMesh, elementType, startMs);

    return {
      meshId: beMesh.id,
      geometryId: beMesh.geometry_id,
      preview,
      nodeCount: beMesh.node_count,
      elementCount: beMesh.element_count,
    };
  }

  async function exportCurrentMesh(format: "json" | "dat" | "csv") {
    const meshId = meshStore.getMeshId();
    if (!meshId) throw new Error("No mesh has been created by the backend");
    await apiClient.exportMesh(meshId, format);
  }

  return { generateMeshFromSketch, exportCurrentMesh, isLoggedIn };
}
