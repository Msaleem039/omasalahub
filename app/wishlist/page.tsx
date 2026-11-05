"use client";

import React from "react";
import { DishImage } from "../components/DishImage";
import Link from "next/link";
import { ShoppingBag, Trash2 } from "lucide-react";
import { SiteShell } from "../components/SiteShell";
import { useWishlist, type WishlistItem } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { dishName } from "../data/menuData";
import { useLanguage } from "../context/LanguageContext";
import { formatPrice } from "../lib/pricing";

export default function WishlistPage() {
  const { t, lang } = useLanguage();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const moveToCart = (item: WishlistItem) => {
    addToCart({ id: item.id, name: item.name, price: item.price, image: item.image, category: item.category });
    removeFromWishlist(item.id);
  };

  return (
    <SiteShell>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="script-title mb-8 text-4xl sm:text-6xl">{t("Saved dishes", "Plats enregistrés")}</h1>
        {wishlist.length === 0 ? (
          <div className="bg-card rounded-3xl border border-[#e5dcc8] p-12 text-center">
            <p className="text-muted">{t("Tap the heart on any dish to keep it here.", "Appuyez sur le cœur d’un plat pour le garder ici.")}</p>
            <Link href="/menu" className="inline-flex mt-5 bg-terra text-ink font-bold px-6 py-3 rounded-full">{t("Browse the menu", "Voir la carte")}</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <article key={item.id} className="bg-card rounded-3xl border border-[#e5dcc8] overflow-hidden">
                <div className="relative h-44">
                  <DishImage src={item.image} alt={dishName(item.name, lang)} />
                  <button type="button" onClick={() => removeFromWishlist(item.id)} className="absolute top-3 right-3 bg-white/90 p-2 rounded-full" aria-label={t(`Remove ${dishName(item.name, lang)}`, `Retirer ${dishName(item.name, lang)}`)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4">
                  <h2 className="font-serif text-2xl">{dishName(item.name, lang)}</h2>
                  <p className="text-terra font-bold mt-1">{formatPrice(item.price)}</p>
                  <button type="button" onClick={() => moveToCart(item)} className="mt-4 w-full bg-terra text-ink font-bold py-2.5 rounded-full inline-flex items-center justify-center gap-2">
                    <ShoppingBag className="w-4 h-4" /> {t("Move to basket", "Mettre au panier")}
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
