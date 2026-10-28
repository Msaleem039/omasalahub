"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "en" | "fr";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (enText: string, frText: string) => string;
  ready: boolean;
  showPrompt: boolean;
  always: boolean;
  setAlways: (value: boolean) => void;
  dismissPrompt: () => void;
}

const LANG_KEY = "omasalahub_lang";
const ALWAYS_KEY = "omasalahub_lang_always";
const DISMISS_KEY = "omasalahub_lang_dismissed";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>("en");
  const [ready, setReady] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [always, setAlwaysState] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LANG_KEY);
    const savedAlways = localStorage.getItem(ALWAYS_KEY) === "1";
    const dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
    if (saved === "fr" || saved === "en") setLangState(saved);
    setAlwaysState(savedAlways);
    setShowPrompt(!savedAlways && !dismissed);
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

  const setAlways = (value: boolean) => {
    setAlwaysState(value);
    if (value) {
      localStorage.setItem(ALWAYS_KEY, "1");
      localStorage.setItem(LANG_KEY, lang);
      setShowPrompt(false);
      return;
    }
    localStorage.removeItem(ALWAYS_KEY);
  };

  const dismissPrompt = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setShowPrompt(false);
  };

  const t = (enText: string, frText: string) => (lang === "fr" ? frText : enText);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, ready, showPrompt, always, setAlways, dismissPrompt }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      lang: "en" as Language,
      setLang: () => {},
      t: (enText: string) => enText,
      ready: false,
      showPrompt: false,
      always: false,
      setAlways: () => {},
      dismissPrompt: () => {},
    };
  }
  return context;
};
