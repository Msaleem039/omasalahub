"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SiteShell } from "../components/SiteShell";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { apiFetch } from "../lib/clientApi";
import { errorText } from "../lib/errors";

export default function ProfilePage() {
  const { t, lang } = useLanguage();
  const { user, ready, refresh, logout } = useAuth();
  const [overrides, setOverrides] = useState<{ name?: string; phone?: string; address?: string }>({});
  const [message, setMessage] = useState("");
  const name = overrides.name ?? user?.name ?? "";
  const phone = overrides.phone ?? user?.phone ?? "";
  const address = overrides.address ?? user?.address ?? "";

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    const response = await apiFetch("/api/user/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, phone, address }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(errorText(data.error || "generic", lang));
      return;
    }
    await refresh();
    setMessage(t("Saved. Checkout can use these details.", "Enregistré. La commande peut réutiliser ces informations."));
  };

  return (
    <SiteShell>
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-12">
        {!ready ? <div className="h-40 animate-pulse rounded-3xl bg-card" /> : null}
        {ready && !user && (
          <div className="rounded-3xl border border-[#e5dcc8] bg-card p-8 text-center">
            <h1 className="script-title text-4xl sm:text-6xl">{t("Your account", "Votre compte")}</h1>
            <p className="mt-3 text-muted">{t("Log in to see your details and orders.", "Connectez-vous pour voir vos informations et vos commandes.")}</p>
            <Link href="/login" className="mt-6 inline-flex rounded-full bg-terra px-6 py-3 font-bold text-ink">{t("Log in", "Connexion")}</Link>
          </div>
        )}
        {user && (
          <>
            <div>
              <h1 className="script-title text-4xl leading-tight sm:text-6xl">{user.name}</h1>
              <p className="text-sm text-muted">{user.email}</p>
            </div>
            {user.role === "customer" ? (
              <form onSubmit={save} className="space-y-4 rounded-3xl border border-[#e5dcc8] bg-card p-6">
                <label className="block text-sm font-bold">{t("Name", "Nom")}
                  <input className="field mt-1" value={name} onChange={(event) => setOverrides((current) => ({ ...current, name: event.target.value }))} />
                </label>
                <label className="block text-sm font-bold">{t("Phone", "Téléphone")}
                  <input className="field mt-1" value={phone} onChange={(event) => setOverrides((current) => ({ ...current, phone: event.target.value }))} />
                </label>
                <label className="block text-sm font-bold">{t("Delivery address", "Adresse de livraison")}
                  <textarea className="field mt-1" rows={3} value={address} onChange={(event) => setOverrides((current) => ({ ...current, address: event.target.value }))} />
                </label>
                <button type="submit" className="rounded-full bg-terra px-6 py-3 font-bold text-ink">{t("Save details", "Enregistrer")}</button>
                {message && <p className="text-sm text-sage">{message}</p>}
              </form>
            ) : (
              <p className="text-sm text-muted">{t("This is the restaurant admin account.", "Ceci est le compte d'administration du restaurant.")}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Link href="/orders" className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream">{t("Order history", "Historique")}</Link>
              {user.role === "admin" && <Link href="/admin" className="rounded-full border border-[#e5dcc8] px-5 py-3 text-sm font-bold">{t("Admin", "Administration")}</Link>}
              <button type="button" onClick={() => logout()} className="rounded-full border border-[#e5dcc8] px-5 py-3 text-sm font-bold">{t("Log out", "Déconnexion")}</button>
            </div>
          </>
        )}
      </main>
    </SiteShell>
  );
}
