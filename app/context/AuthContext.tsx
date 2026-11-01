"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../lib/clientApi";
import type { PublicUser } from "../lib/types";

interface AuthContextType {
  user: PublicUser | null;
  ready: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = async () => {
    try {
      const response = await apiFetch("/api/user/me");
      const data = await response.json();
      const next = data.user ?? null;
      if (next) {
        localStorage.setItem("dd_user", JSON.stringify(next));
        setUser(next);
        return;
      }
    } catch {
      /* keep the account saved at login */
    }
    const raw = localStorage.getItem("dd_user");
    if (localStorage.getItem("dd_token") && raw) {
      try {
        setUser(JSON.parse(raw));
        return;
      } catch {
        /* ignore a broken saved account */
      }
    }
    setUser(null);
  };

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/user/me")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setUser(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = async () => {
    localStorage.removeItem("dd_token");
    localStorage.removeItem("dd_user");
    await apiFetch("/api/user/logout", { method: "POST" });
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, ready, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return { user: null, ready: false, refresh: async () => {}, logout: async () => {} };
  }
  return context;
}
