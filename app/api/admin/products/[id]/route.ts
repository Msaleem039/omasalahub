import { getDb } from "../../../../lib/db";
import { fail, json, readJson, requireAdmin } from "../../../../lib/http";
import { deleteProduct, saveProduct } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return fail("forbidden", 401);
  const { id } = await context.params;
  const body = (await readJson(request)) as Record<string, unknown> | null;
  if (!body) return fail("generic");
  const result = saveProduct(getDb(), { ...body, id });
  if (!result.ok) return fail(result.code);
  return json({ product: result.product });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return fail("forbidden", 401);
  const { id } = await context.params;
  if (!deleteProduct(getDb(), id)) return fail("not_found", 404);
  return json({ ok: true });
}
