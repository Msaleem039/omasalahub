"use client";

import React, { useEffect, useState } from "react";
import { Bike, CheckCircle, CookingPot, Home, Store } from "lucide-react";
import { SiteShell } from "../components/SiteShell";
import { useLanguage } from "../context/LanguageContext";
import { errorText } from "../lib/errors";
import { dishName } from "../data/menuData";
import { formatPrice } from "../lib/pricing";
import { PAYMENT_STATUS_LABEL, STATUS_LABEL } from "../lib/orders";
import { apiFetch } from "../lib/clientApi";
import type { PublicOrder } from "../lib/types";

export default function TrackOrderPage() {
  const { t, lang } = useLanguage();
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState("");

  const lookup = async (id: string, nextPhone: string, token = "") => {
    setError("");
    const response = await apiFetch(`/api/order/track/${encodeURIComponent(id)}?phone=${encodeURIComponent(nextPhone)}`, {
      headers: token ? { "x-order-token": token } : {},
    });
    const data = await response.json();
    if (!response.ok) {
      setOrder(null);
      setError(errorText(data.error || "not_found", lang));
      return;
    }
    setOrder(data.order);
  };

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return;
    const token = sessionStorage.getItem(`mh_order_${id}`) ?? "";
    queueMicrotask(() => setOrderId(id));
    if (!token) return;
    apiFetch(`/api/order/track/${encodeURIComponent(id)}`, { headers: { "x-order-token": token } })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setOrder(null);
          setError(errorText(data.error || "not_found", lang));
          return;
        }
        setOrder(data.order);
      })
      .catch(() => setError(errorText("generic", lang)));
  }, [lang]);

  const status = order?.status;
  const steps = order?.service === "pickup"
    ? [
        { key: "confirmed", icon: CheckCircle, label: t("Confirmed", "Confirmée") },
        { key: "preparing", icon: CookingPot, label: t("Preparing", "En préparation") },
        { key: "ready", icon: Store, label: t("Ready for pickup", "Prête au retrait") },
        { key: "completed", icon: Home, label: t("Completed", "Terminée") },
      ]
    : [
        { key: "confirmed", icon: CheckCircle, label: t("Confirmed", "Confirmée") },
        { key: "preparing", icon: CookingPot, label: t("Preparing", "En préparation") },
        { key: "on_the_way", icon: Bike, label: t("Out for delivery", "En livraison") },
        { key: "completed", icon: Home, label: t("Completed", "Terminée") },
      ];
  const rank = steps.findIndex((step) => step.key === status);

  return (
    <SiteShell>
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="script-title mb-6 text-center text-4xl sm:text-6xl">{t("Track an order", "Suivre une commande")}</h1>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const token = sessionStorage.getItem(`mh_order_${orderId.trim()}`) ?? "";
            lookup(orderId.trim(), phone, token);
          }}
          className="bg-card rounded-3xl border border-[#e5dcc8] p-4 grid gap-3"
        >
          <input value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder={t("Order reference, for example OM-482193", "Référence, par exemple OM-482193")} className="field" />
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={t("Phone on the order", "Téléphone de la commande")} className="field" />
          <button type="submit" className="bg-terra text-ink font-bold px-5 py-3 rounded-full">{t("Search", "Rechercher")}</button>
        </form>
        <p className="mt-3 text-xs text-muted">{t("There is no live driver map. Status comes from the kitchen.", "Il n'y a pas de suivi GPS du livreur. Le statut vient de la cuisine.")}</p>
        {error && <p className="mt-4 text-sm text-terra-deep">{error}</p>}
        {order && (
          <section className="mt-6 bg-card rounded-3xl border border-[#e5dcc8] p-6">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
              <div>
                <p className="text-xs font-bold tracking-wide text-sage uppercase">{order.id}</p>
                <h2 className="font-serif text-3xl">{t(STATUS_LABEL[order.status].en, STATUS_LABEL[order.status].fr)}</h2>
                <p className="text-sm text-muted">{t(PAYMENT_STATUS_LABEL[order.paymentStatus].en, PAYMENT_STATUS_LABEL[order.paymentStatus].fr)}</p>
              </div>
              <p className="font-bold">{formatPrice(order.total)}</p>
            </div>
            {order.status === "cancelled" ? (
              <p className="mb-6 font-bold text-terra-deep">{t("This order was cancelled.", "Cette commande a été annulée.")}</p>
            ) : order.status === "pending" ? (
              <p className="mb-6 font-bold">{t("Waiting for the kitchen to confirm.", "En attente de confirmation de la cuisine.")}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mb-6">
                {steps.map((step, index) => {
                  const active = rank >= index;
                  return (
                    <div key={step.key} className={active ? "" : "opacity-40"}>
                      <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${active ? "bg-sage text-cream" : "bg-cream-deep text-ink"}`}>
                        <step.icon className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-bold">{step.label}</p>
                    </div>
                  );
                })}
              </div>
            )}
            <ul className="space-y-2 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="money-row">
                  <span>{item.quantity} × {dishName(item.name, lang)}{item.optionsLabel ? ` (${dishName(item.optionsLabel, lang)})` : ""}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </SiteShell>
  );
}
