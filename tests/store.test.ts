import assert from "node:assert/strict";
import test from "node:test";
import { openDatabase } from "../app/lib/db.ts";
import {
  applyPaymentEvent,
  createReview,
  login,
  placeOrder,
  quoteCart,
  recommendIds,
  registerCustomer,
  saveCoupon,
  saveRestaurantSettings,
  updateOrderAdmin,
} from "../app/lib/store.ts";
import { publicInfo } from "../app/lib/store.ts";

const now = new Date("2026-06-15T12:00:00.000Z");

function db() {
  return openDatabase(":memory:");
}

test("orders ignore client prices and payment status", () => {
  const database = db();
  const quote = quoteCart(database, { lines: [{ productId: "sp-1", quantity: 1 }], service: "delivery" }, now);
  assert.equal(quote.totalCents, 1580);
  const placed = placeOrder(
    database,
    {
      lines: [{ productId: "sp-1", quantity: 1 }],
      service: "delivery",
      idempotencyKey: "idem-1234567890abcd",
      expectedTotalCents: quote.totalCents,
      paymentMethod: "cod",
      paymentStatus: "paid",
      total: 1,
      customer: { name: "Amina Diallo", phone: "06 12 34 56 78", address: "12 rue des Lilas, Paris" },
    },
    now,
  );
  assert.equal(placed.ok, true);
  if (!placed.ok) return;
  assert.equal(placed.order.total, 15.8);
  assert.equal(placed.order.paymentStatus, "unpaid");
  assert.equal(placed.order.status, "pending");
  const replay = placeOrder(
    database,
    {
      lines: [{ productId: "sp-1", quantity: 9 }],
      service: "delivery",
      idempotencyKey: "idem-1234567890abcd",
      expectedTotalCents: 1,
      paymentMethod: "online",
      customer: { name: "Amina Diallo", phone: "06 12 34 56 78", address: "12 rue des Lilas, Paris" },
    },
    now,
  );
  assert.equal(replay.ok, true);
  if (!replay.ok) return;
  assert.equal(replay.order.id, placed.order.id);
  assert.equal(replay.replayed, true);
});

test("online payment stays pending until a verified event", () => {
  const database = db();
  const quote = quoteCart(database, { lines: [{ productId: "sp-1", quantity: 1 }], service: "pickup" }, now);
  const placed = placeOrder(
    database,
    {
      lines: [{ productId: "sp-1", quantity: 1 }],
      service: "pickup",
      idempotencyKey: "idem-online-12345678",
      expectedTotalCents: quote.totalCents,
      paymentMethod: "online",
      customer: { name: "Amina Diallo", phone: "0612345678", address: "" },
    },
    now,
  );
  assert.equal(placed.ok, true);
  if (!placed.ok) return;
  assert.equal(placed.order.paymentStatus, "pending");
  assert.equal(placed.order.deliveryFee, 0);
  const mismatch = applyPaymentEvent(database, { id: "evt_bad", type: "paid", orderId: placed.order.id, amountCents: 1 });
  assert.equal(mismatch.ok, false);
  const paid = applyPaymentEvent(database, { id: "evt_ok", type: "paid", orderId: placed.order.id, amountCents: quote.totalCents });
  assert.equal(paid.ok, true);
  if (!paid.ok) return;
  assert.equal(paid.payment, "paid");
  assert.equal(paid.fulfillment, "pending");
  const duplicate = applyPaymentEvent(database, { id: "evt_ok", type: "failed", orderId: placed.order.id });
  assert.equal(duplicate.ok, true);
  if (!duplicate.ok) return;
  assert.equal(duplicate.duplicate, true);
});

test("coupons cannot be redeemed past their limit", () => {
  const database = db();
  assert.equal(saveCoupon(database, { code: "NAAN10", type: "percent", value: 10, usageLimit: 1, perUserLimit: 1 }).ok, true);
  const firstQuote = quoteCart(database, { lines: [{ productId: "sp-1", quantity: 1 }], couponCode: "NAAN10", service: "pickup" }, now);
  assert.equal(firstQuote.couponStatus, "coupon_applied");
  const first = placeOrder(
    database,
    {
      lines: [{ productId: "sp-1", quantity: 1 }],
      service: "pickup",
      couponCode: "NAAN10",
      idempotencyKey: "idem-coupon-1234567",
      expectedTotalCents: firstQuote.totalCents,
      paymentMethod: "cod",
      customer: { name: "Amina Diallo", phone: "0612345678" },
    },
    now,
  );
  assert.equal(first.ok, true);
  const secondQuote = quoteCart(database, { lines: [{ productId: "sp-1", quantity: 1 }], couponCode: "NAAN10", service: "pickup", phone: "0612345678" }, now);
  assert.equal(secondQuote.canSubmit, false);
  assert.equal(secondQuote.couponStatus, "coupon_limit");
});

test("reviews are limited to the customer completed order item", () => {
  const database = db();
  const account = registerCustomer(database, { name: "Amina Diallo", email: "amina@example.com", password: "secret-pass", role: "admin" });
  assert.equal(account.ok, true);
  if (!account.ok) return;
  assert.equal(account.user.role, "customer");
  const quote = quoteCart(database, { lines: [{ productId: "sp-1", quantity: 1 }], service: "pickup", userId: account.user.id }, now);
  const placed = placeOrder(
    database,
    {
      lines: [{ productId: "sp-1", quantity: 1 }],
      service: "pickup",
      userId: account.user.id,
      idempotencyKey: "idem-review-12345678",
      expectedTotalCents: quote.totalCents,
      paymentMethod: "cod",
      customer: { name: "Amina Diallo", phone: "0612345678" },
    },
    now,
  );
  assert.equal(placed.ok, true);
  if (!placed.ok) return;
  const itemId = placed.order.items[0]?.id ?? "";
  assert.equal(createReview(database, account.user.id, { productId: "sp-1", orderItemId: itemId, rating: 5, body: "Très bon butter chicken." }).code, "review_not_completed");
  updateOrderAdmin(database, placed.order.id, { payment: "paid", fulfillment: "confirmed" });
  assert.equal(createReview(database, account.user.id, { productId: "sp-1", orderItemId: itemId, rating: 5, body: "Très bon butter chicken." }).code, "review_not_completed");
  updateOrderAdmin(database, placed.order.id, { fulfillment: "completed" });
  const created = createReview(database, account.user.id, { productId: "sp-1", orderItemId: itemId, rating: 5, body: "Très bon butter chicken." });
  assert.equal(created.ok, true);
  assert.equal(createReview(database, account.user.id, { productId: "sp-1", orderItemId: itemId, rating: 4, body: "Deuxième avis refusé." }).code, "review_duplicate");
  const stranger = registerCustomer(database, { name: "Marc Martin", email: "marc@example.com", password: "secret-pass" });
  if (!stranger.ok) return;
  assert.equal(createReview(database, stranger.user.id, { productId: "sp-1", orderItemId: itemId, rating: 1, body: "Je n'ai pas commandé." }).code, "review_forbidden");
});

test("the kitchen can refuse immediate orders when closed", () => {
  const database = db();
  const info = publicInfo(database, now);
  assert.equal(saveRestaurantSettings(database, { ...info, hours: { "0": [], "1": [], "2": [], "3": [], "4": [], "5": [], "6": [] } }).ok, true);
  const quote = quoteCart(database, { lines: [{ productId: "na-3", quantity: 1 }], service: "delivery" }, now);
  assert.equal(quote.orderingCode, "closed");
  assert.equal(quote.canSubmit, false);
});

test("suggestions skip the basket and unavailable dishes", () => {
  const database = db();
  database.prepare("UPDATE products SET stock = 0 WHERE id = 'na-1'").run();
  const ids = recommendIds(database, ["sp-1"], ["sp-1"], 6, now);
  assert.equal(ids.includes("sp-1"), false);
  assert.equal(ids.includes("na-1"), false);
  assert.ok(ids.length > 0);
});

test("admin login is not granted by a customer registration", () => {
  const database = db();
  const attempt = login(database, "admin@masalahub.fr", "wrong-password");
  assert.equal(attempt.ok, false);
  const admin = login(database, "admin@masalahub.fr", "MasalaHub-Admin");
  assert.equal(admin.ok, true);
  if (!admin.ok) return;
  assert.equal(admin.user.role, "admin");
});
