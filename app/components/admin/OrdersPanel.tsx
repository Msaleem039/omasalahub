"use client";

import React, { useMemo, useState } from "react";
import { dishName } from "../../data/menuData";
import { formatPrice } from "../../lib/pricing";
import { METHOD_LABEL, ORDER_STATUSES, PAYMENT_STATUS_LABEL, STATUS_LABEL, type OrderStatus, type PaymentMethod } from "../../lib/orders";
import { useLanguage } from "../../context/LanguageContext";
import type { PaymentStatus } from "../../lib/rules";
import { apiFetch } from "../../lib/clientApi";
import type { PublicOrder } from "../../lib/types";

function when(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

export function OrdersPanel({ orders, onOrders }: { orders: PublicOrder[]; onOrders: (orders: PublicOrder[]) => void }) {
  const { t, lang } = useLanguage();
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [payment, setPayment] = useState<"all" | PaymentMethod>("all");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (payment !== "all" && order.paymentMethod !== payment) return false;
      if (status !== "all" && order.status !== status) return false;
      if (!needle) return true;
      return [order.id, order.customer.name, order.customer.phone, order.customer.address, ...order.items.map((item) => item.name)].join(" ").toLowerCase().includes(needle);
    });
  }, [orders, payment, query, status]);

  const revenue = orders.filter((order) => order.status !== "cancelled" && order.paymentStatus === "paid").reduce((sum, order) => sum + order.total, 0);
  const active = orders.filter((order) => ["pending", "confirmed", "preparing", "ready", "on_the_way"].includes(order.status)).length;

  const patch = async (id: string, body: { fulfillment?: string; payment?: string }) => {
    const response = await apiFetch(`/api/order/status/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) return;
    onOrders(orders.map((order) => (order.id === id ? data.order : order)));
  };

  return (
    <div>
      <h1 className="mb-6 hidden font-serif text-4xl md:block">{t("Orders", "Commandes")}</h1>
      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-[#e4d8c4] bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{t("Placed orders", "Commandes passées")}</p>
          <p className="mt-1 font-serif text-3xl">{orders.length}</p>
        </article>
        <article className="rounded-2xl border border-[#e4d8c4] bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{t("In progress", "En cours")}</p>
          <p className="mt-1 font-serif text-3xl">{active}</p>
        </article>
        <article className="rounded-2xl border border-[#e4d8c4] bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{t("Paid revenue", "Encaissé")}</p>
          <p className="mt-1 font-serif text-3xl">{formatPrice(revenue)}</p>
        </article>
      </section>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Search order, name, phone, dish", "Rechercher commande, nom, téléphone")} className="field" />
        <select value={payment} onChange={(event) => setPayment(event.target.value as "all" | PaymentMethod)} className="field">
          <option value="all">{t("All payments", "Tous les paiements")}</option>
          <option value="cod">{t(METHOD_LABEL.cod.en, METHOD_LABEL.cod.fr)}</option>
          <option value="online">{t(METHOD_LABEL.online.en, METHOD_LABEL.online.fr)}</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value as "all" | OrderStatus)} className="field">
          <option value="all">{t("All statuses", "Tous les statuts")}</option>
          {ORDER_STATUSES.map((item) => (
            <option key={item} value={item}>{t(STATUS_LABEL[item].en, STATUS_LABEL[item].fr)}</option>
          ))}
        </select>
      </div>
      {visible.length === 0 ? (
        <p className="rounded-3xl border border-[#e4d8c4] bg-card p-8 text-muted">{t("No orders match.", "Aucune commande.")}</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((order) => {
            const open = openId === order.id;
            return (
              <li key={order.id} className="overflow-hidden rounded-3xl border border-[#e4d8c4] bg-card">
                <button type="button" onClick={() => setOpenId(open ? null : order.id)} className="flex w-full flex-wrap items-center gap-3 px-4 py-4 text-left sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{order.id}</p>
                    <p className="truncate text-sm text-muted">{order.customer.name} · {when(order.createdAt)} · {order.service === "pickup" ? t("Takeaway", "À emporter") : t("Home delivery", "Livraison")}</p>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide text-sage">{t(PAYMENT_STATUS_LABEL[order.paymentStatus].en, PAYMENT_STATUS_LABEL[order.paymentStatus].fr)}</span>
                  <span className="text-sm font-bold">{formatPrice(order.total)}</span>
                </button>
                {open && (
                  <div className="grid gap-6 border-t border-[#efe6d2] px-4 pb-5 pt-4 sm:px-5 lg:grid-cols-2">
                    <div>
                      <p className="font-bold">{order.customer.name}</p>
                      <p className="text-sm">{order.customer.phone}</p>
                      {order.customer.address && <p className="mt-1 text-sm text-muted">{order.customer.address}</p>}
                      {order.customer.note && <p className="mt-2 text-sm">{t("Note", "Note")}: {order.customer.note}</p>}
                      <p className="mt-2 text-sm font-bold">{order.service === "pickup" ? t("Takeaway", "À emporter") : t("Home delivery", "Livraison à domicile")}</p>
                      {order.scheduledFor && <p className="text-sm text-muted">{t("Pickup time", "Heure de retrait")}: {when(order.scheduledFor)}</p>}
                      <label className="mt-4 block text-sm font-bold">{t("Kitchen status", "Statut cuisine")}
                        <select value={order.status} onChange={(event) => patch(order.id, { fulfillment: event.target.value })} className="field mt-1">
                          {ORDER_STATUSES.map((item) => (
                            <option key={item} value={item}>{t(STATUS_LABEL[item].en, STATUS_LABEL[item].fr)}</option>
                          ))}
                        </select>
                      </label>
                      <label className="mt-3 block text-sm font-bold">{t("Payment status", "Statut de paiement")}
                        <select value={order.paymentStatus} onChange={(event) => patch(order.id, { payment: event.target.value as PaymentStatus })} className="field mt-1">
                          {(Object.keys(PAYMENT_STATUS_LABEL) as PaymentStatus[]).map((item) => (
                            <option key={item} value={item}>{t(PAYMENT_STATUS_LABEL[item].en, PAYMENT_STATUS_LABEL[item].fr)}</option>
                          ))}
                        </select>
                      </label>
                      {order.paymentMethod === "online" && <p className="mt-2 text-xs text-muted">{t("Online payments are marked paid only by the payment provider.", "Un paiement en ligne n'est marqué payé que par le prestataire.")}</p>}
                    </div>
                    <div>
                      <ul className="space-y-2 text-sm">
                        {order.items.map((item) => (
                          <li key={item.id} className="money-row">
                            <span>{item.quantity} × {dishName(item.name, lang)}{item.optionsLabel ? ` (${dishName(item.optionsLabel, lang)})` : ""}</span>
                            <span>{formatPrice(item.price * item.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 space-y-1 border-t border-[#efe6d2] pt-3 text-sm">
                        <p className="flex justify-between"><span>{t("Subtotal", "Sous-total")}</span><span>{formatPrice(order.subtotal)}</span></p>
                        <p className="flex justify-between"><span>{t("Discount", "Réduction")}</span><span>{formatPrice(order.discount)}</span></p>
                        <p className="flex justify-between"><span>{order.service === "pickup" ? t("Takeaway", "À emporter") : t("Delivery", "Livraison")}</span><span>{order.service === "pickup" ? t("No delivery fee", "Sans frais de livraison") : formatPrice(order.deliveryFee)}</span></p>
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
    </div>
  );
}
