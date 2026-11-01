import { getDb } from "../../../../lib/db";
import { fail, json, requireAdmin } from "../../../../lib/http";
import { resolveReport } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return fail("forbidden", 401);
  const { id } = await context.params;
  return json(resolveReport(getDb(), id));
}
