"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DishImage } from "../components/DishImage";
import { Minus, Plus, Trash2 } from "lucide-react";
import { ORDER_SERVICE_KEY } from "../components/OrderTypeDialog";
import { SiteShell } from "../components/SiteShell";
import { Recommendations } from "../components/Recommendations";
import { useCart } from "../context/CartContext";
import { useCatalog } from "../context/CatalogContext";
import { useLanguage } from "../context/LanguageContext";
import { dishName } from "../data/menuData";
import { formatPrice } from "../lib/pricing";
import type { ServiceMode } from "../lib/rules";
import { useQuote } from "../lib/useQuote";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const { info } = useCatalog();
  const { t, lang } = useLanguage();
  const [chosen, setChosen] = useState<ServiceMode | null>(null);
  useEffect(() => {
    const stored = sessionStorage.getItem(ORDER_SERVICE_KEY);
    if (stored === "pickup" || stored === "delivery") queueMicrotask(() => setChosen(stored));
  }, []);
  const service: ServiceMode = chosen ?? (info?.deliveryEnabled === false && info?.pickupEnabled ? "pickup" : "delivery");
  const { quote, loading } = useQuote(cart, { service, couponCode: "", scheduled: null, phone: "" });
  const lines = quote?.lines ?? [];

  return (
    <SiteShell>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <h1 className="script-title mb-6 text-4xl sm:mb-8 sm:text-6xl">{t("Your basket", "Votre panier")}</h1>

        {cart.length === 0 ? (
          <div className="rounded-3xl border border-[#e5dcc8] bg-card p-8 text-center sm:p-12">
            <p className="text-muted mb-6">{t("Your basket is empty.", "Votre panier est vide.")}</p>
            <Link href="/menu" className="bg-terra text-ink font-bold px-6 py-3 rounded-full">
              {t("Browse the menu", "Voir la carte")}
            </Link>
          </div>
        ) : (
          <div className="grid min-w-0 gap-8 lg:grid-cols-3">
            <div className="min-w-0 space-y-4 lg:col-span-2">
              {cart.map((item) => {
                const quantity = item.quantity || 1;
                const priced = lines.find((line) => line.lineId === item.id);
                const name = dishName(item.name, lang);
                return (
                  <div key={item.id} className="rounded-3xl border border-[#e5dcc8] bg-card p-3 sm:p-4">
                    <div className="flex gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl sm:h-20 sm:w-20">
                        <DishImage src={item.image} alt={name} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="font-serif text-xl leading-tight break-words sm:text-2xl">{name}</h2>
                          <button type="button" onClick={() => removeFromCart(item.id)} className="-mr-1 -mt-1 shrink-0 p-2 text-muted hover:text-terra" aria-label={t(`Remove ${name}`, `Retirer ${name}`)}>
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                        {(priced?.optionsLabel || item.optionsLabel) && <p className="mt-1 break-words text-sm text-muted">{priced?.optionsLabel || item.optionsLabel}</p>}
                        {priced?.allergens && <p className="mt-1 break-words text-xs text-muted">{t("Allergens", "Allergènes")}: {priced.allergens}</p>}
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="inline-flex items-center gap-1 rounded-full bg-cream-deep px-1 py-1">
                            <button type="button" onClick={() => updateQuantity(item.id, -1)} aria-label={t(`Decrease ${name}`, `Diminuer ${name}`)} className="p-2">
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-6 text-center font-bold">{quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.id, 1)} aria-label={t(`Increase ${name}`, `Augmenter ${name}`)} className="p-2">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="font-bold text-terra">{priced ? formatPrice(priced.lineTotal) : t("Checking price", "Vérification du prix")}</p>
                        </div>
                        {!priced && !loading && <p className="mt-2 text-xs font-semibold text-terra-deep">{t("This dish needs another look before checkout.", "Ce plat doit être revu avant le paiement.")}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <Recommendations productIds={cart.map((item) => item.productId || item.id)} />
            </div>

            <aside className="h-fit rounded-3xl border border-[#e5dcc8] bg-card p-4 sm:p-6 lg:sticky lg:top-24">
              <h2 className="mb-4 font-serif text-3xl">{t("Summary", "Récapitulatif")}</h2>
              <div className="space-y-2 text-sm text-muted">
                <div className="money-row"><span>{t("Subtotal incl. tax", "Sous-total TTC")}</span><span>{quote ? formatPrice(quote.subtotal) : "…"}</span></div>
                <div className="money-row"><span>{service === "pickup" ? t("Takeaway", "À emporter") : t("Delivery", "Livraison")}</span><span>{service === "pickup" ? t("No delivery fee", "Sans frais de livraison") : quote ? (quote.deliveryFee === 0 ? t("Free", "Offerte") : formatPrice(quote.deliveryFee)) : "…"}</span></div>
                {quote && quote.vatRate > 0 && (
                  <div className="money-row"><span>{t(`incl. VAT ${quote.vatRate}%`, `dont TVA ${quote.vatRate} %`)}</span><span>{formatPrice(quote.vatIncluded)}</span></div>
                )}
                <div className="money-row border-t border-[#e5dcc8] pt-2 text-base font-bold text-ink">
                  <span>{t("Total incl. tax", "Total TTC")}</span><span>{quote ? formatPrice(quote.total) : "…"}</span>
                </div>
              </div>
              {info && info.minOrder > 0 && <p className="text-xs text-sage mt-3">{t(`Minimum order ${formatPrice(info.minOrder)}.`, `Minimum de commande ${formatPrice(info.minOrder)}.`)}</p>}
              {info && <p className="text-xs text-muted mt-2">{t(`About ${info.prepMinutes} min preparation.`, `Préparation d'environ ${info.prepMinutes} min.`)}</p>}
              <Link href="/checkout" className="mt-5 block text-center bg-terra hover:bg-terra-deep text-ink font-bold py-3.5 rounded-full">
                {t("Checkout", "Commander")}
              </Link>
            </aside>
          </div>
        )}
      </main>
    </SiteShell>
  );
}
