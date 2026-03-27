import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

function getOrigin(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const origin = getOrigin(request);

  // PKCE flow — ?code= param (magic link OTP)
  if (code) {
    const supabaseResponse = NextResponse.redirect(new URL("/", origin));
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const errorUrl = new URL("/login", origin);
      errorUrl.searchParams.set("error", "link_expired");
      return NextResponse.redirect(errorUrl);
    }
    return supabaseResponse;
  }

  // Implicit flow — #access_token in fragment (invite emails)
  return NextResponse.redirect(new URL("/auth/handle-token", origin));
}
