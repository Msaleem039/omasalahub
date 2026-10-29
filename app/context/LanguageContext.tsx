"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "en" | "fr";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (enText: string, frText: string) => string;
  ready: boolean;
}

const LANG_KEY = "omasalahub_lang";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>("fr");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "fr" || saved === "en") setLangState(saved);
    else setLangState("fr");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = lang;
  }, [lang, ready]);

  const setLang = (next: Language) => {
    setLangState(next);
    localStorage.setItem(LANG_KEY, next);
  };

  const t = (enText: string, frText: string) => (lang === "fr" ? frText : enText);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, ready }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      lang: "fr" as Language,
      setLang: () => {},
      t: (_enText: string, frText: string) => frText,
      ready: false,
    };
  }
  return context;
};
