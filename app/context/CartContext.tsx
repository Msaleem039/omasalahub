"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Line 7: Self-contained Interface for Cart Items
export interface CartItemType {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  rating?: number;
  description?: string;
  quantity?: number;
}

interface CartContextType {
  cart: CartItemType[];
  addToCart: (item: CartItemType) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItemType[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem("bitebloom_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Cart loading error:", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("bitebloom_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItemType) => {
    setCart((prev) => {
      const existingItemIndex = prev.findIndex((cartItem) => cartItem.id === item.id);
      
      if (existingItemIndex > -1) {
        const updatedCart = [...prev];
        const currentQty = updatedCart[existingItemIndex].quantity || 1;
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: currentQty + 1,
        };
        return updatedCart;
      }
      
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQuantity = (item.quantity || 1) + delta;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItemType[]
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