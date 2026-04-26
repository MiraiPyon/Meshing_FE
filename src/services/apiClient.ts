const BASE_URL = "http://localhost:8000/api";

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

  async createRectangle(data: { name?: string; x_min: number; y_min: number; width: number; height: number }) {
    const res = await withAuth(`${BASE_URL}/geometry/rectangle`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async createCircle(data: { name?: string; center_x: number; center_y: number; radius: number }) {
    const res = await withAuth(`${BASE_URL}/geometry/circle`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async listGeometries() {
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
  }): Promise<{
    name: string;
    operation: string;
    outer_boundary: number[][];
    holes: number[][][];
    area: number;
    num_vertices: number;
    is_valid: boolean;
  }> {
    const res = await withAuth(`${BASE_URL}/geometry/boolean`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // ===== Mesh =====

  async createDelaunayMesh(data: { geometry_id: string; max_area?: number; min_angle?: number }) {
    const res = await withAuth(`${BASE_URL}/mesh/delaunay`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async createQuadMesh(data: { geometry_id: string; nx: number; ny: number }) {
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
    nx?: number;
    ny?: number;
  }) {
    const res = await withAuth(`${BASE_URL}/mesh/from-sketch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMesh(meshId: string) {
    const res = await withAuth(`${BASE_URL}/mesh/${meshId}`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async listMeshes() {
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

  async exportMesh(meshId: string, format: "json" | "dat" | "csv"): Promise<void> {
    const res = await withAuth(
      `${BASE_URL}/mesh/${meshId}/export?format=${format}`,
      { headers: authHeaders() },
    );
    if (!res.ok) throw new Error(`Export failed: HTTP ${res.status}`);

    const blob = await res.blob();
    const contentDisposition = res.headers.get("content-disposition") ?? "";
    const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
    const filename = filenameMatch?.[1] ?? `mesh.${format}`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  // ===== FEA =====

  async solveFEA(data: {
    mesh_id: string;
    material: { E: number; nu: number; thickness?: number; preset?: string };
    analysis_type?: string;
    boundary_conditions?: Array<{ node_id: number; dof: string; value?: number }>;
    nodal_forces?: Array<{ node_id: number; dof: string; value: number }>;
    line_loads?: Array<{ start_node: number; end_node: number; dof: string; value: number }>;
  }) {
    const res = await withAuth(`${BASE_URL}/fea/solve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};
