import { getDb } from "../../../../lib/db";
import { fail, json, readJson, requireAdmin } from "../../../../lib/http";
import { moderateReview } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return fail("forbidden", 401);
  const { id } = await context.params;
  const body = (await readJson(request)) as { status?: string } | null;
  const result = moderateReview(getDb(), id, body?.status ?? "");
  if (!result.ok) return fail(result.code, 400);
  return json({ ok: true });
}
