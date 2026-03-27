"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import Link from "next/link";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center relative overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        <GlassCard className="text-center">
          {/* Email icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-primary-dim"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>

          {/* Heading */}
          <h2 className="font-space-grotesk text-2xl font-bold text-on-surface mb-4">
            Check your email!
          </h2>

          {/* Email display */}
          {email && (
            <p className="text-primary-dim text-sm font-medium mb-4">
              {email}
            </p>
          )}

          {/* Message */}
          <p className="text-on-surface-muted text-sm mb-8">
            Click the link we sent you to sign in. The link expires in 15
            minutes.
          </p>

          {/* Open mail app button */}
          <a href={`mailto:${email}`}>
            <GradientButton fullWidth>Open Mail App</GradientButton>
          </a>

          {/* Links */}
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={`/login`}
              className="text-primary-dim text-sm hover:underline transition-colors"
            >
              Send again
            </Link>
            <Link
              href="/login"
              className="text-on-surface-muted text-sm hover:text-on-surface transition-colors"
            >
              Use different email
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <p className="text-on-surface-muted">Loading...</p>
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
