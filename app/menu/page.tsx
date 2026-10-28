"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, UtensilsCrossed } from "lucide-react";
import { SiteShell } from "../components/SiteShell";
import { DishCard } from "../components/DishCard";
import { CATEGORIES, DISHES, categoryLabel, type MenuCategory } from "../data/menuData";
import { useLanguage } from "../context/LanguageContext";

export default function MenuPage() {
  const { t, lang } = useLanguage();
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("search");
    if (query) setSearchQuery(query);
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return DISHES.filter((dish) => {
      const matchesCategory = selectedCat === "all" || dish.category === selectedCat;
      const matchesSearch =
        q === "" ||
        dish.name.toLowerCase().includes(q) ||
        dish.description.toLowerCase().includes(q) ||
        dish.category.includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCat, searchQuery]);

  const grouped = selectedCat === "all" && searchQuery.trim() === "";

  return (
    <SiteShell>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="text-center mb-8">
          <h1 className="script-title text-7xl">{t("The Menu", "La carte")}</h1>
          <p className="text-muted mt-2">{t("Specialties with basmati rice. Pizzas with sauce faite maison.", "Spécialités avec riz basmati. Pizzas à la sauce faite maison.")}</p>
        </div>

        <div className="max-w-md mx-auto mb-6 relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Search butter chicken, naan, lassi...", "Rechercher butter chicken, naan, lassi...")}
            className="field pl-11"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => setSelectedCat(category.slug)}
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                selectedCat === category.slug ? "bg-terra text-ink" : "bg-card text-ink border border-[#e5dcc8]"
              }`}
            >
              {categoryLabel(category.slug, lang)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center bg-card rounded-3xl border border-dashed border-[#e5dcc8] py-16">
            <UtensilsCrossed className="w-10 h-10 mx-auto text-sage mb-3" />
            <p className="font-semibold">{t("No dishes match that search.", "Aucun plat ne correspond à cette recherche.")}</p>
          </div>
        ) : grouped ? (
          <div className="space-y-12">
            {CATEGORIES.filter((category) => category.slug !== "all").map((category) => {
              const dishes = DISHES.filter((dish) => dish.category === category.slug);
              return (
                <section key={category.slug}>
                  <h2 className="script-title text-5xl mb-5">{categoryLabel(category.slug, lang)}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dishes.map((dish) => (
                      <DishCard key={dish.id} dish={dish} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div>
            {selectedCat !== "all" && (
              <h2 className="script-title text-5xl mb-5">{categoryLabel(selectedCat as MenuCategory, lang)}</h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          </div>
        )}
      </main>
    </SiteShell>
  );
}
