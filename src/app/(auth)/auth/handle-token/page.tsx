"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function HandleTokenPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // The Supabase client automatically reads #access_token from the URL fragment
    // and sets the session when getSession() is called.
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        router.replace("/login?error=link_expired");
        return;
      }
      router.replace("/");
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-on-surface-muted font-space-grotesk text-sm uppercase tracking-widest">
          Uwierzytelnianie...
        </p>
      </div>
    </div>
  );
}
