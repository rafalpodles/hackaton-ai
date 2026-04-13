import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getRedirectUrl(request: NextRequest, pathname: string): URL {
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const origin = host ? `${proto}://${host}` : new URL(request.url).origin;
  return new URL(pathname, origin);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public paths — no auth required
  const publicPaths = ["/login", "/register", "/change-password", "/live"];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));

  // Landing page is public
  if (pathname === "/") return supabaseResponse;

  // Global pages accessible to any logged-in user
  const globalAuthPaths = ["/rules", "/guide", "/faq", "/prompts", "/profile", "/guestbook"];
  const isGlobalAuthPath = globalAuthPaths.some((p) => pathname.startsWith(p));

  if (!user && !isPublicPath) {
    return NextResponse.redirect(getRedirectUrl(request, "/login"));
  }

  if (user) {
    const mustChangePassword = user.user_metadata?.must_change_password === true;

    if (mustChangePassword && pathname !== "/change-password") {
      return NextResponse.redirect(getRedirectUrl(request, "/change-password"));
    }

    if (!mustChangePassword && pathname === "/change-password") {
      return NextResponse.redirect(getRedirectUrl(request, "/"));
    }

    if (pathname === "/login" || pathname === "/register") {
      return NextResponse.redirect(getRedirectUrl(request, "/"));
    }

    // Per-hackathon routes: /h/[slug]/*
    const hackathonMatch = pathname.match(/^\/h\/([^/]+)(\/.*)?$/);
    if (hackathonMatch) {
      const slug = hackathonMatch[1];
      const subpath = hackathonMatch[2] ?? "/";

      // Check hackathon exists
      const { data: hackathon } = await supabase
        .from("hackathons")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!hackathon) {
        return NextResponse.redirect(getRedirectUrl(request, "/"));
      }

      // Admin routes within hackathon
      if (subpath.startsWith("/admin")) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profile || profile.role !== "admin") {
          return NextResponse.redirect(getRedirectUrl(request, `/h/${slug}`));
        }
      }

      // Check participation for protected routes
      const protectedSubpaths = ["/onboarding", "/team", "/my-project", "/vote"];
      const needsParticipation = protectedSubpaths.some((p) => subpath.startsWith(p));

      if (needsParticipation) {
        const { data: participant } = await supabase
          .from("hackathon_participants")
          .select("id, team_id, is_solo")
          .eq("hackathon_id", hackathon.id)
          .eq("user_id", user.id)
          .single();

        if (!participant) {
          return NextResponse.redirect(getRedirectUrl(request, "/"));
        }

        // Onboarding check for team/my-project
        const needsOnboarding = ["/team", "/my-project"].some((p) => subpath.startsWith(p));
        if (needsOnboarding && !participant.team_id && !participant.is_solo) {
          return NextResponse.redirect(getRedirectUrl(request, `/h/${slug}/onboarding`));
        }
      }
    }

    // Admin routes
    if (pathname.startsWith("/admin")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        return NextResponse.redirect(getRedirectUrl(request, "/"));
      }
    }
  }

  return supabaseResponse;
}
