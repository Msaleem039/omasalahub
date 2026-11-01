import { getDb } from "../../lib/db";
import { json } from "../../lib/http";
import { listExtras, listProducts, publicInfo } from "../../lib/store";

export const dynamic = "force-dynamic";

export function GET() {
  const db = getDb();
  return json({ products: listProducts(db), extras: listExtras(db), info: publicInfo(db) });
}
