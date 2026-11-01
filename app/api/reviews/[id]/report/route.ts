import { getDb } from "../../../../lib/db";
import { fail, json, readJson, viewer } from "../../../../lib/http";
import { reportReview } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { user } = await viewer();
  if (!user) return fail("forbidden", 401);
  const { id } = await context.params;
  const body = (await readJson(request)) as { reason?: string } | null;
  const result = reportReview(getDb(), user.id, id, body?.reason ?? "");
  if (!result.ok) return fail(result.code, 400);
  return json({ ok: true });
}
