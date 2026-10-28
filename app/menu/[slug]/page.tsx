"use client";

import React, { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteShell } from "../../components/SiteShell";
import { DishCard } from "../../components/DishCard";
import { categoryLabel, dishesByCategory } from "../../data/menuData";
import { useLanguage } from "../../context/LanguageContext";

export default function CategoryMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t, lang } = useLanguage();
  const dishes = dishesByCategory(slug);
  const title = categoryLabel(slug, lang);

  return (
    <SiteShell>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <Link href="/menu" className="inline-flex items-center gap-2 text-terra font-semibold mb-6">
          <ArrowLeft className="w-4 h-4" /> {t("Full menu", "Menu complet")}
        </Link>
        <h1 className="script-title text-6xl sm:text-7xl mb-3">{title}</h1>
        <p className="text-muted mb-8">
          {slug === "specialites"
            ? t("Each specialty is served with basmati rice.", "Chaque spécialité est servie avec du riz basmati.")
            : slug === "pizzas"
              ? t("House-made sauce.", "Sauce faite maison.")
              : t(`${dishes.length} dishes in this course.`, `${dishes.length} plats dans cette catégorie.`)}
        </p>

        {dishes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-3xl border border-[#c9b79c] p-12 text-center">
            <p className="text-muted">{t("That course is not on the menu.", "Cette catégorie n'est pas à la carte.")}</p>
            <Link href="/menu" className="inline-flex mt-4 bg-terra text-white font-bold px-5 py-2.5 rounded-full">
              {t("Browse dishes", "Voir les plats")}
            </Link>
          </div>
        )}
      </main>
    </SiteShell>
  );
}
