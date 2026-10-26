"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizePhone } from "@/lib/format";

// Step 1: enter phone number. Step 2: enter the 6-digit code we text them.
export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const normalized = normalizePhone(phoneInput);
    if (!normalized) {
      setError("Please enter a 10-digit phone number.");
      return;
    }
    setBusy(true);
    const { error } = await createClient().auth.signInWithOtp({ phone: normalized });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setPhone(normalized);
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await createClient().auth.verifyOtp({
      phone,
      token: code.trim(),
      type: "sms",
    });
    if (error) {
      setBusy(false);
      setError("That code didn't work. Check it and try again.");
      return;
    }
    // New members are asked for their name on the welcome page first.
    router.replace(`/welcome?next=${encodeURIComponent(next)}`);
    router.refresh();
  }

  return (
    <div className="card">
      <h1 className="text-2xl font-bold">Log in</h1>
      {step === "phone" ? (
        <form onSubmit={sendCode} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-slate-600">Your phone number</span>
            <input
              className="input"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(555) 123-4567"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              required
            />
          </label>
          <button className="btn" disabled={busy}>
            {busy ? "Sending…" : "Text me a code"}
          </button>
          <p className="text-sm text-slate-500">
            New here? This also creates your account. Message and data rates may apply.
          </p>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-slate-600">Enter the 6-digit code we texted you</span>
            <input
              className="input text-center text-2xl tracking-[0.5em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
              autoFocus
            />
          </label>
          <button className="btn" disabled={busy || code.length < 6}>
            {busy ? "Checking…" : "Log in"}
          </button>
          <button
            type="button"
            className="text-sm text-slate-500 underline"
            onClick={() => {
              setStep("phone");
              setCode("");
              setError("");
            }}
          >
            Use a different number
          </button>
        </form>
      )}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
}

// Only allow redirects to pages on this site.
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
