import { getDb } from "../../../lib/db";
import { fail, json } from "../../../lib/http";
import { verifyStripeSignature } from "../../../lib/stripe";
import { applyPaymentEvent } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return fail("generic", 503);
  const payload = await request.text();
  const valid = verifyStripeSignature(payload, request.headers.get("stripe-signature"), secret, Math.floor(Date.now() / 1000));
  if (!valid) return fail("forbidden", 400);
  let event: { id?: string; type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload) as typeof event;
  } catch {
    return fail("generic", 400);
  }
  const type = event.type ?? "";
  const object = event.data?.object ?? {};
  const metadata = (object.metadata ?? {}) as Record<string, unknown>;
  const orderId = String(metadata.orderId ?? object.client_reference_id ?? "");
  if (!event.id || !orderId) return json({ received: true, ignored: true });
  const amount = Number(object.amount_received ?? object.amount_total);
  if (type === "payment_intent.succeeded" || (type === "checkout.session.completed" && object.payment_status === "paid")) {
    const result = applyPaymentEvent(getDb(), { id: event.id, type: "paid", orderId, amountCents: amount });
    if (!result.ok) return fail(result.code, 400);
    return json({ received: true, duplicate: result.duplicate });
  }
  if (type === "payment_intent.payment_failed") {
    const result = applyPaymentEvent(getDb(), { id: event.id, type: "failed", orderId });
    if (!result.ok) return fail(result.code, 400);
    return json({ received: true });
  }
  if (type === "checkout.session.expired") {
    const result = applyPaymentEvent(getDb(), { id: event.id, type: "cancelled", orderId });
    if (!result.ok) return fail(result.code, 400);
    return json({ received: true });
  }
  return json({ received: true, ignored: true });
}
