"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteShell } from "../components/SiteShell";
import { isSuperadmin, loginSuperadmin } from "../lib/adminAuth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isSuperadmin()) router.replace("/admin");
  }, [router]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    loginSuperadmin(email, password);
    router.push("/admin");
  };

  return (
    <SiteShell>
      <main className="max-w-md mx-auto px-4 py-16">
        <form onSubmit={submit} className="bg-card rounded-[2rem] border border-[#e4d8c4] p-8 shadow-sm space-y-4">
          <h1 className="font-serif text-4xl text-ink">Log in</h1>
          <label className="block text-sm font-bold">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field mt-1"
              autoComplete="username"
            />
          </label>
          <label className="block text-sm font-bold">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field mt-1"
              autoComplete="current-password"
            />
          </label>
          <button type="submit" className="w-full bg-terra hover:bg-terra-deep text-ink font-bold py-3.5 rounded-full">
            Log in
          </button>
        </form>
      </main>
    </SiteShell>
  );
}
