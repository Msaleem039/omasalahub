import { getDb } from "../../lib/db";
import { fail, json, readJson, viewer } from "../../lib/http";
import { createReview, eligibleOrderItem, listPublicReviews } from "../../lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId") ?? undefined;
  const { user } = await viewer();
  const db = getDb();
  const result = listPublicReviews(db, {
    productId,
    sort: url.searchParams.get("sort") ?? "newest",
    page: Number(url.searchParams.get("page") ?? 1),
    pageSize: Number(url.searchParams.get("pageSize") ?? 5),
  });
  const eligibleOrderItemId = user && productId ? eligibleOrderItem(db, user.id, productId) : null;
  return json({ ...result, eligibleOrderItemId });
}

export async function POST(request: Request) {
  const { user } = await viewer();
  if (!user) return fail("review_forbidden", 401);
  const body = (await readJson(request)) as { productId?: string; orderItemId?: string; rating?: number; body?: string } | null;
  if (!body) return fail("generic");
  const result = createReview(getDb(), user.id, body);
  if (!result.ok) return fail(result.code, 403);
  return json({ id: result.id }, 201);
}
