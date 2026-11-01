"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell, type AdminSection } from "../components/admin/AdminShell";
import { HoursPanel } from "../components/admin/HoursPanel";
import { OrdersPanel } from "../components/admin/OrdersPanel";
import { ProductsPanel } from "../components/admin/ProductsPanel";
import { PromotionsPanel } from "../components/admin/PromotionsPanel";
import { ReviewsPanel } from "../components/admin/ReviewsPanel";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/clientApi";
import type { PublicOrder } from "../lib/types";

export default function AdminPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [ready, setReady] = useState(false);
  const [section, setSection] = useState<AdminSection>("orders");
  const [orders, setOrders] = useState<PublicOrder[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      let role: string | undefined;
      try {
        const saved = localStorage.getItem("dd_user");
        if (saved) role = JSON.parse(saved).role;
      } catch {
        role = undefined;
      }
      try {
        const me = await apiFetch("/api/user/me").then((response) => response.json());
        role = me.user?.role || me.role || role;
      } catch {
        /* the login response already identified an admin */
      }
      if (role !== "admin") {
        router.replace("/login");
        return;
      }
      if (!localStorage.getItem("mh_legacy_imported")) {
        const productsRaw = localStorage.getItem("omasalahub_products");
        const ordersRaw = localStorage.getItem("bitebloom_orders");
        if (productsRaw || ordersRaw) {
          try {
            await apiFetch("/api/food/import", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                products: productsRaw ? JSON.parse(productsRaw) : [],
                orders: ordersRaw ? JSON.parse(ordersRaw) : [],
              }),
            });
          } catch {
            /* import is optional */
          }
        }
        localStorage.setItem("mh_legacy_imported", "1");
      }
      let nextOrders: PublicOrder[] = [];
      try {
        const data = await apiFetch("/api/order/list?status=all").then((response) => response.json());
        nextOrders = data.orders ?? [];
      } catch {
        nextOrders = [];
      }
      if (!cancelled) {
        setOrders(nextOrders);
        setReady(true);
      }
    };
    load().catch(() => router.replace("/login"));
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) return <main className="min-h-screen bg-cream" />;

  return (
    <AdminShell
      section={section}
      onSection={setSection}
      onLogout={async () => {
        await logout();
        router.replace("/login");
      }}
    >
      {section === "orders" && <OrdersPanel orders={orders} onOrders={setOrders} />}
      {section === "products" && <ProductsPanel />}
      {section === "reviews" && <ReviewsPanel />}
      {section === "promotions" && <PromotionsPanel />}
      {section === "hours" && <HoursPanel />}
    </AdminShell>
  );
}
