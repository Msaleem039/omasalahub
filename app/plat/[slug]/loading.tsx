import { SiteShell } from "../../components/SiteShell";

export default function ProductLoading() {
  return (
    <SiteShell>
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-[2rem] bg-card sm:h-[28rem]" />
        <div className="space-y-4">
          <div className="h-8 w-32 animate-pulse rounded-full bg-card" />
          <div className="h-16 w-3/4 animate-pulse rounded-3xl bg-card" />
          <div className="h-24 animate-pulse rounded-3xl bg-card" />
        </div>
      </main>
    </SiteShell>
  );
}
