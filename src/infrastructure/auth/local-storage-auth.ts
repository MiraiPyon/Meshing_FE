const AUTH_STORAGE_KEY = "google-authenticated";
const AUTH_PROFILE_KEY = "google-auth-profile";

const SUCCESS_KEYS = ["code", "access_token", "token", "auth"];

export type AuthProfile = {
  avatar?: string;
  email?: string;
  name: string;
};

export function isAuthenticated() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(AUTH_STORAGE_KEY) === "true";
}

export function markAuthenticated() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, "true");
}

export function clearAuthentication() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_PROFILE_KEY);
}

export function hasOAuthSuccessParams(searchParams: URLSearchParams) {
  return SUCCESS_KEYS.some((key) => {
    const value = searchParams.get(key);
    return typeof value === "string" && value.length > 0;
  });
}

export function storeAuthProfile(profile: AuthProfile) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile));
}

export function getAuthProfile() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawProfile = window.localStorage.getItem(AUTH_PROFILE_KEY);
  if (!rawProfile) {
    return null;
  }

  try {
    return JSON.parse(rawProfile) as AuthProfile;
  } catch {
    return null;
  }
}

export function createAuthProfileFromParams(
  searchParams: URLSearchParams,
): AuthProfile {
  const email = searchParams.get("email") ?? undefined;
  const name =
    searchParams.get("name") ??
    searchParams.get("given_name") ??
    searchParams.get("display_name") ??
    (email ? email.split("@")[0] : undefined) ??
    "Nguoi dung Google";

  const avatar =
    searchParams.get("picture") ?? searchParams.get("avatar") ?? undefined;

  return {
    avatar,
    email,
    name,
  };
}
