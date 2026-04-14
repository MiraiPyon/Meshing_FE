const BASE_URL = "http://localhost:8000/api";

// Phải trùng với VITE_GOOGLE_REDIRECT_URI trong .env
const FE_REDIRECT_URI =
  import.meta.env.VITE_GOOGLE_REDIRECT_URI?.trim() ||
  new URL(`${import.meta.env.BASE_URL}auth/callback`, window.location.origin).toString();

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

export const apiClient = {
  async exchangeAuthCode(code: string) {
    const response = await fetch(`${BASE_URL}/auth/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ code, redirect_uri: FE_REDIRECT_URI }),
    });
    return handleResponse(response);
  },

  async getMe(accessToken: string) {
    const response = await fetch(`${BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
    });
    return handleResponse(response);
  },
};
