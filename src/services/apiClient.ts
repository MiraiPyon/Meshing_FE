const API_ORIGIN = "http://localhost:8000";
const BASE_URL = `${API_ORIGIN}/api`;

// FE redirect_uri — must match VITE_GOOGLE_REDIRECT_URI and Google Cloud Console
const FE_REDIRECT_URI =
  import.meta.env.VITE_GOOGLE_REDIRECT_URI?.trim() ||
  new URL(`${import.meta.env.BASE_URL}auth/callback`, window.location.origin).toString();

// ---- Internal helpers ----

import {
  getAccessToken,
  getRefreshToken,
  storeTokens,
} from "../infrastructure/auth/local-storage-auth";

export type GeometryResponse = {
  id: string;
  name: string;
  geometry_type: "rectangle" | "circle" | "triangle" | "polygon";
  x_min?: number | null;
  y_min?: number | null;
  width?: number | null;
  height?: number | null;
  center_x?: number | null;
  center_y?: number | null;
  radius?: number | null;
  points?: number[][] | null;
  closed?: boolean | null;
  bounds?: {
    x_min: number;
    x_max: number;
    y_min: number;
    y_max: number;
  } | null;
  created_at: string;
};

export type MeshResponse = {
  id: string;
  geometry_id: string;
  mesh_type: "quad" | "delaunay";
  name: string;
  node_count: number;
  element_count: number;
  nodes: number[][];
  elements: number[][];
  element_type?: "Q4" | "T3" | null;
  dof_total?: number | null;
  dashboard?: Record<string, unknown> | null;
  pslg?: {
    outer_boundary?: number[][];
    holes?: number[][][];
  } | null;
  connectivity_matrices?: Record<string, unknown> | null;
  meshing_params?: Record<string, unknown> | null;
  bounds: {
    x_min: number;
    x_max: number;
    y_min: number;
    y_max: number;
  };
  created_at: string;
};

export type BooleanComponent = {
  outer_boundary: number[][];
  holes: number[][][];
  area: number;
  num_vertices: number;
  is_valid: boolean;
};

export type BooleanOperationResponse = {
  name: string;
  operation: string;
  outer_boundary: number[][];
  holes: number[][][];
  area: number;
  num_vertices: number;
  is_valid: boolean;
  components?: BooleanComponent[];
  component_count?: number;
  total_area?: number;
  is_multipolygon?: boolean;
};

export type ProjectSnapshot = {
  id: string;
  name: string;
  geometry_id: string | null;
  mesh_id: string | null;
  element_type: string | null;
  meshing_params: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type FEASolveRequest = {
  mesh_id: string;
  material: { E: number; nu: number; thickness?: number; preset?: string };
  analysis_type?: "plane_stress" | "plane_strain";
  boundary_conditions?: Array<{ node_id: number; dof: "ux" | "uy"; value?: number }>;
  nodal_forces?: Array<{ node_id: number; dof: "fx" | "fy"; value: number }>;
  line_loads?: Array<{ start_node: number; end_node: number; dof: "tx" | "ty"; value: number }>;
  integration_order?: string;
};

export type FEASolveResponse = {
  success: boolean;
  message: string;
  result: {
    id: string;
    mesh_id: string;
    name: string;
    analysis_type: string;
    material: {
      E: number;
      nu: number;
      thickness: number;
    };
    node_count: number;
    displacements: number[][];
    element_count: number;
    stresses: number[][];
    strains: number[][];
    von_mises: number[];
    max_displacement: number;
    max_von_mises_stress: number;
    max_stress_xx: number;
    max_stress_yy: number;
    max_shear_xy: number;
    nodal_stresses?: number[][] | null;
    nodal_von_mises?: number[] | null;
    reactions?: number[][] | null;
    sum_reaction_x?: number | null;
    sum_reaction_y?: number | null;
    cantilever_benchmark?: Record<string, unknown> | null;
  };
};

async function handleResponse(response: Response) {
  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail ?? JSON.stringify(body);
    } catch {
      detail = await response.text().catch(() => detail);
    }
    throw new Error(detail);
  }
  return response.json();
}

function extractFilename(contentDisposition: string | null, fallback: string) {
  const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/);
  return filenameMatch?.[1] ?? fallback;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Attach Authorization header from stored token. */
function authHeaders(): HeadersInit {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Fetch with auto-refresh: if 401, attempt one token refresh then retry.
 */
async function withAuth(url: string, init: RequestInit = {}): Promise<Response> {
  const makeReq = (token: string | null) =>
    fetch(url, {
      ...init,
      credentials: "include",
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let res = await makeReq(getAccessToken());

  if (res.status === 401) {
    // Try refresh
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          storeTokens(data.access_token, data.refresh_token);
          res = await makeReq(data.access_token);
        }
      } catch {
        // refresh failed — fall through to original 401
      }
    }
  }

  return res;
}

// ---- API client ----

export const apiClient = {
  // ===== Auth =====

  async getGoogleAuthUrl(): Promise<{ url: string }> {
    const response = await fetch(`${BASE_URL}/auth/google/url`, {
      credentials: "include",
    });
    return handleResponse(response);
  },

  async exchangeAuthCode(code: string) {
    const response = await fetch(`${BASE_URL}/auth/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code, redirect_uri: FE_REDIRECT_URI }),
    });
    return handleResponse(response);
  },

  async getMe(accessToken: string) {
    const response = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: "include",
    });
    return handleResponse(response);
  },

  async logout(refreshToken: string) {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => {/* ignore network errors on logout */});
  },

  // ===== Geometry =====

  async createRectangle(data: { name?: string; x_min: number; y_min: number; width: number; height: number }): Promise<GeometryResponse> {
    const res = await withAuth(`${BASE_URL}/geometry/rectangle`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async createCircle(data: { name?: string; center_x: number; center_y: number; radius: number }): Promise<GeometryResponse> {
    const res = await withAuth(`${BASE_URL}/geometry/circle`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async createTriangle(data: { name?: string; points: number[][] }): Promise<GeometryResponse> {
    const res = await withAuth(`${BASE_URL}/geometry/triangle`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async createPolygon(data: { name?: string; points: number[][]; closed?: boolean }): Promise<GeometryResponse> {
    const res = await withAuth(`${BASE_URL}/geometry/polygon`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getGeometry(id: string): Promise<GeometryResponse> {
    const res = await withAuth(`${BASE_URL}/geometry/${id}`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async listGeometries(): Promise<GeometryResponse[]> {
    const res = await withAuth(`${BASE_URL}/geometry`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async deleteGeometry(id: string) {
    await withAuth(`${BASE_URL}/geometry/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },

  async booleanOperation(data: {
    polygon_a: number[][];
    polygon_b: number[][];
    operation: "union" | "subtract" | "intersect";
    name?: string;
  }): Promise<BooleanOperationResponse> {
    const res = await withAuth(`${BASE_URL}/geometry/boolean`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // ===== Mesh =====

  async createDelaunayMesh(data: {
    geometry_id: string;
    max_area?: number;
    min_angle?: number;
    max_edge_length?: number;
    max_circumradius_ratio?: number;
  }): Promise<MeshResponse> {
    const res = await withAuth(`${BASE_URL}/mesh/delaunay`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async createQuadMesh(data: { geometry_id: string; nx: number; ny: number }): Promise<MeshResponse> {
    const res = await withAuth(`${BASE_URL}/mesh/quad`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async createMeshFromSketch(data: {
    name?: string;
    outer_boundary: number[][];
    holes?: number[][][];
    element_type?: string;
    max_area?: number;
    min_angle?: number;
    max_edge_length?: number;
    max_circumradius_ratio?: number;
    nx?: number;
    ny?: number;
  }): Promise<MeshResponse> {
    const res = await withAuth(`${BASE_URL}/mesh/from-sketch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async createMeshFromShapeDat(data: {
    name?: string;
    shape_dat: string;
    max_area?: number;
    min_angle?: number;
    max_edge_length?: number;
    max_circumradius_ratio?: number;
  }): Promise<MeshResponse> {
    const res = await withAuth(`${BASE_URL}/mesh/from-shape-dat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMesh(meshId: string): Promise<MeshResponse> {
    const res = await withAuth(`${BASE_URL}/mesh/${meshId}`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async listMeshes(): Promise<MeshResponse[]> {
    const res = await withAuth(`${BASE_URL}/mesh`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async deleteMesh(meshId: string) {
    await withAuth(`${BASE_URL}/mesh/${meshId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },

  async exportMesh(meshId: string, format: "json" | "dat" | "csv" | "csv_zip" | "shape"): Promise<void> {
    const res = await withAuth(
      `${BASE_URL}/mesh/${meshId}/export?format=${format}`,
      { headers: authHeaders() },
    );
    if (!res.ok) throw new Error(`Export failed: HTTP ${res.status}`);

    const blob = await res.blob();
    const filename = extractFilename(res.headers.get("content-disposition"), `mesh.${format}`);
    triggerBlobDownload(blob, filename);
  },

  // ===== Projects =====

  async createProject(data: {
    name: string;
    geometry_id?: string | null;
    mesh_id?: string | null;
    element_type?: string | null;
    meshing_params?: Record<string, unknown> | null;
    notes?: string | null;
  }): Promise<ProjectSnapshot> {
    const res = await withAuth(`${BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async listProjects(): Promise<ProjectSnapshot[]> {
    const res = await withAuth(`${BASE_URL}/projects`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async getProject(projectId: string): Promise<ProjectSnapshot> {
    const res = await withAuth(`${BASE_URL}/projects/${projectId}`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async updateProject(
    projectId: string,
    data: {
      name?: string;
      geometry_id?: string | null;
      mesh_id?: string | null;
      element_type?: string | null;
      meshing_params?: Record<string, unknown> | null;
      notes?: string | null;
    },
  ): Promise<ProjectSnapshot> {
    const res = await withAuth(`${BASE_URL}/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteProject(projectId: string): Promise<void> {
    const res = await withAuth(`${BASE_URL}/projects/${projectId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Delete project failed: HTTP ${res.status}`);
    }
  },

  // ===== Health =====

  async health(): Promise<{ status: string }> {
    const response = await fetch(`${BASE_URL}/health`, {
      credentials: "include",
    });
    return handleResponse(response);
  },

  async healthDb(): Promise<{ status: string; database: string; reason?: string }> {
    const response = await fetch(`${BASE_URL}/health/db`, {
      credentials: "include",
    });
    return handleResponse(response);
  },

  // ===== Realtime =====

  connectDashboardWebSocket(): WebSocket {
    return new WebSocket(`${API_ORIGIN.replace("http", "ws")}/api/ws/dashboard`);
  },

  // ===== FEA =====

  async solveFEA(data: FEASolveRequest): Promise<FEASolveResponse> {
    const res = await withAuth(`${BASE_URL}/fea/solve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};
