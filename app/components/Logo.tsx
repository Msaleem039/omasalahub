import React from "react";

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const word = size === "lg" ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl";

  return (
    <span className="inline-block leading-none" role="img" aria-label="OMasalahub">
      <span className={`block font-serif font-bold tracking-tight ${word}`}>
        <span className="text-cream">OMasala</span>
        <span className="text-terra">hub</span>
      </span>
      <span className="mt-0.5 hidden text-[8px] font-bold uppercase tracking-[0.14em] text-terra min-[420px]:block sm:text-[9px] sm:tracking-[0.2em]">
        Good food · Great mood
      </span>
    </span>
  );
}
