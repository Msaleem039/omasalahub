"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { SiteShell } from "../components/SiteShell";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCatalog } from "../context/CatalogContext";
import { useLanguage } from "../context/LanguageContext";
import { dishName } from "../data/menuData";
import { formatPrice } from "../lib/pricing";
import { METHOD_LABEL, PAYMENT_STATUS_LABEL, STATUS_LABEL } from "../lib/orders";
import { apiFetch } from "../lib/clientApi";
import type { PublicOrder } from "../lib/types";

export default function OrdersPage() {
  const { t, lang } = useLanguage();
  const { user, ready } = useAuth();
  const { dishes } = useCatalog();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    apiFetch("/api/order/userorders")
      .then((response) => response.json())
      .then((data) => setOrders(data.orders ?? []))
      .catch(() => setOrders([]));
  }, [user]);

  const reorder = (order: PublicOrder) => {
    let added = 0;
    let skipped = false;
    for (const item of order.items) {
      const dish = dishes.find((entry) => entry.id === item.productId);
      if (!dish || dish.orderable === false) {
        skipped = true;
        continue;
      }
      addToCart(
        {
          id: dish.id,
          productId: dish.id,
          name: dish.name,
          price: dish.price,
          image: dish.image,
          category: dish.category,
        },
        item.quantity,
      );
      if (item.optionsLabel) skipped = true;
      added += 1;
    }
    setMessage(
      added === 0
        ? t("Those dishes are not available to reorder.", "Ces plats ne sont plus disponibles.")
        : skipped
          ? t("Available dishes were added. Choose any extras again on the product page.", "Les plats disponibles ont été ajoutés. Choisissez à nouveau les suppléments sur la fiche.")
          : t("Added to your basket.", "Ajouté à votre panier."),
    );
  };

  return (
    <SiteShell>
      <main className="mx-auto w-full max-w-3xl px-4 py-12">
        <h1 className="script-title mb-6 text-4xl sm:text-6xl">{t("Your orders", "Vos commandes")}</h1>
        {!ready ? <div className="h-32 animate-pulse rounded-3xl bg-card" /> : null}
        {ready && !user && (
          <p className="text-muted">
            <Link href="/login" className="font-bold text-terra">{t("Log in", "Connectez-vous")}</Link>{" "}
            {t("to see orders placed with your account. Guest orders can be found with the reference and phone.", "pour voir les commandes de votre compte. Une commande invité se retrouve avec la référence et le téléphone.")}{" "}
            <Link href="/track-order" className="font-bold text-terra">{t("Track an order", "Suivre une commande")}</Link>
          </p>
        )}
        {user && orders.length === 0 && <p className="text-muted">{t("No orders on this account yet.", "Aucune commande sur ce compte.")}</p>}
        {message && <p className="mb-4 text-sm font-semibold text-sage">{message}</p>}
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-3xl border border-[#e5dcc8] bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{order.id}</p>
                  <p className="text-sm text-muted">
                    {new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt))}
                  </p>
                </div>
                <p className="font-bold">{formatPrice(order.total)}</p>
              </div>
              <p className="mt-2 break-words text-sm">
                {order.service === "pickup" ? t("Takeaway", "À emporter") : t("Home delivery", "Livraison")} · {t(STATUS_LABEL[order.status].en, STATUS_LABEL[order.status].fr)} · {t(PAYMENT_STATUS_LABEL[order.paymentStatus].en, PAYMENT_STATUS_LABEL[order.paymentStatus].fr)} · {t(METHOD_LABEL[order.paymentMethod].en, METHOD_LABEL[order.paymentMethod].fr)}
              </p>
              {order.service === "pickup" && order.scheduledFor && (
                <p className="text-sm text-muted">{t("Pickup time", "Heure de retrait")}: {new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.scheduledFor))}</p>
              )}
              <ul className="mt-3 space-y-1 text-sm">
                {order.items.map((item) => (
                  <li key={item.id}>{item.quantity} × {dishName(item.name, lang)}{item.optionsLabel ? ` (${dishName(item.optionsLabel, lang)})` : ""}</li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={`/track-order?id=${order.id}`} className="text-sm font-bold text-terra">{t("Details", "Détails")}</Link>
                {order.status !== "cancelled" && (
                  <button type="button" onClick={() => reorder(order)} className="text-sm font-bold text-sage">{t("Reorder", "Commander à nouveau")}</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </main>
    </SiteShell>
  );
}
