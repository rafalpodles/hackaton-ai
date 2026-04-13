"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { registerUser } from "@/lib/actions/register";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";

const EMAIL_HINT_REGEX = /^[a-zA-Z]{1,4}@(spyro-soft\.com|vm\.spyro-soft\.com)$/;

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const emailValid = email === "" || EMAIL_HINT_REGEX.test(email);
  const passwordsMatch = confirmPassword === "" || password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser(email, password);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Auto-login after successful registration
      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (loginError) {
        setError("Konto zostało utworzone, ale logowanie nie powiodło się. Przejdź do strony logowania.");
        return;
      }

      router.push("/");
      router.refresh();
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
            Utwórz konto
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
                placeholder="akronim@spyro-soft.com"
                className="w-full bg-surface-low text-on-surface placeholder:text-on-surface-muted/40 border-b-2 border-secondary focus:border-primary-dim outline-none px-4 py-3 rounded-t-md transition-colors duration-200"
              />
              {email && !emailValid && (
                <p className="text-secondary text-xs mt-1">
                  Format: maks. 4 litery@spyro-soft.com lub akronim@vm.spyro-soft.com
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-space-grotesk text-xs tracking-wide uppercase text-on-surface-muted mb-2"
              >
                Hasło
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-low text-on-surface placeholder:text-on-surface-muted/40 border-b-2 border-secondary focus:border-primary-dim outline-none px-4 py-3 rounded-t-md transition-colors duration-200"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block font-space-grotesk text-xs tracking-wide uppercase text-on-surface-muted mb-2"
              >
                Potwierdź hasło
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-low text-on-surface placeholder:text-on-surface-muted/40 border-b-2 border-secondary focus:border-primary-dim outline-none px-4 py-3 rounded-t-md transition-colors duration-200"
              />
              {!passwordsMatch && (
                <p className="text-secondary text-xs mt-1">Hasła nie są identyczne.</p>
              )}
            </div>

            {error && (
              <p className="text-secondary text-sm text-center">{error}</p>
            )}

            <GradientButton
              type="submit"
              fullWidth
              disabled={loading || !email || !password || !confirmPassword || !passwordsMatch}
            >
              {loading ? "Tworzenie konta..." : "Zarejestruj się"}
            </GradientButton>
          </form>

          {/* Link to login */}
          <p className="mt-6 text-center text-sm text-on-surface-muted">
            Masz już konto?{" "}
            <Link
              href="/login"
              className="text-primary-dim hover:text-primary transition-colors"
            >
              Zaloguj się
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
