import type { Dish } from "../data/menuData.ts";
import type { FulfillmentStatus, PaymentStatus, ServiceMode } from "./rules.ts";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: "customer" | "admin";
};

export type MenuProduct = Dish & {
  slug: string;
  available: boolean;
  orderable: boolean;
  stock: number | null;
  allergens: string;
  ingredients: string;
  isCombo: boolean;
  reviewAverage: number | null;
  reviewCount: number;
};

export type QuoteLine = {
  lineId: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image: string;
  optionsLabel: string;
  allergens: string;
  category: string;
};

export type PublicInfo = {
  timezone: string;
  hoursShort: string;
  hours: Record<string, { open: string; close: string }[]>;
  closures: { id: string; date: string; service: "delivery" | "pickup" | "both"; reason: string }[];
  openNow: boolean;
  deliveryOpen: boolean;
  pickupOpen: boolean;
  nextOpenAt: string | null;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  minOrder: number;
  deliveryFee: number;
  freeDeliveryFrom: number;
  prepMinutes: number;
  vatRate: number;
  allowScheduled: boolean;
};

export type QuoteResult = {
  lines: QuoteLine[];
  issues: { code: string; productId?: string }[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  vatIncluded: number;
  vatRate: number;
  total: number;
  totalCents: number;
  couponCode: string;
  couponStatus: string;
  service: ServiceMode;
  orderingCode: string;
  nextOpenAt: string | null;
  canSubmit: boolean;
  prepMinutes: number;
  minOrder: number;
};

export type PublicOrder = {
  id: string;
  items: {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    optionsLabel: string;
    allergens: string;
  }[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  vatIncluded: number;
  vatRate: number;
  total: number;
  paymentMethod: "cod" | "online";
  paymentStatus: PaymentStatus;
  status: FulfillmentStatus;
  service: ServiceMode;
  couponCode: string | null;
  customer: { name: string; phone: string; email: string; address: string; note: string };
  scheduledFor: string | null;
  createdAt: string;
  accessToken?: string;
};

export type PublicReview = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  rating: number;
  body: string;
  createdAt: string;
  author: string;
  status?: string;
};

export type CartRequestLine = {
  productId: string;
  quantity: number;
  variantIds?: string[];
  extraIds?: string[];
};
