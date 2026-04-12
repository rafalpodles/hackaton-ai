import Link from "next/link";
import { getCurrentUser } from "@/lib/utils";
import { GradientButton } from "@/components/ui/gradient-button";

export default async function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen">
      <header className="border-b border-outline bg-surface-high/40 backdrop-blur-[20px] sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-space-grotesk font-bold text-xl text-on-surface hover:text-primary transition-colors"
          >
            Spyrosoft Hackathons
          </Link>

          <nav className="flex items-center gap-4">
            {user ? (
              <Link
                href="/profile"
                className="text-on-surface-muted hover:text-on-surface transition-colors text-sm"
              >
                {user.display_name}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-on-surface-muted hover:text-on-surface transition-colors text-sm"
                >
                  Zaloguj się
                </Link>
                <Link href="/register">
                  <GradientButton variant="primary">
                    Zarejestruj się
                  </GradientButton>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
