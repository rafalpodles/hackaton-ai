"use client";

import { useGeocities } from "@/components/geocities/geocities-provider";
import { Guestbook } from "@/components/geocities/guestbook";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Entry {
  id: string;
  author_name: string;
  message: string;
  created_at: string;
}

export function GuestbookGuard({ entries }: { entries: Entry[] }) {
  const { enabled } = useGeocities();
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      router.replace("/");
    }
  }, [enabled, router]);

  if (!enabled) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-on-surface-muted">
          Włącz tryb Geocities, żeby odblokować księgę gości!
        </p>
      </div>
    );
  }

  return <Guestbook entries={entries} />;
}
