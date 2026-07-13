import Link from "next/link";

interface LandingTopBarProps {
  email?: string | null;
  displayName?: string | null;
  isLoggedIn: boolean;
}

function LogoMark() {
  return (
    <div className="flex items-center gap-[13px]">
      <div
        className="h-8 w-8 rounded-[9px]"
        style={{
          background: "linear-gradient(135deg, #6366f1, #ff5a4d)",
          boxShadow: "0 0 20px rgba(99,102,241,.55)",
        }}
      />
      <div className="font-chakra-petch text-[18px] font-bold tracking-[0.02em] text-on-surface">
        Spyrosoft <span className="font-medium text-on-surface-dim">Hackathons</span>
      </div>
    </div>
  );
}

export function LandingTopBar({ email, displayName, isLoggedIn }: LandingTopBarProps) {
  return (
    <header className="mx-auto flex max-w-[1400px] items-center justify-between px-[clamp(20px,5vw,64px)] py-[26px]">
      <Link href="/">
        <LogoMark />
      </Link>
      <div className="flex items-center gap-[22px]">
        {isLoggedIn ? (
          <>
            <Link
              href="/profile"
              className="font-jetbrains-mono text-xs tracking-[0.18em] text-on-surface-dim transition-colors hover:text-on-surface"
            >
              {email ?? displayName}
            </Link>
            <span className="flex items-center gap-2 rounded-full border border-[rgba(46,230,207,.35)] px-[14px] py-2 font-jetbrains-mono text-[11px] tracking-[0.16em] text-cyan">
              <span className="gos-pulse-dot h-[7px] w-[7px] rounded-full bg-cyan" />
              SYSTEM ONLINE
            </span>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="font-jetbrains-mono text-xs tracking-[0.18em] text-on-surface-dim transition-colors hover:text-on-surface"
            >
              ZALOGUJ
            </Link>
            <Link
              href="/register"
              className="rounded-[12px] px-[18px] py-[10px] font-chakra-petch text-[13px] font-bold tracking-[0.06em] text-white"
              style={{ background: "linear-gradient(120deg, #6366f1, #ff5a4d)" }}
            >
              ZAREJESTRUJ
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
