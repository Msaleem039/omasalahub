"use client";

import { useEffect, useState } from "react";
import type { CartItemType } from "../context/CartContext";
import { apiFetch } from "./clientApi";
import type { ServiceMode, SlotInput } from "./rules";
import type { QuoteResult } from "./types";

export function useQuote(cart: CartItemType[], options: { service: ServiceMode; couponCode: string; scheduled: SlotInput | null; phone: string }) {
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const lines = cart.map((item) => ({
    productId: item.productId || item.id,
    quantity: item.quantity || 1,
    variantIds: item.variantIds ?? [],
    extraIds: item.extraIds ?? [],
  }));
  const body = JSON.stringify({ lines, service: options.service, couponCode: options.couponCode, scheduled: options.scheduled, phone: options.phone });

  useEffect(() => {
    const parsed = JSON.parse(body) as { lines: unknown[] };
    if (parsed.lines.length === 0) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      apiFetch("/api/order/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        signal: controller.signal,
      })
        .then((response) => response.json())
        .then((data) => {
          if (!controller.signal.aborted) setQuote(data);
        })
        .catch(() => {})
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 180);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [body]);

  const empty = (JSON.parse(body) as { lines: unknown[] }).lines.length === 0;
  return { quote: empty ? null : quote, loading };
}
