"use client";

import React from "react";
import { X } from "lucide-react";
import { useLanguage, type Language } from "../context/LanguageContext";

const OPTIONS: { id: Language; label: string }[] = [
  { id: "fr", label: "Français" },
  { id: "en", label: "English" },
];

export function TranslatePrompt() {
  const { lang, setLang, ready, showPrompt, always, setAlways, dismissPrompt, t } = useLanguage();

  if (!ready || !showPrompt) return null;

  return (
    <div className="fixed top-3 left-1/2 z-[60] w-[min(92vw,22rem)] -translate-x-1/2 rounded-2xl border border-[#e5dcc8] bg-card shadow-2xl">
      <div className="flex items-center justify-end gap-2 border-b border-[#e5dcc8] px-3 py-2">
        <div className="mr-auto flex items-center gap-1">
          {OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setLang(option.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-bold ${
                lang === option.id ? "bg-ink text-cream" : "text-ink hover:bg-cream-deep"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={dismissPrompt} className="p-1 text-muted" aria-label={t("Close", "Fermer")}>
          <X className="h-4 w-4" />
        </button>
      </div>
      <label className="flex items-center gap-2 px-4 py-3 text-sm text-ink">
        <input
          type="checkbox"
          checked={always}
          onChange={(event) => setAlways(event.target.checked)}
          className="h-4 w-4 accent-[#e0b15a]"
        />
        {t("Always use this language", "Toujours utiliser cette langue")}
      </label>
    </div>
  );
}
