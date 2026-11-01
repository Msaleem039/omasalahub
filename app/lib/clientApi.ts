export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production" ? "https://api.omasalahub.com" : "http://localhost:5000");

export function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("dd_token");
    if (token && !headers.has("token")) headers.set("token", token);
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}
