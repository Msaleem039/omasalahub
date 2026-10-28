"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "../components/Logo";
import { isSuperadmin, logoutSuperadmin } from "../lib/adminAuth";
import { formatPrice } from "../lib/pricing";
import {
  getOrders,
  ORDER_STATUSES,
  orderStatus,
  paymentLabel,
  updateOrderStatus,
  type OrderStatus,
  type PaymentMethod,
  type SavedOrder,
} from "../lib/orders";

const STATUS_LABEL: Record<OrderStatus, string> = {
  confirmed: "Confirmed",
  preparing: "Preparing",
  on_the_way: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function when(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [payment, setPayment] = useState<"all" | PaymentMethod>("all");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");

  useEffect(() => {
    if (!isSuperadmin()) {
      router.replace("/login");
      return;
    }
    setOrders(getOrders());
    setReady(true);
  }, [router]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (payment !== "all" && order.paymentMethod !== payment) return false;
      if (status !== "all" && orderStatus(order) !== status) return false;
      if (!needle) return true;
      const haystack = [
        order.id,
        order.customer.name,
        order.customer.phone,
        order.customer.address,
        ...order.items.map((item) => item.name),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [orders, payment, query, status]);

  const revenue = orders
    .filter((order) => orderStatus(order) !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);
  const active = orders.filter((order) => {
    const current = orderStatus(order);
    return current === "confirmed" || current === "preparing" || current === "on_the_way";
  }).length;

  const changeStatus = (id: string, next: OrderStatus) => {
    setOrders(updateOrderStatus(id, next));
  };

  const logout = () => {
    logoutSuperadmin();
    router.replace("/login");
  };

  if (!ready) {
    return <main className="min-h-screen bg-cream" />;
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="bg-forest text-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-terra">Admin</span>
          </div>
          <button type="button" onClick={logout} className="text-sm font-bold text-cream hover:text-terra">
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-serif text-4xl mb-6">Orders</h1>

        <section className="grid sm:grid-cols-3 gap-3 mb-6">
          <article className="bg-card border border-[#e4d8c4] rounded-2xl p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Placed orders</p>
            <p className="font-serif text-3xl mt-1">{orders.length}</p>
          </article>
          <article className="bg-card border border-[#e4d8c4] rounded-2xl p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">In progress</p>
            <p className="font-serif text-3xl mt-1">{active}</p>
          </article>
          <article className="bg-card border border-[#e4d8c4] rounded-2xl p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Revenue</p>
            <p className="font-serif text-3xl mt-1">{formatPrice(revenue)}</p>
          </article>
        </section>

        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search order, name, phone, dish"
            className="field"
          />
          <select value={payment} onChange={(event) => setPayment(event.target.value as "all" | PaymentMethod)} className="field">
            <option value="all">All payments</option>
            <option value="cod">Cash on delivery</option>
            <option value="online">Online payment</option>
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value as "all" | OrderStatus)} className="field">
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((item) => (
              <option key={item} value={item}>{STATUS_LABEL[item]}</option>
            ))}
          </select>
        </div>

        {visible.length === 0 ? (
          <p className="bg-card border border-[#e4d8c4] rounded-3xl p-8 text-muted">
            {orders.length === 0
              ? "No orders yet. A checkout on this browser will appear in this list."
              : "No orders match this search."}
          </p>
        ) : (
          <ul className="space-y-3">
            {visible.map((order) => {
              const current = orderStatus(order);
              const open = openId === order.id;
              return (
                <li key={order.id} className="bg-card border border-[#e4d8c4] rounded-3xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : order.id)}
                    className="w-full text-left px-4 sm:px-5 py-4 flex flex-wrap items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{order.id}</p>
                      <p className="text-sm text-muted truncate">
                        {order.customer.name} · {when(order.createdAt)}
                      </p>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide text-sage">
                      {paymentLabel(order.paymentMethod)}
                    </span>
                    <span className="text-sm font-bold">{formatPrice(order.total)}</span>
                  </button>

                  {open && (
                    <div className="px-4 sm:px-5 pb-5 border-t border-[#efe6d2] pt-4 grid lg:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Customer</p>
                        <p className="font-bold">{order.customer.name}</p>
                        <p className="text-sm">{order.customer.phone}</p>
                        <p className="text-sm text-muted mt-1">{order.customer.address}</p>
                        {order.customer.note && <p className="text-sm mt-2">Note: {order.customer.note}</p>}
                        {order.cardLast4 && (
                          <p className="text-sm mt-2">Card ending {order.cardLast4}</p>
                        )}
                        <label className="block text-sm font-bold mt-4">
                          Status
                          <select
                            value={current}
                            onChange={(event) => changeStatus(order.id, event.target.value as OrderStatus)}
                            className="field mt-1"
                          >
                            {ORDER_STATUSES.map((item) => (
                              <option key={item} value={item}>{STATUS_LABEL[item]}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Items</p>
                        <ul className="text-sm space-y-2">
                          {order.items.map((item) => (
                            <li key={item.id} className="flex justify-between gap-3">
                              <span>{item.quantity} × {item.name}</span>
                              <span>{formatPrice(item.price * item.quantity)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 pt-3 border-t border-[#efe6d2] text-sm space-y-1">
                          <p className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></p>
                          <p className="flex justify-between"><span>Delivery</span><span>{formatPrice(order.deliveryFee)}</span></p>
                          <p className="flex justify-between font-bold"><span>Total</span><span>{formatPrice(order.total)}</span></p>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
