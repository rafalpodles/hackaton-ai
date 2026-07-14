"use client";

import { useState, useTransition } from "react";
import { updateHackathon } from "@/lib/actions/hackathons";
import { HACKATHON_THEMES, type Hackathon, type HackathonTheme } from "@/lib/types";

type HackathonStatus = "upcoming" | "active" | "voting" | "finished";

const STATUS_OPTIONS: { value: HackathonStatus; label: string }[] = [
  { value: "upcoming", label: "Nadchodzący" },
  { value: "active", label: "Aktywny" },
  { value: "voting", label: "Głosowanie" },
  { value: "finished", label: "Zakończony" },
];

export default function HackathonSettingsForm({ hackathon }: { hackathon: Hackathon }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState(hackathon.name);
  const [description, setDescription] = useState(hackathon.description ?? "");
  const [status, setStatus] = useState<HackathonStatus>(hackathon.status);
  const [theme, setTheme] = useState<HackathonTheme>(hackathon.theme ?? "garage");
  const [supportChannel, setSupportChannel] = useState(hackathon.support_channel ?? "");
  const [apiKeyLimit, setApiKeyLimit] = useState<number>(hackathon.api_key_default_limit_usd ?? 5);

  const handleSave = () => {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        await updateHackathon(hackathon.id, {
          name,
          description,
          status,
          theme,
          support_channel: supportChannel.trim() || null,
          api_key_default_limit_usd: apiKeyLimit,
        });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd zapisu");
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="mb-1.5 block font-space-grotesk text-xs font-bold uppercase tracking-wider text-on-surface-muted">
          Nazwa
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-outline bg-surface/60 px-4 py-2.5 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
        />
      </div>

      {/* Slug (read-only) */}
      <div>
        <label className="mb-1.5 block font-space-grotesk text-xs font-bold uppercase tracking-wider text-on-surface-muted">
          Slug
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-outline/50 bg-surface-high/40 px-4 py-2.5">
          <span className="text-sm text-on-surface-muted">/</span>
          <span className="font-mono text-sm text-on-surface-muted">{hackathon.slug}</span>
        </div>
        <p className="mt-1 text-[11px] text-on-surface-muted">Slug nie może być zmieniony po utworzeniu.</p>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block font-space-grotesk text-xs font-bold uppercase tracking-wider text-on-surface-muted">
          Opis
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full resize-none rounded-lg border border-outline bg-surface/60 px-4 py-2.5 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
        />
      </div>

      {/* Support channel */}
      <div>
        <label className="mb-1.5 block font-space-grotesk text-xs font-bold uppercase tracking-wider text-on-surface-muted">
          Kanał wsparcia (markdown)
        </label>
        <textarea
          value={supportChannel}
          onChange={(e) => setSupportChannel(e.target.value)}
          rows={2}
          placeholder='np. Napisz na kanale Teams **"AI Enablement Hackathon"**'
          className="w-full resize-none rounded-lg border border-outline bg-surface/60 px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-muted/40 focus:border-primary/40 focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-on-surface-muted">
          Pokazane w stopce FAQ i Poradnika. Pozostaw puste, żeby ukryć.
        </p>
      </div>

      {/* API key default limit */}
      <div>
        <label className="mb-1.5 block font-space-grotesk text-xs font-bold uppercase tracking-wider text-on-surface-muted">
          Domyślny limit klucza API (USD)
        </label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={apiKeyLimit}
          onChange={(e) => setApiKeyLimit(parseFloat(e.target.value) || 0)}
          className="w-32 rounded-lg border border-outline bg-surface/60 px-4 py-2.5 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-on-surface-muted">
          Domyślna kwota przy generowaniu klucza OpenRouter dla uczestników. Widoczna też w profilu jako &quot;dostaniesz ${apiKeyLimit}&quot;.
        </p>
      </div>

      {/* Status */}
      <div>
        <label className="mb-1.5 block font-space-grotesk text-xs font-bold uppercase tracking-wider text-on-surface-muted">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={`rounded-lg px-4 py-2 font-space-grotesk text-sm font-semibold transition-colors ${
                status === opt.value
                  ? "bg-primary text-white"
                  : "bg-surface-high text-on-surface-muted hover:bg-surface-bright"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block font-space-grotesk text-xs font-bold uppercase tracking-wider text-on-surface-muted">
          Motyw wizualny
        </label>
        <div className="flex flex-wrap gap-2">
          {HACKATHON_THEMES.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={`rounded-lg px-4 py-2 font-space-grotesk text-sm font-semibold transition-colors ${
                theme === opt.value
                  ? "bg-primary text-white"
                  : "bg-surface-high text-on-surface-muted hover:bg-surface-bright"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-on-surface-muted">
          {HACKATHON_THEMES.find((t) => t.value === theme)?.description}
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-secondary/10 px-4 py-2 text-sm text-secondary">{error}</p>
      )}
      {success && (
        <p className="rounded-lg bg-green-500/10 px-4 py-2 text-sm text-green-400">Zapisano pomyslnie</p>
      )}

      <button
        onClick={handleSave}
        disabled={isPending}
        className="rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-2.5 font-space-grotesk text-sm font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(70,70,204,0.3)] disabled:opacity-50"
      >
        {isPending ? "Zapisywanie..." : "Zapisz zmiany"}
      </button>
    </div>
  );
}
