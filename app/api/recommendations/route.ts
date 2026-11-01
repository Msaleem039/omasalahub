import { getDb } from "../../lib/db";
import { json } from "../../lib/http";
import { recommendedProducts } from "../../lib/store";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const ids = new URL(request.url).searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  return json({ products: recommendedProducts(getDb(), ids, ids, 4) });
}
