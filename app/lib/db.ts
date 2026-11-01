import { randomBytes, scryptSync } from "crypto";
import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { DISHES, dishSlug } from "../data/menuData.ts";
import { DEFAULT_SETTINGS, eurosToCents } from "./rules.ts";

const globalForDb = globalThis as unknown as { masalahubDb?: DatabaseSync };

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  image TEXT NOT NULL,
  description TEXT NOT NULL,
  available INTEGER NOT NULL DEFAULT 1,
  stock INTEGER,
  allergens TEXT NOT NULL DEFAULT '',
  ingredients TEXT NOT NULL DEFAULT '',
  is_combo INTEGER NOT NULL DEFAULT 0,
  available_from TEXT,
  available_until TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  name TEXT NOT NULL,
  price_delta_cents INTEGER NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS extras (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  available INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS product_extras (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  extra_id TEXT NOT NULL REFERENCES extras(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, extra_id)
);
CREATE TABLE IF NOT EXISTS related_products (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, related_id)
);
CREATE TABLE IF NOT EXISTS complementary_categories (
  category TEXT NOT NULL,
  complement TEXT NOT NULL,
  PRIMARY KEY (category, complement)
);
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  order_item_id TEXT NOT NULL UNIQUE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','hidden')),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id, status);
CREATE TABLE IF NOT EXISTS review_reports (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at TEXT NOT NULL,
  UNIQUE (review_id, user_id)
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  idempotency_key TEXT UNIQUE,
  access_token TEXT NOT NULL,
  legacy INTEGER NOT NULL DEFAULT 0,
  fulfillment_status TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  service TEXT NOT NULL CHECK (service IN ('delivery','pickup')),
  subtotal_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  delivery_fee_cents INTEGER NOT NULL,
  vat_cents INTEGER NOT NULL,
  vat_rate INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  coupon_code TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_phone_digits TEXT NOT NULL DEFAULT '',
  customer_email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  scheduled_for TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone_digits);
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  image TEXT NOT NULL,
  options_json TEXT NOT NULL DEFAULT '[]',
  allergens TEXT NOT NULL DEFAULT '',
  line_total_cents INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('percent','fixed')),
  value INTEGER NOT NULL,
  min_subtotal_cents INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  starts_at TEXT,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  per_user_limit INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  order_id TEXT NOT NULL,
  user_id TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS closures (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  service TEXT NOT NULL DEFAULT 'both',
  reason TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS payment_events (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

const COMPLEMENTS: [string, string][] = [
  ["specialites", "naans"],
  ["specialites", "boissons"],
  ["specialites", "entrees"],
  ["biryanis", "naans"],
  ["biryanis", "boissons"],
  ["naans", "boissons"],
  ["naans", "entrees"],
  ["pizzas", "boissons"],
  ["pizzas", "entrees"],
  ["entrees", "boissons"],
  ["formules", "entrees"],
  ["boissons", "entrees"],
];

const EXTRA_SEED: { id: string; name: string; price: number; categories: string[] }[] = [
  { id: "ex-boisson", name: "Boisson 33 cl", price: 200, categories: ["specialites", "biryanis", "naans", "pizzas", "entrees"] },
  { id: "ex-fromage", name: "Supplément fromage", price: 100, categories: ["naans", "pizzas"] },
  { id: "ex-sauce", name: "Sauce", price: 50, categories: ["entrees", "naans", "pizzas"] },
];

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function seedDatabase(db: DatabaseSync) {
  const count = db.prepare("SELECT COUNT(*) AS n FROM products").get() as { n: number };
  if (Number(count.n) === 0) {
    const insert = db.prepare(
      `INSERT INTO products (id, slug, name, category, price_cents, image, description, available, stock, allergens, ingredients, is_combo, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, NULL, '', '', ?, ?)`,
    );
    const now = new Date().toISOString();
    for (const dish of DISHES) {
      insert.run(dish.id, dishSlug(dish), dish.name, dish.category, eurosToCents(dish.price), dish.image, dish.description, dish.category === "formules" ? 1 : 0, now);
    }
    const extra = db.prepare("INSERT INTO extras (id, name, price_cents, available) VALUES (?, ?, ?, 1)");
    const link = db.prepare("INSERT OR IGNORE INTO product_extras (product_id, extra_id) VALUES (?, ?)");
    for (const item of EXTRA_SEED) {
      extra.run(item.id, item.name, item.price);
      const products = db.prepare("SELECT id, category FROM products").all() as { id: string; category: string }[];
      for (const product of products) {
        if (item.categories.includes(product.category)) link.run(product.id, item.id);
      }
    }
  }

  const complements = db.prepare("SELECT COUNT(*) AS n FROM complementary_categories").get() as { n: number };
  if (Number(complements.n) === 0) {
    const insert = db.prepare("INSERT INTO complementary_categories (category, complement) VALUES (?, ?)");
    for (const [category, complement] of COMPLEMENTS) insert.run(category, complement);
  }

  const settings = db.prepare("SELECT key FROM settings WHERE key = 'restaurant'").get();
  if (!settings) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('restaurant', ?)").run(JSON.stringify(DEFAULT_SETTINGS));
  }

  const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (!admin) {
    const email = (process.env.ADMIN_EMAIL || "admin@masalahub.fr").trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "MasalaHub-Admin";
    db.prepare(
      "INSERT INTO users (id, name, email, password_hash, phone, address, role, created_at) VALUES (?, ?, ?, ?, '', '', 'admin', ?)",
    ).run(`user-admin`, "Masala Hub", email, hashPassword(password), new Date().toISOString());
  }
}

export function openDatabase(filename: string) {
  const db = new DatabaseSync(filename);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA);
  seedDatabase(db);
  return db;
}

export function getDb() {
  if (!globalForDb.masalahubDb) {
    const dir = path.join(process.cwd(), "data");
    fs.mkdirSync(dir, { recursive: true });
    const db = openDatabase(path.join(dir, "masalahub.sqlite"));
    db.exec("PRAGMA journal_mode = WAL;");
    globalForDb.masalahubDb = db;
  }
  return globalForDb.masalahubDb;
}
