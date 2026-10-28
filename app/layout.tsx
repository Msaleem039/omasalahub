import type { Metadata } from "next";
import { Cormorant_Garamond, Great_Vibes, Nunito } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./context/LanguageContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { TranslatePrompt } from "./components/TranslatePrompt";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito-gf",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant-gf",
});

const script = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes-gf",
});

export const metadata: Metadata = {
  title: "Masala Hub - Biryani, Curries & Naans",
  description: "Order butter chicken, biryani, naan, and house specialties from Masala Hub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${cormorant.variable} ${script.variable} antialiased`}>
        <LanguageProvider>
          <CartProvider>
            <WishlistProvider>
              <TranslatePrompt />
              {children}
            </WishlistProvider>
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
