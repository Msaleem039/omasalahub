"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { SiteShell } from "../components/SiteShell";
import { formatPrice } from "../lib/pricing";
import { getOrders, paymentLabel, type SavedOrder } from "../lib/orders";

const PROFILE_KEY = "bitebloom_profile";

interface Profile {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const emptyProfile: Profile = { name: "", email: "", phone: "", address: "" };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      try {
        setProfile({ ...emptyProfile, ...JSON.parse(raw) });
      } catch {
        /* keep empty form */
      }
    }
    setOrders(getOrders());
  }, []);

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    setSaved(true);
  };

  const initials = (profile.name || "Guest")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <SiteShell>
      <main className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-sage-soft text-sage font-serif text-2xl flex items-center justify-center">
            {initials || "BB"}
          </div>
          <div>
            <h1 className="script-title text-6xl leading-none">{profile.name || "Your profile"}</h1>
            <p className="text-sm text-muted">{profile.email || "Saved on this device"}</p>
          </div>
        </div>

        <form onSubmit={save} className="bg-card rounded-3xl border border-[#c9b79c] p-6 space-y-4">
          <label className="block text-sm font-bold">Name
            <input className="field mt-1" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </label>
          <label className="block text-sm font-bold">Email
            <input type="email" className="field mt-1" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          </label>
          <label className="block text-sm font-bold">Phone
            <input className="field mt-1" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </label>
          <label className="block text-sm font-bold">Delivery address
            <textarea className="field mt-1" rows={3} value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
          </label>
          <button type="submit" className="bg-terra text-white font-bold px-6 py-3 rounded-full">Save details</button>
          {saved && <p className="text-sm text-sage">Saved. Checkout will use this name, phone, and address.</p>}
        </form>

        <section>
          <h2 className="font-serif text-3xl mb-3">Orders</h2>
          {orders.length === 0 ? (
            <p className="text-muted">No orders yet. <Link href="/menu" className="text-terra font-bold">Start with the menu.</Link></p>
          ) : (
            <ul className="space-y-3">
              {orders.map((order) => (
                <li key={order.id} className="bg-card border border-[#c9b79c] rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{order.id}</p>
                    <p className="text-xs text-muted">{paymentLabel(order.paymentMethod)} · {order.items.length} dishes</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatPrice(order.total)}</p>
                    <Link href={`/track-order?id=${order.id}`} className="text-xs text-terra font-bold">Track</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </SiteShell>
  );
}
