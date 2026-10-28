import React from "react";

function Mark({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="28" fill="#efe4d2" stroke="#2c2118" strokeWidth="4" />
      <path
        d="M26 22v10M32 20v12M38 22v10M26 32h12v2c0 7-12 7-12 0zM32 34v12"
        fill="none"
        stroke="#c8652c"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const mark = size === "lg" ? "h-12 w-12" : "h-9 w-9";
  const word = size === "lg" ? "text-3xl" : "text-xl sm:text-2xl";

  return (
    <span className="inline-flex items-center gap-2" role="img" aria-label="Omasalahub">
      <Mark className={`${mark} shrink-0`} />
      <span className={`font-extrabold tracking-tight leading-none lowercase ${word}`}>
        <span className="text-ink">masala</span>
        <span className="text-terra">hub</span>
      </span>
    </span>
  );
}
