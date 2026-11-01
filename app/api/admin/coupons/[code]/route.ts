import { getDb } from "../../../../lib/db";
import { fail, json, requireAdmin } from "../../../../lib/http";
import { deleteCoupon } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, context: { params: Promise<{ code: string }> }) {
  if (!(await requireAdmin())) return fail("forbidden", 401);
  const { code } = await context.params;
  return json(deleteCoupon(getDb(), decodeURIComponent(code)));
}
