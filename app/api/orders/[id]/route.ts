import { getDb } from "../../../lib/db";
import { fail, json, viewer } from "../../../lib/http";
import { orderForViewer } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { user } = await viewer();
  const url = new URL(request.url);
  const order = orderForViewer(getDb(), id, {
    userId: user?.id ?? null,
    token: request.headers.get("x-order-token"),
    phone: url.searchParams.get("phone"),
  });
  if (!order) return fail("not_found", 404);
  return json({ order });
}
