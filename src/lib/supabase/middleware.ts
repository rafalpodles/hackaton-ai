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

  const publicPaths = ["/login", "/change-password"];
  const isPublicPath = publicPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (!user && !isPublicPath) {
    return NextResponse.redirect(getRedirectUrl(request, "/login"));
  }

  if (user) {
    const mustChangePassword = user.user_metadata?.must_change_password === true;

    if (mustChangePassword && request.nextUrl.pathname !== "/change-password") {
      return NextResponse.redirect(getRedirectUrl(request, "/change-password"));
    }

    if (!mustChangePassword && request.nextUrl.pathname === "/change-password") {
      return NextResponse.redirect(getRedirectUrl(request, "/rules"));
    }

    if (!isPublicPath) {
      const needsOnboardingCheck = ["/team", "/my-project"].some((p) =>
        request.nextUrl.pathname.startsWith(p)
      );

      if (needsOnboardingCheck) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("team_id, is_solo, role")
          .eq("id", user.id)
          .single();

        if (profile && !profile.team_id && !profile.is_solo && profile.role !== "admin") {
          return NextResponse.redirect(getRedirectUrl(request, "/onboarding"));
        }
      }
    }

    if (request.nextUrl.pathname === "/login") {
      return NextResponse.redirect(getRedirectUrl(request, "/rules"));
    }
  }

  return supabaseResponse;
}
