"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DISHES, type Dish } from "../data/menuData";
import { formatPrice } from "../lib/pricing";
import { useLanguage } from "../context/LanguageContext";

const HERO_IDS = ["by-1", "sp-1", "na-3", "pz-2", "en-1", "bo-1"];

const HERO_DISHES: Dish[] = HERO_IDS.map((id) => DISHES.find((dish) => dish.id === id)).filter(
  (dish): dish is Dish => Boolean(dish)
);

const EASE = [0.22, 1, 0.36, 1] as const;

function placement(index: number, active: number, count: number) {
  const offset = (index - active + count) % count;
  if (offset === 0) {
    return { left: "50%", top: "50%", scale: 1 };
  }
  const slot = offset - 1;
  const angle = (slot / (count - 1)) * Math.PI * 2 - Math.PI / 2;
  const radius = 37;
  return {
    left: `${50 + Math.cos(angle) * radius}%`,
    top: `${50 + Math.sin(angle) * radius}%`,
    scale: 0.42,
  };
}

export const Hero: React.FC = () => {
  const { t } = useLanguage();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [hidden, setHidden] = useState(false);
  const count = HERO_DISHES.length;
  const dish = HERO_DISHES[active];

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotion = () => setReduced(motionQuery.matches);
    const applyVisibility = () => setHidden(document.hidden);
    applyMotion();
    applyVisibility();
    motionQuery.addEventListener("change", applyMotion);
    document.addEventListener("visibilitychange", applyVisibility);
    return () => {
      motionQuery.removeEventListener("change", applyMotion);
      document.removeEventListener("visibilitychange", applyVisibility);
    };
  }, []);

  useEffect(() => {
    if (paused || reduced || hidden || count < 2) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % count);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [paused, reduced, hidden, active, count]);

  const go = (step: number) => setActive((current) => (current + step + count) % count);
  const duration = reduced ? 0 : 0.75;

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-16 top-0 h-72 w-72 rounded-full bg-sage-soft/80 blur-2xl" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-terra/20 blur-2xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 grid lg:grid-cols-2 gap-8 lg:gap-6 items-center">
        <div className="min-h-[15rem]">
          <p className="text-sm font-semibold tracking-[0.18em] text-terra uppercase">11:00 — 23:00</p>
          <AnimatePresence mode="wait">
            <motion.div
              key={dish.id}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: reduced ? 0 : 0.35 }}
            >
              <h1 className="font-serif text-5xl sm:text-6xl text-ink mt-3 leading-none">{dish.name}</h1>
              <p className="mt-5 max-w-md text-muted leading-relaxed">{dish.description}</p>
              <p className="mt-4 text-2xl font-extrabold text-terra">{formatPrice(dish.price)}</p>
            </motion.div>
          </AnimatePresence>
          <Link
            href={`/menu/${dish.category}`}
            className="inline-flex mt-8 bg-terra hover:bg-terra-deep text-ink font-bold px-8 py-3.5 rounded-full shadow-lg shadow-terra/20"
          >
            {t("Order Now", "Commander")}
          </Link>
        </div>

        <div
          className="relative mx-auto w-full max-w-[22rem] sm:max-w-[28rem] lg:max-w-[34rem]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") go(1);
            if (event.key === "ArrowLeft") go(-1);
          }}
        >
          <div
            className="relative aspect-square"
            role="region"
            aria-roledescription="carousel"
            aria-label="Featured dishes"
          >
            <div className="absolute inset-[10%] rounded-full bg-sage-soft/70" />
            <div className="pointer-events-none absolute inset-[6%] rounded-full border border-dashed border-terra/35 motion-safe:animate-[spin_48s_linear_infinite]" />

            {HERO_DISHES.map((item, index) => {
              const spot = placement(index, active, count);
              const isActive = index === active;
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  aria-label={isActive ? item.name : t(`Show ${item.name}`, `Afficher ${item.name}`)}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => setActive(index)}
                  initial={false}
                  animate={{ left: spot.left, top: spot.top, scale: spot.scale }}
                  transition={{ duration, ease: EASE }}
                  style={{ marginLeft: "-23%", marginTop: "-23%", zIndex: isActive ? 20 : 10 }}
                  className={`absolute aspect-square w-[46%] overflow-hidden rounded-full border-4 bg-card shadow-[0_18px_40px_rgba(60,42,30,0.16)] ${
                    isActive ? "border-white cursor-default" : "border-white/90 cursor-pointer"
                  }`}
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    priority={index === 0}
                    unoptimized
                    sizes="(max-width: 1024px) 42vw, 280px"
                    className="object-cover"
                  />
                </motion.button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              aria-label={t("Previous dish", "Plat précédent")}
              onClick={() => go(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e5dcc8] bg-card text-ink hover:bg-terra hover:text-ink"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="sr-only" aria-live="polite">
              {dish.name}, {formatPrice(dish.price)}
            </p>
            <button
              type="button"
              aria-label={t("Next dish", "Plat suivant")}
              onClick={() => go(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e5dcc8] bg-card text-ink hover:bg-terra hover:text-ink"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
