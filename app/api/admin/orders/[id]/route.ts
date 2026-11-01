import { getDb } from "../../../../lib/db";
import { fail, json, readJson, requireAdmin } from "../../../../lib/http";
import { updateOrderAdmin } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return fail("forbidden", 401);
  const { id } = await context.params;
  const body = (await readJson(request)) as { fulfillment?: string; payment?: string } | null;
  if (!body) return fail("generic");
  const result = updateOrderAdmin(getDb(), id, body);
  if (!result.ok) return fail(result.code, result.code === "not_found" ? 404 : 400);
  return json({ order: result.order });
}
