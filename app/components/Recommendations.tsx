"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { dishName, dishPath, type Dish } from "../data/menuData";
import { apiFetch } from "../lib/clientApi";
import { formatPrice } from "../lib/pricing";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { DishImage } from "./DishImage";

export function Recommendations({ productIds, title }: { productIds: string[]; title?: string }) {
  const { t, lang } = useLanguage();
  const { addToCart } = useCart();
  const [items, setItems] = useState<Dish[]>([]);
  const ids = productIds.filter(Boolean).join(",");

  useEffect(() => {
    if (!ids) return;
    const controller = new AbortController();
    apiFetch(`/api/food/recommendations?ids=${encodeURIComponent(ids)}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (!controller.signal.aborted) setItems(Array.isArray(data.products) ? data.products : []);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [ids]);

  if (!ids || items.length === 0) return null;

  return (
    <section className="mt-8 min-w-0">
      <h2 className="mb-3 font-serif text-2xl sm:text-3xl">{title ?? t("Goes well with", "Avec votre commande")}</h2>
      <div className="flex max-w-full gap-3 overflow-x-auto pb-2">
        {items.map((item) => (
          <article key={item.id} className="w-56 shrink-0 rounded-3xl border border-[#e5dcc8] bg-card p-3">
            <Link href={dishPath(item)} className="relative block h-28 overflow-hidden rounded-2xl">
              <DishImage src={item.image} alt={dishName(item.name, lang)} />
            </Link>
            <h3 className="mt-3 font-serif text-xl leading-tight">
              <Link href={dishPath(item)}>{dishName(item.name, lang)}</Link>
            </h3>
            <p className="mt-1 text-sm font-bold text-terra">{formatPrice(item.price)}</p>
            <button
              type="button"
              onClick={() =>
                addToCart({
                  id: item.id,
                  productId: item.id,
                  name: item.name,
                  price: item.price,
                  image: item.image,
                  category: item.category,
                })
              }
              className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-full bg-terra px-3 py-2 text-sm font-bold text-ink"
            >
              <Plus className="h-4 w-4" />
              {t("Add", "Ajouter")}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
