"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/menu?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setMobileMenuOpen(false);
    setSearchQuery("");
  };

  const linkClass = (href: string) =>
    `text-sm font-semibold transition ${
      pathname === href ? "text-terra" : "text-ink/80 hover:text-terra"
    }`;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#c9b79c]/80 bg-[#e4d5c0]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[4.5rem] gap-4 py-2">
            <Link href="/" className="leading-none" aria-label="omasalahub home">
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
              <div className="flex overflow-hidden rounded-full border border-[#c9b79c] text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setLang("fr")}
                  className={`px-2 py-1 ${lang === "fr" ? "bg-ink text-cream" : "text-ink"}`}
                  aria-label="Français"
                >
                  FR
                </button>
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`px-2 py-1 ${lang === "en" ? "bg-terra text-white" : "text-ink"}`}
                  aria-label="English"
                >
                  EN
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="p-2 text-ink/80 hover:text-terra"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <Link href="/wishlist" className="p-2 relative text-ink/80 hover:text-terra" aria-label="Wishlist">
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-terra text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <Link href="/cart" className="p-2 relative text-ink/80 hover:text-terra" aria-label="Cart">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-terra text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link href="/profile" className="hidden sm:inline-flex p-2 text-ink/80 hover:text-terra" aria-label="Profile">
                <User className="w-5 h-5" />
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="md:hidden p-2 text-ink"
                aria-label={mobileMenuOpen ? t("Close menu", "Fermer le menu") : t("Open menu", "Ouvrir le menu")}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <nav className="md:hidden border-t border-[#c9b79c] py-3 flex flex-col">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-2 py-3 font-semibold text-ink hover:text-terra"
                >
                  {t(link.en, link.fr)}
                </Link>
              ))}
              <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="px-2 py-3 font-semibold text-ink">
                {t("Profile", "Profil")}
              </Link>
            </nav>
          )}
        </div>
      </header>

      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-[#2c2118]/45 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
          <div className="bg-card w-full max-w-xl rounded-3xl p-6 shadow-2xl relative border border-[#c9b79c]">
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="absolute top-4 right-4 text-muted"
              aria-label={t("Close search", "Fermer la recherche")}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-2xl mb-4">{t("Search the menu", "Rechercher dans le menu")}</h3>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("Try biryani, naan, lassi...", "Essayez biryani, naan, lassi...")}
                  className="field pr-14"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-terra text-white p-2 rounded-xl"
                  aria-label="Submit search"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
