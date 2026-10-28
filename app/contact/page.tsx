"use client";

import React, { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { SiteShell } from "../components/SiteShell";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <SiteShell>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid lg:grid-cols-2 gap-10">
        <div>
          <h1 className="script-title text-7xl">Say hello</h1>
          <p className="text-muted mt-3 mb-8">Questions about a formule, a catering tray, or an order already on the way.</p>
          <div className="space-y-5">
            {[
              { icon: Phone, title: "Phone", text: "+92 42 111 228 325" },
              { icon: Mail, title: "Email", text: "support@omasalahub.com" },
              { icon: MapPin, title: "Kitchen", text: "Gulberg III, Lahore" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4">
                <div className="bg-sage-soft text-sage p-3 rounded-2xl"><item.icon className="w-5 h-5" /></div>
                <div>
                  <p className="font-bold">{item.title}</p>
                  <p className="text-sm text-muted">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {sent ? (
          <div className="bg-card rounded-3xl border border-[#c9b79c] p-8 flex items-center">
            <div>
              <h2 className="font-serif text-4xl">Message received</h2>
              <p className="text-muted mt-2">We will reply during kitchen hours, 11:00 to 23:00.</p>
              <button type="button" onClick={() => setSent(false)} className="mt-6 text-terra font-bold">Send another</button>
            </div>
          </div>
        ) : (
          <form
            className="bg-card rounded-3xl border border-[#c9b79c] p-6 sm:p-8 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSent(true);
            }}
          >
            <label className="block text-sm font-bold">Full name
              <input required className="field mt-1" />
            </label>
            <label className="block text-sm font-bold">Email
              <input required type="email" className="field mt-1" />
            </label>
            <label className="block text-sm font-bold">Message
              <textarea required rows={4} className="field mt-1" />
            </label>
            <button type="submit" className="w-full bg-terra text-white font-bold py-3.5 rounded-full">Send message</button>
          </form>
        )}
      </main>
    </SiteShell>
  );
}
