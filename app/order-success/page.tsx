"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { SiteShell } from "../components/SiteShell";
import { formatPrice } from "../lib/pricing";
import { getOrder, paymentLabel, type SavedOrder } from "../lib/orders";

export default function OrderSuccessPage() {
  const [order, setOrder] = useState<SavedOrder | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) setOrder(getOrder(id) ?? null);

    const end = Date.now() + 1800;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 50,
        origin: { x: 0, y: 0.7 },
        colors: ["#e0b15a", "#143528", "#f8f4ea", "#12382c"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 50,
        origin: { x: 1, y: 0.7 },
        colors: ["#e0b15a", "#143528", "#f8f4ea", "#12382c"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <SiteShell>
      <main className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-card rounded-[2rem] border border-[#e5dcc8] p-8 sm:p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-sage-soft text-sage flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="script-title text-6xl">Order placed</h1>
          {order ? (
            <div className="mt-4 text-left space-y-3 text-sm">
              <p className="text-center text-muted">
                {order.id} · {paymentLabel(order.paymentMethod)}
                {order.cardLast4 ? ` · card •••• ${order.cardLast4}` : ""}
              </p>
              <ul className="bg-cream rounded-2xl p-4 space-y-2">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span>{item.quantity} × {item.name}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between font-bold px-1">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              <p className="text-muted px-1">
                {order.paymentMethod === "cod"
                  ? "Please keep cash ready for the courier."
                  : "Your card payment is recorded for this order. The kitchen is starting now."}
              </p>
              <p className="text-muted px-1">Delivering to {order.customer.address}</p>
            </div>
          ) : (
            <p className="text-muted mt-3">Thank you. The kitchen has your order.</p>
          )}

          <div className="mt-8 space-y-3">
            <Link href={order ? `/track-order?id=${order.id}` : "/track-order"} className="flex items-center justify-center gap-2 bg-ink text-cream font-bold py-3 rounded-full">
              Track this order <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/menu" className="block bg-terra text-ink font-bold py-3 rounded-full">
              Order something else
            </Link>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
