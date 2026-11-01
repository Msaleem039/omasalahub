import { getDb } from "../../../lib/db";
import { fail, json, requireAdmin } from "../../../lib/http";
import { ordersForAdmin } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) return fail("forbidden", 401);
  return json({ orders: ordersForAdmin(getDb()) });
}
