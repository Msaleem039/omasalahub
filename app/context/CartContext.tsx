"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItemType {
  id: string;
  productId?: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  description?: string;
  quantity?: number;
  variantIds?: string[];
  extraIds?: string[];
  optionsLabel?: string;
}

interface CartContextType {
  cart: CartItemType[];
  addToCart: (item: CartItemType, amount?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function lineIdFor(item: CartItemType) {
  const productId = item.productId || item.id;
  const variantIds = [...(item.variantIds ?? [])].sort();
  const extraIds = [...(item.extraIds ?? [])].sort();
  return [productId, ...variantIds, ...extraIds].join("|");
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem("bitebloom_cart");
    queueMicrotask(() => {
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart) as CartItemType[];
          if (Array.isArray(parsed)) {
            setCart(parsed.map((item) => ({ ...item, productId: item.productId || item.id, id: lineIdFor(item) })));
          }
        } catch (error) {
          console.error("Cart loading error:", error);
        }
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("bitebloom_cart", JSON.stringify(cart));
  }, [cart, ready]);

  const addToCart = (item: CartItemType, amount = 1) => {
    const productId = item.productId || item.id;
    const variantIds = [...(item.variantIds ?? [])].sort();
    const extraIds = [...(item.extraIds ?? [])].sort();
    const id = lineIdFor({ ...item, productId, variantIds, extraIds });
    const quantity = Math.max(1, amount);
    setCart((prev) => {
      const index = prev.findIndex((entry) => entry.id === id);
      if (index > -1) {
        const next = [...prev];
        next[index] = { ...next[index], quantity: (next[index].quantity || 1) + quantity };
        return next;
      }
      return [...prev, { ...item, id, productId, variantIds, extraIds, quantity }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const nextQuantity = (item.quantity || 1) + delta;
          return nextQuantity > 0 ? { ...item, quantity: nextQuantity } : null;
        })
        .filter((item): item is CartItemType => Boolean(item)),
    );
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
