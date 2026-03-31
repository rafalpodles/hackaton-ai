"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

interface SidebarProps {
  user: Profile;
  votingOpen: boolean;
}

const startItems = [
  { label: "Garage Rules", href: "/rules" },
  { label: "Poradnik", href: "/guide" },
  { label: "Pomysły na projekty", href: "/ideas" },
  { label: "Przydatne prompty", href: "/prompts" },
];

const hackathonItems = [
  { label: "Zespół", href: "/team" },
  { label: "Mój projekt", href: "/my-project" },
];

const galleryItems = [
  { label: "Projekty", href: "/" },
  { label: "Live", href: "/feed" },
];

const adminItems = [
  { label: "Panel", href: "/admin" },
  { label: "Wyniki", href: "/results" },
];

export default function Sidebar({ user, votingOpen }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initial = user.display_name?.charAt(0).toUpperCase() ?? "?";

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-high/80 backdrop-blur-md text-on-surface lg:hidden"
        aria-label="Open menu"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Overlay (mobile only) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-60 flex-col bg-surface-low/80 backdrop-blur-[20px] border-r border-outline transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile close button */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-muted hover:text-on-surface lg:hidden"
          aria-label="Close menu"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* User identity */}
        <Link
          href="/profile"
          className="group/user flex items-center gap-3 rounded-xl px-5 py-6 transition-colors hover:bg-surface-high"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary font-space-grotesk text-sm font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-on-surface">
              {user.display_name}
            </p>
            <p className="truncate text-xs text-on-surface-muted">
              {user.email}
            </p>
          </div>
          <svg
            className="h-4 w-4 shrink-0 text-on-surface-muted opacity-0 transition-opacity group-hover/user:opacity-100"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3">
          <p className="mb-2 px-2 font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
            Na start
          </p>
          {startItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isActive(item.href)}
            />
          ))}

          <div className="my-4 border-t border-outline" />
          <p className="mb-2 px-2 font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
            Hackathon
          </p>
          {hackathonItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isActive(item.href)}
            />
          ))}

          <div className="my-4 border-t border-outline" />
          <p className="mb-2 px-2 font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
            Galeria
          </p>
          {galleryItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isActive(item.href)}
            />
          ))}

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

        {/* Vote CTA — only when voting is open */}
        {votingOpen && (
          <div className="px-3 pb-3">
            <Link
              href="/vote"
              className="block w-full rounded-lg bg-gradient-to-r from-primary to-secondary py-2.5 text-center font-space-grotesk text-sm font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
            >
              Głosuj
            </Link>
          </div>
        )}

        {/* Logout */}
        <div className="border-t border-outline px-3 py-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted transition-colors hover:bg-surface-high hover:text-on-surface"
          >
            Wyloguj
          </button>
        </div>
      </aside>
    </>
  );
}

function NavLink({
  href,
  label,
  active,
  small,
}: {
  href: string;
  label: string;
  active: boolean;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center rounded-lg font-space-grotesk uppercase tracking-wider transition-colors ${
        small
          ? "px-3 py-1.5 text-[10px]"
          : "px-3 py-2 text-xs"
      } ${
        active
          ? "border-l-2 border-primary-dim bg-primary/15 text-primary-dim"
          : "text-on-surface-muted hover:bg-surface-high hover:text-on-surface"
      }`}
    >
      {label}
    </Link>
  );
}
