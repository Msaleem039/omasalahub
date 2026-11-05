"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Leaf, ShieldCheck, Truck } from "lucide-react";
import { DishImage } from "./components/DishImage";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Footer } from "./components/Footer";
import { DishCard } from "./components/DishCard";
import { OrderingBanner } from "./components/OrderingBanner";
import { categoryLabel, dishName, type Dish } from "./data/menuData";
import { useCatalog } from "./context/CatalogContext";
import { useLanguage } from "./context/LanguageContext";
import { apiFetch } from "./lib/clientApi";
import { formatPrice } from "./lib/pricing";
import type { PublicReview } from "./lib/types";

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
  const { dishes, info } = useCatalog();
  const [reviews, setReviews] = useState<PublicReview[]>([]);

  useEffect(() => {
    apiFetch("/api/food/reviews?pageSize=3")
      .then((response) => response.json())
      .then((data) => setReviews(Array.isArray(data.reviews) ? data.reviews : []))
      .catch(() => setReviews([]));
  }, []);
  const featured = pick(dishes, FEATURED_IDS);
  const fromTandoor = pick(dishes, TANDOOR_IDS);
  const categories = COURSE_IDS.map((course) => {
    const dish = dishes.find((item) => item.id === course.id) ?? dishes.find((item) => item.category === course.slug);
    return dish ? { slug: course.slug, image: dish.image, name: dish.name } : null;
  }).filter((course): course is { slug: string; image: string; name: string } => Boolean(course));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <OrderingBanner />
      <Hero />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Truck, title: t("Hot delivery", "Livraison chaude"), text: info ? t(`Free delivery from ${formatPrice(info.freeDeliveryFrom)}`, `Livraison offerte dès ${formatPrice(info.freeDeliveryFrom)}`) : t("Delivery fee shown at checkout", "Frais de livraison indiqués à la commande") },
            { icon: Leaf, title: t("Basmati rice", "Riz basmati"), text: t("Specialties arrive with steamed rice", "Les spécialités sont servies avec du riz") },
            { icon: ShieldCheck, title: t("House sauce", "Sauce maison"), text: t("Pizzas use sauce faite maison", "Pizzas à la sauce faite maison") },
            { icon: Clock, title: info?.openNow ? t("Kitchen open", "Cuisine ouverte") : t("Kitchen hours", "Horaires"), text: info?.hoursShort || t("Hours follow the restaurant schedule", "Horaires selon le planning du restaurant") },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4 rounded-3xl bg-card/80 border border-[#e5dcc8] p-4">
              <div className="bg-sage-soft text-sage p-3 rounded-2xl">
                <item.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-ink">{item.title}</h4>
                <p className="mt-0.5 text-xs text-muted">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full">
        <div className="text-center mb-8">
          <h2 className="script-title text-5xl sm:text-6xl">Spécialités</h2>
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
          <h2 className="script-title text-5xl sm:text-6xl">Biryani & Naan</h2>
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
                <DishImage src={category.image} alt={dishName(category.name, lang)} className="object-cover group-hover:scale-105 transition" />
              </div>
              <h3 className="mt-3 break-words font-serif text-xl sm:text-2xl">{categoryLabel(category.slug, lang)}</h3>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
        <h2 className="script-title mb-8 text-center text-5xl sm:text-6xl">{t("Verified reviews", "Avis vérifiés")}</h2>
        {reviews.length === 0 ? (
          <p className="text-center text-muted">{t("Approved reviews from completed orders will appear here.", "Les avis approuvés, issus de commandes terminées, apparaîtront ici.")}</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {reviews.map((review) => (
              <blockquote key={review.id} className="bg-card rounded-3xl border border-[#e5dcc8] p-6">
                <p className="text-ink leading-relaxed">“{review.body}”</p>
                <footer className="mt-4 text-sm font-bold text-sage">{review.author} · {review.productName} · {review.rating}/5</footer>
              </blockquote>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
