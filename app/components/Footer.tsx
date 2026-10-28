"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
import { Logo } from "./Logo";

export const Footer = () => {
  const { t = (en: string) => en } = useLanguage() || {};
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="mt-8 border-t border-[#c9b79c] bg-[#cbbda8] text-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="space-y-3">
          <Logo size="lg" />
          <p className="text-sm text-muted leading-relaxed">
            {t(
              "Butter chicken, biryani, stuffed naan, and house lassi, prepared fresh and delivered to your door.",
              "Butter chicken, biryani, naan garni et lassi maison, préparés frais et livrés chez vous."
            )}
          </p>
        </div>

        <div>
          <h4 className="font-serif text-xl mb-3">{t("Visit", "Visiter")}</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/" className="hover:text-terra">{t("Home", "Accueil")}</Link></li>
            <li><Link href="/menu" className="hover:text-terra">{t("Full menu", "Menu complet")}</Link></li>
            <li><Link href="/about" className="hover:text-terra">{t("About", "À propos")}</Link></li>
            <li><Link href="/track-order" className="hover:text-terra">{t("Track order", "Suivre une commande")}</Link></li>
            <li><Link href="/checkout" className="hover:text-terra">{t("Checkout", "Commander")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-xl mb-3">{t("The menu", "La carte")}</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/menu/specialites" className="hover:text-terra">Spécialités</Link></li>
            <li><Link href="/menu/biryanis" className="hover:text-terra">Biryanis</Link></li>
            <li><Link href="/menu/naans" className="hover:text-terra">Naans</Link></li>
            <li><Link href="/menu/pizzas" className="hover:text-terra">Pizzas signature</Link></li>
            <li><Link href="/menu/boissons" className="hover:text-terra">{t("Lassis & drinks", "Lassis et boissons")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-xl mb-3">{t("Kitchen", "Cuisine")}</h4>
          <ul className="space-y-3 text-sm text-muted">
            <li className="flex gap-2"><MapPin className="w-4 h-4 text-terra shrink-0 mt-0.5" /> Main Boulevard, Gulberg III, Lahore</li>
            <li className="flex gap-2"><Phone className="w-4 h-4 text-terra shrink-0" /> +92 42 111 228 325</li>
            <li className="flex gap-2"><Mail className="w-4 h-4 text-terra shrink-0" /> support@omasalahub.com</li>
            <li className="flex gap-2"><Clock className="w-4 h-4 text-terra shrink-0" /> {t("Open daily, 11:00–23:00", "Ouvert tous les jours, 11:00–23:00")}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#b9a88e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-muted">
          <p>© {year ?? "2026"} omasalahub. {t("All rights reserved.", "Tous droits réservés.")}</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-terra">{t("Privacy", "Confidentialité")}</Link>
            <Link href="/terms" className="hover:text-terra">{t("Terms", "Conditions")}</Link>
            <Link href="/hygiene" className="hover:text-terra">{t("Hygiene", "Hygiène")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
