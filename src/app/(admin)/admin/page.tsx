import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import UsersTable from "@/components/admin/users-table";
import { getOpenRouterKeyUsage } from "@/lib/actions/admin";
import { getCurrentUser } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export default async function AdminDashboardPage() {
  const currentUser = await getCurrentUser();
  const supabase = await createClient();

  const { data: usersRaw, error: usersError } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (usersError) {
    return (
      <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-6">
        <h2 className="font-space-grotesk text-lg font-bold text-secondary">
          Nie udało się załadować panelu
        </h2>
        <p className="mt-2 text-sm text-on-surface-muted">{usersError.message}</p>
      </div>
    );
  }

  // Fetch auth users to get login status
  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const authMap = new Map(
    (authData?.users ?? []).map((u) => [
      u.id,
      {
        confirmed_at: u.confirmed_at ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
      },
    ])
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usersBase = (usersRaw ?? []).map((u: any) => {
    const auth = authMap.get(u.id);
    return {
      ...(u as Profile),
      confirmed_at: auth?.confirmed_at ?? null,
      last_sign_in_at: auth?.last_sign_in_at ?? null,
    };
  });

  // Fetch OpenRouter usage for users with keys (in parallel)
  const usageResults = await Promise.all(
    usersBase.map(async (u) => {
      if (!u.openrouter_key_hash) return { ...u, key_usage: null, key_limit: null };
      const usage = await getOpenRouterKeyUsage(u.openrouter_key_hash);
      return {
        ...u,
        key_usage: usage?.usage ?? null,
        key_limit: usage?.limit ?? null,
      };
    })
  );
  const users = usageResults;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
          Panel admina
        </h1>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-outline px-4 py-2 text-sm text-on-surface-muted transition-colors hover:bg-surface-high hover:text-on-surface"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Hackathony
        </Link>
      </div>

      <p className="text-sm text-on-surface-muted">
        Aby zarządzać konkretnym hackathonem (ustawienia, kategorie, projekty, wyniki), wejdź w hackathon z listy na stronie głównej i użyj linku Admin w sidebarze.
      </p>

      {/* Users */}
      <div className="space-y-4">
        <h2 className="font-space-grotesk text-xl font-semibold text-on-surface">
          Użytkownicy
        </h2>
        <UsersTable currentUserId={currentUser!.id} users={users} />
      </div>
    </div>
  );
}
