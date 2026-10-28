import React from "react";

function Hat({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d="M10 30c0-7 4.2-12 9.2-12 1-5 4.4-8 8.8-8s7.8 3 8.8 8c5 0 9.2 5 9.2 12v2H10v-2z"
        fill="#f8f4ea"
      />
      <path d="M8 32h32v5.5c0 3.2-3.4 5.5-16 5.5S8 40.7 8 37.5V32z" fill="#e0b15a" />
      <path d="M24 8c.6 2.4 1.4 3.6 3.2 4.4" stroke="#e0b15a" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const hat = size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const word = size === "lg" ? "text-4xl" : "text-2xl";

  return (
    <span className="inline-flex items-center gap-1.5" role="img" aria-label="Masala Hub">
      <Hat className={`${hat} shrink-0`} />
      <span className="leading-none">
        <span className={`block font-serif font-bold tracking-tight ${word}`}>
          <span className="text-cream">Masala</span>
          <span className="text-terra">Hub</span>
        </span>
        <span className="mt-0.5 block text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] text-terra">
          Good food · Great mood
        </span>
      </span>
    </span>
  );
}
