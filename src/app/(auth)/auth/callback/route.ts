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
  // Fragments are not visible server-side, so serve a client-side HTML page
  // that reads the token from the fragment and sets the Supabase session.
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Authenticating...</title>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
  <style>
    body { background: #0e0e13; color: #f8f5fd; font-family: monospace; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .msg { text-align: center; }
    .spinner { width: 32px; height: 32px; border: 2px solid #4646CC; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { color: #9896a3; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="msg">
    <div class="spinner"></div>
    <p>Authenticating...</p>
  </div>
  <script>
    const { createClient } = supabase;
    const client = createClient(
      '${process.env.NEXT_PUBLIC_SUPABASE_URL}',
      '${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY}'
    );
    client.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        window.location.href = '/login?error=link_expired';
      } else {
        window.location.href = '/';
      }
    });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
