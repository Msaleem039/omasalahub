import { getDb } from "../../../../lib/db";
import { fail, json, requireAdmin } from "../../../../lib/http";
import { deleteExtra } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return fail("forbidden", 401);
  const { id } = await context.params;
  return json(deleteExtra(getDb(), id));
}
