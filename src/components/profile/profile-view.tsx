"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { updateProfile, requestApiKey } from "@/lib/actions/profiles";
import { leaveProject } from "@/lib/actions/projects";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import type { Profile, Project } from "@/lib/types";

interface ProfileViewProps {
  user: Profile;
  project: Project | null;
  team: Pick<Profile, "id" | "display_name" | "avatar_url">[];
  keyUsage?: number | null;
  keyLimit?: number | null;
}

export default function ProfileView({
  user,
  project,
  team,
  keyUsage,
  keyLimit,
}: ProfileViewProps) {
  const [isPending, startTransition] = useTransition();
  const [editingName, setEditingName] = useState(false);
  const [firstNameValue, setFirstNameValue] = useState(user.first_name ?? "");
  const [lastNameValue, setLastNameValue] = useState(user.last_name ?? "");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initial =
    user.display_name?.charAt(0).toUpperCase() ?? user.email.charAt(0).toUpperCase();

  const handleAvatarUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        setError("Avatar musi być mniejszy niż 2 MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Plik musi być obrazem");
        return;
      }

      setError(null);
      setAvatarUploading(true);

      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop() ?? "png";
        const filePath = `${user.id}/avatar.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw new Error(uploadError.message);

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);

        // Bust cache by adding timestamp
        const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

        startTransition(async () => {
          try {
            await updateProfile({ avatar_url: urlWithCacheBust });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Nie udało się zaktualizować avatara");
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Przesyłanie nie powiodło się");
      } finally {
        setAvatarUploading(false);
      }
    },
    [user.id]
  );

  const handleSaveName = useCallback(() => {
    const first = firstNameValue.trim();
    const last = lastNameValue.trim();
    if (!first && !last) {
      setEditingName(false);
      return;
    }

    startTransition(async () => {
      try {
        await updateProfile({ first_name: first, last_name: last });
        setEditingName(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się zapisać");
      }
    });
  }, [firstNameValue, lastNameValue]);

  const handleLeaveProject = useCallback(() => {
    setShowLeaveConfirm(false);
    startTransition(async () => {
      try {
        await leaveProject();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się opuścić projektu");
      }
    });
  }, []);

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-low p-8 pb-24">
        <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-primary opacity-[0.07] blur-3xl" />
      </div>

      {/* Avatar Section */}
      <div className="-mt-16 ml-8">
        <button
          type="button"
          className="group relative h-28 w-28 overflow-hidden rounded-full ring-4 ring-surface focus:outline-none focus-visible:ring-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={avatarUploading || isPending}
          aria-label="Zmień avatar"
        >
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.display_name}
              fill
              className="object-cover"
              sizes="112px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-secondary">
              <span className="font-space-grotesk text-3xl font-bold text-white">
                {initial}
              </span>
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"
              />
            </svg>
            <span className="mt-1 text-xs font-semibold text-white">Zmień</span>
          </div>
          {avatarUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-8 mt-4 rounded-lg bg-secondary/10 px-4 py-2 text-sm text-secondary">
          {error}
        </div>
      )}

      {/* Profile Card */}
      <div className="mt-6 rounded-2xl bg-surface-low p-6">
        <p className="mb-4 font-space-grotesk text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-muted">
          Profil
        </p>

        {/* Name */}
        <div>
          {editingName ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="mb-1 block font-space-grotesk text-[10px] uppercase tracking-[0.2em] text-on-surface-muted">
                    Imię
                  </label>
                  <input
                    type="text"
                    value={firstNameValue}
                    onChange={(e) => setFirstNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") {
                        setEditingName(false);
                        setFirstNameValue(user.first_name ?? "");
                        setLastNameValue(user.last_name ?? "");
                      }
                    }}
                    className="w-full bg-black px-3 py-2 font-space-grotesk text-on-surface outline-none"
                    autoFocus
                    disabled={isPending}
                    placeholder="Jan"
                  />
                  <div className="h-0.5 bg-gradient-to-r from-primary to-secondary" />
                </div>
                <div className="relative">
                  <label className="mb-1 block font-space-grotesk text-[10px] uppercase tracking-[0.2em] text-on-surface-muted">
                    Nazwisko
                  </label>
                  <input
                    type="text"
                    value={lastNameValue}
                    onChange={(e) => setLastNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") {
                        setEditingName(false);
                        setFirstNameValue(user.first_name ?? "");
                        setLastNameValue(user.last_name ?? "");
                      }
                    }}
                    className="w-full bg-black px-3 py-2 font-space-grotesk text-on-surface outline-none"
                    disabled={isPending}
                    placeholder="Kowalski"
                  />
                  <div className="h-0.5 bg-gradient-to-r from-primary to-secondary" />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveName}
                  disabled={isPending}
                  className="rounded-lg bg-primary/15 px-3 py-1.5 font-space-grotesk text-xs font-bold uppercase tracking-wider text-primary-dim transition-colors hover:bg-primary/25 disabled:opacity-50"
                >
                  Zapisz
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setFirstNameValue(user.first_name ?? "");
                    setLastNameValue(user.last_name ?? "");
                  }}
                  className="rounded-lg px-3 py-1.5 font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted transition-colors hover:bg-surface-high"
                >
                  Anuluj
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="font-space-grotesk text-lg font-semibold text-on-surface">
                {user.display_name}
              </p>
              <button
                onClick={() => setEditingName(true)}
                className="rounded-lg p-2 text-on-surface-muted transition-colors hover:bg-surface-high hover:text-on-surface"
                aria-label="Edytuj imię i nazwisko"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="mt-4 h-px bg-outline" />
        <div className="mt-4 flex items-center justify-between">
          <p className="text-base text-on-surface-muted">{user.email}</p>
          <svg
            className="h-4 w-4 text-on-surface-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </div>
      </div>

      {/* Team & Project Card */}
      <div className="mt-4 rounded-2xl bg-surface-low p-6">
        <p className="mb-4 font-space-grotesk text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-muted">
          Twój zespół
        </p>

        {project ? (
          <>
            {/* Project name + status */}
            <div className="flex items-center gap-3">
              <p className="font-space-grotesk text-lg font-semibold text-on-surface">
                {project.name}
              </p>
              {project.is_submitted ? (
                <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 font-space-grotesk text-[10px] font-bold uppercase tracking-wider text-green-400">
                  Zgłoszony
                </span>
              ) : (
                <span className="rounded-full bg-yellow-500/15 px-2.5 py-0.5 font-space-grotesk text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                  Szkic
                </span>
              )}
            </div>

            {/* Team members */}
            <div className="mt-4 space-y-3">
              {team.map((member) => {
                const memberInitial =
                  member.display_name?.charAt(0).toUpperCase() ?? "?";
                return (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
                      {member.avatar_url ? (
                        <Image
                          src={member.avatar_url}
                          alt={member.display_name}
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-secondary">
                          <span className="text-xs font-bold text-white">
                            {memberInitial}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-on-surface">{member.display_name}</p>
                    {member.id === user.id && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 font-space-grotesk text-[10px] font-bold uppercase tracking-wider text-primary-dim">
                        TY
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Leave Team button */}
            {!project.is_submitted && (
              <button
                onClick={() => setShowLeaveConfirm(true)}
                disabled={isPending}
                className="mt-6 w-full rounded-xl border border-secondary/25 bg-transparent py-3 font-space-grotesk text-sm uppercase tracking-wider text-secondary transition-colors hover:border-secondary/40 hover:bg-secondary/10 disabled:opacity-50"
              >
                Opuść zespół
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center py-8 text-center">
            <svg
              className="h-12 w-12 text-on-surface-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
              />
            </svg>
            <p className="mt-3 font-space-grotesk text-sm font-semibold text-on-surface">
              Brak zespołu
            </p>
            <p className="mt-1 text-xs text-on-surface-muted">
              Stwórz projekt lub dołącz do zespołu
            </p>
          </div>
        )}
      </div>

      {/* API Key Card */}
      <div className="mt-4 rounded-2xl bg-surface-low p-6">
        <p className="mb-4 font-space-grotesk text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-muted">
          Klucz API
        </p>

        {user.openrouter_api_key ? (
          <>
            <div className="flex items-center gap-3">
              <code className="flex-1 overflow-x-auto rounded-lg bg-black px-4 py-3 font-mono text-sm text-primary-dim">
                {user.openrouter_api_key}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(user.openrouter_api_key!);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={`shrink-0 rounded-lg px-3 py-2 font-space-grotesk text-xs font-semibold uppercase tracking-wider transition-colors ${
                  copied
                    ? "bg-green-500/15 text-green-400"
                    : "bg-surface-high text-on-surface-muted hover:bg-surface-bright hover:text-on-surface"
                }`}
              >
                {copied ? "Skopiowano!" : "Kopiuj"}
              </button>
            </div>
            {keyLimit != null && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-space-grotesk text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-muted">
                    Zużycie
                  </span>
                  <span className="font-mono text-xs text-on-surface-muted">
                    ${(keyUsage ?? 0).toFixed(2)} / ${keyLimit}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-high">
                  <div
                    className={`h-full rounded-full transition-all ${
                      (keyUsage ?? 0) / keyLimit > 0.8
                        ? "bg-secondary"
                        : "bg-gradient-to-r from-primary to-primary-dim"
                    }`}
                    style={{
                      width: `${Math.min(
                        ((keyUsage ?? 0) / keyLimit) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <p className="mt-3 text-xs text-on-surface-muted">
              Nie udostępniaj tego klucza nikomu. Poniżej znajdziesz jak go skonfigurować.
            </p>

            {/* Setup instructions */}
            <div className="mt-4 space-y-3">
              <p className="font-space-grotesk text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-muted">
                Jak użyć klucza
              </p>

              <div className="rounded-lg bg-black p-4">
                <p className="mb-2 font-space-grotesk text-xs font-bold text-on-surface">
                  Claude Code
                </p>
                <p className="mb-2 text-xs text-on-surface-muted">
                  Wyloguj się z Claude Code (<code className="text-primary-dim">/logout</code>) jeśli byłeś zalogowany, a następnie ustaw zmienne:
                </p>
                <code className="block whitespace-pre-wrap rounded bg-surface-high/50 px-3 py-2 font-mono text-[11px] leading-relaxed text-primary-dim">
{`export ANTHROPIC_BASE_URL=https://openrouter.ai/api
export ANTHROPIC_AUTH_TOKEN=${user.openrouter_api_key}
export ANTHROPIC_API_KEY=""`}
                </code>
                <p className="mt-2 text-xs text-on-surface-muted">
                  Następnie uruchom <code className="text-primary-dim">claude</code> i sprawdź połączenie przez <code className="text-primary-dim">/status</code>.
                </p>
              </div>

              <div className="rounded-lg bg-black p-4">
                <p className="mb-2 font-space-grotesk text-xs font-bold text-on-surface">
                  Codex (OpenAI)
                </p>
                <p className="mb-2 text-xs text-on-surface-muted">
                  1. Ustaw zmienną środowiskową:
                </p>
                <code className="block whitespace-pre-wrap rounded bg-surface-high/50 px-3 py-2 font-mono text-[11px] leading-relaxed text-primary-dim">
{`export OPENROUTER_API_KEY=${user.openrouter_api_key}`}
                </code>
                <p className="mt-3 mb-2 text-xs text-on-surface-muted">
                  2. Utwórz plik <code className="text-primary-dim">~/.codex/config.toml</code>:
                </p>
                <code className="block whitespace-pre-wrap rounded bg-surface-high/50 px-3 py-2 font-mono text-[11px] leading-relaxed text-primary-dim">
{`model_provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[model_providers.openrouter]
name = "openrouter"
base_url = "https://openrouter.ai/api/v1"
env_key = "OPENROUTER_API_KEY"`}
                </code>
                <p className="mt-2 text-xs text-on-surface-muted">
                  Następnie uruchom <code className="text-primary-dim">codex</code> w terminalu.
                </p>
              </div>

              <p className="text-[10px] text-on-surface-muted/60">
                Dodaj te zmienne do <code className="text-on-surface-muted">~/.zshrc</code> lub <code className="text-on-surface-muted">~/.bashrc</code> żeby nie wpisywać ich za każdym razem.
              </p>
            </div>
          </>
        ) : user.api_key_requested ? (
          <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-500/15">
              <svg className="h-4 w-4 text-yellow-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-yellow-400">
                Prośba wysłana
              </p>
              <p className="text-xs text-on-surface-muted">
                Admin przygotuje Twój klucz API. Wróć tu później.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-on-surface-muted">
              Nie masz subskrypcji AI lub wyczerpałeś tokeny podczas hackathonu?
              Poproś o klucz API — dostaniesz $5 na tokeny OpenRouter.
            </p>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  try {
                    await requestApiKey();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Nie udało się wysłać prośby");
                  }
                });
              }}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary py-3 font-space-grotesk text-sm font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Wysyłanie..." : "Poproś o klucz API"}
            </button>
          </div>
        )}
      </div>

      {/* Leave Team Confirm Dialog */}
      {showLeaveConfirm && (
        <ConfirmDialog
          title="Opuść zespół"
          message="Czy na pewno chcesz opuścić zespół? Możesz dołączyć ponownie, jeśli projekt nie został jeszcze zgłoszony."
          confirmLabel="Opuść"
          onConfirm={handleLeaveProject}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      )}
    </div>
  );
}
