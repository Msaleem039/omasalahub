import { getDb } from "../../lib/db";
import { fail, json, readJson, viewer } from "../../lib/http";
import { ordersForUser, placeOrder } from "../../lib/store";
import type { CartRequestLine } from "../../lib/types";
import type { ServiceMode, SlotInput } from "../../lib/rules";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user } = await viewer();
  if (!user) return fail("forbidden", 401);
  return json({ orders: ordersForUser(getDb(), user.id) });
}

export async function POST(request: Request) {
  const body = (await readJson(request)) as {
    lines?: CartRequestLine[];
    service?: ServiceMode;
    couponCode?: string;
    scheduled?: SlotInput | null;
    idempotencyKey?: string;
    expectedTotalCents?: number;
    paymentMethod?: string;
    customer?: { name?: string; phone?: string; email?: string; address?: string; note?: string };
    paymentStatus?: string;
    total?: number;
  } | null;
  if (!body) return fail("generic");
  const { user } = await viewer();
  const result = placeOrder(getDb(), {
    lines: body.lines ?? [],
    service: body.service,
    couponCode: body.couponCode,
    scheduled: body.scheduled,
    userId: user?.id ?? null,
    idempotencyKey: body.idempotencyKey ?? "",
    expectedTotalCents: Number(body.expectedTotalCents),
    paymentMethod: body.paymentMethod,
    customer: body.customer ?? {},
  });
  if (!result.ok) return fail(result.code, result.code === "forbidden" ? 403 : 400, "quote" in result ? { quote: result.quote } : undefined);
  return json({ order: result.order, replayed: result.replayed }, result.replayed ? 200 : 201);
}
