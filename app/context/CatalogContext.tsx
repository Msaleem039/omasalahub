"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DISHES, type Dish } from "../data/menuData";
import { readProducts, writeProducts } from "../lib/catalog";

interface CatalogContextType {
  dishes: Dish[];
  ready: boolean;
  saveDish: (dish: Dish) => void;
  deleteDish: (id: string) => void;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [dishes, setDishes] = useState<Dish[]>(DISHES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDishes(readProducts());
    setReady(true);
  }, []);

  const saveDish = (dish: Dish) => {
    const next = dishes.some((item) => item.id === dish.id)
      ? dishes.map((item) => (item.id === dish.id ? dish : item))
      : [dish, ...dishes];
    writeProducts(next);
    setDishes(next);
  };

  const deleteDish = (id: string) => {
    const next = dishes.filter((item) => item.id !== id);
    writeProducts(next);
    setDishes(next);
  };

  return (
    <CatalogContext.Provider value={{ dishes, ready, saveDish, deleteDish }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    return {
      dishes: DISHES,
      ready: false,
      saveDish: () => {},
      deleteDish: () => {},
    };
  }
  return context;
}
