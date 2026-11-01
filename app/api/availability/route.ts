import { getDb } from "../../lib/db";
import { json } from "../../lib/http";
import { publicInfo } from "../../lib/store";

export const dynamic = "force-dynamic";

export function GET() {
  return json(publicInfo(getDb()));
}
