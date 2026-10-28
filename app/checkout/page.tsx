"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard } from "lucide-react";
import { SiteShell } from "../components/SiteShell";
import { useCart } from "../context/CartContext";
import { deliveryFeeFor, formatPrice, lineTotal } from "../lib/pricing";
import { createOrderId, saveOrder, type PaymentMethod } from "../lib/orders";

const PROFILE_KEY = "bitebloom_profile";

interface FormState {
  name: string;
  phone: string;
  address: string;
  note: string;
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

const emptyForm: FormState = {
  name: "",
  phone: "",
  address: "",
  note: "",
  cardName: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function isFutureExpiry(value: string) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  const end = new Date(year, month, 1);
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return end > thisMonth;
}

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("cod");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");

  const subtotal = cart.reduce((sum, item) => sum + lineTotal(item.price, item.quantity || 1), 0);
  const deliveryFee = deliveryFeeFor(subtotal);
  const total = subtotal + deliveryFee;

  useEffect(() => {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (!saved) return;
    try {
      const profile = JSON.parse(saved) as Partial<FormState>;
      setForm((current) => ({
        ...current,
        name: profile.name || current.name,
        phone: profile.phone || current.phone,
        address: profile.address || current.address,
      }));
    } catch {
      /* ignore broken profile cache */
    }
  }, []);

  const setField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const placeOrder = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (cart.length === 0) {
      setError("Add a dish before checkout.");
      return;
    }
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("Name, phone, and delivery address are required.");
      return;
    }

    let cardLast4: string | undefined;
    if (method === "online") {
      const card = digitsOnly(form.cardNumber);
      if (form.cardName.trim().length < 2 || card.length !== 16 || !isFutureExpiry(form.expiry) || !/^\d{3,4}$/.test(form.cvv)) {
        setError("Enter the name on the card, a 16-digit number, a future expiry (MM/YY), and a 3 or 4 digit CVV.");
        return;
      }
      cardLast4 = card.slice(-4);
    }

    const order = {
      id: createOrderId(),
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        image: item.image,
      })),
      subtotal,
      deliveryFee,
      total,
      paymentMethod: method,
      cardLast4,
      customer: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        note: form.note.trim(),
      },
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify({ name: order.customer.name, phone: order.customer.phone, address: order.customer.address })
    );
    saveOrder(order);
    clearCart();
    router.push(`/order-success?id=${order.id}`);
  };

  return (
    <SiteShell>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <h1 className="script-title text-6xl mb-8">Checkout</h1>

        {cart.length === 0 ? (
          <div className="bg-card rounded-3xl border border-[#c9b79c] p-12 text-center">
            <p className="text-muted mb-5">Nothing to check out yet.</p>
            <Link href="/menu" className="bg-terra text-white font-bold px-6 py-3 rounded-full">Open the menu</Link>
          </div>
        ) : (
          <form onSubmit={placeOrder} className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <section className="bg-card rounded-3xl border border-[#c9b79c] p-6 space-y-4">
                <h2 className="font-serif text-3xl">Delivery</h2>
                <label className="block text-sm font-bold">Full name
                  <input className="field mt-1" value={form.name} onChange={(e) => setField("name", e.target.value)} />
                </label>
                <label className="block text-sm font-bold">Phone
                  <input className="field mt-1" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
                </label>
                <label className="block text-sm font-bold">Address
                  <textarea className="field mt-1" rows={3} value={form.address} onChange={(e) => setField("address", e.target.value)} />
                </label>
                <label className="block text-sm font-bold">Note for the kitchen
                  <input className="field mt-1" value={form.note} onChange={(e) => setField("note", e.target.value)} placeholder="Extra raita, mild spice..." />
                </label>
              </section>

              <section className="bg-card rounded-3xl border border-[#c9b79c] p-6 space-y-4">
                <h2 className="font-serif text-3xl">Payment</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod("cod")}
                    className={`text-left rounded-2xl border p-4 ${method === "cod" ? "border-terra bg-sage-soft/40" : "border-[#c9b79c]"}`}
                  >
                    <Banknote className="w-5 h-5 text-terra mb-2" />
                    <p className="font-bold">Cash on delivery</p>
                    <p className="text-xs text-muted mt-1">Pay the courier when the food arrives.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("online")}
                    className={`text-left rounded-2xl border p-4 ${method === "online" ? "border-terra bg-sage-soft/40" : "border-[#c9b79c]"}`}
                  >
                    <CreditCard className="w-5 h-5 text-terra mb-2" />
                    <p className="font-bold">Online payment</p>
                    <p className="text-xs text-muted mt-1">Pay by card before the kitchen starts.</p>
                  </button>
                </div>

                {method === "online" && (
                  <div className="grid sm:grid-cols-2 gap-3 pt-2">
                    <label className="sm:col-span-2 block text-sm font-bold">Name on card
                      <input className="field mt-1" value={form.cardName} onChange={(e) => setField("cardName", e.target.value)} />
                    </label>
                    <label className="sm:col-span-2 block text-sm font-bold">Card number
                      <input
                        className="field mt-1"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="4242 4242 4242 4242"
                        value={form.cardNumber}
                        onChange={(e) => setField("cardNumber", digitsOnly(e.target.value).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 "))}
                      />
                    </label>
                    <label className="block text-sm font-bold">Expiry
                      <input
                        className="field mt-1"
                        placeholder="MM/YY"
                        value={form.expiry}
                        onChange={(e) => {
                          const raw = digitsOnly(e.target.value).slice(0, 4);
                          setField("expiry", raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw);
                        }}
                      />
                    </label>
                    <label className="block text-sm font-bold">CVV
                      <input
                        className="field mt-1"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        value={form.cvv}
                        onChange={(e) => setField("cvv", digitsOnly(e.target.value).slice(0, 4))}
                      />
                    </label>
                    <p className="sm:col-span-2 text-xs text-muted">
                      This checkout confirms the order in your browser. The full card number is not stored.
                    </p>
                  </div>
                )}
              </section>

              {error && <p className="text-sm font-semibold text-terra-deep">{error}</p>}
              <button type="submit" className="w-full bg-terra hover:bg-terra-deep text-white font-bold py-3.5 rounded-full">
                {method === "cod" ? `Place order · ${formatPrice(total)}` : `Pay ${formatPrice(total)}`}
              </button>
            </div>

            <aside className="lg:col-span-2 bg-card rounded-3xl border border-[#c9b79c] p-6 h-fit">
              <h2 className="font-serif text-3xl mb-4">Your dishes</h2>
              <ul className="space-y-3 text-sm">
                {cart.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span>{item.quantity || 1} × {item.name}</span>
                    <span className="font-semibold">{formatPrice(lineTotal(item.price, item.quantity || 1))}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-[#c9b79c] space-y-2 text-sm">
                <div className="flex justify-between text-muted"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between text-muted"><span>Delivery</span><span>{deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}</span></div>
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatPrice(total)}</span></div>
                <p className="text-xs text-sage pt-1">{method === "cod" ? "Cash on delivery" : "Online payment"}</p>
              </div>
            </aside>
          </form>
        )}
      </main>
    </SiteShell>
  );
}
