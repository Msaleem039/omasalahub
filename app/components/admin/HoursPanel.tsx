"use client";

import React, { useEffect, useState } from "react";
import { useCatalog } from "../../context/CatalogContext";
import { useLanguage } from "../../context/LanguageContext";
import { apiFetch } from "../../lib/clientApi";
import type { PublicInfo } from "../../lib/types";

const DAYS = [
  { id: "1", en: "Monday", fr: "Lundi" },
  { id: "2", en: "Tuesday", fr: "Mardi" },
  { id: "3", en: "Wednesday", fr: "Mercredi" },
  { id: "4", en: "Thursday", fr: "Jeudi" },
  { id: "5", en: "Friday", fr: "Vendredi" },
  { id: "6", en: "Saturday", fr: "Samedi" },
  { id: "0", en: "Sunday", fr: "Dimanche" },
];

export function HoursPanel() {
  const { t, lang } = useLanguage();
  const { refresh } = useCatalog();
  const [info, setInfo] = useState<PublicInfo | null>(null);
  const [saved, setSaved] = useState(false);
  const [closureDate, setClosureDate] = useState("");
  const [closureService, setClosureService] = useState<"both" | "delivery" | "pickup">("both");
  const [closureReason, setClosureReason] = useState("");

  useEffect(() => {
    apiFetch("/api/food/settings")
      .then((response) => response.json())
      .then((data) => setInfo(data.info ?? null))
      .catch(() => {});
  }, []);

  if (!info) return <div className="h-40 animate-pulse rounded-3xl bg-card" />;

  const setWindow = (day: string, key: "open" | "close", value: string) => {
    const current = info.hours[day]?.[0] ?? { open: "11:00", close: "23:00" };
    setInfo({ ...info, hours: { ...info.hours, [day]: [{ ...current, [key]: value }] } });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaved(false);
    const response = await apiFetch("/api/food/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(info),
    });
    if (response.ok) {
      const data = await response.json();
      setInfo(data.info);
      await refresh();
      setSaved(true);
    }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <h1 className="hidden font-serif text-4xl md:block">{t("Hours", "Horaires")}</h1>
      <label className="block text-sm font-bold">{t("Timezone", "Fuseau horaire")}
        <input className="field mt-1" value={info.timezone} onChange={(event) => setInfo({ ...info, timezone: event.target.value })} />
      </label>
      <div className="space-y-2">
        {DAYS.map((day) => {
          const window = info.hours[day.id]?.[0] ?? { open: "", close: "" };
          return (
            <div key={day.id} className="grid items-center gap-2 sm:grid-cols-[8rem_1fr_1fr]">
              <span className="text-sm font-bold">{lang === "fr" ? day.fr : day.en}</span>
              <div className="grid grid-cols-2 gap-2 sm:contents">
                <input className="field" type="time" value={window.open} onChange={(event) => setWindow(day.id, "open", event.target.value)} />
                <input className="field" type="time" value={window.close} onChange={(event) => setWindow(day.id, "close", event.target.value)} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={info.deliveryEnabled} onChange={(event) => setInfo({ ...info, deliveryEnabled: event.target.checked })} />{t("Delivery", "Livraison")}</label>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={info.pickupEnabled} onChange={(event) => setInfo({ ...info, pickupEnabled: event.target.checked })} />{t("Pickup", "Retrait")}</label>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={info.allowScheduled} onChange={(event) => setInfo({ ...info, allowScheduled: event.target.checked })} />{t("Allow scheduled orders", "Autoriser les commandes programmées")}</label>
        <label className="text-sm font-bold">{t("Preparation minutes", "Minutes de préparation")}<input className="field mt-1" value={info.prepMinutes} onChange={(event) => setInfo({ ...info, prepMinutes: Number(event.target.value) })} /></label>
        <label className="text-sm font-bold">{t("Minimum order €", "Minimum de commande €")}<input className="field mt-1" value={info.minOrder} onChange={(event) => setInfo({ ...info, minOrder: Number(event.target.value) })} /></label>
        <label className="text-sm font-bold">{t("Delivery fee €", "Frais de livraison €")}<input className="field mt-1" value={info.deliveryFee} onChange={(event) => setInfo({ ...info, deliveryFee: Number(event.target.value) })} /></label>
        <label className="text-sm font-bold">{t("Free delivery from €", "Livraison offerte dès €")}<input className="field mt-1" value={info.freeDeliveryFrom} onChange={(event) => setInfo({ ...info, freeDeliveryFrom: Number(event.target.value) })} /></label>
        <label className="text-sm font-bold">{t("VAT rate % included", "Taux de TVA % incluse")}<input className="field mt-1" value={info.vatRate} onChange={(event) => setInfo({ ...info, vatRate: Number(event.target.value) })} /></label>
      </div>
      <p className="text-xs text-muted">{t("Confirm the VAT rate with the restaurant. The displayed rate is a setting, not legal advice.", "Confirmez le taux de TVA avec le restaurant. Le taux affiché est un réglage, pas un conseil juridique.")}</p>
      <div className="rounded-3xl border border-[#e4d8c4] bg-card p-4">
        <h2 className="font-serif text-2xl">{t("Exceptional closure", "Fermeture exceptionnelle")}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <input type="date" className="field" value={closureDate} onChange={(event) => setClosureDate(event.target.value)} />
          <select className="field" value={closureService} onChange={(event) => setClosureService(event.target.value as "both" | "delivery" | "pickup")}>
            <option value="both">{t("Both", "Les deux")}</option>
            <option value="delivery">{t("Delivery", "Livraison")}</option>
            <option value="pickup">{t("Pickup", "Retrait")}</option>
          </select>
          <input className="field" value={closureReason} onChange={(event) => setClosureReason(event.target.value)} placeholder={t("Reason", "Motif")} />
          <button
            type="button"
            className="rounded-full bg-ink px-3 py-2 text-sm font-bold text-cream"
            onClick={() => {
              if (!closureDate) return;
              setInfo({ ...info, closures: [...info.closures, { id: closureDate + closureService, date: closureDate, service: closureService, reason: closureReason }] });
              setClosureDate("");
              setClosureReason("");
            }}
          >
            {t("Add", "Ajouter")}
          </button>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {info.closures.map((closure) => (
            <li key={closure.id} className="flex justify-between gap-3">
              <span>{closure.date} · {closure.service} · {closure.reason}</span>
              <button type="button" onClick={() => setInfo({ ...info, closures: info.closures.filter((item) => item.id !== closure.id) })} className="font-bold">{t("Remove", "Retirer")}</button>
            </li>
          ))}
        </ul>
      </div>
      <button type="submit" className="rounded-full bg-terra px-5 py-3 font-bold text-ink">{t("Save hours", "Enregistrer les horaires")}</button>
      {saved && <p className="text-sm font-semibold text-sage">{t("Saved.", "Enregistré.")}</p>}
    </form>
  );
}
