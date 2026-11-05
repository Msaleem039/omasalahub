"use client";

import Link from "next/link";
import { SiteShell } from "./components/SiteShell";
import { useLanguage } from "./context/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <SiteShell>
      <main className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="script-title text-4xl sm:text-6xl lg:text-7xl">{t("This page is off the menu", "Cette page n’est pas à la carte")}</h1>
        <p className="text-muted mt-3 mb-8">{t("The link does not match a dish, a course, or a Masala Hub page.", "Ce lien ne correspond à aucun plat, aucune catégorie, ni aucune page Masala Hub.")}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="bg-terra text-ink font-bold px-6 py-3 rounded-full">{t("Home", "Accueil")}</Link>
          <Link href="/menu" className="bg-ink text-cream font-bold px-6 py-3 rounded-full">{t("Full menu", "Menu complet")}</Link>
        </div>
      </main>
    </SiteShell>
  );
}
