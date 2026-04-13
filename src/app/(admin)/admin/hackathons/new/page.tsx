"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createHackathon } from "@/lib/actions/hackathons";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function NewHackathonPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [hackathonDate, setHackathonDate] = useState("");

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(val));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    startTransition(async () => {
      try {
        await createHackathon({
          name: name.trim(),
          slug: slug.trim() || generateSlug(name.trim()),
          description: description.trim(),
          hackathon_date: hackathonDate || null,
        });
        // createHackathon redirects to /admin on success
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd tworzenia hackathonu");
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline text-on-surface-muted transition-colors hover:bg-surface-high hover:text-on-surface"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
          Nowy hackathon
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-outline bg-surface-low/60 p-6 backdrop-blur-md">
          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="mb-1.5 block font-space-grotesk text-xs font-bold uppercase tracking-wider text-on-surface-muted">
                Nazwa *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="np. AI Hackathon Spring 2025"
                className="w-full rounded-lg border border-outline bg-surface/60 px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-muted/40 focus:border-primary/40 focus:outline-none"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="mb-1.5 block font-space-grotesk text-xs font-bold uppercase tracking-wider text-on-surface-muted">
                Slug (URL) *
              </label>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-on-surface-muted">/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugManuallyEdited(true);
                  }}
                  required
                  placeholder="ai-hackathon-spring-2025"
                  className="w-full rounded-lg border border-outline bg-surface/60 px-4 py-2.5 font-mono text-sm text-on-surface placeholder:text-on-surface-muted/40 focus:border-primary/40 focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-on-surface-muted">
                Slug generuje się automatycznie z nazwy. Używaj tylko małych liter, cyfr i myślników.
              </p>
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
                placeholder="Krótki opis hackathonu..."
                className="w-full rounded-lg border border-outline bg-surface/60 px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-muted/40 focus:border-primary/40 focus:outline-none resize-none"
              />
            </div>

            {/* Hackathon date */}
            <div>
              <label className="mb-1.5 block font-space-grotesk text-xs font-bold uppercase tracking-wider text-on-surface-muted">
                Data hackathonu
              </label>
              <input
                type="datetime-local"
                value={hackathonDate}
                onChange={(e) => setHackathonDate(e.target.value)}
                className="w-full rounded-lg border border-outline bg-surface/60 px-4 py-2.5 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-secondary/10 px-4 py-2 text-sm text-secondary">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="flex-1 rounded-lg bg-gradient-to-r from-primary to-secondary py-3 font-space-grotesk text-sm font-bold uppercase tracking-wider text-white transition-all hover:shadow-[0_0_20px_rgba(70,70,204,0.3)] disabled:opacity-50"
          >
            {isPending ? "Tworzenie..." : "Utwórz hackathon"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isPending}
            className="rounded-lg border border-outline px-6 py-3 font-space-grotesk text-sm uppercase tracking-wider text-on-surface-muted transition-colors hover:bg-surface-high disabled:opacity-50"
          >
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
}
