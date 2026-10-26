"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Staff log in with email + password (accounts are created in Supabase).
export default function StaffLoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center p-6">
      <Suspense>
        <StaffLoginForm />
      </Suspense>
    </main>
  );
}

function StaffLoginForm() {
  const router = useRouter();
  const notStaff = useSearchParams().get("error") === "not-staff";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    notStaff ? "That account doesn't have staff access. Log in with a staff account." : "",
  );
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError("Wrong email or password.");
      return;
    }
    router.replace("/staff");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Staff login</h1>
      <input
        className="input"
        type="email"
        placeholder="Email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="input"
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button className="btn" disabled={busy}>
        {busy ? "Logging in…" : "Log in"}
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}
