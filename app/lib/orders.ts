import type { FulfillmentStatus, PaymentStatus } from "./rules";

export type OrderStatus = FulfillmentStatus;
export type PaymentMethod = "cod" | "online";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "on_the_way",
  "completed",
  "cancelled",
];

export const STATUS_LABEL: Record<OrderStatus, { en: string; fr: string }> = {
  pending: { en: "Pending", fr: "En attente" },
  confirmed: { en: "Confirmed", fr: "Confirmée" },
  preparing: { en: "Preparing", fr: "En préparation" },
  ready: { en: "Ready for pickup", fr: "Prête au retrait" },
  on_the_way: { en: "Out for delivery", fr: "En livraison" },
  completed: { en: "Completed", fr: "Terminée" },
  cancelled: { en: "Cancelled", fr: "Annulée" },
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, { en: string; fr: string }> = {
  unpaid: { en: "Unpaid", fr: "Non payée" },
  pending: { en: "Payment pending", fr: "Paiement en attente" },
  paid: { en: "Paid", fr: "Payée" },
  failed: { en: "Payment failed", fr: "Paiement refusé" },
  cancelled: { en: "Payment cancelled", fr: "Paiement annulé" },
};

export const METHOD_LABEL = {
  cod: { en: "Cash on delivery or pickup", fr: "Espèces à la livraison ou au retrait" },
  online: { en: "Online payment", fr: "Paiement en ligne" },
};
