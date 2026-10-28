"use client";

import { SiteShell } from "../components/SiteShell";

export default function TermsPage() {
  return (
    <SiteShell>
      <main className="max-w-3xl mx-auto px-4 py-14">
        <h1 className="script-title text-7xl">Terms</h1>
        <div className="mt-6 space-y-4 text-muted leading-relaxed">
          <p>Menu prices are shown in euro and match the printed card, including formules. Delivery is €2.90, and it is free once the food subtotal reaches €25.</p>
          <p>You can pay online by card or choose cash on delivery. An online order is treated as paid. A cash order is paid to the courier on arrival.</p>
          <p>Kitchen hours are 11:00 to 23:00. Specialties include basmati rice. Signature pizzas use house-made sauce. Formules include the drink noted on the card.</p>
          <p>If a dish is unavailable after you order, we will contact the phone number on the order before substituting anything.</p>
        </div>
      </main>
    </SiteShell>
  );
}
