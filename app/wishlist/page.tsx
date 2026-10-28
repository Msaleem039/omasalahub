"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Trash2 } from "lucide-react";
import { SiteShell } from "../components/SiteShell";
import { useWishlist, type WishlistItem } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/pricing";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const moveToCart = (item: WishlistItem) => {
    addToCart({ id: item.id, name: item.name, price: item.price, image: item.image, category: item.category });
    removeFromWishlist(item.id);
  };

  return (
    <SiteShell>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="script-title text-6xl mb-8">Saved dishes</h1>
        {wishlist.length === 0 ? (
          <div className="bg-card rounded-3xl border border-[#c9b79c] p-12 text-center">
            <p className="text-muted">Tap the heart on any dish to keep it here.</p>
            <Link href="/menu" className="inline-flex mt-5 bg-terra text-white font-bold px-6 py-3 rounded-full">Browse the menu</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <article key={item.id} className="bg-card rounded-3xl border border-[#c9b79c] overflow-hidden">
                <div className="relative h-44">
                  <Image src={item.image} alt={item.name} fill unoptimized className="object-cover" />
                  <button type="button" onClick={() => removeFromWishlist(item.id)} className="absolute top-3 right-3 bg-white/90 p-2 rounded-full" aria-label={`Remove ${item.name}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4">
                  <h2 className="font-serif text-2xl">{item.name}</h2>
                  <p className="text-terra font-bold mt-1">{formatPrice(item.price)}</p>
                  <button type="button" onClick={() => moveToCart(item)} className="mt-4 w-full bg-terra text-white font-bold py-2.5 rounded-full inline-flex items-center justify-center gap-2">
                    <ShoppingBag className="w-4 h-4" /> Move to basket
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </SiteShell>
  );
}
