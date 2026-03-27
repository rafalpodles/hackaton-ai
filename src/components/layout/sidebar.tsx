"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

interface SidebarProps {
  user: Profile;
}

const navItems = [
  { label: "Projects", href: "/" },
  { label: "Live Feed", href: "/feed" },
  { label: "Submit", href: "/my-project" },
];

const adminItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Results", href: "/admin/results" },
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initial = user.display_name?.charAt(0).toUpperCase() ?? "?";

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col bg-surface-low/80 backdrop-blur-[20px] border-r border-outline">
      {/* User identity */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary font-space-grotesk text-sm font-bold text-white">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-on-surface">
            {user.display_name}
          </p>
          <p className="truncate text-xs text-on-surface-muted">
            {user.email}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        <p className="mb-2 px-2 font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
          Menu
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            active={isActive(item.href)}
          />
        ))}

        <NavLink href="/vote" label="Voting" active={isActive("/vote")} />
        <NavLink href="/results" label="Results" active={isActive("/results")} />

        {/* Admin section */}
        {user.role === "admin" && (
          <>
            <div className="my-4 border-t border-outline" />
            <p className="mb-2 px-2 font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
              Admin
            </p>
            {adminItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={isActive(item.href)}
              />
            ))}
          </>
        )}
      </nav>

      {/* Vote CTA — always visible */}
      <div className="px-3 pb-3">
        <Link
          href="/vote"
          className="block w-full rounded-lg bg-gradient-to-r from-primary to-secondary py-2.5 text-center font-space-grotesk text-sm font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
        >
          Vote Now
        </Link>
      </div>

      {/* Logout */}
      <div className="border-t border-outline px-3 py-4">
        <button
          onClick={handleLogout}
          className="w-full rounded-lg px-3 py-2 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted transition-colors hover:bg-surface-high hover:text-on-surface"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center rounded-lg px-3 py-2 font-space-grotesk text-xs uppercase tracking-wider transition-colors ${
        active
          ? "border-l-2 border-primary-dim bg-primary/15 text-primary-dim"
          : "text-on-surface-muted hover:bg-surface-high hover:text-on-surface"
      }`}
    >
      {label}
    </Link>
  );
}
