import { getDb } from "../../../lib/db";
import { fail, json, readJson, requireAdmin } from "../../../lib/http";
import { listExtras, saveExtra } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) return fail("forbidden", 401);
  return json({ extras: listExtras(getDb()) });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return fail("forbidden", 401);
  const body = (await readJson(request)) as { id?: string; name?: string; price?: number; available?: boolean } | null;
  if (!body) return fail("generic");
  const result = saveExtra(getDb(), body);
  if (!result.ok) return fail(result.code);
  return json(result);
}
