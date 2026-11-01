import { getDb } from "../../../lib/db";
import { fail, json, readJson, requireAdmin } from "../../../lib/http";
import { saveProduct } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await requireAdmin())) return fail("forbidden", 401);
  const body = (await readJson(request)) as Record<string, unknown> | null;
  if (!body) return fail("generic");
  const result = saveProduct(getDb(), body);
  if (!result.ok) return fail(result.code);
  return json({ product: result.product }, 201);
}
