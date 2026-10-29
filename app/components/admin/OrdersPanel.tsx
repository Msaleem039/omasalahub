"use client";

import React, { useMemo, useState } from "react";
import { formatPrice } from "../../lib/pricing";
import {
  ORDER_STATUSES,
  orderStatus,
  paymentLabel,
  updateOrderStatus,
  type OrderStatus,
  type PaymentMethod,
  type SavedOrder,
} from "../../lib/orders";
import { useLanguage } from "../../context/LanguageContext";

const STATUS_LABEL: Record<OrderStatus, { en: string; fr: string }> = {
  confirmed: { en: "Confirmed", fr: "Confirmée" },
  preparing: { en: "Preparing", fr: "En préparation" },
  on_the_way: { en: "On the way", fr: "En livraison" },
  delivered: { en: "Delivered", fr: "Livrée" },
  cancelled: { en: "Cancelled", fr: "Annulée" },
};

function when(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

export function OrdersPanel({
  orders,
  onOrders,
}: {
  orders: SavedOrder[];
  onOrders: (orders: SavedOrder[]) => void;
}) {
  const { t } = useLanguage();
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [payment, setPayment] = useState<"all" | PaymentMethod>("all");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (payment !== "all" && order.paymentMethod !== payment) return false;
      if (status !== "all" && orderStatus(order) !== status) return false;
      if (!needle) return true;
      const haystack = [order.id, order.customer.name, order.customer.phone, order.customer.address, ...order.items.map((item) => item.name)]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [orders, payment, query, status]);

  const revenue = orders.filter((order) => orderStatus(order) !== "cancelled").reduce((sum, order) => sum + order.total, 0);
  const active = orders.filter((order) => ["confirmed", "preparing", "on_the_way"].includes(orderStatus(order))).length;

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
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{t("Revenue", "Chiffre")}</p>
          <p className="mt-1 font-serif text-3xl">{formatPrice(revenue)}</p>
        </article>
      </section>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Search order, name, phone, dish", "Rechercher commande, nom, téléphone")} className="field" />
        <select value={payment} onChange={(event) => setPayment(event.target.value as "all" | PaymentMethod)} className="field">
          <option value="all">{t("All payments", "Tous les paiements")}</option>
          <option value="cod">{t("Cash on delivery", "Paiement à la livraison")}</option>
          <option value="online">{t("Online payment", "Paiement en ligne")}</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value as "all" | OrderStatus)} className="field">
          <option value="all">{t("All statuses", "Tous les statuts")}</option>
          {ORDER_STATUSES.map((item) => (
            <option key={item} value={item}>{t(STATUS_LABEL[item].en, STATUS_LABEL[item].fr)}</option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-3xl border border-[#e4d8c4] bg-card p-8 text-muted">
          {orders.length === 0
            ? t("No orders yet. A checkout on this browser will appear in this list.", "Aucune commande. Un paiement sur ce navigateur apparaîtra ici.")
            : t("No orders match this search.", "Aucune commande ne correspond.")}
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((order) => {
            const current = orderStatus(order);
            const open = openId === order.id;
            return (
              <li key={order.id} className="overflow-hidden rounded-3xl border border-[#e4d8c4] bg-card">
                <button type="button" onClick={() => setOpenId(open ? null : order.id)} className="flex w-full flex-wrap items-center gap-3 px-4 py-4 text-left sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{order.id}</p>
                    <p className="truncate text-sm text-muted">{order.customer.name} · {when(order.createdAt)}</p>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide text-sage">{paymentLabel(order.paymentMethod)}</span>
                  <span className="text-sm font-bold">{formatPrice(order.total)}</span>
                </button>
                {open && (
                  <div className="grid gap-6 border-t border-[#efe6d2] px-4 pb-5 pt-4 sm:px-5 lg:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{t("Customer", "Client")}</p>
                      <p className="font-bold">{order.customer.name}</p>
                      <p className="text-sm">{order.customer.phone}</p>
                      <p className="mt-1 text-sm text-muted">{order.customer.address}</p>
                      {order.customer.note && <p className="mt-2 text-sm">{t("Note", "Note")}: {order.customer.note}</p>}
                      {order.cardLast4 && <p className="mt-2 text-sm">{t("Card ending", "Carte finissant par")} {order.cardLast4}</p>}
                      <label className="mt-4 block text-sm font-bold">
                        {t("Status", "Statut")}
                        <select
                          value={current}
                          onChange={(event) => onOrders(updateOrderStatus(order.id, event.target.value as OrderStatus))}
                          className="field mt-1"
                        >
                          {ORDER_STATUSES.map((item) => (
                            <option key={item} value={item}>{t(STATUS_LABEL[item].en, STATUS_LABEL[item].fr)}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{t("Items", "Plats")}</p>
                      <ul className="space-y-2 text-sm">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex justify-between gap-3">
                            <span>{item.quantity} × {item.name}</span>
                            <span>{formatPrice(item.price * item.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 space-y-1 border-t border-[#efe6d2] pt-3 text-sm">
                        <p className="flex justify-between"><span>{t("Subtotal", "Sous-total")}</span><span>{formatPrice(order.subtotal)}</span></p>
                        <p className="flex justify-between"><span>{t("Delivery", "Livraison")}</span><span>{formatPrice(order.deliveryFee)}</span></p>
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
