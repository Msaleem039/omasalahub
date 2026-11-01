import { getDb } from "../../../lib/db";
import { fail, json, readJson, setSession } from "../../../lib/http";
import { login } from "../../../lib/store";

export const dynamic = "force-dynamic";

const attempts = new Map<string, { count: number; at: number }>();

export async function POST(request: Request) {
  const body = (await readJson(request)) as { email?: string; password?: string } | null;
  const email = String(body?.email ?? "").trim().toLowerCase();
  const now = Date.now();
  const current = attempts.get(email);
  if (current && now - current.at < 10 * 60 * 1000 && current.count >= 8) return fail("credentials", 429);
  const result = login(getDb(), email, String(body?.password ?? ""));
  if (!result.ok) {
    const previous = attempts.get(email);
    attempts.set(email, { count: previous && now - previous.at < 10 * 60 * 1000 ? previous.count + 1 : 1, at: now });
    return fail("credentials", 401);
  }
  attempts.delete(email);
  await setSession(result.sessionId);
  return json({ user: result.user });
}
