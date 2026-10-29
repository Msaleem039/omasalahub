"use client";

import React, { useState } from "react";
import { ClipboardList, LogOut, Menu, UtensilsCrossed, X } from "lucide-react";
import { Logo } from "../Logo";
import { useLanguage } from "../../context/LanguageContext";

export type AdminSection = "orders" | "products";

export function AdminShell({
  section,
  onSection,
  onLogout,
  children,
}: {
  section: AdminSection;
  onSection: (section: AdminSection) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const choose = (next: AdminSection) => {
    onSection(next);
    setOpen(false);
  };

  const itemClass = (id: AdminSection) =>
    `flex items-center gap-3 w-full rounded-2xl px-3 py-3 text-sm font-bold ${
      section === id ? "bg-terra text-ink" : "text-cream/85 hover:bg-white/10"
    }`;

  return (
    <div className="min-h-screen bg-cream text-ink">
      {open && (
        <button
          type="button"
          aria-label={t("Close menu", "Fermer le menu")}
          className="fixed inset-0 z-30 bg-forest/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-forest text-cream transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 overflow-hidden px-4 py-4">
          <Logo />
          <button type="button" className="md:hidden p-2" onClick={() => setOpen(false)} aria-label={t("Close menu", "Fermer le menu")}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          <button type="button" className={itemClass("orders")} onClick={() => choose("orders")}>
            <ClipboardList className="h-5 w-5" />
            {t("Orders", "Commandes")}
          </button>
          <button type="button" className={itemClass("products")} onClick={() => choose("products")}>
            <UtensilsCrossed className="h-5 w-5" />
            {t("Products", "Produits")}
          </button>
        </nav>
        <div className="p-3">
          <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-cream/85 hover:bg-white/10">
            <LogOut className="h-5 w-5" />
            {t("Log out", "Déconnexion")}
          </button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[#e4d8c4] bg-cream/95 px-4 backdrop-blur md:hidden">
          <button type="button" onClick={() => setOpen(true)} className="p-2" aria-label={t("Open menu", "Ouvrir le menu")}>
            <Menu className="h-5 w-5" />
          </button>
          <p className="font-serif text-xl">{section === "orders" ? t("Orders", "Commandes") : t("Products", "Produits")}</p>
        </header>
        <main className="px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
