import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import UsersTable from "@/components/admin/users-table";
import { getOpenRouterKeyUsage } from "@/lib/actions/admin";
import { getCurrentUser } from "@/lib/utils";
import type { Profile, Hackathon } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Nadchodzący",
  active: "Aktywny",
  voting: "Głosowanie",
  finished: "Zakończony",
};

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-blue-500/15 text-blue-400",
  active: "bg-green-500/15 text-green-400",
  voting: "bg-yellow-500/15 text-yellow-400",
  finished: "bg-surface-high text-on-surface-muted",
};

interface HackathonWithStats extends Hackathon {
  project_count: number;
  participant_count: number;
}

export default async function AdminDashboardPage() {
  const currentUser = await getCurrentUser();
  const supabase = await createClient();

  const [
    { data: hackathonsRaw, error: e1 },
    { data: usersRaw, error: e2 },
  ] = await Promise.all([
    supabase
      .from("hackathons")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true }),
  ]);

  // Fetch stats per hackathon
  const hackathons: HackathonWithStats[] = await Promise.all(
    (hackathonsRaw ?? []).map(async (h) => {
      const [{ count: projectCount }, { count: participantCount }] = await Promise.all([
        supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .eq("hackathon_id", h.id),
        supabase
          .from("hackathon_participants")
          .select("*", { count: "exact", head: true })
          .eq("hackathon_id", h.id),
      ]);
      return {
        ...h,
        project_count: projectCount ?? 0,
        participant_count: participantCount ?? 0,
      };
    })
  );

  const queryError = e1 || e2;

  if (queryError) {
    return (
      <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-6">
        <h2 className="font-space-grotesk text-lg font-bold text-secondary">
          Nie udało się załadować panelu
        </h2>
        <p className="mt-2 text-sm text-on-surface-muted">{queryError.message}</p>
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
          href="/admin/hackathons/new"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary px-5 py-2.5 font-space-grotesk text-sm font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(70,70,204,0.3)]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nowy hackathon
        </Link>
      </div>

      {/* Hackathons list */}
      <div className="space-y-4">
        <h2 className="font-space-grotesk text-xl font-semibold text-on-surface">
          Hackathony
        </h2>

        {hackathons.length === 0 ? (
          <div className="rounded-xl border border-outline bg-surface-low/60 p-8 text-center">
            <p className="text-sm text-on-surface-muted">Brak hackathonów. Utwórz pierwszy!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {hackathons.map((h) => (
              <Link
                key={h.id}
                href={`/admin/hackathons/${h.slug}`}
                className="group rounded-xl border border-outline bg-surface-low/60 p-6 backdrop-blur-md transition-all hover:border-primary/30 hover:bg-surface-low/80"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h3 className="font-space-grotesk text-base font-bold text-on-surface group-hover:text-primary-dim transition-colors">
                    {h.name}
                  </h3>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[h.status] ?? STATUS_COLORS.upcoming}`}>
                    {STATUS_LABELS[h.status] ?? h.status}
                  </span>
                </div>

                <p className="mb-1 font-mono text-xs text-on-surface-muted">/{h.slug}</p>

                {h.hackathon_date && (
                  <p className="mb-3 text-xs text-on-surface-muted">
                    {new Date(h.hackathon_date).toLocaleDateString("pl-PL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}

                <div className="mt-3 flex gap-4 border-t border-outline/50 pt-3">
                  <div className="text-center">
                    <p className="font-space-grotesk text-lg font-bold text-on-surface">{h.project_count}</p>
                    <p className="text-[10px] uppercase tracking-wider text-on-surface-muted">projekty</p>
                  </div>
                  <div className="text-center">
                    <p className="font-space-grotesk text-lg font-bold text-on-surface">{h.participant_count}</p>
                    <p className="text-[10px] uppercase tracking-wider text-on-surface-muted">uczestnicy</p>
                  </div>
                  <div className="ml-auto flex items-center">
                    <div className="flex gap-1.5">
                      {h.submission_open && (
                        <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-400">Zgłoszenia</span>
                      )}
                      {h.voting_open && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary-dim">Głosowanie</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

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
