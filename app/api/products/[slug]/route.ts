import { getDb } from "../../../lib/db";
import { fail, json } from "../../../lib/http";
import { productBySlug, recommendedProducts } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const db = getDb();
  const product = productBySlug(db, slug);
  if (!product) return fail("not_found", 404);
  return json({ product, related: recommendedProducts(db, [product.id], [product.id], 3) });
}
