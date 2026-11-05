"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { SiteShell } from "../components/SiteShell";
import { useLanguage } from "../context/LanguageContext";
import { dishName } from "../data/menuData";
import { formatPrice } from "../lib/pricing";
import { METHOD_LABEL, PAYMENT_STATUS_LABEL, STATUS_LABEL } from "../lib/orders";
import { apiFetch } from "../lib/clientApi";
import type { PublicOrder } from "../lib/types";

export default function OrderSuccessPage() {
  const { t, lang } = useLanguage();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      queueMicrotask(() => setMissing(true));
      return;
    }
    const token = sessionStorage.getItem(`mh_order_${id}`) ?? "";
    apiFetch(`/api/order/track/${encodeURIComponent(id)}`, { headers: token ? { "x-order-token": token } : {} })
      .then(async (response) => {
        if (!response.ok) {
          setMissing(true);
          return;
        }
        const data = await response.json();
        setOrder(data.order);
      })
      .catch(() => setMissing(true));

    const end = Date.now() + 1200;
    const frame = () => {
      confetti({ particleCount: 2, angle: 60, spread: 50, origin: { x: 0, y: 0.7 }, colors: ["#e0b15a", "#143528", "#f8f4ea"] });
      confetti({ particleCount: 2, angle: 120, spread: 50, origin: { x: 1, y: 0.7 }, colors: ["#e0b15a", "#143528", "#f8f4ea"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const paid = order?.paymentStatus === "paid";

  return (
    <SiteShell>
      <main className="max-w-xl mx-auto px-4 py-16">
        <div className="rounded-[2rem] border border-[#e5dcc8] bg-card p-5 text-center shadow-sm sm:p-10">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-sage-soft text-sage flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="script-title text-4xl sm:text-6xl">{t("Order recorded", "Commande enregistrée")}</h1>
          <p className="mt-2 font-bold">{t("Order with obligation to pay", "Commande avec obligation de paiement")}</p>
          {order ? (
            <div className="mt-4 text-left space-y-3 text-sm">
              <p className="text-center font-bold">{order.id}</p>
              <p className="text-center text-muted">
                {t(STATUS_LABEL[order.status].en, STATUS_LABEL[order.status].fr)} · {t(PAYMENT_STATUS_LABEL[order.paymentStatus].en, PAYMENT_STATUS_LABEL[order.paymentStatus].fr)} · {t(METHOD_LABEL[order.paymentMethod].en, METHOD_LABEL[order.paymentMethod].fr)}
              </p>
              <ul className="bg-cream rounded-2xl p-4 space-y-2">
                {order.items.map((item) => (
                  <li key={item.id}>
                    <div className="money-row">
                      <span>{item.quantity} × {dishName(item.name, lang)}</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                    {item.optionsLabel && <p className="text-xs text-muted">{item.optionsLabel}</p>}
                  </li>
                ))}
              </ul>
              <div className="money-row px-1 font-bold">
                <span>{t("Amount due", "Montant dû")}</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              <p className="text-muted px-1">
                {paid
                  ? t("The payment provider confirmed this payment.", "Le prestataire a confirmé ce paiement.")
                  : order.paymentMethod === "cod"
                    ? t("Cash is collected on delivery or pickup. This page does not mean the order is paid.", "Les espèces sont encaissées à la livraison ou au retrait. Cette page ne signifie pas que la commande est payée.")
                    : t("Online payment is still pending. Opening this page does not mark the order as paid.", "Le paiement en ligne est encore en attente. Ouvrir cette page ne marque pas la commande comme payée.")}
              </p>
              {order.service === "delivery" && order.customer.address && <p className="text-muted px-1">{t("Delivery to", "Livraison à")} {order.customer.address}</p>}
              {order.service === "pickup" && (
                <p className="text-muted px-1">
                  {t("Takeaway at the restaurant.", "À emporter au restaurant.")}
                  {order.scheduledFor ? ` ${new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.scheduledFor))}` : ""}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted mt-3">
              {missing
                ? t("Enter your order reference and phone on the tracking page.", "Indiquez la référence et le téléphone sur la page de suivi.")
                : t("Loading the order…", "Chargement de la commande…")}
            </p>
          )}
          <div className="mt-8 space-y-3">
            <Link href={order ? `/track-order?id=${order.id}` : "/track-order"} className="flex items-center justify-center gap-2 bg-ink text-cream font-bold py-3 rounded-full">
              {t("Track this order", "Suivre cette commande")} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/orders" className="block font-bold text-terra">{t("Order history", "Historique des commandes")}</Link>
          </div>
          <p className="sr-only">{lang}</p>
        </div>
      </main>
    </SiteShell>
  );
}
