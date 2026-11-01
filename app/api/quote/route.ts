import { getDb } from "../../lib/db";
import { json, readJson, viewer } from "../../lib/http";
import { quoteCart } from "../../lib/store";
import type { CartRequestLine } from "../../lib/types";
import type { ServiceMode, SlotInput } from "../../lib/rules";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await readJson(request)) as {
    lines?: CartRequestLine[];
    service?: ServiceMode;
    couponCode?: string;
    scheduled?: SlotInput | null;
    phone?: string;
  } | null;
  if (!body || !Array.isArray(body.lines)) return json({ error: "generic" }, 400);
  const { user } = await viewer();
  return json(quoteCart(getDb(), { ...body, lines: body.lines, userId: user?.id ?? null }));
}
