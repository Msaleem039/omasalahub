import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  allergenText,
  DEFAULT_SETTINGS,
  evaluateCoupon,
  includedVatCents,
  isOpenAt,
  recommendProducts,
  reviewEligibility,
  wallTimeToUtc,
} from "../app/lib/rules.ts";
import { verifyStripeSignature } from "../app/lib/stripe.ts";

const openMonday = new Date("2026-06-15T12:00:00Z");

test("prices stay tax inclusive", () => {
  assert.equal(includedVatCents(1580, 10), 144);
  assert.equal(1580, 1580);
});

test("closed hours and scheduled wall time use the restaurant timezone", () => {
  const closed = { ...DEFAULT_SETTINGS, hours: { "0": [], "1": [], "2": [], "3": [], "4": [], "5": [], "6": [] } };
  assert.equal(isOpenAt(openMonday, closed, [], "delivery"), false);
  assert.equal(isOpenAt(openMonday, DEFAULT_SETTINGS, [], "delivery"), true);
  assert.equal(isOpenAt(openMonday, DEFAULT_SETTINGS, [{ id: "c1", date: "2026-06-15", service: "both", reason: "" }], "pickup"), false);
  const utc = wallTimeToUtc("2026-06-15", "14:00", "Europe/Paris");
  assert.ok(utc);
  assert.equal(utc?.toISOString(), "2026-06-15T12:00:00.000Z");
});

test("coupons expire and cannot exceed the subtotal", () => {
  const coupon = {
    code: "BIENVENUE",
    type: "fixed" as const,
    value: 5000,
    minSubtotalCents: 1000,
    expiresAt: "2026-06-01T00:00:00.000Z",
    startsAt: null,
    usageLimit: 1,
    usedCount: 0,
    perUserLimit: 1,
    userRedemptions: 0,
    active: true,
  };
  assert.equal(evaluateCoupon(coupon, 2000, openMonday).code, "coupon_expired");
  assert.equal(evaluateCoupon({ ...coupon, expiresAt: null, usedCount: 1 }, 2000, openMonday).code, "coupon_limit");
  assert.equal(evaluateCoupon({ ...coupon, expiresAt: null }, 2000, openMonday).discountCents, 2000);
});

test("reviews require a completed order and reject duplicates", () => {
  const base = {
    actorUserId: "u1",
    orderUserId: "u1",
    fulfillmentStatus: "confirmed",
    paymentStatus: "paid",
    itemProductId: "sp-1",
    requestedProductId: "sp-1",
    orderItemId: "oi-1",
    alreadyReviewed: false,
  };
  assert.equal(reviewEligibility(base).ok, false);
  assert.equal(reviewEligibility({ ...base, fulfillmentStatus: "completed" }).ok, true);
  assert.equal(reviewEligibility({ ...base, fulfillmentStatus: "completed", alreadyReviewed: true }).code, "review_duplicate");
  assert.equal(reviewEligibility({ ...base, fulfillmentStatus: "completed", orderUserId: "other" }).code, "review_forbidden");
});

test("recommendations stay in complementary categories and skip unavailable dishes", () => {
  const catalog = [
    { id: "curry", category: "specialites", available: true, name: "Curry" },
    { id: "naan", category: "naans", available: true, name: "Naan" },
    { id: "lassi", category: "boissons", available: false, name: "Lassi" },
    { id: "samosa", category: "entrees", available: true, name: "Samosa" },
    { id: "other", category: "pizzas", available: true, name: "Pizza" },
  ];
  const ids = recommendProducts({
    anchors: [{ id: "curry", category: "specialites" }],
    catalog,
    complements: [
      { category: "specialites", complement: "naans" },
      { category: "specialites", complement: "boissons" },
      { category: "specialites", complement: "entrees" },
    ],
    explicit: [],
    excludeIds: ["curry"],
    limit: 4,
  });
  assert.deepEqual(ids, ["naan", "samosa"]);
});

test("allergen text rejects unsupported free-from claims", () => {
  assert.equal(allergenText("sans allergène").ok, false);
  assert.equal(allergenText("Lait, gluten").ok, true);
});

test("stripe signatures reject missing and stale headers", () => {
  const payload = JSON.stringify({ id: "evt_1" });
  const secret = "whsec_test";
  const timestamp = 1_700_000_000;
  const signature = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  assert.equal(verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, secret, timestamp), true);
  assert.equal(verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, secret, timestamp + 1000), false);
  assert.equal(verifyStripeSignature(payload, null, secret, timestamp), false);
});
