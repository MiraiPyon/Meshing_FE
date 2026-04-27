import type { Point } from "../modules/geometry/domain/types";
import type { ElementType, MeshPreview } from "../modules/meshing/domain/types";
import {
  apiClient,
  type FEASolveResponse,
  type GeometryResponse,
  type MeshResponse,
  type ProjectSnapshot,
} from "../services/apiClient";
import { getAccessToken } from "../infrastructure/auth/local-storage-auth";
import { meshStore } from "../store/meshStore";

type ExportFormat = "json" | "dat" | "csv" | "csv_zip" | "shape";

type DashboardEventPayload = {
  event: string;
  data: Record<string, unknown>;
};

export type QuickFEAInput = {
  E: number;
  nu: number;
  thickness: number;
  totalForceFy: number;
  analysisType: "plane_stress" | "plane_strain";
};

function distanceSquared(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function simplifyLoopPoints(
  loop: Point[],
  opts: { maxVertices: number; minDistance: number; collinearTolerance: number },
): Point[] {
  if (loop.length <= 3) {
    return [...loop];
  }

  const minDistanceSq = opts.minDistance * opts.minDistance;

  const deduped: Point[] = [];
  for (const point of loop) {
    const last = deduped[deduped.length - 1];
    if (!last || distanceSquared(last, point) >= minDistanceSq) {
      deduped.push(point);
    }
  }

  if (
    deduped.length > 2 &&
    distanceSquared(deduped[0], deduped[deduped.length - 1]) < minDistanceSq
  ) {
    deduped.pop();
  }

  const cleaned = [...deduped];
  let changed = true;
  while (changed && cleaned.length > 3) {
    changed = false;
    for (let i = 0; i < cleaned.length; i += 1) {
      const prev = cleaned[(i - 1 + cleaned.length) % cleaned.length];
      const curr = cleaned[i];
      const next = cleaned[(i + 1) % cleaned.length];
      const baseDx = next.x - prev.x;
      const baseDy = next.y - prev.y;
      const baseLen = Math.hypot(baseDx, baseDy);
      if (baseLen <= 1e-9) {
        continue;
      }

      const area2 = Math.abs(
        (curr.x - prev.x) * (next.y - prev.y) -
          (curr.y - prev.y) * (next.x - prev.x),
      );
      const perpDistance = area2 / baseLen;
      if (perpDistance <= opts.collinearTolerance) {
        cleaned.splice(i, 1);
        changed = true;
        break;
      }
    }
  }

  if (cleaned.length <= opts.maxVertices) {
    return cleaned.length >= 3 ? cleaned : [...loop];
  }

  const sampled: Point[] = [];
  for (let i = 0; i < opts.maxVertices; i += 1) {
    const idx = Math.floor((i * cleaned.length) / opts.maxVertices);
    sampled.push(cleaned[idx]);
  }

  return sampled.length >= 3 ? sampled : [...loop];
}

/** Convert BE mesh response → FE MeshPreview (for canvas + stats). */
export function beMeshToPreview(
  beMesh: MeshResponse,
  elementType: ElementType,
  startMs: number,
): MeshPreview {
  const nodes: Point[] = beMesh.nodes.map(([x, y]) => ({ x, y }));
  const flatConnectivity = beMesh.elements.flat();
  const isOneBased = flatConnectivity.length > 0 && Math.min(...flatConnectivity) >= 1;

  // Build edges from element connectivity (deduplicated)
  const edgeSet = new Set<string>();
  const edges: [Point, Point][] = [];

  for (const elem of beMesh.elements) {
    const n = elem.length;
    for (let i = 0; i < n; i++) {
      const aIdx = isOneBased ? elem[i] - 1 : elem[i];
      const bIdx = isOneBased ? elem[(i + 1) % n] - 1 : elem[(i + 1) % n];
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
  rawMesh: MeshResponse;
  nodeCount: number;
  elementCount: number;
};

export type LoadProjectResult = {
  project: ProjectSnapshot;
  preview: MeshPreview | null;
  elementType: ElementType | null;
  meshId: string | null;
  geometryId: string | null;
  outerLoop: Point[] | null;
  holeLoops: Point[][] | null;
};

function meshTypeToElementType(meshType: MeshResponse["mesh_type"]): ElementType {
  return meshType === "quad" ? "Q4" : "T3";
}

function buildMeshResult(mesh: MeshResponse, startMs: number): BackendMeshResult {
  const elementType = meshTypeToElementType(mesh.mesh_type);
  return {
    meshId: mesh.id,
    geometryId: mesh.geometry_id,
    preview: beMeshToPreview(mesh, elementType, startMs),
    rawMesh: mesh,
    nodeCount: mesh.node_count,
    elementCount: mesh.element_count,
  };
}

function getNodesByX(mesh: MeshResponse, targetX: number, tolerance: number): number[] {
  const indices: number[] = [];
  mesh.nodes.forEach(([x], index) => {
    if (Math.abs(x - targetX) <= tolerance) {
      indices.push(index);
    }
  });
  return indices;
}

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

    // Keep Delaunay constraints scale-aware for canvas-sized coordinates.
    // Without this, small absolute maxLength values can over-refine large sketches.
    const bbox = outerLoop.reduce(
      (acc, point) => ({
        xMin: Math.min(acc.xMin, point.x),
        xMax: Math.max(acc.xMax, point.x),
        yMin: Math.min(acc.yMin, point.y),
        yMax: Math.max(acc.yMax, point.y),
      }),
      {
        xMin: Number.POSITIVE_INFINITY,
        xMax: Number.NEGATIVE_INFINITY,
        yMin: Number.POSITIVE_INFINITY,
        yMax: Number.NEGATIVE_INFINITY,
      },
    );
    const bboxWidth = Math.max(bbox.xMax - bbox.xMin, 0);
    const bboxHeight = Math.max(bbox.yMax - bbox.yMin, 0);
    const bboxDiag = Math.hypot(bboxWidth, bboxHeight);
    const adaptiveMinEdge = bboxDiag > 0 ? bboxDiag / 40 : params.maxLength;
    const effectiveMaxLength = Math.max(params.maxLength, adaptiveMinEdge);
    const minDistance = bboxDiag > 0 ? Math.max(bboxDiag / 400, 0.5) : 0.5;
    const collinearTolerance = bboxDiag > 0 ? Math.max(bboxDiag / 600, 0.25) : 0.25;

    const simplifiedOuterLoop = simplifyLoopPoints(outerLoop, {
      maxVertices: 120,
      minDistance,
      collinearTolerance,
    });
    const simplifiedHoleLoops = holeLoops.map((loop) =>
      simplifyLoopPoints(loop, {
        maxVertices: 80,
        minDistance,
        collinearTolerance,
      }),
    );

    const outerBoundary = simplifiedOuterLoop.map((p) => [p.x, p.y]);
    const holes = simplifiedHoleLoops.map((loop) => loop.map((p) => [p.x, p.y]));

    // max_area from maxLength: equilateral triangle area with side = edge length
    const maxArea = (effectiveMaxLength ** 2 * Math.sqrt(3)) / 4;

    const beMesh = await apiClient.createMeshFromSketch({
      name: `sketch_${Date.now()}`,
      outer_boundary: outerBoundary,
      holes,
      element_type: elementType === "Q4" ? "quad" : "delaunay",
      max_area: elementType === "T3" ? maxArea : undefined,
      min_angle: elementType === "T3" ? params.thetaMin : undefined,
      max_edge_length: elementType === "T3" ? effectiveMaxLength : undefined,
      nx: params.nx ?? 10,
      ny: params.ny ?? 10,
    });

    // Save IDs globally
    meshStore.setMeshId(beMesh.id);
    meshStore.setGeometryId(beMesh.geometry_id);

    return buildMeshResult(beMesh, startMs);
  }

  async function generateMeshFromShapeDat(
    shapeDat: string,
    params: { maxLength: number; thetaMin: number; name?: string },
  ): Promise<BackendMeshResult> {
    const startMs = Date.now();
    const maxArea = (params.maxLength ** 2 * Math.sqrt(3)) / 4;
    const mesh = await apiClient.createMeshFromShapeDat({
      name: params.name ?? `shape_dat_${Date.now()}`,
      shape_dat: shapeDat,
      max_area: maxArea,
      min_angle: params.thetaMin,
      max_edge_length: params.maxLength,
    });

    meshStore.setMeshId(mesh.id);
    meshStore.setGeometryId(mesh.geometry_id);
    return buildMeshResult(mesh, startMs);
  }

  async function exportCurrentMesh(format: ExportFormat) {
    const meshId = meshStore.getMeshId();
    if (!meshId) throw new Error("No mesh has been created by the backend");
    await apiClient.exportMesh(meshId, format);
  }

  async function createRectangle(data: {
    name?: string;
    xMin: number;
    yMin: number;
    width: number;
    height: number;
  }): Promise<GeometryResponse> {
    return apiClient.createRectangle({
      name: data.name,
      x_min: data.xMin,
      y_min: data.yMin,
      width: data.width,
      height: data.height,
    });
  }

  async function createCircle(data: {
    name?: string;
    centerX: number;
    centerY: number;
    radius: number;
  }): Promise<GeometryResponse> {
    return apiClient.createCircle({
      name: data.name,
      center_x: data.centerX,
      center_y: data.centerY,
      radius: data.radius,
    });
  }

  async function createPolygon(data: {
    name?: string;
    points: number[][];
    closed?: boolean;
  }): Promise<GeometryResponse> {
    return apiClient.createPolygon(data);
  }

  async function listGeometryRecords(): Promise<GeometryResponse[]> {
    return apiClient.listGeometries();
  }

  async function getGeometryRecord(geometryId: string): Promise<GeometryResponse> {
    return apiClient.getGeometry(geometryId);
  }

  async function deleteGeometryRecord(geometryId: string): Promise<void> {
    await apiClient.deleteGeometry(geometryId);
  }

  async function listProjectSnapshots(): Promise<ProjectSnapshot[]> {
    return apiClient.listProjects();
  }

  async function createProjectSnapshot(input: {
    name: string;
    notes?: string;
    elementType?: ElementType;
    meshingParams?: Record<string, unknown>;
  }): Promise<ProjectSnapshot> {
    return apiClient.createProject({
      name: input.name,
      notes: input.notes,
      geometry_id: meshStore.getGeometryId(),
      mesh_id: meshStore.getMeshId(),
      element_type: input.elementType,
      meshing_params: input.meshingParams,
    });
  }

  async function deleteProjectSnapshot(projectId: string): Promise<void> {
    await apiClient.deleteProject(projectId);
  }

  async function loadProjectSnapshot(projectId: string): Promise<LoadProjectResult> {
    const project = await apiClient.getProject(projectId);
    if (!project.mesh_id || !project.geometry_id) {
      meshStore.clear();
      return {
        project,
        preview: null,
        elementType: null,
        meshId: project.mesh_id,
        geometryId: project.geometry_id,
        outerLoop: null,
        holeLoops: null,
      };
    }

    const startMs = Date.now();
    const mesh = await apiClient.getMesh(project.mesh_id);
    meshStore.setMeshId(mesh.id);
    meshStore.setGeometryId(mesh.geometry_id);

    const elementType = meshTypeToElementType(mesh.mesh_type);
    const outerLoop = mesh.pslg?.outer_boundary?.map(([x, y]) => ({ x, y })) ?? null;
    const holeLoops =
      mesh.pslg?.holes?.map((loop) => loop.map(([x, y]) => ({ x, y }))) ?? null;

    return {
      project,
      preview: beMeshToPreview(mesh, elementType, startMs),
      elementType,
      meshId: mesh.id,
      geometryId: mesh.geometry_id,
      outerLoop,
      holeLoops,
    };
  }

  async function solveQuickCantilever(input: QuickFEAInput): Promise<FEASolveResponse> {
    const meshId = meshStore.getMeshId();
    if (!meshId) {
      throw new Error("No mesh available. Generate or load a mesh first.");
    }

    const mesh = await apiClient.getMesh(meshId);
    if (mesh.nodes.length < 2) {
      throw new Error("Mesh has too few nodes for FEA.");
    }

    const xs = mesh.nodes.map(([x]) => x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const tolerance = Math.max((maxX - minX) * 1e-6, 1e-9);

    const leftNodes = getNodesByX(mesh, minX, tolerance);
    const rightNodes = getNodesByX(mesh, maxX, tolerance);

    if (leftNodes.length === 0 || rightNodes.length === 0) {
      throw new Error("Could not detect boundary nodes for quick cantilever setup.");
    }

    const boundaryConditions = leftNodes.flatMap((nodeId) => ([
      { node_id: nodeId, dof: "ux" as const, value: 0.0 },
      { node_id: nodeId, dof: "uy" as const, value: 0.0 },
    ]));

    const forcePerNode = input.totalForceFy / rightNodes.length;
    const nodalForces = rightNodes.map((nodeId) => ({
      node_id: nodeId,
      dof: "fy" as const,
      value: forcePerNode,
    }));

    return apiClient.solveFEA({
      mesh_id: mesh.id,
      material: {
        E: input.E,
        nu: input.nu,
        thickness: input.thickness,
      },
      analysis_type: input.analysisType,
      boundary_conditions: boundaryConditions,
      nodal_forces: nodalForces,
    });
  }

  function subscribeDashboardEvents(
    onEvent: (event: DashboardEventPayload) => void,
    onError?: (error: Event) => void,
  ): () => void {
    const ws = apiClient.connectDashboardWebSocket();
    const pingId = window.setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send("ping");
      }
    }, 25000);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as DashboardEventPayload;
        if (payload?.event) {
          onEvent(payload);
        }
      } catch {
        // Ignore malformed ws messages.
      }
    };

    ws.onerror = (event) => {
      onError?.(event);
    };

    return () => {
      window.clearInterval(pingId);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }

  return {
    createRectangle,
    createCircle,
    createPolygon,
    listGeometryRecords,
    getGeometryRecord,
    deleteGeometryRecord,
    generateMeshFromSketch,
    generateMeshFromShapeDat,
    exportCurrentMesh,
    listProjectSnapshots,
    createProjectSnapshot,
    loadProjectSnapshot,
    deleteProjectSnapshot,
    solveQuickCantilever,
    subscribeDashboardEvents,
    isLoggedIn,
  };
}
