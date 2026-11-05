"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteShell } from "../components/SiteShell";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { apiFetch } from "../lib/clientApi";
import { errorText } from "../lib/errors";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const { t, lang } = useLanguage();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await apiFetch(mode === "login" ? "/api/user/login" : "/api/user/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(mode === "login" ? { email, password } : { name, email, password }),
    });
    const data = await response.json();
    const role = data.role || data.user?.role;
    if (!response.ok || data.success === false) {
      setError(errorText(typeof data.error === "string" ? data.error : "credentials", lang));
      return;
    }
    if (data.token) localStorage.setItem("dd_token", data.token);
    if (data.user) localStorage.setItem("dd_user", JSON.stringify(data.user));
    if (role === "admin") {
      router.push("/admin");
      return;
    }
    await refresh();
    router.push("/profile");
  };

  return (
    <SiteShell>
      <main className="max-w-md mx-auto px-4 py-16">
        <form onSubmit={submit} className="space-y-4 rounded-[2rem] border border-[#e4d8c4] bg-card p-5 shadow-sm sm:p-8">
          <h1 className="font-serif text-4xl text-ink">{mode === "login" ? t("Log in", "Connexion") : t("Create an account", "Créer un compte")}</h1>
          <p className="text-sm text-muted">{t("Customers and the restaurant use the same sign-in.", "Les clients et le restaurant utilisent la même connexion.")}</p>
          {mode === "register" && (
            <label className="block text-sm font-bold">{t("Name", "Nom")}
              <input value={name} onChange={(event) => setName(event.target.value)} className="field mt-1" autoComplete="name" required />
            </label>
          )}
          <label className="block text-sm font-bold">{t("Email", "E-mail")}
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field mt-1" autoComplete="username" required />
          </label>
          <label className="block text-sm font-bold">{t("Password", "Mot de passe")}
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="field mt-1" autoComplete={mode === "login" ? "current-password" : "new-password"} required />
          </label>
          {error && <p className="text-sm font-semibold text-terra-deep">{error}</p>}
          <button type="submit" className="w-full bg-terra hover:bg-terra-deep text-ink font-bold py-3.5 rounded-full">
            {mode === "login" ? t("Log in", "Connexion") : t("Create an account", "Créer un compte")}
          </button>
          <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="w-full text-sm font-bold text-sage">
            {mode === "login" ? t("Need an account?", "Créer un compte") : t("Already registered?", "Déjà inscrit ?")}
          </button>
        </form>
      </main>
    </SiteShell>
  );
}
