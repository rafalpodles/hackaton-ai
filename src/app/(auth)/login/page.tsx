"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Suspense } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const linkExpired = searchParams.get("error") === "link_expired";
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + "/auth/callback",
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push(`/auth/confirm?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Coś poszło nie tak. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center relative overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        <GlassCard>
          {/* Title */}
          <h1 className="font-space-grotesk text-center text-xs tracking-[0.3em] uppercase bg-gradient-to-r from-primary-dim to-secondary-dim bg-clip-text text-transparent mb-6">
            Spyrosoft AI Hackathon
          </h1>

          {/* Heading */}
          <h2 className="font-space-grotesk text-2xl font-bold text-on-surface text-center mb-8">
            Witaj, hackerze!
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block font-space-grotesk text-xs tracking-wide uppercase text-on-surface-muted mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ty@example.com"
                className="w-full bg-surface-low text-on-surface placeholder:text-on-surface-muted/40 border-b-2 border-secondary focus:border-primary-dim outline-none px-4 py-3 rounded-t-md transition-colors duration-200"
              />
            </div>

            {linkExpired && (
              <p className="text-secondary text-sm text-center">
                Twój link logowania wygasł lub został już użyty. Poproś o nowy poniżej.
              </p>
            )}
            {error && (
              <p className="text-secondary text-sm text-center">{error}</p>
            )}

            <GradientButton
              type="submit"
              fullWidth
              disabled={loading || !email}
            >
              {loading ? "Wysyłanie..." : "Wyślij link"}
            </GradientButton>
          </form>

          {/* Footer text */}
          <p className="text-on-surface-muted text-sm text-center mt-6">
            Sprawdź skrzynkę — bez hasła, po prostu kliknij link.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
