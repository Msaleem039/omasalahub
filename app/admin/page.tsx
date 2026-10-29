"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell, type AdminSection } from "../components/admin/AdminShell";
import { OrdersPanel } from "../components/admin/OrdersPanel";
import { ProductsPanel } from "../components/admin/ProductsPanel";
import { isSuperadmin, logoutSuperadmin } from "../lib/adminAuth";
import { getOrders, type SavedOrder } from "../lib/orders";

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [section, setSection] = useState<AdminSection>("orders");
  const [orders, setOrders] = useState<SavedOrder[]>([]);

  useEffect(() => {
    if (!isSuperadmin()) {
      router.replace("/login");
      return;
    }
    setOrders(getOrders());
    setReady(true);
  }, [router]);

  const logout = () => {
    logoutSuperadmin();
    router.replace("/login");
  };

  if (!ready) {
    return <main className="min-h-screen bg-cream" />;
  }

  return (
    <AdminShell section={section} onSection={setSection} onLogout={logout}>
      {section === "orders" ? <OrdersPanel orders={orders} onOrders={setOrders} /> : <ProductsPanel />}
    </AdminShell>
  );
}
