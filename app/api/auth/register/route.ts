import { getDb } from "../../../lib/db";
import { fail, json, readJson, setSession } from "../../../lib/http";
import { registerCustomer } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await readJson(request)) as { name?: string; email?: string; password?: string; role?: string } | null;
  if (!body) return fail("generic");
  const result = registerCustomer(getDb(), body);
  if (!result.ok) return fail(result.code, result.code === "email_taken" ? 409 : 400);
  await setSession(result.sessionId);
  return json({ user: result.user }, 201);
}
