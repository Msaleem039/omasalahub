"use client";

import React, { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { SiteShell } from "../components/SiteShell";
import { useCatalog } from "../context/CatalogContext";
import { useLanguage } from "../context/LanguageContext";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const { info } = useCatalog();
  const { t } = useLanguage();

  return (
    <SiteShell>
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-2 lg:px-8">
        <div>
          <h1 className="script-title text-5xl sm:text-7xl">{t("Say hello", "Écrivez-nous")}</h1>
          <p className="text-muted mt-3 mb-8">{t("Questions about a formule, a catering tray, or an order already on the way.", "Une question sur une formule, un plateau, ou une commande déjà en route.")}</p>
          <div className="space-y-5">
            {[
              { icon: Phone, title: t("Phone", "Téléphone"), text: "+92 42 111 228 325" },
              { icon: Mail, title: t("Email", "E-mail"), text: "support@masalahub.com" },
              { icon: MapPin, title: t("Kitchen", "Cuisine"), text: "Gulberg III, Lahore" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4">
                <div className="bg-sage-soft text-sage p-3 rounded-2xl"><item.icon className="w-5 h-5" /></div>
                <div>
                  <p className="font-bold">{item.title}</p>
                  <p className="text-sm text-muted">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {sent ? (
          <div className="bg-card rounded-3xl border border-[#e5dcc8] p-8 flex items-center">
            <div>
              <h2 className="font-serif text-4xl">{t("Message received", "Message reçu")}</h2>
              <p className="text-muted mt-2">{t("We reply during the published kitchen hours.", "Nous répondons pendant les horaires affichés.")} {info?.hoursShort}</p>
              <button type="button" onClick={() => setSent(false)} className="mt-6 text-terra font-bold">{t("Send another", "Envoyer un autre")}</button>
            </div>
          </div>
        ) : (
          <form
            className="bg-card rounded-3xl border border-[#e5dcc8] p-6 sm:p-8 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSent(true);
            }}
          >
            <label className="block text-sm font-bold">{t("Full name", "Nom complet")}
              <input required className="field mt-1" />
            </label>
            <label className="block text-sm font-bold">{t("Email", "E-mail")}
              <input required type="email" className="field mt-1" />
            </label>
            <label className="block text-sm font-bold">{t("Message", "Message")}
              <textarea required rows={4} className="field mt-1" />
            </label>
            <button type="submit" className="w-full bg-terra text-ink font-bold py-3.5 rounded-full">{t("Send message", "Envoyer")}</button>
          </form>
        )}
      </main>
    </SiteShell>
  );
}
