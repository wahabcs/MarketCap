"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Boxes } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Only allow same-site relative redirects ("/watchlist"), never "//evil.com" or full URLs.
const safeNext = (raw: string | null) => (raw && /^\/(?!\/)/.test(raw) ? raw : "/");

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();
    const next = safeNext(new URLSearchParams(window.location.search).get("next"));

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else {
        router.push(next);
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else if (data.session) {
        router.push(next);
        router.refresh();
      } else {
        setNotice("Check your email for a confirmation link, then sign in.");
        setMode("signin");
      }
    }
    setBusy(false);
  };

  const field = "w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-brand";

  return (
    <main className="grid min-h-screen place-items-center bg-sidebar p-4">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white">
            <Boxes size={20} />
          </div>
          <span className="text-xl font-semibold">MarketCap</span>
        </div>
        <h1 className="text-2xl font-semibold">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-muted">Sign in to save stocks to your watchlist.</p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <input
            type="email" required autoComplete="email" placeholder="Email"
            value={email} onChange={(e) => setEmail(e.target.value)} className={field}
          />
          <input
            type="password" required minLength={8} placeholder="Password (8+ characters)"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password} onChange={(e) => setPassword(e.target.value)} className={field}
          />
          {error && <p role="alert" className="rounded-xl bg-down-soft px-4 py-2 text-sm text-down">{error}</p>}
          {notice && <p className="rounded-xl bg-up-soft px-4 py-2 text-sm text-up">{notice}</p>}
          <button
            disabled={busy}
            className="rounded-full bg-brand py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setNotice(null);
          }}
          className="mt-4 w-full text-center text-sm text-muted hover:text-foreground"
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
