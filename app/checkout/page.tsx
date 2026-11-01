"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard } from "lucide-react";
import { SiteShell } from "../components/SiteShell";
import { Recommendations } from "../components/Recommendations";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCatalog } from "../context/CatalogContext";
import { useLanguage } from "../context/LanguageContext";
import { apiFetch } from "../lib/clientApi";
import { errorText } from "../lib/errors";
import { formatPrice } from "../lib/pricing";
import type { PaymentMethod } from "../lib/orders";
import type { ServiceMode } from "../lib/rules";
import type { PublicOrder } from "../lib/types";
import { useQuote } from "../lib/useQuote";

const PROFILE_KEY = "bitebloom_profile";

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { info } = useCatalog();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("cod");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [serviceChoice, setServiceChoice] = useState<ServiceMode | null>(null);
  const service: ServiceMode = serviceChoice ?? (info && !info.deliveryEnabled && info.pickupEnabled ? "pickup" : "delivery");

  useEffect(() => {
    const existing = sessionStorage.getItem("mh_checkout_key");
    const next = existing || crypto.randomUUID();
    sessionStorage.setItem("mh_checkout_key", next);
    const saved = localStorage.getItem(PROFILE_KEY);
    let profile: { name?: string; phone?: string; address?: string; email?: string } = {};
    if (saved) {
      try {
        profile = JSON.parse(saved) as typeof profile;
      } catch {
        profile = {};
      }
    }
    queueMicrotask(() => {
      setIdempotencyKey(next);
      setName((current) => current || profile.name || "");
      setPhone((current) => current || profile.phone || "");
      setAddress((current) => current || profile.address || "");
      setEmail((current) => current || profile.email || "");
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => {
      setName((current) => current || user.name);
      setEmail((current) => current || user.email);
      setPhone((current) => current || user.phone);
      setAddress((current) => current || user.address);
    });
  }, [user]);

  const needsSchedule = Boolean(info && !info.openNow && info.allowScheduled);
  const scheduled = needsSchedule && scheduleDate && scheduleTime ? { date: scheduleDate, time: scheduleTime } : null;
  const { quote } = useQuote(cart, { service, couponCode: appliedCoupon, scheduled, phone });

  const placeOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!quote?.canSubmit || !idempotencyKey) {
      setError(errorText(quote?.couponStatus && quote.couponStatus !== "coupon_applied" ? quote.couponStatus : quote?.orderingCode || "generic", lang));
      return;
    }
    setSubmitting(true);
    try {
      const response = await apiFetch("/api/order/place", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lines: cart.map((item) => ({
            productId: item.productId || item.id,
            quantity: item.quantity || 1,
            variantIds: item.variantIds ?? [],
            extraIds: item.extraIds ?? [],
          })),
          service,
          couponCode: appliedCoupon,
          scheduled,
          idempotencyKey,
          expectedTotalCents: quote.totalCents,
          paymentMethod: method,
          customer: { name, phone, email, address, note },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(errorText(data.error || "generic", lang));
        return;
      }
      const order = data.order as PublicOrder;
      if (order.accessToken) sessionStorage.setItem(`mh_order_${order.id}`, order.accessToken);
      sessionStorage.removeItem("mh_checkout_key");
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ name, phone, email, address }));
      clearCart();
      router.push(`/order-success?id=${encodeURIComponent(order.id)}`);
    } catch {
      setError(errorText("generic", lang));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteShell>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <h1 className="script-title text-6xl mb-8">{t("Checkout", "Commande")}</h1>
        {cart.length === 0 ? (
          <div className="bg-card rounded-3xl border border-[#e5dcc8] p-12 text-center">
            <p className="text-muted mb-5">{t("Nothing to check out yet.", "Rien à commander pour le moment.")}</p>
            <Link href="/menu" className="bg-terra text-ink font-bold px-6 py-3 rounded-full">{t("Open the menu", "Voir la carte")}</Link>
          </div>
        ) : (
          <form onSubmit={placeOrder} className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <section className="bg-card rounded-3xl border border-[#e5dcc8] p-6 space-y-4">
                <h2 className="font-serif text-3xl">{t("Service", "Service")}</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {info?.deliveryEnabled !== false && (
                    <button type="button" onClick={() => setServiceChoice("delivery")} className={`rounded-2xl border p-4 text-left ${service === "delivery" ? "border-terra bg-sage-soft/40" : "border-[#e5dcc8]"}`}>
                      <p className="font-bold">{t("Delivery", "Livraison")}</p>
                    </button>
                  )}
                  {info?.pickupEnabled !== false && (
                    <button type="button" onClick={() => setServiceChoice("pickup")} className={`rounded-2xl border p-4 text-left ${service === "pickup" ? "border-terra bg-sage-soft/40" : "border-[#e5dcc8]"}`}>
                      <p className="font-bold">{t("Pickup", "Retrait")}</p>
                    </button>
                  )}
                </div>
                {needsSchedule && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="text-sm font-bold">{t("Date", "Date")}
                      <input type="date" required className="field mt-1" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} />
                    </label>
                    <label className="text-sm font-bold">{t("Time", "Heure")} ({info?.timezone})
                      <input type="time" required className="field mt-1" value={scheduleTime} onChange={(event) => setScheduleTime(event.target.value)} />
                    </label>
                  </div>
                )}
                <label className="block text-sm font-bold">{t("Full name", "Nom complet")}
                  <input className="field mt-1" required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
                </label>
                <label className="block text-sm font-bold">{t("Phone", "Téléphone")}
                  <input className="field mt-1" required value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" />
                </label>
                <label className="block text-sm font-bold">{t("Email", "E-mail")}
                  <input type="email" className="field mt-1" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
                </label>
                {service === "delivery" && (
                  <label className="block text-sm font-bold">{t("Address", "Adresse")}
                    <textarea className="field mt-1" required rows={3} value={address} onChange={(event) => setAddress(event.target.value)} autoComplete="street-address" />
                  </label>
                )}
                <label className="block text-sm font-bold">{t("Note for the kitchen", "Note pour la cuisine")}
                  <input className="field mt-1" value={note} onChange={(event) => setNote(event.target.value)} />
                </label>
                {!user && (
                  <p className="text-sm text-muted">
                    {t("Guest checkout is open.", "La commande invité est possible.")}{" "}
                    <Link href="/login" className="font-bold text-terra">{t("Log in", "Connectez-vous")}</Link>{" "}
                    {t("if you want this order in your history and to leave a review later.", "pour retrouver cette commande et laisser un avis plus tard.")}
                  </p>
                )}
              </section>

              <section className="bg-card rounded-3xl border border-[#e5dcc8] p-6 space-y-4">
                <h2 className="font-serif text-3xl">{t("Payment", "Paiement")}</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <button type="button" onClick={() => setMethod("cod")} className={`text-left rounded-2xl border p-4 ${method === "cod" ? "border-terra bg-sage-soft/40" : "border-[#e5dcc8]"}`}>
                    <Banknote className="w-5 h-5 text-terra mb-2" />
                    <p className="font-bold">{t("Cash", "Espèces")}</p>
                    <p className="text-xs text-muted mt-1">{t("Pay when you receive the order. It is not marked paid in advance.", "À régler à la réception. La commande n'est pas marquée payée à l'avance.")}</p>
                  </button>
                  <button type="button" onClick={() => setMethod("online")} className={`text-left rounded-2xl border p-4 ${method === "online" ? "border-terra bg-sage-soft/40" : "border-[#e5dcc8]"}`}>
                    <CreditCard className="w-5 h-5 text-terra mb-2" />
                    <p className="font-bold">{t("Online payment", "Paiement en ligne")}</p>
                    <p className="text-xs text-muted mt-1">{t("The order stays pending until the payment provider confirms it. Card details are not entered here.", "La commande reste en attente tant que le prestataire n'a pas confirmé le paiement. Les données de carte ne sont pas saisies ici.")}</p>
                  </button>
                </div>
                <div className="flex gap-2">
                  <label className="flex-1 text-sm font-bold">{t("Coupon", "Code promo")}
                    <input className="field mt-1" value={coupon} onChange={(event) => setCoupon(event.target.value.toUpperCase())} />
                  </label>
                  <button type="button" onClick={() => setAppliedCoupon(coupon.trim())} className="self-end rounded-full border border-[#e5dcc8] px-4 py-3 text-sm font-bold">
                    {t("Apply", "Appliquer")}
                  </button>
                </div>
                {quote?.couponStatus && <p className="text-sm">{errorText(quote.couponStatus, lang)}</p>}
              </section>

              {quote && quote.orderingCode !== "ok" && <p className="text-sm font-semibold text-terra-deep">{errorText(quote.orderingCode, lang)}</p>}
              {error && <p className="text-sm font-semibold text-terra-deep">{error}</p>}
              <p className="text-xs text-muted leading-relaxed">
                {t(
                  "Prices are shown in euro, tax included. The restaurant owner still needs to confirm the legal identity, VAT rate, and checkout wording. This screen does not by itself make the shop legally compliant.",
                  "Les prix sont indiqués en euros, toutes taxes comprises. Le restaurateur doit encore confirmer l'identité légale, le taux de TVA et les mentions de commande. Cet écran ne suffit pas, à lui seul, à assurer la conformité juridique.",
                )}
              </p>
              <button type="submit" disabled={submitting || !quote?.canSubmit} className="w-full bg-terra hover:bg-terra-deep disabled:opacity-50 text-ink font-bold py-3.5 rounded-full">
                {t("Order with obligation to pay", "Commande avec obligation de paiement")} · {quote ? formatPrice(quote.total) : ""}
              </button>
            </div>

            <aside className="lg:col-span-2 bg-card rounded-3xl border border-[#e5dcc8] p-6 h-fit lg:sticky lg:top-24">
              <h2 className="font-serif text-3xl mb-1">{t("Final summary", "Récapitulatif final")}</h2>
              <p className="text-sm font-bold mb-4">{t("Order with obligation to pay", "Commande avec obligation de paiement")}</p>
              <ul className="space-y-3 text-sm">
                {(quote?.lines ?? []).map((item) => (
                  <li key={item.lineId}>
                    <div className="flex justify-between gap-3">
                      <span>{item.quantity} × {item.name}</span>
                      <span className="font-semibold">{formatPrice(item.lineTotal)}</span>
                    </div>
                    {item.optionsLabel && <p className="text-xs text-muted">{item.optionsLabel}</p>}
                    <p className="text-xs text-muted">{item.allergens ? `${t("Allergens", "Allergènes")}: ${item.allergens}` : t("Allergens not provided by the restaurant.", "Allergènes non communiqués par le restaurant.")}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-[#e5dcc8] space-y-2 text-sm">
                <div className="flex justify-between text-muted"><span>{t("Subtotal incl. tax", "Sous-total TTC")}</span><span>{quote ? formatPrice(quote.subtotal) : "…"}</span></div>
                {quote && quote.discount > 0 && <div className="flex justify-between text-muted"><span>{t("Discount", "Réduction")}</span><span>-{formatPrice(quote.discount)}</span></div>}
                <div className="flex justify-between text-muted"><span>{service === "pickup" ? t("Pickup", "Retrait") : t("Delivery", "Livraison")}</span><span>{quote ? (quote.deliveryFee === 0 ? t("Free", "Offerte") : formatPrice(quote.deliveryFee)) : "…"}</span></div>
                {quote && <div className="flex justify-between text-muted"><span>{t(`incl. VAT ${quote.vatRate}%`, `dont TVA ${quote.vatRate} %`)}</span><span>{formatPrice(quote.vatIncluded)}</span></div>}
                <div className="flex justify-between font-bold text-base"><span>{t("Amount due", "Montant dû")}</span><span>{quote ? formatPrice(quote.total) : "…"}</span></div>
                {info && <p className="text-xs text-sage pt-1">{t(`Preparation about ${info.prepMinutes} min.`, `Préparation d'environ ${info.prepMinutes} min.`)}</p>}
              </div>
              <Recommendations productIds={cart.map((item) => item.productId || item.id)} />
            </aside>
          </form>
        )}
      </main>
    </SiteShell>
  );
}
