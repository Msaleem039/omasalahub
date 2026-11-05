"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Star } from "lucide-react";
import { SiteShell } from "./SiteShell";
import { DishImage } from "./DishImage";
import { ProductReviews } from "./ProductReviews";
import { categoryLabel, dishDescription, dishName, dishPath, type Dish } from "../data/menuData";
import { formatPrice } from "../lib/pricing";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";

export function ProductView({ product, related }: { product: Dish; related: Dish[] }) {
  const { t, lang } = useLanguage();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [variants, setVariants] = useState<Record<string, string>>({});
  const [extras, setExtras] = useState<string[]>([]);
  const [added, setAdded] = useState(false);
  const orderable = product.orderable !== false && product.available !== false;
  const groups = useMemo(() => {
    const map = new Map<string, NonNullable<Dish["variants"]>>();
    for (const variant of product.variants ?? []) {
      map.set(variant.group, [...(map.get(variant.group) ?? []), variant]);
    }
    return [...map.entries()];
  }, [product.variants]);

  const selectedVariants = groups
    .map(([group, options]) => options.find((option) => option.id === variants[group] && option.available))
    .filter((option): option is NonNullable<Dish["variants"]>[number] => Boolean(option));
  const selectedExtras = (product.extras ?? []).filter((extra) => extras.includes(extra.id) && extra.available);
  const unit = product.price + selectedVariants.reduce((sum, item) => sum + item.priceDelta, 0) + selectedExtras.reduce((sum, item) => sum + item.price, 0);
  const optionsLabel = [...selectedVariants.map((item) => item.name), ...selectedExtras.map((item) => item.name)].join(", ");

  const add = () => {
    if (!orderable) return;
    addToCart(
      {
        id: product.id,
        productId: product.id,
        name: product.name,
        price: unit,
        image: product.image,
        category: product.category,
        description: product.description,
        variantIds: selectedVariants.map((item) => item.id),
        extraIds: selectedExtras.map((item) => item.id),
        optionsLabel,
      },
      quantity,
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  };

  return (
    <SiteShell>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-28 sm:px-6 sm:pb-12 lg:px-8">
        <nav className="mb-6 flex flex-wrap gap-x-1 text-sm text-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-terra">{t("Home", "Accueil")}</Link>
          <span> / </span>
          <Link href="/menu" className="hover:text-terra">{t("Menu", "Menu")}</Link>
          <span> / </span>
          <Link href={`/menu/${product.category}`} className="hover:text-terra">{categoryLabel(product.category, lang)}</Link>
          <span> / </span>
          <span className="text-ink">{dishName(product.name, lang)}</span>
        </nav>

        <div className="grid items-start gap-8 lg:grid-cols-2">
          <div className="relative h-64 overflow-hidden rounded-[2rem] border border-[#e5dcc8] bg-cream-deep sm:h-80 lg:h-[28rem]">
            <DishImage src={product.image} alt={dishName(product.name, lang)} priority sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sage">{categoryLabel(product.category, lang)}</p>
            <h1 className="mt-2 break-words font-serif text-4xl leading-tight sm:text-5xl">{dishName(product.name, lang)}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-2xl font-extrabold text-terra">{formatPrice(product.price)}</p>
              <span className="text-xs font-bold text-muted">{t("Tax included", "Prix TTC")}</span>
              {product.reviewCount ? (
                <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-700">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {product.reviewAverage?.toFixed(1)} ({product.reviewCount})
                </span>
              ) : (
                <span className="text-sm text-muted">{t("No reviews yet", "Pas encore d'avis")}</span>
              )}
            </div>
            <p className="mt-4 leading-relaxed text-muted">{dishDescription(product.description, lang)}</p>
            <p className={`mt-4 text-sm font-bold ${orderable ? "text-sage" : "text-terra-deep"}`}>
              {orderable ? t("Available", "Disponible") : t("Unavailable right now", "Indisponible pour le moment")}
            </p>
            {product.isCombo && <p className="mt-2 text-sm font-bold">{t("Set menu", "Formule")}</p>}

            <div className="mt-5 rounded-3xl border border-[#e5dcc8] bg-card p-4">
              <h2 className="font-bold">{t("Allergens", "Allergènes")}</h2>
              {product.allergens ? (
                <p className="mt-1 text-sm">{product.allergens}</p>
              ) : (
                <p className="mt-1 text-sm text-muted">
                  {t(
                    "The restaurant has not provided allergen information. That does not mean this dish is allergen-free.",
                    "Le restaurant n'a pas communiqué d'information allergène. Cela ne signifie pas que le plat est sans allergène.",
                  )}
                </p>
              )}
              {product.ingredients ? (
                <p className="mt-3 text-sm"><span className="font-bold">{t("Ingredients", "Ingrédients")}: </span>{product.ingredients}</p>
              ) : null}
            </div>

            {groups.map(([group, options]) => (
              <fieldset key={group} className="mt-5">
                <legend className="text-sm font-bold">{group}</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setVariants((current) => ({ ...current, [group]: "" }))} className={`rounded-full border px-3 py-2 text-sm font-bold ${!variants[group] ? "border-terra bg-sage-soft/50" : "border-[#e5dcc8]"}`}>
                    {t("Standard", "Standard")}
                  </button>
                  {options.filter((option) => option.available).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setVariants((current) => ({ ...current, [group]: option.id }))}
                      className={`rounded-full border px-3 py-2 text-sm font-bold ${variants[group] === option.id ? "border-terra bg-sage-soft/50" : "border-[#e5dcc8]"}`}
                    >
                      {option.name} {option.priceDelta > 0 ? `+${formatPrice(option.priceDelta)}` : ""}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}

            {(product.extras ?? []).some((extra) => extra.available) && (
              <fieldset className="mt-5">
                <legend className="text-sm font-bold">{t("Optional extras", "Suppléments")}</legend>
                <div className="mt-2 space-y-2">
                  {(product.extras ?? []).filter((extra) => extra.available).map((extra) => (
                    <label key={extra.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#e5dcc8] px-3 py-2 text-sm">
                      <span className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={extras.includes(extra.id)}
                          onChange={(event) =>
                            setExtras((current) => event.target.checked ? [...current, extra.id] : current.filter((id) => id !== extra.id))
                          }
                        />
                        {dishName(extra.name, lang)}
                      </span>
                      <span className="font-bold">+{formatPrice(extra.price)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="mt-6 hidden items-center gap-3 sm:flex">
              <div className="inline-flex items-center gap-3 rounded-full bg-cream-deep px-2 py-1">
                <button type="button" aria-label={t("Decrease quantity", "Diminuer la quantité")} onClick={() => setQuantity((current) => Math.max(1, current - 1))} className="p-2"><Minus className="h-4 w-4" /></button>
                <span className="w-6 text-center font-bold">{quantity}</span>
                <button type="button" aria-label={t("Increase quantity", "Augmenter la quantité")} onClick={() => setQuantity((current) => Math.min(30, current + 1))} className="p-2"><Plus className="h-4 w-4" /></button>
              </div>
              <button type="button" disabled={!orderable} onClick={add} className="rounded-full bg-terra px-6 py-3 font-bold text-ink disabled:opacity-50">
                {added ? t("Added", "Ajouté") : `${t("Add", "Ajouter")} · ${formatPrice(unit * quantity)}`}
              </button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-4xl mb-4">{t("You may also like", "Dans la même veine")}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {related.map((item) => (
                <Link key={item.id} href={dishPath(item)} className="rounded-3xl border border-[#e5dcc8] bg-card p-3">
                  <div className="relative h-32 overflow-hidden rounded-2xl"><DishImage src={item.image} alt={dishName(item.name, lang)} /></div>
                  <p className="mt-3 font-serif text-2xl">{dishName(item.name, lang)}</p>
                  <p className="font-bold text-terra">{formatPrice(item.price)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
        <ProductReviews productId={product.id} />
      </main>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e5dcc8] bg-card p-3 sm:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="inline-flex items-center rounded-full bg-cream-deep px-1">
            <button type="button" aria-label={t("Decrease quantity", "Diminuer la quantité")} onClick={() => setQuantity((current) => Math.max(1, current - 1))} className="p-3"><Minus className="h-4 w-4" /></button>
            <span className="w-5 text-center font-bold">{quantity}</span>
            <button type="button" aria-label={t("Increase quantity", "Augmenter la quantité")} onClick={() => setQuantity((current) => Math.min(30, current + 1))} className="p-3"><Plus className="h-4 w-4" /></button>
          </div>
          <button type="button" disabled={!orderable} onClick={add} className="flex-1 rounded-full bg-terra py-3 font-bold text-ink disabled:opacity-50">
            {orderable ? `${t("Add", "Ajouter")} · ${formatPrice(unit * quantity)}` : t("Unavailable", "Indisponible")}
          </button>
        </div>
      </div>
    </SiteShell>
  );
}
