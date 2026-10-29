"use client";

import React, { useEffect, useState } from "react";
import { Bike, CheckCircle, CookingPot, Home } from "lucide-react";
import { SiteShell } from "../components/SiteShell";
import { formatPrice } from "../lib/pricing";
import { getOrder, getOrders, orderStatus, paymentLabel, type SavedOrder } from "../lib/orders";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState<SavedOrder | null>(null);
  const [miss, setMiss] = useState(false);
  const [recent, setRecent] = useState<SavedOrder[]>([]);

  useEffect(() => {
    const orders = getOrders();
    setRecent(orders.slice(0, 4));
    const fromUrl = new URLSearchParams(window.location.search).get("id");
    if (fromUrl) {
      setOrderId(fromUrl);
      const found = getOrder(fromUrl);
      setResult(found ?? null);
      setMiss(!found);
    }
  }, []);

  const search = (event: React.FormEvent) => {
    event.preventDefault();
    const found = getOrder(orderId.trim());
    setResult(found ?? null);
    setMiss(!found);
  };

  return (
    <SiteShell>
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="script-title text-6xl text-center mb-6">Track an order</h1>
        <form onSubmit={search} className="bg-card rounded-3xl border border-[#e5dcc8] p-4 flex flex-col sm:flex-row gap-3">
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Order ID, for example OM-482193"
            className="field min-w-0"
          />
          <button type="submit" className="bg-terra text-ink font-bold px-5 py-3 sm:py-0 rounded-full">Search</button>
        </form>

        {miss && <p className="mt-4 text-sm text-terra-deep">No order matches {orderId.trim() || "that id"} on this device.</p>}

        {result && (
          <section className="mt-6 bg-card rounded-3xl border border-[#e5dcc8] p-6">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
              <div>
                <p className="text-xs font-bold tracking-wide text-sage uppercase">{result.id}</p>
                <h2 className="font-serif text-3xl">{paymentLabel(result.paymentMethod)}</h2>
              </div>
              <p className="font-bold">{formatPrice(result.total)}</p>
            </div>
            {(() => {
              const status = orderStatus(result);
              if (status === "cancelled") {
                return <p className="mb-6 font-bold text-terra-deep">This order was cancelled.</p>;
              }
              const rank = { confirmed: 0, preparing: 1, on_the_way: 2, delivered: 3 }[status];
              return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mb-6">
                {[
                  { icon: CheckCircle, label: "Confirmed" },
                  { icon: CookingPot, label: "Preparing" },
                  { icon: Bike, label: "On the way" },
                  { icon: Home, label: "Delivered" },
                ].map((step, index) => {
                  const active = rank >= index;
                  return (
                    <div key={step.label} className={active ? "" : "opacity-40"}>
                      <div className={`mx-auto mb-2 w-12 h-12 rounded-full flex items-center justify-center ${active ? "bg-sage text-cream" : "bg-cream-deep text-ink"}`}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold">{step.label}</p>
                    </div>
                  );
                })}
              </div>
              );
            })()}
            <ul className="text-sm space-y-2">
              {result.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.quantity} × {item.name}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted mt-4">To {result.customer.address}</p>
          </section>
        )}

        {recent.length > 0 && (
          <div className="mt-8">
            <h2 className="font-serif text-2xl mb-3">Recent on this device</h2>
            <ul className="space-y-2">
              {recent.map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderId(order.id);
                      setResult(order);
                      setMiss(false);
                    }}
                    className="w-full text-left bg-card border border-[#e5dcc8] rounded-2xl px-4 py-3 flex justify-between"
                  >
                    <span className="font-bold">{order.id}</span>
                    <span className="text-sm text-muted">{paymentLabel(order.paymentMethod)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </SiteShell>
  );
}
