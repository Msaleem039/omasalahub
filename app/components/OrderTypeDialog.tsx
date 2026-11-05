"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Store, Truck } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import type { ServiceMode } from "../lib/rules";

export const ORDER_SERVICE_KEY = "mh_order_service";

export function OrderTypeDialog({
  open,
  onClose,
  onChoose,
}: {
  open: boolean;
  onClose: () => void;
  onChoose: (service: ServiceMode) => void;
}) {
  const { t } = useLanguage();
  const titleId = useId();
  const firstChoice = useRef<HTMLButtonElement>(null);
  const [choice, setChoice] = useState<ServiceMode>("delivery");

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    firstChoice.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/50 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-[2rem] border border-[#e5dcc8] bg-cream p-6 shadow-xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-terra">{t("Order online", "Commander en ligne")}</p>
        <h2 id={titleId} className="mt-2 font-serif text-4xl text-ink">{t("How would you like to order?", "Comment souhaitez-vous commander ?")}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            ref={firstChoice}
            type="button"
            onClick={() => setChoice("delivery")}
            className={`rounded-3xl border p-5 text-left ${choice === "delivery" ? "border-terra bg-sage-soft/50" : "border-[#e5dcc8] bg-card"}`}
          >
            <Truck className="mb-3 h-6 w-6 text-terra" />
            <p className="font-bold">{t("Home delivery", "Livraison à domicile")}</p>
            <p className="mt-1 text-sm text-muted">{t("We bring the order to your address.", "Nous apportons la commande à votre adresse.")}</p>
          </button>
          <button
            type="button"
            onClick={() => setChoice("pickup")}
            className={`rounded-3xl border p-5 text-left ${choice === "pickup" ? "border-terra bg-sage-soft/50" : "border-[#e5dcc8] bg-card"}`}
          >
            <Store className="mb-3 h-6 w-6 text-terra" />
            <p className="font-bold">{t("Takeaway", "À emporter")}</p>
            <p className="mt-1 text-sm text-muted">{t("Collect at the restaurant. No delivery fee.", "À retirer au restaurant. Sans frais de livraison.")}</p>
          </button>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-full px-5 py-3 text-sm font-bold text-muted">
            {t("Cancel", "Annuler")}
          </button>
          <button
            type="button"
            onClick={() => onChoose(choice)}
            className="rounded-full bg-terra px-6 py-3 font-bold text-ink hover:bg-terra-deep"
          >
            {t("Continue", "Continuer")}
          </button>
        </div>
      </div>
    </div>
  );
}
