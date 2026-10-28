"use client";

import { SiteShell } from "../components/SiteShell";

export default function HygienePage() {
  return (
    <SiteShell>
      <main className="max-w-3xl mx-auto px-4 py-14">
        <h1 className="script-title text-7xl">Hygiene</h1>
        <div className="mt-6 space-y-4 text-muted leading-relaxed">
          <p>Rice, sauces, and tandoor bread are prepared in separate stations. Cold drinks and lassi stay in a chilled hold until the order is packed.</p>
          <p>Each delivery box is sealed and labeled with the order id. Hands are washed between raw chicken and ready-to-eat naan, salad, and drinks.</p>
          <p>Hot dishes leave the pass above serving temperature. If a seal is broken when the bag arrives, call +92 42 111 228 325 and we will replace the dish.</p>
        </div>
      </main>
    </SiteShell>
  );
}
