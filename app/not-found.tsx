import Link from "next/link";
import { SiteShell } from "./components/SiteShell";

export default function NotFound() {
  return (
    <SiteShell>
      <main className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="script-title text-7xl">This page is off the menu</h1>
        <p className="text-muted mt-3 mb-8">The link does not match a dish, a course, or an omasalahub page.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="bg-terra text-white font-bold px-6 py-3 rounded-full">Home</Link>
          <Link href="/menu" className="bg-ink text-cream font-bold px-6 py-3 rounded-full">Full menu</Link>
        </div>
      </main>
    </SiteShell>
  );
}
