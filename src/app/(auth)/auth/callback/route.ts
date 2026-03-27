import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  // PKCE flow — ?code= param (magic link OTP)
  if (code) {
    const supabaseResponse = NextResponse.redirect(new URL("/", request.url));
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
      const errorUrl = new URL("/login", request.url);
      errorUrl.searchParams.set("error", "link_expired");
      return NextResponse.redirect(errorUrl);
    }
    return supabaseResponse;
  }

  // Implicit flow — #access_token in fragment (invite emails)
  // Redirect to /auth/handle-token which handles this client-side
  return NextResponse.redirect(new URL("/auth/handle-token", request.url));
}
