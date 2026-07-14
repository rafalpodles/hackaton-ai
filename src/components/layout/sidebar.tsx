"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import GeocitiesToggle from "@/components/geocities/geocities-toggle";
import { useGeocities } from "@/components/geocities/geocities-provider";

interface SidebarProps {
  user: Profile;
  votingOpen: boolean;
  surveyOpen?: boolean;
  surveyResponded?: boolean;
  hackathonFinished?: boolean;
  hackathonSlug?: string;
  hiddenStartPages?: string[];
}

interface NavItemData {
  key?: string;
  label: string;
  href: string;
  en: string;
}

const ACTIVE_STYLE: React.CSSProperties = {
  background: "linear-gradient(120deg, rgba(99,102,241,.22), rgba(255,90,77,.12))",
  border: "1px solid rgba(139,140,245,.4)",
  boxShadow: "inset 3px 0 0 #8b8cf5",
};

export default function Sidebar({ user, votingOpen, surveyOpen, surveyResponded, hackathonFinished, hackathonSlug, hiddenStartPages = [] }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { enabled: geocitiesEnabled } = useGeocities();

  const h = hackathonSlug ? `/h/${hackathonSlug}` : "";

  const startItems: NavItemData[] = [
    ...(hackathonSlug ? [{ key: "rules", label: "Garage Rules", href: `${h}/rules`, en: "rules" }] : []),
    { key: "guide", label: "Poradnik", href: hackathonSlug ? `${h}/guide` : "/guide", en: "guide" },
    ...(hackathonSlug ? [{ key: "faq", label: "Q&A", href: `${h}/faq`, en: "faq" }] : []),
    ...(hackathonSlug ? [{ key: "ideas", label: "Pomysły na projekty", href: `${h}/ideas`, en: "ideas" }] : []),
    ...(hackathonSlug ? [{ key: "prompts", label: "Przydatne prompty", href: `${h}/prompts`, en: "prompts" }] : []),
  ].filter((item) => !hiddenStartPages.includes(item.key ?? ""));

  const hackathonItems: NavItemData[] = hackathonSlug
    ? [
        { label: "Zespół", href: `${h}/team`, en: "team" },
        { label: "Mój projekt", href: `${h}/my-project`, en: "project" },
      ]
    : [];

  const galleryItems: NavItemData[] = hackathonSlug
    ? [
        { label: "Projekty", href: `${h}`, en: "gallery" },
        { label: "Live", href: `${h}/feed`, en: "stream" },
        ...(hackathonFinished ? [{ label: "Wyniki", href: `${h}/results`, en: "results" }] : []),
      ]
    : [];

  const adminItems: NavItemData[] = hackathonSlug
    ? [
        { label: "Admin", href: `${h}/admin`, en: "admin" },
        { label: "Wyniki", href: `${h}/admin/results`, en: "export" },
      ]
    : [{ label: "Panel", href: "/admin", en: "panel" }];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (hackathonSlug && href === `/h/${hackathonSlug}`) return pathname === href;
    if (href.endsWith("/admin")) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initial = user.display_name?.charAt(0).toUpperCase() ?? "?";

  const gradientCta =
    "block w-full rounded-[13px] py-[13px] text-center font-chakra-petch text-sm font-bold tracking-[0.08em] text-white";
  const gradientStyle = {
    background: "linear-gradient(120deg, #6366f1, #a855f7, #ff5a4d)",
    boxShadow: "0 12px 30px -10px rgba(129,90,241,.7)",
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-high/80 text-on-surface backdrop-blur-md lg:hidden"
        aria-label="Open menu"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-y-auto border-r border-outline bg-[rgba(9,9,14,.72)] px-[18px] py-[22px] backdrop-blur-[14px] transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-muted hover:text-on-surface lg:hidden"
          aria-label="Close menu"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <Link
          href={hackathonSlug ? `${h}/profile` : "/profile"}
          className="flex items-center gap-3 rounded-xl px-[6px] pb-[18px] pt-2 transition-colors hover:bg-white/[0.04]"
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] font-chakra-petch text-xl font-bold text-white"
            style={{ background: "linear-gradient(135deg, #6366f1, #ff5a4d)", boxShadow: "0 0 20px rgba(99,102,241,.5)" }}
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-on-surface">{user.display_name}</p>
            <p className="truncate font-jetbrains-mono text-[11px] text-on-surface-dim">{user.email}</p>
          </div>
        </Link>

        {hackathonSlug && (
          <Link
            href="/"
            className="px-2 py-[10px] font-jetbrains-mono text-xs tracking-[0.16em] text-on-surface-dim transition-colors hover:text-on-surface"
          >
            ← HACKATHONY
          </Link>
        )}

        <nav className="flex-1">
          <NavSection label="NA START" items={startItems} isActive={isActive} />
          <NavSection label="HACKATHON" items={hackathonItems} isActive={isActive} />
          <NavSection label="GALERIA" items={galleryItems} isActive={isActive} />
          {user.role === "admin" && (
            <NavSection label="ADMIN" items={adminItems} isActive={isActive} />
          )}
        </nav>

        {geocitiesEnabled && (
          <Link
            href={hackathonSlug ? `${h}/guestbook` : "/guestbook"}
            className="mt-2 flex items-center rounded-[11px] px-3 py-2 font-jetbrains-mono text-xs uppercase tracking-[0.16em] text-on-surface-muted transition-colors hover:bg-white/5 hover:text-on-surface"
            style={{ animation: "geocities-rainbow 2s linear infinite" }}
          >
            &#9733; Guestbook &#9733;
          </Link>
        )}

        {votingOpen && (
          <Link href={`${h}/vote`} className={`mt-[26px] ${gradientCta}`} style={gradientStyle}>
            GŁOSUJ
          </Link>
        )}

        {surveyOpen && hackathonSlug && (
          <>
            {surveyResponded && (hackathonFinished || user.role === "admin") ? (
              <Link href={`${h}/results`} className={`mt-3 ${gradientCta}`} style={gradientStyle}>
                ZOBACZ WYNIKI
              </Link>
            ) : !surveyResponded ? (
              <Link href={`${h}/survey`} className={`mt-3 ${gradientCta}`} style={gradientStyle}>
                WYPEŁNIJ ANKIETĘ
              </Link>
            ) : null}
          </>
        )}

        <div className="py-[14px] text-center font-jetbrains-mono text-[11px] tracking-[0.2em] text-on-surface-faint">
          &lt;90s&gt;
        </div>

        <div className="flex justify-center pb-1">
          <GeocitiesToggle />
        </div>

        <button
          onClick={handleLogout}
          className="mt-2 px-2 py-3 text-left font-jetbrains-mono text-xs tracking-[0.16em] text-on-surface-dim transition-colors hover:text-secondary"
        >
          WYLOGUJ
        </button>
      </aside>
    </>
  );
}

function NavSection({
  label,
  items,
  isActive,
}: {
  label: string;
  items: NavItemData[];
  isActive: (href: string) => boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <div className="px-2 py-[6px] font-jetbrains-mono text-[10.5px] tracking-[0.24em] text-on-surface-faint">
        {label}
      </div>
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            data-active={active ? "true" : undefined}
            style={active ? ACTIVE_STYLE : undefined}
            className={`my-[3px] flex items-center justify-between gap-2 rounded-[11px] px-3 py-[11px] text-[14.5px] font-semibold transition-colors ${
              active ? "text-white" : "border border-transparent text-on-surface-muted hover:bg-white/5"
            }`}
          >
            <span>{item.label}</span>
            <span className="font-jetbrains-mono text-[10px] tracking-[0.1em] text-on-surface-faint">
              {item.en}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
