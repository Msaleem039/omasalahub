"use client";

import React, { useEffect, useState } from "react";
import { CATEGORIES, categoryLabel } from "../../data/menuData";
import { useCatalog } from "../../context/CatalogContext";
import { useLanguage } from "../../context/LanguageContext";
import { apiFetch } from "../../lib/clientApi";
import { formatPrice } from "../../lib/pricing";

type Coupon = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal: number;
  expiresAt: string;
  startsAt: string;
  usageLimit: number | "";
  usedCount: number;
  perUserLimit: number;
  active: boolean;
};

type ExtraDraft = { id: string; name: string; price: string; available: boolean };

export function PromotionsPanel() {
  const { t, lang } = useLanguage();
  const { extras, refresh } = useCatalog();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [complements, setComplements] = useState<{ category: string; complement: string }[]>([]);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("10");
  const [minSubtotal, setMinSubtotal] = useState("0");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [extra, setExtra] = useState<ExtraDraft>({ id: "", name: "", price: "", available: true });
  const courses = CATEGORIES.filter((category) => category.slug !== "all");

  const load = () => {
    apiFetch("/api/order/coupons").then((response) => response.json()).then((data) => setCoupons(data.coupons ?? [])).catch(() => {});
    apiFetch("/api/food/settings").then((response) => response.json()).then((data) => setComplements(data.complements ?? [])).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const saveCoupon = async (event: React.FormEvent) => {
    event.preventDefault();
    await apiFetch("/api/order/coupons", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, type, value, minSubtotal, usageLimit, expiresAt: expiresAt || null, perUserLimit: 1, active: true }),
    });
    setCode("");
    load();
  };

  const saveExtra = async (event: React.FormEvent) => {
    event.preventDefault();
    await apiFetch("/api/food/extras", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...extra, price: Number(extra.price.replace(",", ".")) }),
    });
    setExtra({ id: "", name: "", price: "", available: true });
    await refresh();
  };

  const toggleComplement = async (category: string, complement: string) => {
    const exists = complements.some((pair) => pair.category === category && pair.complement === complement);
    const next = exists
      ? complements.filter((pair) => !(pair.category === category && pair.complement === complement))
      : [...complements, { category, complement }];
    const settings = await apiFetch("/api/food/settings").then((response) => response.json());
    await apiFetch("/api/food/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...settings.info, complements: next }),
    });
    setComplements(next);
  };

  return (
    <div className="space-y-8">
      <h1 className="hidden font-serif text-4xl md:block">{t("Promotions", "Promotions")}</h1>
      <form onSubmit={saveCoupon} className="grid gap-3 rounded-3xl border border-[#e4d8c4] bg-card p-5 sm:grid-cols-2">
        <h2 className="font-serif text-2xl sm:col-span-2">{t("Coupon", "Code promo")}</h2>
        <input className="field" placeholder="CODE" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} required />
        <select className="field" value={type} onChange={(event) => setType(event.target.value as "percent" | "fixed")}>
          <option value="percent">{t("Percent", "Pourcentage")}</option>
          <option value="fixed">{t("Fixed amount (€)", "Montant fixe (€)")}</option>
        </select>
        <input className="field" value={value} onChange={(event) => setValue(event.target.value)} placeholder={t("Value", "Valeur")} />
        <input className="field" value={minSubtotal} onChange={(event) => setMinSubtotal(event.target.value)} placeholder={t("Minimum €", "Minimum €")} />
        <input className="field" value={usageLimit} onChange={(event) => setUsageLimit(event.target.value)} placeholder={t("Usage limit", "Limite d'usage")} />
        <input className="field" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
        <button type="submit" className="rounded-full bg-terra px-4 py-2 text-sm font-bold text-ink sm:col-span-2">{t("Save coupon", "Enregistrer le code")}</button>
      </form>
      <ul className="space-y-2">
        {coupons.map((coupon) => (
          <li key={coupon.code} className="flex items-center justify-between rounded-2xl border border-[#e4d8c4] bg-card px-4 py-3 text-sm">
            <span>{coupon.code} · {coupon.type === "percent" ? `${coupon.value}%` : formatPrice(coupon.value)} · {coupon.usedCount}{coupon.usageLimit === "" ? "" : `/${coupon.usageLimit}`}</span>
            <button type="button" onClick={async () => { await apiFetch(`/api/order/coupons/${coupon.code}`, { method: "DELETE" }); load(); }} className="font-bold">{t("Delete", "Supprimer")}</button>
          </li>
        ))}
      </ul>
      <form onSubmit={saveExtra} className="grid gap-3 rounded-3xl border border-[#e4d8c4] bg-card p-5 sm:grid-cols-3">
        <h2 className="font-serif text-2xl sm:col-span-3">{t("Optional extra", "Supplément")}</h2>
        <input className="field" placeholder={t("Name", "Nom")} value={extra.name} onChange={(event) => setExtra({ ...extra, name: event.target.value })} required />
        <input className="field" placeholder="€" value={extra.price} onChange={(event) => setExtra({ ...extra, price: event.target.value })} required />
        <button type="submit" className="rounded-full bg-terra px-4 py-2 text-sm font-bold text-ink">{t("Save extra", "Enregistrer")}</button>
      </form>
      <ul className="space-y-2 text-sm">
        {extras.map((item) => (
          <li key={item.id} className="flex justify-between rounded-2xl border border-[#e4d8c4] bg-card px-4 py-3">
            <span>{item.name} · {formatPrice(item.price)}</span>
            <button type="button" onClick={async () => { await apiFetch(`/api/food/extras/${item.id}`, { method: "DELETE" }); await refresh(); }} className="font-bold">{t("Delete", "Supprimer")}</button>
          </li>
        ))}
      </ul>
      <section>
        <h2 className="mb-3 font-serif text-2xl">{t("Complementary categories", "Catégories complémentaires")}</h2>
        <div className="space-y-3">
          {courses.map((category) => (
            <div key={category.slug} className="rounded-2xl border border-[#e4d8c4] bg-card p-3">
              <p className="mb-2 text-sm font-bold">{categoryLabel(category.slug, lang)}</p>
              <div className="flex flex-wrap gap-2">
                {courses.filter((item) => item.slug !== category.slug).map((item) => {
                  const on = complements.some((pair) => pair.category === category.slug && pair.complement === item.slug);
                  return (
                    <button key={item.slug} type="button" onClick={() => toggleComplement(category.slug, item.slug)} className={`rounded-full px-3 py-1 text-xs font-bold ${on ? "bg-terra text-ink" : "border border-[#e4d8c4]"}`}>
                      {categoryLabel(item.slug, lang)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
