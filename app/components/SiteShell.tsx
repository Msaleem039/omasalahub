"use client";

import React from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { OrderingBanner } from "./OrderingBanner";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <OrderingBanner />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
