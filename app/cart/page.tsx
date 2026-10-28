"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { SiteShell } from "../components/SiteShell";
import { useCart } from "../context/CartContext";
import { deliveryFeeFor, formatPrice, lineTotal, FREE_DELIVERY_FROM } from "../lib/pricing";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const subtotal = cart.reduce((sum, item) => sum + lineTotal(item.price, item.quantity || 1), 0);
  const deliveryFee = deliveryFeeFor(subtotal);
  const grandTotal = subtotal + deliveryFee;
  const remaining = Math.max(0, FREE_DELIVERY_FROM - subtotal);

  return (
    <SiteShell>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <h1 className="script-title text-6xl mb-8">Your basket</h1>

        {cart.length === 0 ? (
          <div className="bg-card rounded-3xl border border-[#c9b79c] p-12 text-center">
            <p className="text-muted mb-6">Your basket is empty.</p>
            <Link href="/menu" className="bg-terra text-white font-bold px-6 py-3 rounded-full">
              Browse the menu
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => {
                const quantity = item.quantity || 1;
                return (
                  <div key={item.id} className="bg-card rounded-3xl border border-[#c9b79c] p-4 flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                      <Image src={item.image} alt={item.name} fill unoptimized className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-serif text-2xl leading-none truncate">{item.name}</h2>
                      <p className="text-terra font-bold mt-1">{formatPrice(lineTotal(item.price, quantity))}</p>
                      <div className="mt-2 inline-flex items-center gap-3 bg-cream-deep rounded-full px-2 py-1">
                        <button type="button" onClick={() => updateQuantity(item.id, -1)} aria-label={`Decrease ${item.name}`} className="p-1">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold w-4 text-center">{quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, 1)} aria-label={`Increase ${item.name}`} className="p-1">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeFromCart(item.id)} className="text-muted hover:text-terra p-2" aria-label={`Remove ${item.name}`}>
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <aside className="bg-card rounded-3xl border border-[#c9b79c] p-6 h-fit">
              <h2 className="font-serif text-3xl mb-4">Summary</h2>
              <div className="space-y-2 text-sm text-muted">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span>{deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}</span></div>
                <div className="flex justify-between font-bold text-ink text-base pt-2 border-t border-[#c9b79c]">
                  <span>Total</span><span>{formatPrice(grandTotal)}</span>
                </div>
              </div>
              {remaining > 0 && (
                <p className="text-xs text-sage mt-3">Add {formatPrice(remaining)} for free delivery.</p>
              )}
              <Link href="/checkout" className="mt-5 block text-center bg-terra hover:bg-terra-deep text-white font-bold py-3.5 rounded-full">
                Checkout
              </Link>
            </aside>
          </div>
        )}
      </main>
    </SiteShell>
  );
}
