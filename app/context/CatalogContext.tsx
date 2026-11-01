"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DISHES, type Dish, type DishExtra } from "../data/menuData";
import { apiFetch } from "../lib/clientApi";
import type { PublicInfo } from "../lib/types";

interface CatalogContextType {
  dishes: Dish[];
  extras: DishExtra[];
  info: PublicInfo | null;
  ready: boolean;
  refresh: () => Promise<void>;
  saveDish: (dish: Dish & { extraIds?: string[] }) => Promise<void>;
  deleteDish: (id: string) => Promise<void>;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

async function loadCatalog() {
  const response = await apiFetch("/api/food/list");
  if (!response.ok) throw new Error("catalog");
  return response.json() as Promise<{ products: Dish[]; extras: DishExtra[]; info: PublicInfo }>;
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [dishes, setDishes] = useState<Dish[]>(DISHES);
  const [extras, setExtras] = useState<DishExtra[]>([]);
  const [info, setInfo] = useState<PublicInfo | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = async () => {
    const data = await loadCatalog();
    setDishes(data.products);
    setExtras(data.extras);
    setInfo(data.info);
  };

  useEffect(() => {
    let cancelled = false;
    loadCatalog()
      .then((data) => {
        if (cancelled) return;
        setDishes(data.products);
        setExtras(data.extras);
        setInfo(data.info);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveDish = async (dish: Dish & { extraIds?: string[] }) => {
    const exists = dishes.some((item) => item.id === dish.id);
    const response = await apiFetch(exists ? "/api/food/update" : "/api/food/add", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...dish,
        extraIds: dish.extraIds ?? dish.extras?.map((extra) => extra.id) ?? [],
        relatedIds: dish.relatedIds ?? [],
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "generic");
    setDishes((current) =>
      current.some((item) => item.id === data.product.id)
        ? current.map((item) => (item.id === data.product.id ? data.product : item))
        : [data.product, ...current],
    );
  };

  const deleteDish = async (id: string) => {
    const response = await apiFetch("/api/food/remove", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    if (!response.ok) throw new Error("generic");
    setDishes((current) => current.filter((item) => item.id !== id));
  };

  return (
    <CatalogContext.Provider value={{ dishes, extras, info, ready, refresh, saveDish, deleteDish }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    return {
      dishes: DISHES,
      extras: [] as DishExtra[],
      info: null as PublicInfo | null,
      ready: false,
      refresh: async () => {},
      saveDish: async () => {},
      deleteDish: async () => {},
    };
  }
  return context;
}
