"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Check, Heart, Plus, Star } from "lucide-react";
import type { Dish } from "../data/menuData";
import { formatPrice } from "../lib/pricing";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useLanguage } from "../context/LanguageContext";

export function DishCard({ dish }: { dish: Dish }) {
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [added, setAdded] = useState(false);
  const saved = isInWishlist(dish.id);

  const handleAdd = () => {
    addToCart({
      id: dish.id,
      name: dish.name,
      price: dish.price,
      image: dish.image,
      category: dish.category,
      rating: dish.rating,
      description: dish.description,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 900);
  };

  const toggleSaved = () => {
    if (saved) {
      removeFromWishlist(dish.id);
      return;
    }
    addToWishlist({
      id: dish.id,
      name: dish.name,
      price: dish.price,
      image: dish.image,
      category: dish.category,
    });
  };

  return (
    <article className="bg-card rounded-[1.6rem] border border-[#c9b79c] shadow-[0_12px_30px_rgba(60,42,30,0.06)] p-3 flex flex-col">
      <div className="relative h-52 rounded-[1.25rem] overflow-hidden bg-cream-deep">
        <Image src={dish.image} alt={dish.name} fill unoptimized className="object-cover" />
        <button
          type="button"
          onClick={toggleSaved}
          aria-label={saved ? `Remove ${dish.name} from wishlist` : `Save ${dish.name}`}
          className={`absolute top-3 right-3 h-9 w-9 rounded-full flex items-center justify-center shadow-sm ${
            saved ? "bg-terra text-white" : "bg-white/90 text-ink"
          }`}
        >
          <Heart className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="px-2 pt-4 pb-2 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-[1.35rem] leading-tight text-ink">{dish.name}</h3>
          <span className="flex items-center gap-1 text-xs font-bold text-amber-700 shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {dish.rating.toFixed(1)}
          </span>
        </div>
        <p className="text-sm text-muted mt-2 leading-relaxed line-clamp-2">{dish.description}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-lg font-extrabold text-terra">{formatPrice(dish.price)}</span>
          <button
            type="button"
            onClick={handleAdd}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white ${
              added ? "bg-sage" : "bg-terra hover:bg-terra-deep"
            }`}
          >
            {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {added ? t("Added", "Ajouté") : t("Add", "Ajouter")}
          </button>
        </div>
      </div>
    </article>
  );
}
