import { getDb } from "../../../lib/db";
import { fail, json, readJson, viewer } from "../../../lib/http";
import { updateProfile } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user } = await viewer();
  return json({ user });
}

export async function PATCH(request: Request) {
  const { user } = await viewer();
  if (!user) return fail("forbidden", 401);
  if (user.role !== "customer") return fail("forbidden", 403);
  const body = (await readJson(request)) as { name?: string; phone?: string; address?: string } | null;
  if (!body) return fail("generic");
  const result = updateProfile(getDb(), user.id, body);
  if (!result.ok) return fail(result.code);
  return json({ user: result.user });
}
