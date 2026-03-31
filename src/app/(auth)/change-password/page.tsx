"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: { must_change_password: false },
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      await supabase.auth.signOut();
      router.push("/login?password_changed=true");
    } catch {
      setError("Coś poszło nie tak. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        <GlassCard>
          <h1 className="font-space-grotesk text-center text-xs tracking-[0.3em] uppercase bg-gradient-to-r from-primary-dim to-secondary-dim bg-clip-text text-transparent mb-6">
            Spyrosoft AI Hackathon
          </h1>

          <h2 className="font-space-grotesk text-2xl font-bold text-on-surface text-center mb-4">
            Zmień hasło
          </h2>

          <p className="text-on-surface-muted text-sm text-center mb-8">
            Utwórz nowe hasło, które będziesz używać do logowania.
            <br />
            <span className="text-secondary">Nie używaj hasła do systemów korporacyjnych.</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block font-space-grotesk text-xs tracking-wide uppercase text-on-surface-muted mb-2"
              >
                Nowe hasło
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 znaków"
                className="w-full bg-surface-low text-on-surface placeholder:text-on-surface-muted/40 border-b-2 border-secondary focus:border-primary-dim outline-none px-4 py-3 rounded-t-md transition-colors duration-200"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block font-space-grotesk text-xs tracking-wide uppercase text-on-surface-muted mb-2"
              >
                Powtórz hasło
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Powtórz nowe hasło"
                className="w-full bg-surface-low text-on-surface placeholder:text-on-surface-muted/40 border-b-2 border-secondary focus:border-primary-dim outline-none px-4 py-3 rounded-t-md transition-colors duration-200"
              />
            </div>

            {error && (
              <p className="text-secondary text-sm text-center">{error}</p>
            )}

            <GradientButton
              type="submit"
              fullWidth
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? "Zapisywanie..." : "Ustaw nowe hasło"}
            </GradientButton>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
