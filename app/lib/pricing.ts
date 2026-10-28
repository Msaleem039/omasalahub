export const DELIVERY_FEE = 2.9;
export const FREE_DELIVERY_FROM = 25;

export function formatPrice(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function lineTotal(price: number, quantity = 1) {
  return price * quantity;
}

export function deliveryFeeFor(subtotal: number) {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
}
