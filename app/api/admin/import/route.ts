import { getDb } from "../../../lib/db";
import { fail, json, readJson, requireAdmin } from "../../../lib/http";
import { importLegacy } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await requireAdmin())) return fail("forbidden", 401);
  const body = (await readJson(request)) as { products?: Record<string, unknown>[]; orders?: Record<string, unknown>[] } | null;
  if (!body) return fail("generic");
  return json(importLegacy(getDb(), body));
}
