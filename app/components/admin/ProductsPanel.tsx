"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { CATEGORIES, categoryLabel, type Dish, type MenuCategory } from "../../data/menuData";
import { useCatalog } from "../../context/CatalogContext";
import { useLanguage } from "../../context/LanguageContext";
import { readImageFile } from "../../lib/catalog";
import { formatPrice } from "../../lib/pricing";
import { DishImage } from "../DishImage";

const COURSE_SLUGS = CATEGORIES.filter((category) => category.slug !== "all").map((category) => category.slug as MenuCategory);

type Draft = {
  id: string;
  name: string;
  category: MenuCategory;
  price: string;
  rating: string;
  description: string;
  image: string;
};

const emptyDraft = (): Draft => ({
  id: "",
  name: "",
  category: "specialites",
  price: "",
  rating: "4.8",
  description: "",
  image: "",
});

export function ProductsPanel() {
  const { dishes, saveDish, deleteDish } = useCatalog();
  const { t, lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Dish | null>(null);

  useEffect(() => {
    if (!draft && !pendingDelete) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDraft(null);
        setPendingDelete(null);
        setError("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft, pendingDelete]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return dishes;
    return dishes.filter((dish) => `${dish.name} ${dish.category} ${dish.description}`.toLowerCase().includes(needle));
  }, [dishes, query]);

  const startAdd = () => {
    setError("");
    setDraft(emptyDraft());
  };

  const startEdit = (dish: Dish) => {
    setError("");
    setDraft({
      id: dish.id,
      name: dish.name,
      category: dish.category,
      price: String(dish.price),
      rating: String(dish.rating),
      description: dish.description,
      image: dish.image,
    });
  };

  const onFile = async (file: File | undefined) => {
    if (!file || !draft) return;
    try {
      const image = await readImageFile(file);
      setDraft({ ...draft, image });
      setError("");
    } catch {
      setError(t("Could not read that image.", "Impossible de lire cette image."));
    }
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const price = Number(draft.price.replace(",", "."));
    const rating = Number(draft.rating.replace(",", "."));
    if (!draft.name.trim() || !draft.description.trim() || !Number.isFinite(price) || price <= 0) {
      setError(t("Name, description, and a price above 0 are required.", "Le nom, la description et un prix supérieur à 0 sont requis."));
      return;
    }
    if (!draft.image) {
      setError(t("Upload a product photo.", "Ajoutez une photo du produit."));
      return;
    }
    try {
      saveDish({
        id: draft.id || `p-${Date.now().toString().slice(-8)}`,
        name: draft.name.trim(),
        category: draft.category,
        price,
        rating: Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 4.8,
        description: draft.description.trim(),
        image: draft.image,
      });
      setDraft(null);
      setError("");
    } catch {
      setError(t("That photo is too large to save on this browser.", "Cette photo est trop lourde pour ce navigateur."));
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="hidden font-serif text-4xl md:block">{t("Products", "Produits")}</h1>
        <button type="button" onClick={startAdd} className="inline-flex items-center gap-2 rounded-full bg-terra px-4 py-2.5 text-sm font-bold text-ink">
          <Plus className="h-4 w-4" />
          {t("Add product", "Ajouter un produit")}
        </button>
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest/55 p-3 sm:items-center sm:p-6" onClick={() => { setDraft(null); setError(""); }}>
        <form onSubmit={save} onClick={(event) => event.stopPropagation()} className="max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl border border-[#e4d8c4] bg-card p-4 shadow-2xl sm:p-6">
          <h2 className="font-serif text-2xl">{draft.id ? t("Edit product", "Modifier le produit") : t("New product", "Nouveau produit")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold">
              {t("Name", "Nom")}
              <input className="field mt-1" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </label>
            <label className="block text-sm font-bold">
              {t("Category", "Catégorie")}
              <select className="field mt-1" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as MenuCategory })}>
                {COURSE_SLUGS.map((slug) => (
                  <option key={slug} value={slug}>{categoryLabel(slug, lang)}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold">
              {t("Price (€)", "Prix (€)")}
              <input className="field mt-1" inputMode="decimal" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} />
            </label>
            <label className="block text-sm font-bold">
              {t("Rating", "Note")}
              <input className="field mt-1" inputMode="decimal" value={draft.rating} onChange={(event) => setDraft({ ...draft, rating: event.target.value })} />
            </label>
          </div>
          <label className="block text-sm font-bold">
            {t("Description", "Description")}
            <textarea className="field mt-1" rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
          </label>
          <label className="block text-sm font-bold">
            {t("Photo", "Photo")}
            <input type="file" accept="image/*" className="mt-2 block w-full text-sm" onChange={(event) => onFile(event.target.files?.[0])} />
          </label>
          {draft.image && (
            <div className="relative h-36 w-36 overflow-hidden rounded-2xl">
              <DishImage src={draft.image} alt={draft.name || "Product"} />
            </div>
          )}
          {error && <p className="text-sm font-semibold text-terra-deep">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="rounded-full bg-terra px-5 py-2.5 text-sm font-bold text-ink">
              {t("Save product", "Enregistrer")}
            </button>
            <button type="button" onClick={() => { setDraft(null); setError(""); }} className="rounded-full border border-[#e4d8c4] px-5 py-2.5 text-sm font-bold">
              {t("Cancel", "Annuler")}
            </button>
          </div>
        </form>
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest/55 p-3 sm:items-center sm:p-6" onClick={() => setPendingDelete(null)}>
          <div onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-3xl border border-[#e4d8c4] bg-card p-5 shadow-2xl">
            <h2 className="font-serif text-2xl">{t("Delete product", "Supprimer le produit")}</h2>
            <p className="mt-2 text-sm text-muted">
              {t(`Remove ${pendingDelete.name} from the menu?`, `Retirer ${pendingDelete.name} de la carte ?`)}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  deleteDish(pendingDelete.id);
                  if (draft?.id === pendingDelete.id) setDraft(null);
                  setPendingDelete(null);
                }}
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-cream"
              >
                {t("Delete", "Supprimer")}
              </button>
              <button type="button" onClick={() => setPendingDelete(null)} className="rounded-full border border-[#e4d8c4] px-5 py-2.5 text-sm font-bold">
                {t("Cancel", "Annuler")}
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("Search products", "Rechercher un produit")}
        className="field mb-4"
      />

      {visible.length === 0 ? (
        <p className="rounded-3xl border border-[#e4d8c4] bg-card p-8 text-muted">{t("No products match.", "Aucun produit.")}</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((dish) => (
            <li key={dish.id} className="flex flex-col gap-3 rounded-3xl border border-[#e4d8c4] bg-card p-3 sm:flex-row sm:items-center">
              <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-2xl sm:h-16 sm:w-16">
                <DishImage src={dish.image} alt={dish.name} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{dish.name}</p>
                <p className="text-sm text-muted">{categoryLabel(dish.category, lang)} · {formatPrice(dish.price)}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => startEdit(dish)} className="inline-flex items-center gap-1 rounded-full border border-[#e4d8c4] px-3 py-2 text-sm font-bold">
                  <Pencil className="h-4 w-4" />
                  {t("Edit", "Modifier")}
                </button>
                <button type="button" onClick={() => setPendingDelete(dish)} className="inline-flex items-center gap-1 rounded-full border border-[#e4d8c4] px-3 py-2 text-sm font-bold">
                  <Trash2 className="h-4 w-4" />
                  {t("Delete", "Supprimer")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
