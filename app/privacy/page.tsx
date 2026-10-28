"use client";

import { SiteShell } from "../components/SiteShell";

export default function PrivacyPage() {
  return (
    <SiteShell>
      <main className="max-w-3xl mx-auto px-4 py-14">
        <h1 className="script-title text-7xl">Privacy</h1>
        <div className="mt-6 space-y-4 text-muted leading-relaxed">
          <p>Masala Hub keeps your basket, saved dishes, profile, and orders in this browser. We use that information to refill checkout and to show order tracking on this device.</p>
          <p>Online payment asks for a card so the order can be marked paid. Only the last four digits are saved with the order. The full card number and CVV are not written to storage.</p>
          <p>Cash on delivery stores your name, phone, and address with the order so the courier can find you. Clearing this browser’s site data removes those records.</p>
          <p>Questions: support@masalahub.com.</p>
        </div>
      </main>
    </SiteShell>
  );
}
