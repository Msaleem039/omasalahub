export type PaymentMethod = "cod" | "online";

export interface OrderLine {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface SavedOrder {
  id: string;
  items: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  cardLast4?: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    note: string;
  };
  createdAt: string;
}

const ORDERS_KEY = "bitebloom_orders";

export function paymentLabel(method: PaymentMethod) {
  return method === "cod" ? "Cash on delivery" : "Online payment";
}

export function getOrders(): SavedOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as SavedOrder[]) : [];
  } catch {
    return [];
  }
}

export function getOrder(id: string) {
  return getOrders().find((order) => order.id.toLowerCase() === id.toLowerCase());
}

export function saveOrder(order: SavedOrder) {
  const next = [order, ...getOrders().filter((item) => item.id !== order.id)];
  localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
}

export function createOrderId() {
  const stamp = Date.now().toString().slice(-6);
  return `OM-${stamp}`;
}
