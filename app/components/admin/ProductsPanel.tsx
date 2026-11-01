"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { CATEGORIES, categoryLabel, type Dish, type DishVariant, type MenuCategory } from "../../data/menuData";
import { useCatalog } from "../../context/CatalogContext";
import { useLanguage } from "../../context/LanguageContext";
import { readImageFile } from "../../lib/catalog";
import { errorText } from "../../lib/errors";
import { formatPrice } from "../../lib/pricing";
import { DishImage } from "../DishImage";

const COURSE_SLUGS = CATEGORIES.filter((category) => category.slug !== "all").map((category) => category.slug as MenuCategory);

type Draft = {
  id: string;
  name: string;
  category: MenuCategory;
  price: string;
  description: string;
  image: string;
  available: boolean;
  stock: string;
  allergens: string;
  ingredients: string;
  isCombo: boolean;
  variants: { id: string; group: string; name: string; priceDelta: string }[];
  extraIds: string[];
  relatedIds: string[];
};

const emptyDraft = (): Draft => ({
  id: "",
  name: "",
  category: "specialites",
  price: "",
  description: "",
  image: "",
  available: true,
  stock: "",
  allergens: "",
  ingredients: "",
  isCombo: false,
  variants: [],
  extraIds: [],
  relatedIds: [],
});

export function ProductsPanel() {
  const { dishes, extras, saveDish, deleteDish } = useCatalog();
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

  const startEdit = (dish: Dish) => {
    setError("");
    setDraft({
      id: dish.id,
      name: dish.name,
      category: dish.category,
      price: String(dish.price),
      description: dish.description,
      image: dish.image,
      available: dish.available !== false,
      stock: dish.stock === null || dish.stock === undefined ? "" : String(dish.stock),
      allergens: dish.allergens ?? "",
      ingredients: dish.ingredients ?? "",
      isCombo: Boolean(dish.isCombo),
      variants: (dish.variants ?? []).map((variant: DishVariant) => ({
        id: variant.id,
        group: variant.group,
        name: variant.name,
        priceDelta: String(variant.priceDelta),
      })),
      extraIds: (dish.extras ?? []).map((extra) => extra.id),
      relatedIds: dish.relatedIds ?? [],
    });
  };

  const onFile = async (file: File | undefined) => {
    if (!file || !draft) return;
    try {
      setDraft({ ...draft, image: await readImageFile(file) });
      setError("");
    } catch {
      setError(t("Could not read that image.", "Impossible de lire cette image."));
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const price = Number(draft.price.replace(",", "."));
    if (!draft.name.trim() || !draft.description.trim() || !Number.isFinite(price) || price <= 0 || !draft.image) {
      setError(t("Name, description, photo, and a price above 0 are required.", "Le nom, la description, la photo et un prix supérieur à 0 sont requis."));
      return;
    }
    try {
      await saveDish({
        id: draft.id || `p-${Date.now().toString().slice(-8)}`,
        name: draft.name.trim(),
        category: draft.category,
        price,
        description: draft.description.trim(),
        image: draft.image,
        available: draft.available,
        stock: draft.stock.trim() === "" ? null : Number(draft.stock),
        allergens: draft.allergens.trim(),
        ingredients: draft.ingredients.trim(),
        isCombo: draft.isCombo,
        variants: draft.variants.filter((variant) => variant.name.trim()).map((variant) => ({
          id: variant.id,
          group: variant.group || "Option",
          name: variant.name.trim(),
          priceDelta: Number(variant.priceDelta.replace(",", ".")) || 0,
          available: true,
        })),
        extraIds: draft.extraIds,
        relatedIds: draft.relatedIds,
      });
      setDraft(null);
    } catch (saveError) {
      setError(errorText(saveError instanceof Error ? saveError.message : "generic", lang));
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="hidden font-serif text-4xl md:block">{t("Products", "Produits")}</h1>
        <button type="button" onClick={() => { setError(""); setDraft(emptyDraft()); }} className="inline-flex items-center gap-2 rounded-full bg-terra px-4 py-2.5 text-sm font-bold text-ink">
          <Plus className="h-4 w-4" />
          {t("Add product", "Ajouter un produit")}
        </button>
      </div>
      {draft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest/55 p-3 sm:items-center sm:p-6" onClick={() => { setDraft(null); setError(""); }}>
          <form onSubmit={save} onClick={(event) => event.stopPropagation()} className="max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl border border-[#e4d8c4] bg-card p-4 shadow-2xl sm:p-6">
            <h2 className="font-serif text-2xl">{draft.id ? t("Edit product", "Modifier le produit") : t("New product", "Nouveau produit")}</h2>
            <label className="block text-sm font-bold">{t("Name", "Nom")}<input className="field mt-1" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold">{t("Category", "Catégorie")}
                <select className="field mt-1" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as MenuCategory })}>
                  {COURSE_SLUGS.map((slug) => <option key={slug} value={slug}>{categoryLabel(slug, lang)}</option>)}
                </select>
              </label>
              <label className="block text-sm font-bold">{t("Price (€, tax included)", "Prix (€ TTC)")}
                <input className="field mt-1" inputMode="decimal" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} />
              </label>
            </div>
            <label className="block text-sm font-bold">{t("Description", "Description")}
              <textarea className="field mt-1" rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            </label>
            <label className="block text-sm font-bold">{t("Allergens verified by the restaurant", "Allergènes vérifiés par le restaurant")}
              <textarea className="field mt-1" rows={2} value={draft.allergens} onChange={(event) => setDraft({ ...draft, allergens: event.target.value })} placeholder={t("Leave empty if not confirmed. Do not write allergen-free.", "Laissez vide si ce n'est pas confirmé. N'écrivez pas « sans allergène ».")} />
            </label>
            <label className="block text-sm font-bold">{t("Ingredients, if verified", "Ingrédients, s'ils sont vérifiés")}
              <textarea className="field mt-1" rows={2} value={draft.ingredients} onChange={(event) => setDraft({ ...draft, ingredients: event.target.value })} />
            </label>
            <label className="block text-sm font-bold">{t("Stock, empty if not tracked", "Stock, vide si non suivi")}
              <input className="field mt-1" inputMode="numeric" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: event.target.value })} />
            </label>
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={draft.available} onChange={(event) => setDraft({ ...draft, available: event.target.checked })} />{t("Available to order", "Disponible à la commande")}</label>
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={draft.isCombo} onChange={(event) => setDraft({ ...draft, isCombo: event.target.checked })} />{t("Combo or set menu", "Formule ou menu")}</label>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold">{t("Variants", "Variantes")}</p>
                <button type="button" className="text-sm font-bold text-sage" onClick={() => setDraft({ ...draft, variants: [...draft.variants, { id: "", group: "Taille", name: "", priceDelta: "0" }] })}>{t("Add", "Ajouter")}</button>
              </div>
              {draft.variants.map((variant, index) => (
                <div key={`${variant.id}-${index}`} className="mb-2 grid grid-cols-3 gap-2">
                  <input className="field" value={variant.group} onChange={(event) => setDraft({ ...draft, variants: draft.variants.map((item, itemIndex) => itemIndex === index ? { ...item, group: event.target.value } : item) })} placeholder={t("Group", "Groupe")} />
                  <input className="field" value={variant.name} onChange={(event) => setDraft({ ...draft, variants: draft.variants.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) })} placeholder={t("Name", "Nom")} />
                  <input className="field" value={variant.priceDelta} onChange={(event) => setDraft({ ...draft, variants: draft.variants.map((item, itemIndex) => itemIndex === index ? { ...item, priceDelta: event.target.value } : item) })} placeholder="+€" />
                </div>
              ))}
            </div>
            <fieldset>
              <legend className="text-sm font-bold">{t("Extras offered", "Suppléments proposés")}</legend>
              <div className="mt-2 space-y-1">
                {extras.map((extra) => (
                  <label key={extra.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={draft.extraIds.includes(extra.id)} onChange={(event) => setDraft({ ...draft, extraIds: event.target.checked ? [...draft.extraIds, extra.id] : draft.extraIds.filter((id) => id !== extra.id) })} />
                    {extra.name} · {formatPrice(extra.price)}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-bold">{t("Related dishes", "Plats associés")}</legend>
              <div className="mt-2 max-h-36 space-y-1 overflow-y-auto">
                {dishes.filter((dish) => dish.id !== draft.id).map((dish) => (
                  <label key={dish.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={draft.relatedIds.includes(dish.id)} onChange={(event) => setDraft({ ...draft, relatedIds: event.target.checked ? [...draft.relatedIds, dish.id] : draft.relatedIds.filter((id) => id !== dish.id) })} />
                    {dish.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block text-sm font-bold">{t("Photo", "Photo")}
              <input type="file" accept="image/*" className="mt-2 block w-full text-sm" onChange={(event) => onFile(event.target.files?.[0])} />
            </label>
            {draft.image && <div className="relative h-36 w-36 overflow-hidden rounded-2xl"><DishImage src={draft.image} alt={draft.name || "Product"} /></div>}
            {error && <p className="text-sm font-semibold text-terra-deep">{error}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="rounded-full bg-terra px-5 py-2.5 text-sm font-bold text-ink">{t("Save product", "Enregistrer")}</button>
              <button type="button" onClick={() => { setDraft(null); setError(""); }} className="rounded-full border border-[#e4d8c4] px-5 py-2.5 text-sm font-bold">{t("Cancel", "Annuler")}</button>
            </div>
          </form>
        </div>
      )}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest/55 p-3 sm:items-center" onClick={() => setPendingDelete(null)}>
          <div onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-3xl border border-[#e4d8c4] bg-card p-5">
            <h2 className="font-serif text-2xl">{t("Delete product", "Supprimer le produit")}</h2>
            <p className="mt-2 text-sm text-muted">{t(`Remove ${pendingDelete.name} from the menu?`, `Retirer ${pendingDelete.name} de la carte ?`)}</p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={async () => { await deleteDish(pendingDelete.id); setPendingDelete(null); }} className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-cream">{t("Delete", "Supprimer")}</button>
              <button type="button" onClick={() => setPendingDelete(null)} className="rounded-full border border-[#e4d8c4] px-5 py-2.5 text-sm font-bold">{t("Cancel", "Annuler")}</button>
            </div>
          </div>
        </div>
      )}
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Search products", "Rechercher un produit")} className="field mb-4" />
      <ul className="space-y-3">
        {visible.map((dish) => (
          <li key={dish.id} className="flex flex-col gap-3 rounded-3xl border border-[#e4d8c4] bg-card p-3 sm:flex-row sm:items-center">
            <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-2xl sm:h-16 sm:w-16"><DishImage src={dish.image} alt={dish.name} /></div>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{dish.name}</p>
              <p className="text-sm text-muted">{categoryLabel(dish.category, lang)} · {formatPrice(dish.price)} · {dish.orderable === false ? t("Unavailable", "Indisponible") : t("Available", "Disponible")}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => startEdit(dish)} className="inline-flex items-center gap-1 rounded-full border border-[#e4d8c4] px-3 py-2 text-sm font-bold"><Pencil className="h-4 w-4" />{t("Edit", "Modifier")}</button>
              <button type="button" onClick={() => setPendingDelete(dish)} className="inline-flex items-center gap-1 rounded-full border border-[#e4d8c4] px-3 py-2 text-sm font-bold"><Trash2 className="h-4 w-4" />{t("Delete", "Supprimer")}</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
