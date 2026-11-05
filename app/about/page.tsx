"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Leaf, ShieldCheck } from "lucide-react";
import { SiteShell } from "../components/SiteShell";
import { useCatalog } from "../context/CatalogContext";
import { useLanguage } from "../context/LanguageContext";

export default function AboutPage() {
  const { info } = useCatalog();
  const { t } = useLanguage();
  return (
    <SiteShell>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
        <section className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sage font-bold tracking-[0.16em] uppercase text-xs">{t("Our kitchen", "Notre cuisine")}</p>
            <h1 className="script-title mt-2 text-4xl sm:text-6xl lg:text-7xl">{t("Cooked slowly, served hot.", "Mijoté doucement, servi chaud.")}</h1>
            <p className="text-muted mt-4 leading-relaxed">
              {t(
                "Masala Hub cooks the dishes on our card: butter chicken and the other specialties with basmati rice, chicken and vegetable biryani, stuffed naan, house-sauce pizzas, samosas, and lassi.",
                "Masala Hub prépare les plats de la carte : poulet au beurre et les autres spécialités avec riz basmati, biryani poulet et végétarien, naan garni, pizzas à la sauce maison, samosas et lassi.",
              )}
            </p>
            <div className="mt-8 grid grid-cols-3 gap-2 border-t border-[#e5dcc8] pt-6 text-center sm:gap-4 sm:text-left">
              <div><p className="font-serif text-4xl text-terra">30m</p><p className="text-xs text-muted">{t("Typical delivery", "Livraison habituelle")}</p></div>
              <div><p className="font-serif text-4xl text-terra">22</p><p className="text-xs text-muted">{t("Dishes on the card", "Plats à la carte")}</p></div>
              <div><p className="font-serif text-4xl text-terra">{info?.hoursShort ? info.hoursShort.replace(" — ", "–") : "—"}</p><p className="text-xs text-muted">{t("Kitchen hours", "Horaires")}</p></div>
            </div>
          </div>
          <div className="relative h-80 sm:h-[420px] rounded-[2rem] overflow-hidden border-4 border-white shadow-xl">
            <Image
              src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1400&q=80"
              alt={t("Chicken biryani from the Masala Hub kitchen", "Biryani poulet de la cuisine Masala Hub")}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Leaf, title: t("Rice with every specialty", "Du riz avec chaque spécialité"), text: t("Butter chicken, masala, tikka, balti, korma, and dal tadka come with basmati rice.", "Poulet au beurre, masala, tikka, balti, korma et dal tadka sont servis avec du riz basmati.") },
            { icon: Clock, title: t("A clear kitchen clock", "Un horaire clair"), text: info?.hoursShort ? t(`The kitchen follows ${info.hoursShort} (${info.timezone}).`, `La cuisine suit ${info.hoursShort} (${info.timezone}).`) : t("Hours follow the restaurant schedule.", "Les horaires suivent le planning du restaurant.") },
            { icon: ShieldCheck, title: t("A tidy pass", "Un passage soigné"), text: t("Each box is sealed, labeled, and checked before it leaves the counter.", "Chaque boîte est scellée, étiquetée et vérifiée avant de quitter le comptoir.") },
          ].map((item) => (
            <div key={item.title} className="bg-card rounded-3xl border border-[#e5dcc8] p-6">
              <div className="w-11 h-11 rounded-2xl bg-sage-soft text-sage flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5" />
              </div>
              <h2 className="font-serif text-2xl">{item.title}</h2>
              <p className="text-sm text-muted mt-2 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[2rem] bg-ink text-cream p-8 sm:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="script-title text-4xl sm:text-5xl">{t("Hungry already?", "Déjà faim ?")}</h2>
            <p className="text-cream/80 mt-2">{t("Start with chicken biryani, or build a formule with a drink.", "Commencez par un biryani poulet, ou composez une formule avec une boisson.")}</p>
          </div>
          <Link href="/menu" className="bg-terra text-ink font-bold px-6 py-3 rounded-full text-center">
            {t("Open the menu", "Ouvrir la carte")}
          </Link>
        </section>
      </main>
    </SiteShell>
  );
}
