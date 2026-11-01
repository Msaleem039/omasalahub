"use client";

import React from "react";
import Link from "next/link";
import { DishImage } from "../components/DishImage";
import { Minus, Plus, Trash2 } from "lucide-react";
import { SiteShell } from "../components/SiteShell";
import { Recommendations } from "../components/Recommendations";
import { useCart } from "../context/CartContext";
import { useCatalog } from "../context/CatalogContext";
import { useLanguage } from "../context/LanguageContext";
import { formatPrice } from "../lib/pricing";
import { useQuote } from "../lib/useQuote";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const { info } = useCatalog();
  const { t } = useLanguage();
  const service = info?.deliveryEnabled === false && info?.pickupEnabled ? "pickup" : "delivery";
  const { quote, loading } = useQuote(cart, { service, couponCode: "", scheduled: null, phone: "" });
  const lines = quote?.lines ?? [];

  return (
    <SiteShell>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <h1 className="script-title text-6xl mb-8">{t("Your basket", "Votre panier")}</h1>

        {cart.length === 0 ? (
          <div className="bg-card rounded-3xl border border-[#e5dcc8] p-12 text-center">
            <p className="text-muted mb-6">{t("Your basket is empty.", "Votre panier est vide.")}</p>
            <Link href="/menu" className="bg-terra text-ink font-bold px-6 py-3 rounded-full">
              {t("Browse the menu", "Voir la carte")}
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => {
                const quantity = item.quantity || 1;
                const priced = lines.find((line) => line.lineId === item.id);
                return (
                  <div key={item.id} className="bg-card rounded-3xl border border-[#e5dcc8] p-4 flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                      <DishImage src={item.image} alt={item.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-serif text-2xl leading-none">{item.name}</h2>
                      {(priced?.optionsLabel || item.optionsLabel) && <p className="text-sm text-muted mt-1">{priced?.optionsLabel || item.optionsLabel}</p>}
                      {priced?.allergens && <p className="text-xs text-muted mt-1">{t("Allergens", "Allergènes")}: {priced.allergens}</p>}
                      <p className="text-terra font-bold mt-1">{priced ? formatPrice(priced.lineTotal) : t("Checking price", "Vérification du prix")}</p>
                      {!priced && !loading && <p className="text-xs font-semibold text-terra-deep">{t("This dish needs another look before checkout.", "Ce plat doit être revu avant le paiement.")}</p>}
                      <div className="mt-2 inline-flex items-center gap-3 bg-cream-deep rounded-full px-2 py-1">
                        <button type="button" onClick={() => updateQuantity(item.id, -1)} aria-label={t(`Decrease ${item.name}`, `Diminuer ${item.name}`)} className="p-2">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold w-4 text-center">{quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, 1)} aria-label={t(`Increase ${item.name}`, `Augmenter ${item.name}`)} className="p-2">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeFromCart(item.id)} className="text-muted hover:text-terra p-2" aria-label={t(`Remove ${item.name}`, `Retirer ${item.name}`)}>
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
              <Recommendations productIds={cart.map((item) => item.productId || item.id)} />
            </div>

            <aside className="bg-card rounded-3xl border border-[#e5dcc8] p-6 h-fit lg:sticky lg:top-24">
              <h2 className="font-serif text-3xl mb-4">{t("Summary", "Récapitulatif")}</h2>
              <div className="space-y-2 text-sm text-muted">
                <div className="flex justify-between"><span>{t("Subtotal incl. tax", "Sous-total TTC")}</span><span>{quote ? formatPrice(quote.subtotal) : "…"}</span></div>
                <div className="flex justify-between"><span>{service === "pickup" ? t("Pickup", "Retrait") : t("Delivery", "Livraison")}</span><span>{quote ? (quote.deliveryFee === 0 ? t("Free", "Offerte") : formatPrice(quote.deliveryFee)) : "…"}</span></div>
                {quote && quote.vatRate > 0 && (
                  <div className="flex justify-between"><span>{t(`incl. VAT ${quote.vatRate}%`, `dont TVA ${quote.vatRate} %`)}</span><span>{formatPrice(quote.vatIncluded)}</span></div>
                )}
                <div className="flex justify-between font-bold text-ink text-base pt-2 border-t border-[#e5dcc8]">
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
