import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import type { DatabaseSync } from "node:sqlite";
import { CATEGORIES, type MenuCategory } from "../data/menuData.ts";
import {
  allergenText,
  centsToEuros,
  deliveryFeeCents,
  evaluateCoupon,
  eurosToCents,
  FULFILLMENT_STATUSES,
  hoursShort,
  includedVatCents,
  isOpenAt,
  nextOpening,
  normalizeFulfillment,
  orderingDecision,
  publicAuthor,
  recommendProducts,
  reviewEligibility,
  sanitizeText,
  type Closure,
  type CouponRule,
  type FulfillmentStatus,
  type PaymentStatus,
  type RestaurantSettings,
  type ServiceMode,
  type SlotInput,
} from "./rules.ts";
import type { CartRequestLine, MenuProduct, PublicInfo, PublicOrder, PublicReview, PublicUser, QuoteResult } from "./types.ts";

type Row = Record<string, unknown>;

const CATEGORY_IDS = new Set(CATEGORIES.map((category) => category.slug).filter((slug) => slug !== "all"));

function rows(db: DatabaseSync, sql: string, ...params: (string | number | null)[]) {
  return db.prepare(sql).all(...params) as Row[];
}

function one(db: DatabaseSync, sql: string, ...params: (string | number | null)[]) {
  return db.prepare(sql).get(...params) as Row | undefined;
}

function changesOf(result: { changes: number | bigint }) {
  return Number(result.changes);
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 64);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

function publicUser(row: Row): PublicUser {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone ?? ""),
    address: String(row.address ?? ""),
    role: row.role === "admin" ? "admin" : "customer",
  };
}

export function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function readSettings(db: DatabaseSync): RestaurantSettings {
  const row = one(db, "SELECT value FROM settings WHERE key = 'restaurant'");
  if (!row) throw new Error("Missing restaurant settings");
  return JSON.parse(String(row.value)) as RestaurantSettings;
}

export function readClosures(db: DatabaseSync): Closure[] {
  return rows(db, "SELECT id, date, service, reason FROM closures ORDER BY date").map((row) => ({
    id: String(row.id),
    date: String(row.date),
    service: (row.service === "delivery" || row.service === "pickup" ? row.service : "both") as Closure["service"],
    reason: String(row.reason ?? ""),
  }));
}

function sellable(row: Row, now: Date) {
  if (Number(row.available) !== 1) return false;
  if (row.stock !== null && row.stock !== undefined && Number(row.stock) <= 0) return false;
  if (row.available_from && now < new Date(String(row.available_from))) return false;
  if (row.available_until && now > new Date(String(row.available_until))) return false;
  return true;
}

function reviewStats(db: DatabaseSync, productId: string) {
  const row = one(
    db,
    "SELECT COUNT(*) AS n, AVG(rating) AS avg FROM reviews WHERE product_id = ? AND status = 'approved'",
    productId,
  );
  const count = Number(row?.n ?? 0);
  const average = count > 0 && row?.avg !== null && row?.avg !== undefined ? Math.round(Number(row.avg) * 10) / 10 : null;
  return { count, average };
}

function mapProduct(db: DatabaseSync, row: Row, now: Date): MenuProduct {
  const id = String(row.id);
  const stats = reviewStats(db, id);
  const variants = rows(db, "SELECT * FROM variants WHERE product_id = ? ORDER BY sort_order, name", id).map((variant) => ({
    id: String(variant.id),
    group: String(variant.group_name),
    name: String(variant.name),
    priceDelta: centsToEuros(Number(variant.price_delta_cents)),
    available: Number(variant.available) === 1,
  }));
  const extras = rows(
    db,
    "SELECT e.* FROM extras e JOIN product_extras pe ON pe.extra_id = e.id WHERE pe.product_id = ? ORDER BY e.name",
    id,
  ).map((extra) => ({
    id: String(extra.id),
    name: String(extra.name),
    price: centsToEuros(Number(extra.price_cents)),
    available: Number(extra.available) === 1,
  }));
  const relatedIds = rows(db, "SELECT related_id FROM related_products WHERE product_id = ?", id).map((item) => String(item.related_id));
  return {
    id,
    slug: String(row.slug),
    name: String(row.name),
    category: String(row.category) as MenuCategory,
    price: centsToEuros(Number(row.price_cents)),
    image: String(row.image),
    description: String(row.description),
    available: Number(row.available) === 1,
    orderable: sellable(row, now),
    stock: row.stock === null || row.stock === undefined ? null : Number(row.stock),
    allergens: String(row.allergens ?? ""),
    ingredients: String(row.ingredients ?? ""),
    isCombo: Number(row.is_combo) === 1,
    variants,
    extras,
    reviewAverage: stats.average,
    reviewCount: stats.count,
    relatedIds,
  };
}

export function listProducts(db: DatabaseSync, now = new Date()) {
  return rows(db, "SELECT * FROM products ORDER BY name").map((row) => mapProduct(db, row, now));
}

export function productBySlug(db: DatabaseSync, slug: string, now = new Date()) {
  const row = one(db, "SELECT * FROM products WHERE slug = ?", slug);
  return row ? mapProduct(db, row, now) : null;
}

export function publicInfo(db: DatabaseSync, now = new Date()): PublicInfo {
  const settings = readSettings(db);
  const closures = readClosures(db);
  const deliveryOpen = settings.deliveryEnabled && isOpenAt(now, settings, closures, "delivery");
  const pickupOpen = settings.pickupEnabled && isOpenAt(now, settings, closures, "pickup");
  const openNow = deliveryOpen || pickupOpen;
  const service: ServiceMode = settings.deliveryEnabled ? "delivery" : "pickup";
  return {
    timezone: settings.timezone,
    hoursShort: hoursShort(settings),
    hours: settings.hours,
    closures,
    openNow,
    deliveryOpen,
    pickupOpen,
    nextOpenAt: openNow ? null : nextOpening(now, settings, closures, service),
    deliveryEnabled: settings.deliveryEnabled,
    pickupEnabled: settings.pickupEnabled,
    minOrder: centsToEuros(settings.minOrderCents),
    deliveryFee: centsToEuros(settings.deliveryFeeCents),
    freeDeliveryFrom: centsToEuros(settings.freeDeliveryFromCents),
    prepMinutes: settings.prepMinutes,
    vatRate: settings.vatRate,
    allowScheduled: settings.allowScheduled,
  };
}

export function listComplements(db: DatabaseSync) {
  return rows(db, "SELECT category, complement FROM complementary_categories ORDER BY category, complement").map((row) => ({
    category: String(row.category),
    complement: String(row.complement),
  }));
}

export function listExtras(db: DatabaseSync) {
  return rows(db, "SELECT * FROM extras ORDER BY name").map((row) => ({
    id: String(row.id),
    name: String(row.name),
    price: centsToEuros(Number(row.price_cents)),
    available: Number(row.available) === 1,
  }));
}

type PricedLine = QuoteResult["lines"][number] & { unitPriceCents: number; lineTotalCents: number; variantIds: string[]; extraIds: string[] };

function priceLines(db: DatabaseSync, lines: CartRequestLine[], now: Date) {
  const priced: PricedLine[] = [];
  const issues: { code: string; productId?: string }[] = [];
  const used = new Map<string, number>();
  for (const line of lines) {
    const quantity = Math.floor(Number(line.quantity));
    const productId = sanitizeText(line.productId, 80);
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 30) {
      issues.push({ code: "bad_quantity", productId });
      continue;
    }
    const product = one(db, "SELECT * FROM products WHERE id = ?", productId);
    if (!product || !sellable(product, now)) {
      issues.push({ code: "unavailable", productId });
      continue;
    }
    const variantIds = [...new Set((line.variantIds ?? []).map((id) => sanitizeText(id, 80)).filter(Boolean))];
    const extraIds = [...new Set((line.extraIds ?? []).map((id) => sanitizeText(id, 80)).filter(Boolean))];
    const variants = rows(db, "SELECT * FROM variants WHERE product_id = ?", productId);
    const extras = rows(
      db,
      "SELECT e.* FROM extras e JOIN product_extras pe ON pe.extra_id = e.id WHERE pe.product_id = ?",
      productId,
    );
    const labels: string[] = [];
    const groups = new Set<string>();
    let delta = 0;
    let invalid = false;
    for (const id of variantIds) {
      const variant = variants.find((item) => String(item.id) === id);
      if (!variant || Number(variant.available) !== 1 || groups.has(String(variant.group_name))) {
        invalid = true;
        break;
      }
      groups.add(String(variant.group_name));
      delta += Number(variant.price_delta_cents);
      labels.push(String(variant.name));
    }
    for (const id of extraIds) {
      const extra = extras.find((item) => String(item.id) === id);
      if (!extra || Number(extra.available) !== 1) {
        invalid = true;
        break;
      }
      delta += Number(extra.price_cents);
      labels.push(String(extra.name));
    }
    if (invalid) {
      issues.push({ code: "bad_options", productId });
      continue;
    }
    const nextUsed = (used.get(productId) ?? 0) + quantity;
    if (product.stock !== null && product.stock !== undefined && nextUsed > Number(product.stock)) {
      issues.push({ code: "stock", productId });
      continue;
    }
    used.set(productId, nextUsed);
    const unit = Math.max(0, Number(product.price_cents) + delta);
    priced.push({
      lineId: [productId, ...[...variantIds].sort(), ...[...extraIds].sort()].join("|"),
      productId,
      name: String(product.name),
      quantity,
      unitPrice: centsToEuros(unit),
      lineTotal: centsToEuros(unit * quantity),
      unitPriceCents: unit,
      lineTotalCents: unit * quantity,
      image: String(product.image),
      optionsLabel: labels.join(", "),
      allergens: String(product.allergens ?? ""),
      category: String(product.category),
      variantIds,
      extraIds,
    });
  }
  return { lines: priced, issues };
}

function couponFor(db: DatabaseSync, code: string, userId: string | null, phone: string): CouponRule | null {
  const row = one(db, "SELECT * FROM coupons WHERE code = ?", code.trim().toUpperCase());
  if (!row) return null;
  const digits = phoneDigits(phone);
  const redemptions = one(
    db,
    `SELECT COUNT(*) AS n FROM coupon_redemptions r
     LEFT JOIN orders o ON o.id = r.order_id
     WHERE r.code = ? AND ((? IS NOT NULL AND r.user_id = ?) OR (? != '' AND o.customer_phone_digits = ?))`,
    String(row.code),
    userId,
    userId,
    digits,
    digits,
  );
  return {
    code: String(row.code),
    type: row.type === "fixed" ? "fixed" : "percent",
    value: Number(row.value),
    minSubtotalCents: Number(row.min_subtotal_cents),
    expiresAt: row.expires_at ? String(row.expires_at) : null,
    startsAt: row.starts_at ? String(row.starts_at) : null,
    usageLimit: row.usage_limit === null || row.usage_limit === undefined ? null : Number(row.usage_limit),
    usedCount: Number(row.used_count),
    perUserLimit: Number(row.per_user_limit ?? 1),
    userRedemptions: Number(redemptions?.n ?? 0),
    active: Number(row.active) === 1,
  };
}

export function quoteCart(
  db: DatabaseSync,
  input: { lines: CartRequestLine[]; service?: ServiceMode; couponCode?: string; scheduled?: SlotInput | null; userId?: string | null; phone?: string },
  now = new Date(),
): QuoteResult {
  const settings = readSettings(db);
  const closures = readClosures(db);
  const service: ServiceMode = input.service === "pickup" ? "pickup" : "delivery";
  const built = priceLines(db, input.lines ?? [], now);
  const subtotalCents = built.lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const couponCode = sanitizeText(input.couponCode, 40).toUpperCase();
  const coupon = couponCode ? couponFor(db, couponCode, input.userId ?? null, input.phone ?? "") : null;
  const couponResult = couponCode ? evaluateCoupon(coupon, subtotalCents, now) : { ok: true as const, discountCents: 0, code: "" };
  const discountCents = couponResult.ok ? couponResult.discountCents : 0;
  const fee = deliveryFeeCents(subtotalCents, settings, service);
  const totalCents = subtotalCents - discountCents + fee;
  const decision = orderingDecision(now, settings, closures, service, input.scheduled ?? null);
  const belowMinimum = subtotalCents > 0 && subtotalCents < settings.minOrderCents;
  const issueCode = built.issues[0]?.code;
  const orderingCode = !decision.ok ? decision.code : belowMinimum ? "minimum" : issueCode ?? (built.lines.length === 0 ? "empty" : "ok");
  const couponBlocks = Boolean(couponCode) && !couponResult.ok;
  return {
    lines: built.lines.map((line) => ({
      lineId: line.lineId,
      productId: line.productId,
      name: line.name,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
      image: line.image,
      optionsLabel: line.optionsLabel,
      allergens: line.allergens,
      category: line.category,
    })),
    issues: built.issues,
    subtotal: centsToEuros(subtotalCents),
    discount: centsToEuros(discountCents),
    deliveryFee: centsToEuros(fee),
    vatIncluded: centsToEuros(includedVatCents(totalCents, settings.vatRate)),
    vatRate: settings.vatRate,
    total: centsToEuros(totalCents),
    totalCents,
    couponCode,
    couponStatus: couponResult.code,
    service,
    orderingCode,
    nextOpenAt: "nextOpenAt" in decision ? decision.nextOpenAt ?? null : null,
    canSubmit: built.issues.length === 0 && built.lines.length > 0 && decision.ok && !belowMinimum && !couponBlocks,
    prepMinutes: settings.prepMinutes,
    minOrder: centsToEuros(settings.minOrderCents),
  };
}

function mapOrder(db: DatabaseSync, row: Row, includeToken: boolean): PublicOrder {
  const items = rows(db, "SELECT * FROM order_items WHERE order_id = ?", String(row.id)).map((item) => {
    const labels = JSON.parse(String(item.options_json || "[]")) as string[];
    return {
      id: String(item.id),
      productId: String(item.product_id),
      name: String(item.name),
      price: centsToEuros(Number(item.unit_price_cents)),
      quantity: Number(item.quantity),
      image: String(item.image),
      optionsLabel: Array.isArray(labels) ? labels.filter(Boolean).join(", ") : "",
      allergens: String(item.allergens ?? ""),
    };
  });
  return {
    id: String(row.id),
    items,
    subtotal: centsToEuros(Number(row.subtotal_cents)),
    discount: centsToEuros(Number(row.discount_cents)),
    deliveryFee: centsToEuros(Number(row.delivery_fee_cents)),
    vatIncluded: centsToEuros(Number(row.vat_cents)),
    vatRate: Number(row.vat_rate),
    total: centsToEuros(Number(row.total_cents)),
    paymentMethod: row.payment_method === "online" ? "online" : "cod",
    paymentStatus: String(row.payment_status) as PaymentStatus,
    status: normalizeFulfillment(String(row.fulfillment_status)),
    service: row.service === "pickup" ? "pickup" : "delivery",
    couponCode: row.coupon_code ? String(row.coupon_code) : null,
    customer: {
      name: String(row.customer_name),
      phone: String(row.customer_phone),
      email: String(row.customer_email ?? ""),
      address: String(row.address ?? ""),
      note: String(row.note ?? ""),
    },
    scheduledFor: row.scheduled_for ? String(row.scheduled_for) : null,
    createdAt: String(row.created_at),
    ...(includeToken ? { accessToken: String(row.access_token) } : {}),
  };
}

function newOrderId(db: DatabaseSync) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const bytes = randomBytes(6);
    let id = "OM-";
    for (const byte of bytes) id += alphabet[byte % alphabet.length];
    if (!one(db, "SELECT id FROM orders WHERE id = ?", id)) return id;
  }
  return `OM-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function placeOrder(
  db: DatabaseSync,
  input: {
    lines: CartRequestLine[];
    service?: ServiceMode;
    couponCode?: string;
    scheduled?: SlotInput | null;
    userId?: string | null;
    idempotencyKey: string;
    expectedTotalCents: number;
    paymentMethod?: string;
    customer: { name?: string; phone?: string; email?: string; address?: string; note?: string };
    paymentStatus?: string;
    total?: number;
  },
  now = new Date(),
) {
  const key = sanitizeText(input.idempotencyKey, 80);
  if (key.length < 16) return { ok: false as const, code: "generic" };
  const userId = input.userId ?? null;
  const existing = one(db, "SELECT * FROM orders WHERE idempotency_key = ?", key);
  if (existing) {
    if ((existing.user_id ? String(existing.user_id) : null) !== userId) return { ok: false as const, code: "forbidden" };
    return { ok: true as const, order: mapOrder(db, existing, true), replayed: true };
  }
  const name = sanitizeText(input.customer?.name, 80);
  const phone = sanitizeText(input.customer?.phone, 30);
  const email = sanitizeText(input.customer?.email, 120).toLowerCase();
  const address = sanitizeText(input.customer?.address, 240);
  const note = sanitizeText(input.customer?.note, 300);
  const digits = phoneDigits(phone);
  if (name.length < 2 || digits.length < 8) return { ok: false as const, code: "customer" };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false as const, code: "email" };
  const service: ServiceMode = input.service === "pickup" ? "pickup" : "delivery";
  if (service === "delivery" && address.length < 8) return { ok: false as const, code: "address" };
  const method = input.paymentMethod === "online" ? "online" : "cod";
  const paymentStatus: PaymentStatus = method === "online" ? "pending" : "unpaid";

  const preview = quoteCart(db, { lines: input.lines, service, couponCode: input.couponCode, scheduled: input.scheduled, userId, phone }, now);
  if (!preview.canSubmit) return { ok: false as const, code: preview.orderingCode === "ok" ? preview.couponStatus || "generic" : preview.orderingCode, quote: preview };
  if (preview.totalCents !== input.expectedTotalCents) return { ok: false as const, code: "total_changed", quote: preview };

  const orderId = newOrderId(db);
  const token = randomBytes(24).toString("hex");
  const couponCode = preview.couponCode || null;
  try {
    db.exec("BEGIN IMMEDIATE");
    const again = one(db, "SELECT * FROM orders WHERE idempotency_key = ?", key);
    if (again) {
      db.exec("ROLLBACK");
      return { ok: true as const, order: mapOrder(db, again, true), replayed: true };
    }
    const fresh = quoteCart(db, { lines: input.lines, service, couponCode: input.couponCode, scheduled: input.scheduled, userId, phone }, now);
    if (!fresh.canSubmit || fresh.totalCents !== input.expectedTotalCents) {
      db.exec("ROLLBACK");
      return { ok: false as const, code: fresh.totalCents !== input.expectedTotalCents ? "total_changed" : fresh.orderingCode, quote: fresh };
    }
    const built = priceLines(db, input.lines, now);
    const quantities = new Map<string, number>();
    for (const line of built.lines) quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
    for (const [productId, quantity] of quantities) {
      const product = one(db, "SELECT stock FROM products WHERE id = ?", productId);
      if (!product) throw new Error("missing product");
      if (product.stock !== null && product.stock !== undefined) {
        const updated = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?").run(quantity, productId, quantity);
        if (changesOf(updated) !== 1) {
          db.exec("ROLLBACK");
          return { ok: false as const, code: "stock" };
        }
      }
    }
    if (couponCode) {
      const updated = db
        .prepare("UPDATE coupons SET used_count = used_count + 1 WHERE code = ? AND active = 1 AND (usage_limit IS NULL OR used_count < usage_limit)")
        .run(couponCode);
      if (changesOf(updated) !== 1) {
        db.exec("ROLLBACK");
        return { ok: false as const, code: "coupon_limit" };
      }
      const rule = couponFor(db, couponCode, userId, phone);
      if (!rule || rule.userRedemptions >= rule.perUserLimit) {
        db.exec("ROLLBACK");
        return { ok: false as const, code: "coupon_user_limit" };
      }
    }
    db.prepare(
      `INSERT INTO orders (
        id, user_id, idempotency_key, access_token, legacy, fulfillment_status, payment_status, payment_method, service,
        subtotal_cents, discount_cents, delivery_fee_cents, vat_cents, vat_rate, total_cents, coupon_code,
        customer_name, customer_phone, customer_phone_digits, customer_email, address, note, scheduled_for, created_at
      ) VALUES (?, ?, ?, ?, 0, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      orderId,
      userId,
      key,
      token,
      paymentStatus,
      method,
      service,
      eurosToCents(fresh.subtotal),
      eurosToCents(fresh.discount),
      eurosToCents(fresh.deliveryFee),
      eurosToCents(fresh.vatIncluded),
      fresh.vatRate,
      fresh.totalCents,
      couponCode,
      name,
      phone,
      digits,
      email,
      service === "pickup" ? "" : address,
      note,
      (() => {
        const slot = orderingDecision(now, readSettings(db), readClosures(db), service, input.scheduled ?? null);
        return slot.ok ? slot.scheduledFor : null;
      })(),
      now.toISOString(),
    );
    const insertItem = db.prepare(
      `INSERT INTO order_items (id, order_id, product_id, name, unit_price_cents, quantity, image, options_json, allergens, line_total_cents)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const line of built.lines) {
      insertItem.run(
        randomUUID(),
        orderId,
        line.productId,
        line.name,
        line.unitPriceCents,
        line.quantity,
        line.image,
        JSON.stringify(line.optionsLabel ? line.optionsLabel.split(", ") : []),
        line.allergens,
        line.lineTotalCents,
      );
    }
    if (couponCode) {
      db.prepare("INSERT INTO coupon_redemptions (id, code, order_id, user_id, created_at) VALUES (?, ?, ?, ?, ?)").run(
        randomUUID(),
        couponCode,
        orderId,
        userId,
        now.toISOString(),
      );
    }
    db.exec("COMMIT");
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* already closed */
    }
    const raced = one(db, "SELECT * FROM orders WHERE idempotency_key = ?", key);
    if (raced) return { ok: true as const, order: mapOrder(db, raced, true), replayed: true };
    console.error("placeOrder failed");
    throw error;
  }
  const saved = one(db, "SELECT * FROM orders WHERE id = ?", orderId);
  if (!saved) return { ok: false as const, code: "generic" };
  return { ok: true as const, order: mapOrder(db, saved, true), replayed: false };
}

export function orderForViewer(db: DatabaseSync, id: string, viewer: { userId?: string | null; token?: string | null; phone?: string | null }) {
  const row = one(db, "SELECT * FROM orders WHERE id = ?", id.trim());
  if (!row) return null;
  const owner = viewer.userId && row.user_id && String(row.user_id) === viewer.userId;
  const tokenOk = viewer.token && String(row.access_token) === viewer.token;
  const phoneOk = viewer.phone && phoneDigits(viewer.phone).length >= 8 && phoneDigits(viewer.phone) === String(row.customer_phone_digits);
  if (!owner && !tokenOk && !phoneOk) return null;
  return mapOrder(db, row, Boolean(tokenOk));
}

export function ordersForUser(db: DatabaseSync, userId: string) {
  return rows(db, "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", userId).map((row) => mapOrder(db, row, false));
}

export function ordersForAdmin(db: DatabaseSync) {
  return rows(db, "SELECT * FROM orders ORDER BY created_at DESC").map((row) => mapOrder(db, row, false));
}

export function updateOrderAdmin(db: DatabaseSync, id: string, patch: { fulfillment?: string; payment?: string }) {
  const row = one(db, "SELECT * FROM orders WHERE id = ?", id);
  if (!row) return { ok: false as const, code: "not_found" };
  if (patch.fulfillment) {
    const status = patch.fulfillment === "delivered" ? "completed" : patch.fulfillment;
    if (!FULFILLMENT_STATUSES.includes(status as FulfillmentStatus)) return { ok: false as const, code: "generic" };
    db.prepare("UPDATE orders SET fulfillment_status = ? WHERE id = ?").run(status, id);
  }
  if (patch.payment) {
    const payment = patch.payment as PaymentStatus;
    if (!["unpaid", "pending", "paid", "failed", "cancelled"].includes(payment)) return { ok: false as const, code: "generic" };
    if (payment === "paid" && row.payment_method !== "cod") return { ok: false as const, code: "payment_locked" };
    db.prepare("UPDATE orders SET payment_status = ? WHERE id = ?").run(payment, id);
  }
  const next = one(db, "SELECT * FROM orders WHERE id = ?", id);
  return { ok: true as const, order: mapOrder(db, next!, false) };
}

export function applyPaymentEvent(db: DatabaseSync, event: { id: string; type: "paid" | "failed" | "cancelled"; orderId: string; amountCents?: number }, now = new Date()) {
  if (one(db, "SELECT id FROM payment_events WHERE id = ?", event.id)) return { ok: true as const, duplicate: true };
  const row = one(db, "SELECT * FROM orders WHERE id = ?", event.orderId);
  if (!row) return { ok: false as const, code: "not_found" };
  if (event.type === "paid") {
    if (event.amountCents === undefined || event.amountCents !== Number(row.total_cents)) return { ok: false as const, code: "generic" };
    db.prepare("UPDATE orders SET payment_status = 'paid' WHERE id = ?").run(event.orderId);
  } else if (event.type === "failed") {
    db.prepare("UPDATE orders SET payment_status = 'failed' WHERE id = ?").run(event.orderId);
  } else {
    db.prepare("UPDATE orders SET payment_status = 'cancelled' WHERE id = ?").run(event.orderId);
  }
  db.prepare("INSERT INTO payment_events (id, order_id, created_at) VALUES (?, ?, ?)").run(event.id, event.orderId, now.toISOString());
  const next = one(db, "SELECT fulfillment_status, payment_status FROM orders WHERE id = ?", event.orderId);
  return { ok: true as const, duplicate: false, fulfillment: String(next?.fulfillment_status), payment: String(next?.payment_status) };
}

export function recommendIds(db: DatabaseSync, anchorIds: string[], excludeIds: string[], limit = 4, now = new Date()) {
  const catalog = rows(db, "SELECT * FROM products").map((row) => ({
    id: String(row.id),
    category: String(row.category),
    name: String(row.name),
    available: sellable(row, now),
  }));
  const anchors = anchorIds
    .map((id) => catalog.find((item) => item.id === id))
    .filter((item): item is { id: string; category: string; name: string; available: boolean } => Boolean(item));
  const ids = anchors.map(() => "?").join(",");
  const explicit = anchors.length
    ? rows(db, `SELECT product_id, related_id FROM related_products WHERE product_id IN (${ids})`, ...anchors.map((item) => item.id)).map((row) => ({
        productId: String(row.product_id),
        relatedId: String(row.related_id),
      }))
    : [];
  return recommendProducts({
    anchors,
    catalog,
    complements: listComplements(db),
    explicit,
    excludeIds,
    limit,
  });
}

export function recommendedProducts(db: DatabaseSync, anchorIds: string[], excludeIds: string[], limit = 4) {
  const ids = recommendIds(db, anchorIds, excludeIds, limit);
  const products = listProducts(db);
  return ids.map((id) => products.find((product) => product.id === id)).filter((product): product is MenuProduct => Boolean(product));
}

function sessionUser(db: DatabaseSync, token: string, now = new Date()) {
  const row = one(
    db,
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > ?`,
    token,
    now.toISOString(),
  );
  return row ? publicUser(row) : null;
}

export function userFromSession(db: DatabaseSync, token: string | undefined) {
  if (!token) return null;
  return sessionUser(db, token);
}

export function registerCustomer(db: DatabaseSync, input: { name?: string; email?: string; password?: string; role?: string }, now = new Date()) {
  const name = sanitizeText(input.name, 80);
  const email = sanitizeText(input.email, 120).toLowerCase();
  const password = String(input.password ?? "");
  if (name.length < 2) return { ok: false as const, code: "name" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false as const, code: "email" };
  if (password.length < 8) return { ok: false as const, code: "password" };
  if (one(db, "SELECT id FROM users WHERE email = ?", email)) return { ok: false as const, code: "email_taken" };
  const id = randomUUID();
  db.prepare("INSERT INTO users (id, name, email, password_hash, phone, address, role, created_at) VALUES (?, ?, ?, ?, '', '', 'customer', ?)").run(
    id,
    name,
    email,
    hashPassword(password),
    now.toISOString(),
  );
  const sessionId = randomBytes(32).toString("hex");
  const expires = new Date(now.getTime() + 30 * 86400000).toISOString();
  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(sessionId, id, expires);
  const user = one(db, "SELECT * FROM users WHERE id = ?", id);
  return { ok: true as const, user: publicUser(user!), sessionId };
}

export function login(db: DatabaseSync, email: string, password: string, now = new Date()) {
  const row = one(db, "SELECT * FROM users WHERE email = ?", sanitizeText(email, 120).toLowerCase());
  if (!row || !verifyPassword(password, String(row.password_hash))) return { ok: false as const, code: "credentials" };
  const sessionId = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(
    sessionId,
    String(row.id),
    new Date(now.getTime() + 30 * 86400000).toISOString(),
  );
  return { ok: true as const, user: publicUser(row), sessionId };
}

export function logout(db: DatabaseSync, token: string | undefined) {
  if (token) db.prepare("DELETE FROM sessions WHERE id = ?").run(token);
}

export function updateProfile(db: DatabaseSync, userId: string, input: { name?: string; phone?: string; address?: string }) {
  const name = sanitizeText(input.name, 80);
  const phone = sanitizeText(input.phone, 30);
  const address = sanitizeText(input.address, 240);
  if (name.length < 2) return { ok: false as const, code: "name" };
  db.prepare("UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ? AND role = 'customer'").run(name, phone, address, userId);
  const row = one(db, "SELECT * FROM users WHERE id = ?", userId);
  return { ok: true as const, user: publicUser(row!) };
}

export function createReview(db: DatabaseSync, userId: string, input: { productId?: string; orderItemId?: string; rating?: number; body?: string }, now = new Date()) {
  const productId = sanitizeText(input.productId, 80);
  const orderItemId = sanitizeText(input.orderItemId, 80);
  const item = one(
    db,
    `SELECT oi.id, oi.product_id, o.user_id, o.fulfillment_status, o.payment_status
     FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.id = ?`,
    orderItemId,
  );
  if (!item) return { ok: false as const, code: "review_forbidden" };
  const decision = reviewEligibility({
    actorUserId: userId,
    orderUserId: item.user_id ? String(item.user_id) : null,
    fulfillmentStatus: normalizeFulfillment(String(item.fulfillment_status)),
    paymentStatus: String(item.payment_status),
    itemProductId: String(item.product_id),
    requestedProductId: productId,
    orderItemId,
    alreadyReviewed: Boolean(one(db, "SELECT id FROM reviews WHERE order_item_id = ?", orderItemId)),
  });
  if (!decision.ok) return decision;
  const rating = Math.round(Number(input.rating));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false as const, code: "review_rating" };
  const body = sanitizeText(input.body, 1000);
  if (body.length < 10) return { ok: false as const, code: "review_body" };
  const id = randomUUID();
  db.prepare(
    "INSERT INTO reviews (id, product_id, user_id, order_id, order_item_id, rating, body, status, created_at) VALUES (?, ?, ?, (SELECT order_id FROM order_items WHERE id = ?), ?, ?, ?, 'pending', ?)",
  ).run(id, productId, userId, orderItemId, orderItemId, rating, body, now.toISOString());
  return { ok: true as const, id };
}

export function eligibleOrderItem(db: DatabaseSync, userId: string, productId: string) {
  const items = rows(
    db,
    `SELECT oi.id, oi.product_id, o.user_id, o.fulfillment_status, o.payment_status
     FROM order_items oi JOIN orders o ON o.id = oi.order_id
     WHERE o.user_id = ? AND oi.product_id = ? AND o.fulfillment_status = 'completed'
     ORDER BY o.created_at DESC`,
    userId,
    productId,
  );
  for (const item of items) {
    const decision = reviewEligibility({
      actorUserId: userId,
      orderUserId: String(item.user_id),
      fulfillmentStatus: "completed",
      paymentStatus: String(item.payment_status),
      itemProductId: String(item.product_id),
      requestedProductId: productId,
      orderItemId: String(item.id),
      alreadyReviewed: Boolean(one(db, "SELECT id FROM reviews WHERE order_item_id = ?", String(item.id))),
    });
    if (decision.ok) return String(item.id);
  }
  return null;
}

function mapReview(row: Row, includeStatus: boolean): PublicReview {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    productName: String(row.product_name ?? ""),
    productSlug: String(row.product_slug ?? ""),
    rating: Number(row.rating),
    body: String(row.body),
    createdAt: String(row.created_at),
    author: publicAuthor(String(row.author_name ?? "")),
    ...(includeStatus ? { status: String(row.status) } : {}),
  };
}

export function listPublicReviews(db: DatabaseSync, query: { productId?: string; sort?: string; page?: number; pageSize?: number }) {
  const requestedSize = Number(query.pageSize);
  const requestedPage = Number(query.page);
  const pageSize = Math.min(10, Math.max(1, Number.isFinite(requestedSize) ? requestedSize : 5));
  const page = Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1);
  const productId = query.productId ? sanitizeText(query.productId, 80) : "";
  const where = productId ? "WHERE r.product_id = ? AND r.status = 'approved'" : "WHERE r.status = 'approved'";
  const params = productId ? [productId] : [];
  const order = query.sort === "highest" ? "r.rating DESC, r.created_at DESC" : "r.created_at DESC";
  const total = Number((one(db, `SELECT COUNT(*) AS n FROM reviews r ${where}`, ...params)?.n ?? 0));
  const reviews = rows(
    db,
    `SELECT r.*, u.name AS author_name, p.name AS product_name, p.slug AS product_slug
     FROM reviews r JOIN users u ON u.id = r.user_id JOIN products p ON p.id = r.product_id
     ${where} ORDER BY ${order} LIMIT ? OFFSET ?`,
    ...params,
    pageSize,
    (page - 1) * pageSize,
  ).map((row) => mapReview(row, false));
  let summary: { average: number | null; count: number; distribution: Record<string, number> } | null = null;
  if (productId) {
    const stats = reviewStats(db, productId);
    const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    for (const row of rows(db, "SELECT rating, COUNT(*) AS n FROM reviews WHERE product_id = ? AND status = 'approved' GROUP BY rating", productId)) {
      distribution[String(row.rating)] = Number(row.n);
    }
    summary = { average: stats.average, count: stats.count, distribution };
  }
  return { reviews, summary, page, pageCount: Math.max(1, Math.ceil(total / pageSize)), total };
}

export function reportReview(db: DatabaseSync, userId: string, reviewId: string, reason: string, now = new Date()) {
  const review = one(db, "SELECT id FROM reviews WHERE id = ? AND status = 'approved'", reviewId);
  if (!review) return { ok: false as const, code: "not_found" };
  const body = sanitizeText(reason, 300);
  if (body.length < 5) return { ok: false as const, code: "review_body" };
  if (one(db, "SELECT id FROM review_reports WHERE review_id = ? AND user_id = ?", reviewId, userId)) return { ok: true as const };
  db.prepare("INSERT INTO review_reports (id, review_id, user_id, reason, status, created_at) VALUES (?, ?, ?, ?, 'open', ?)").run(
    randomUUID(),
    reviewId,
    userId,
    body,
    now.toISOString(),
  );
  return { ok: true as const };
}

export function adminReviews(db: DatabaseSync) {
  const reviews = rows(
    db,
    `SELECT r.*, u.name AS author_name, p.name AS product_name, p.slug AS product_slug
     FROM reviews r JOIN users u ON u.id = r.user_id JOIN products p ON p.id = r.product_id
     ORDER BY r.created_at DESC`,
  ).map((row) => mapReview(row, true));
  const reports = rows(
    db,
    `SELECT rr.*, r.body AS review_body FROM review_reports rr JOIN reviews r ON r.id = rr.review_id WHERE rr.status = 'open' ORDER BY rr.created_at DESC`,
  ).map((row) => ({
    id: String(row.id),
    reviewId: String(row.review_id),
    reason: String(row.reason),
    createdAt: String(row.created_at),
  }));
  return { reviews, reports };
}

export function moderateReview(db: DatabaseSync, id: string, status: string) {
  if (!["pending", "approved", "rejected", "hidden"].includes(status)) return { ok: false as const, code: "generic" };
  const updated = db.prepare("UPDATE reviews SET status = ? WHERE id = ?").run(status, id);
  if (changesOf(updated) !== 1) return { ok: false as const, code: "not_found" };
  if (status === "rejected" || status === "hidden") {
    db.prepare("UPDATE review_reports SET status = 'resolved' WHERE review_id = ?").run(id);
  }
  return { ok: true as const };
}

export function resolveReport(db: DatabaseSync, id: string) {
  db.prepare("UPDATE review_reports SET status = 'resolved' WHERE id = ?").run(id);
  return { ok: true as const };
}

const SLUGS = CATEGORY_IDS;

export function saveProduct(db: DatabaseSync, input: Record<string, unknown>, now = new Date()) {
  const name = sanitizeText(input.name, 80);
  const description = sanitizeText(input.description, 600);
  const category = String(input.category ?? "");
  const price = Number(String(input.price ?? "").replace(",", "."));
  const image = String(input.image ?? "");
  const allergens = allergenText(input.allergens);
  if (!allergens.ok) return { ok: false as const, code: allergens.code };
  const ingredients = sanitizeText(input.ingredients, 500);
  if (!name || !description || !SLUGS.has(category as MenuCategory)) return { ok: false as const, code: "generic" };
  if (!Number.isFinite(price) || price <= 0 || price > 500) return { ok: false as const, code: "generic" };
  if (!image || image.length > 1_500_000) return { ok: false as const, code: "generic" };
  const id = sanitizeText(input.id, 80) || `p-${Date.now().toString().slice(-8)}`;
  const baseSlug = sanitizeText(input.slug, 80) || name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  let slug = baseSlug || id;
  let suffix = 2;
  while (true) {
    const clash = one(db, "SELECT id FROM products WHERE slug = ?", slug);
    if (!clash || String(clash.id) === id) break;
    slug = `${baseSlug}-${suffix++}`;
  }
  const stockRaw = input.stock === "" || input.stock === null || input.stock === undefined ? null : Math.floor(Number(input.stock));
  const stock = stockRaw === null || !Number.isFinite(stockRaw) ? null : Math.max(0, stockRaw);
  const variants = Array.isArray(input.variants) ? input.variants : null;
  const extraIds = Array.isArray(input.extraIds) ? input.extraIds.map((item) => sanitizeText(item, 80)) : null;
  const relatedIds = Array.isArray(input.relatedIds) ? input.relatedIds.map((item) => sanitizeText(item, 80)).filter((item) => item && item !== id) : null;
  db.exec("BEGIN IMMEDIATE");
  try {
    const exists = one(db, "SELECT id FROM products WHERE id = ?", id);
    if (exists) {
      db.prepare(
        `UPDATE products SET slug = ?, name = ?, category = ?, price_cents = ?, image = ?, description = ?, available = ?, stock = ?, allergens = ?, ingredients = ?, is_combo = ?, available_from = ?, available_until = ? WHERE id = ?`,
      ).run(
        slug,
        name,
        category,
        eurosToCents(price),
        image,
        description,
        input.available === false ? 0 : 1,
        stock,
        allergens.value,
        ingredients,
        input.isCombo ? 1 : 0,
        input.availableFrom ? String(input.availableFrom) : null,
        input.availableUntil ? String(input.availableUntil) : null,
        id,
      );
    } else {
      db.prepare(
        `INSERT INTO products (id, slug, name, category, price_cents, image, description, available, stock, allergens, ingredients, is_combo, available_from, available_until, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        slug,
        name,
        category,
        eurosToCents(price),
        image,
        description,
        input.available === false ? 0 : 1,
        stock,
        allergens.value,
        ingredients,
        input.isCombo ? 1 : 0,
        input.availableFrom ? String(input.availableFrom) : null,
        input.availableUntil ? String(input.availableUntil) : null,
        now.toISOString(),
      );
    }
    if (variants) {
      db.prepare("DELETE FROM variants WHERE product_id = ?").run(id);
      const insertVariant = db.prepare(
        "INSERT INTO variants (id, product_id, group_name, name, price_delta_cents, available, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
      );
      variants.forEach((variant, index) => {
        const record = variant as Record<string, unknown>;
        const variantName = sanitizeText(record.name, 60);
        const group = sanitizeText(record.group, 40) || "Option";
        const delta = Number(String(record.priceDelta ?? 0).replace(",", "."));
        if (!variantName || !Number.isFinite(delta)) return;
        insertVariant.run(sanitizeText(record.id, 80) || randomUUID(), id, group, variantName, eurosToCents(delta), record.available === false ? 0 : 1, index);
      });
    }
    if (extraIds) {
      db.prepare("DELETE FROM product_extras WHERE product_id = ?").run(id);
      const linkExtra = db.prepare("INSERT OR IGNORE INTO product_extras (product_id, extra_id) SELECT ?, id FROM extras WHERE id = ?");
      for (const extraId of extraIds) linkExtra.run(id, extraId);
    }
    if (relatedIds) {
      db.prepare("DELETE FROM related_products WHERE product_id = ?").run(id);
      const linkRelated = db.prepare("INSERT OR IGNORE INTO related_products (product_id, related_id) SELECT ?, id FROM products WHERE id = ?");
      for (const relatedId of relatedIds) linkRelated.run(id, relatedId);
    }
    db.exec("COMMIT");
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* already closed */
    }
    throw error;
  }
  const saved = one(db, "SELECT * FROM products WHERE id = ?", id);
  return { ok: true as const, product: mapProduct(db, saved!, now) };
}

export function deleteProduct(db: DatabaseSync, id: string) {
  const updated = db.prepare("DELETE FROM products WHERE id = ?").run(id);
  return changesOf(updated) === 1;
}

export function saveExtra(db: DatabaseSync, input: { id?: string; name?: string; price?: number; available?: boolean }) {
  const name = sanitizeText(input.name, 60);
  const price = Number(input.price);
  if (!name || !Number.isFinite(price) || price < 0 || price > 100) return { ok: false as const, code: "generic" };
  const id = sanitizeText(input.id, 80) || randomUUID();
  const exists = one(db, "SELECT id FROM extras WHERE id = ?", id);
  if (exists) {
    db.prepare("UPDATE extras SET name = ?, price_cents = ?, available = ? WHERE id = ?").run(name, eurosToCents(price), input.available === false ? 0 : 1, id);
  } else {
    db.prepare("INSERT INTO extras (id, name, price_cents, available) VALUES (?, ?, ?, ?)").run(id, name, eurosToCents(price), input.available === false ? 0 : 1);
  }
  return { ok: true as const, extra: { id, name, price, available: input.available !== false } };
}

export function deleteExtra(db: DatabaseSync, id: string) {
  db.prepare("DELETE FROM extras WHERE id = ?").run(id);
  return { ok: true as const };
}

export function listCoupons(db: DatabaseSync) {
  return rows(db, "SELECT * FROM coupons ORDER BY code").map((row) => ({
    code: String(row.code),
    type: String(row.type) as "percent" | "fixed",
    value: row.type === "fixed" ? centsToEuros(Number(row.value)) : Number(row.value),
    minSubtotal: centsToEuros(Number(row.min_subtotal_cents)),
    expiresAt: row.expires_at ? String(row.expires_at) : "",
    startsAt: row.starts_at ? String(row.starts_at) : "",
    usageLimit: row.usage_limit === null || row.usage_limit === undefined ? "" : Number(row.usage_limit),
    usedCount: Number(row.used_count),
    perUserLimit: Number(row.per_user_limit),
    active: Number(row.active) === 1,
  }));
}

export function saveCoupon(db: DatabaseSync, input: Record<string, unknown>) {
  const code = sanitizeText(input.code, 40).toUpperCase();
  const type = input.type === "fixed" ? "fixed" : "percent";
  const value = Number(String(input.value ?? "").replace(",", "."));
  const minSubtotal = Number(String(input.minSubtotal ?? 0).replace(",", "."));
  const perUser = Math.max(1, Math.floor(Number(input.perUserLimit ?? 1)));
  const usageRaw = input.usageLimit === "" || input.usageLimit === null || input.usageLimit === undefined ? null : Math.floor(Number(input.usageLimit));
  if (!/^[A-Z0-9-]{3,40}$/.test(code)) return { ok: false as const, code: "generic" };
  if (!Number.isFinite(value) || value <= 0) return { ok: false as const, code: "generic" };
  if (type === "percent" && value > 100) return { ok: false as const, code: "generic" };
  const storedValue = type === "fixed" ? eurosToCents(value) : Math.round(value);
  const startsAt = input.startsAt ? new Date(String(input.startsAt)).toISOString() : null;
  const expiresAt = input.expiresAt ? new Date(String(input.expiresAt)).toISOString() : null;
  if ((input.startsAt && Number.isNaN(Date.parse(String(input.startsAt)))) || (input.expiresAt && Number.isNaN(Date.parse(String(input.expiresAt))))) {
    return { ok: false as const, code: "bad_schedule" };
  }
  const exists = one(db, "SELECT code FROM coupons WHERE code = ?", code);
  if (exists) {
    db.prepare(
      "UPDATE coupons SET type = ?, value = ?, min_subtotal_cents = ?, expires_at = ?, starts_at = ?, usage_limit = ?, per_user_limit = ?, active = ? WHERE code = ?",
    ).run(type, storedValue, eurosToCents(Number.isFinite(minSubtotal) ? minSubtotal : 0), expiresAt, startsAt, usageRaw, perUser, input.active === false ? 0 : 1, code);
  } else {
    db.prepare(
      "INSERT INTO coupons (code, type, value, min_subtotal_cents, expires_at, starts_at, usage_limit, used_count, per_user_limit, active) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)",
    ).run(type === "fixed" ? code : code, type, storedValue, eurosToCents(Number.isFinite(minSubtotal) ? minSubtotal : 0), expiresAt, startsAt, usageRaw, perUser, input.active === false ? 0 : 1);
  }
  return { ok: true as const };
}

export function deleteCoupon(db: DatabaseSync, code: string) {
  db.prepare("DELETE FROM coupons WHERE code = ?").run(code.toUpperCase());
  return { ok: true as const };
}

export function saveRestaurantSettings(db: DatabaseSync, input: PublicInfo & { complements?: { category: string; complement: string }[] }) {
  try {
    new Intl.DateTimeFormat("fr-FR", { timeZone: input.timezone }).format(new Date());
  } catch {
    return { ok: false as const, code: "bad_schedule" };
  }
  const hours: RestaurantSettings["hours"] = {};
  for (let day = 0; day < 7; day += 1) {
    const windows = input.hours?.[String(day)] ?? [];
    hours[String(day)] = windows
      .map((window) => ({ open: sanitizeText(window.open, 5), close: sanitizeText(window.close, 5) }))
      .filter((window) => /^\d{2}:\d{2}$/.test(window.open) && /^\d{2}:\d{2}$/.test(window.close));
  }
  const settings: RestaurantSettings = {
    timezone: input.timezone,
    hours,
    deliveryEnabled: Boolean(input.deliveryEnabled),
    pickupEnabled: Boolean(input.pickupEnabled),
    minOrderCents: eurosToCents(Number(input.minOrder) || 0),
    deliveryFeeCents: eurosToCents(Number(input.deliveryFee) || 0),
    freeDeliveryFromCents: eurosToCents(Number(input.freeDeliveryFrom) || 0),
    prepMinutes: Math.max(0, Math.min(240, Math.floor(Number(input.prepMinutes) || 0))),
    vatRate: Math.max(0, Math.min(30, Number(input.vatRate) || 0)),
    allowScheduled: Boolean(input.allowScheduled),
  };
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("INSERT INTO settings (key, value) VALUES ('restaurant', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(JSON.stringify(settings));
    db.prepare("DELETE FROM closures").run();
    const insertClosure = db.prepare("INSERT INTO closures (id, date, service, reason) VALUES (?, ?, ?, ?)");
    for (const closure of input.closures ?? []) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(closure.date)) continue;
      const service = closure.service === "delivery" || closure.service === "pickup" ? closure.service : "both";
      insertClosure.run(randomUUID(), closure.date, service, sanitizeText(closure.reason, 160));
    }
    if (input.complements) {
      db.prepare("DELETE FROM complementary_categories").run();
      const insert = db.prepare("INSERT INTO complementary_categories (category, complement) VALUES (?, ?)");
      for (const pair of input.complements) {
        if (!SLUGS.has(pair.category as MenuCategory) || !SLUGS.has(pair.complement as MenuCategory) || pair.category === pair.complement) continue;
        insert.run(pair.category, pair.complement);
      }
    }
    db.exec("COMMIT");
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* already closed */
    }
    throw error;
  }
  return { ok: true as const, info: publicInfo(db) };
}

export function importLegacy(db: DatabaseSync, payload: { products?: Record<string, unknown>[]; orders?: Record<string, unknown>[] }, now = new Date()) {
  let products = 0;
  let orders = 0;
  for (const product of payload.products ?? []) {
    if (!product.id) continue;
    const saved = saveProduct(db, product, now);
    if (saved.ok) products += 1;
  }
  for (const order of payload.orders ?? []) {
    const id = sanitizeText(order.id, 40);
    if (!id || one(db, "SELECT id FROM orders WHERE id = ?", id)) continue;
    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length === 0) continue;
    const customer = (order.customer ?? {}) as Record<string, unknown>;
    const status = normalizeFulfillment(String(order.status ?? "pending"));
    const method = order.paymentMethod === "online" ? "online" : "cod";
    db.prepare(
      `INSERT INTO orders (
        id, user_id, idempotency_key, access_token, legacy, fulfillment_status, payment_status, payment_method, service,
        subtotal_cents, discount_cents, delivery_fee_cents, vat_cents, vat_rate, total_cents, coupon_code,
        customer_name, customer_phone, customer_phone_digits, customer_email, address, note, scheduled_for, created_at
      ) VALUES (?, NULL, NULL, ?, 1, ?, ?, ?, 'delivery', ?, 0, ?, 0, 0, ?, NULL, ?, ?, ?, '', ?, ?, NULL, ?)`,
    ).run(
      id,
      randomBytes(24).toString("hex"),
      status,
      method === "online" ? "pending" : "unpaid",
      method,
      eurosToCents(Number(order.subtotal) || 0),
      eurosToCents(Number(order.deliveryFee) || 0),
      eurosToCents(Number(order.total) || 0),
      sanitizeText(customer.name, 80) || "Client",
      sanitizeText(customer.phone, 30),
      phoneDigits(String(customer.phone ?? "")),
      sanitizeText(customer.address, 240),
      sanitizeText(customer.note, 300),
      typeof order.createdAt === "string" ? order.createdAt : now.toISOString(),
    );
    const insertItem = db.prepare(
      "INSERT INTO order_items (id, order_id, product_id, name, unit_price_cents, quantity, image, options_json, allergens, line_total_cents) VALUES (?, ?, ?, ?, ?, ?, ?, '[]', '', ?)",
    );
    for (const item of items) {
      const record = item as Record<string, unknown>;
      const quantity = Math.max(1, Math.floor(Number(record.quantity) || 1));
      const price = eurosToCents(Number(record.price) || 0);
      insertItem.run(randomUUID(), id, sanitizeText(record.id, 80) || "legacy", sanitizeText(record.name, 80) || "Plat", price, quantity, String(record.image ?? ""), price * quantity);
    }
    orders += 1;
  }
  return { products, orders };
}
