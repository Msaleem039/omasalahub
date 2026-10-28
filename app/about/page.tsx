"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Leaf, ShieldCheck } from "lucide-react";
import { SiteShell } from "../components/SiteShell";

export default function AboutPage() {
  return (
    <SiteShell>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
        <section className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sage font-bold tracking-[0.16em] uppercase text-xs">Our kitchen</p>
            <h1 className="script-title text-7xl mt-2">Cooked slowly, served hot.</h1>
            <p className="text-muted mt-4 leading-relaxed">
              omasalahub cooks the dishes on our card: butter chicken and the other specialties with basmati rice, chicken and vegetable biryani, stuffed naan, house-sauce pizzas, samosas, and lassi.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-8 border-t border-[#c9b79c] pt-6">
              <div><p className="font-serif text-4xl text-terra">30m</p><p className="text-xs text-muted">Typical delivery</p></div>
              <div><p className="font-serif text-4xl text-terra">22</p><p className="text-xs text-muted">Dishes on the card</p></div>
              <div><p className="font-serif text-4xl text-terra">11–23</p><p className="text-xs text-muted">Kitchen hours</p></div>
            </div>
          </div>
          <div className="relative h-80 sm:h-[420px] rounded-[2rem] overflow-hidden border-4 border-white shadow-xl">
            <Image
              src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1400&q=80"
              alt="Biryani Poulet from the omasalahub kitchen"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Leaf, title: "Rice with every specialty", text: "Butter chicken, masala, tikka, balti, korma, and dal tadka come with basmati rice." },
            { icon: Clock, title: "A clear kitchen clock", text: "We cook between 11:00 and 23:00, so the tandoor and the biryani pot stay in rhythm." },
            { icon: ShieldCheck, title: "A tidy pass", text: "Each box is sealed, labeled, and checked before it leaves the counter." },
          ].map((item) => (
            <div key={item.title} className="bg-card rounded-3xl border border-[#c9b79c] p-6">
              <div className="w-11 h-11 rounded-2xl bg-sage-soft text-sage flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5" />
              </div>
              <h2 className="font-serif text-2xl">{item.title}</h2>
              <p className="text-sm text-muted mt-2 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[2rem] bg-ink text-cream p-8 sm:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="script-title text-5xl">Hungry already?</h2>
            <p className="text-cream/80 mt-2">Start with Biryani Poulet, or build a formule with a drink.</p>
          </div>
          <Link href="/menu" className="bg-terra text-white font-bold px-6 py-3 rounded-full text-center">
            Open the menu
          </Link>
        </section>
      </main>
    </SiteShell>
  );
}
