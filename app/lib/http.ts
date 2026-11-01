import { cookies } from "next/headers";
import { getDb } from "./db";
import { errorText } from "./errors";
import { userFromSession } from "./store";

export async function viewer() {
  const jar = await cookies();
  const token = jar.get("mh_session")?.value;
  return { token, user: userFromSession(getDb(), token) };
}

export async function requireUser() {
  const current = await viewer();
  if (!current.user) return null;
  return current.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function setSession(token: string) {
  const jar = await cookies();
  jar.set("mh_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete("mh_session");
}

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function fail(code: string, status = 400, extra?: Record<string, unknown>) {
  return json({ error: code, message: errorText(code, "fr"), ...extra }, status);
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
