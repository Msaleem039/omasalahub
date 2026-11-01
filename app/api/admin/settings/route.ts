import { getDb } from "../../../lib/db";
import { fail, json, readJson, requireAdmin } from "../../../lib/http";
import { listComplements, publicInfo, saveRestaurantSettings } from "../../../lib/store";
import type { PublicInfo } from "../../../lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) return fail("forbidden", 401);
  const db = getDb();
  return json({ info: publicInfo(db), complements: listComplements(db) });
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) return fail("forbidden", 401);
  const body = (await readJson(request)) as (PublicInfo & { complements?: { category: string; complement: string }[] }) | null;
  if (!body) return fail("generic");
  const result = saveRestaurantSettings(getDb(), body);
  if (!result.ok) return fail(result.code);
  return json({ info: result.info });
}
