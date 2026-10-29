"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Clock, Leaf, ShieldCheck, Truck } from "lucide-react";
import { DishImage } from "./components/DishImage";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Footer } from "./components/Footer";
import { DishCard } from "./components/DishCard";
import { categoryLabel, type Dish } from "./data/menuData";
import { useCatalog } from "./context/CatalogContext";
import { useLanguage } from "./context/LanguageContext";

const FEATURED_IDS = ["sp-1", "sp-3", "sp-6"];
const TANDOOR_IDS = ["by-1", "by-2", "na-1"];
const COURSE_IDS = [
  { slug: "specialites", id: "sp-1" },
  { slug: "biryanis", id: "by-1" },
  { slug: "naans", id: "na-3" },
  { slug: "pizzas", id: "pz-1" },
  { slug: "entrees", id: "en-1" },
  { slug: "formules", id: "fo-1" },
  { slug: "boissons", id: "bo-1" },
];

function pick(dishes: Dish[], ids: string[]) {
  return ids.map((id) => dishes.find((dish) => dish.id === id)).filter((dish): dish is Dish => Boolean(dish));
}

export default function Home() {
  const { t, lang } = useLanguage();
  const { dishes } = useCatalog();
  const featured = pick(dishes, FEATURED_IDS);
  const fromTandoor = pick(dishes, TANDOOR_IDS);
  const categories = COURSE_IDS.map((course) => {
    const dish = dishes.find((item) => item.id === course.id) ?? dishes.find((item) => item.category === course.slug);
    return dish ? { slug: course.slug, image: dish.image, name: dish.name } : null;
  }).filter((course): course is { slug: string; image: string; name: string } => Boolean(course));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Hero />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Truck, title: t("Hot delivery", "Livraison chaude"), text: t("Free delivery on orders from €25", "Livraison offerte dès 25 €") },
            { icon: Leaf, title: t("Basmati rice", "Riz basmati"), text: t("Specialties arrive with steamed rice", "Les spécialités sont servies avec du riz") },
            { icon: ShieldCheck, title: t("House sauce", "Sauce maison"), text: t("Pizzas use sauce faite maison", "Pizzas à la sauce faite maison") },
            { icon: Clock, title: t("Open daily", "Ouvert tous les jours"), text: t("Kitchen hours 11:00 to 23:00", "Cuisine ouverte de 11:00 à 23:00") },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4 rounded-3xl bg-card/80 border border-[#e5dcc8] p-4">
              <div className="bg-sage-soft text-sage p-3 rounded-2xl">
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-ink">{item.title}</h4>
                <p className="text-xs text-muted mt-0.5">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full">
        <div className="text-center mb-8">
          <h2 className="script-title text-6xl">Spécialités</h2>
          <p className="text-muted mt-2">{t("Served with basmati rice.", "Servis avec du riz basmati.")}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 w-full">
        <div className="text-center mb-8">
          <h2 className="script-title text-6xl">Biryani & Naan</h2>
          <p className="text-muted mt-2">{t("From the pot and the tandoor.", "Du faitout et du tandoor.")}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {fromTandoor.map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/menu" className="inline-flex items-center gap-2 font-bold text-terra">
            {t("See the full menu", "Voir tout le menu")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
        <h2 className="font-serif text-4xl text-center mb-8">{t("Browse by course", "Parcourir par catégorie")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link key={category.slug} href={`/menu/${category.slug}`} className="group bg-card rounded-3xl border border-[#e5dcc8] p-4 text-center">
              <div className="relative mx-auto h-28 w-28 rounded-full overflow-hidden">
                <DishImage src={category.image} alt={category.name} className="object-cover group-hover:scale-105 transition" />
              </div>
              <h3 className="mt-3 font-serif text-2xl">{categoryLabel(category.slug, lang)}</h3>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
        <h2 className="script-title text-6xl text-center mb-8">{t("Kind words", "Ils en parlent")}</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { quote: "The Biryani Poulet arrived steaming, with the rice still fragrant.", name: "Ayesha Khan" },
            { quote: "Butter Chicken with basmati rice is now our Friday order.", name: "Hassan Raza" },
            { quote: "Cheese naan and mango lassi made the whole table happy.", name: "Sara Malik" },
          ].map((item) => (
            <blockquote key={item.name} className="bg-card rounded-3xl border border-[#e5dcc8] p-6">
              <p className="text-ink leading-relaxed">“{item.quote}”</p>
              <footer className="mt-4 text-sm font-bold text-sage">{item.name}</footer>
            </blockquote>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
