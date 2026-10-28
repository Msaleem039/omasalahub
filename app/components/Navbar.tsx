"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { Logo } from "./Logo";
import { useLanguage } from "../context/LanguageContext";

const LINKS = [
  { href: "/", en: "Home", fr: "Accueil" },
  { href: "/menu", en: "Menu", fr: "Menu" },
  { href: "/about", en: "About", fr: "À propos" },
  { href: "/contact", en: "Contact", fr: "Contact" },
  { href: "/track-order", en: "Track", fr: "Suivi" },
];

export const Navbar: React.FC = () => {
  const { lang, setLang, t } = useLanguage();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const linkClass = (href: string) =>
    `text-sm font-semibold transition ${
      pathname === href ? "text-terra underline underline-offset-8" : "text-cream/85 hover:text-terra"
    }`;

  return (
    <>
      <header className="sticky top-0 z-50 bg-forest text-cream shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[4.5rem] gap-4 py-2">
            <Link href="/" className="leading-none" aria-label="Masala Hub home">
              <Logo />
            </Link>

            <nav className="hidden md:flex items-center gap-7">
              {LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                  {t(link.en, link.fr)}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              <div className="flex overflow-hidden rounded-full border border-white/20 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setLang("fr")}
                  className={`px-2 py-1 ${lang === "fr" ? "bg-terra text-ink" : "text-cream"}`}
                  aria-label="Français"
                >
                  FR
                </button>
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`px-2 py-1 ${lang === "en" ? "bg-terra text-ink" : "text-cream"}`}
                  aria-label="English"
                >
                  EN
                </button>
              </div>
              <Link href="/wishlist" className="p-2 relative text-cream/85 hover:text-terra" aria-label="Wishlist">
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-terra text-ink text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <Link href="/cart" className="p-2 relative text-cream/85 hover:text-terra" aria-label="Cart">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-terra text-ink text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link href="/login" className="p-2 text-cream/85 hover:text-terra" aria-label={t("Log in", "Connexion")}>
                <User className="w-5 h-5" />
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="md:hidden p-2 text-cream"
                aria-label={mobileMenuOpen ? t("Close menu", "Fermer le menu") : t("Open menu", "Ouvrir le menu")}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <nav className="md:hidden border-t border-white/15 py-3 flex flex-col">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-2 py-3 font-semibold text-cream hover:text-terra"
                >
                  {t(link.en, link.fr)}
                </Link>
              ))}
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="px-2 py-3 font-semibold text-cream">
                {t("Log in", "Connexion")}
              </Link>
            </nav>
          )}
        </div>
      </header>
    </>
  );
};
