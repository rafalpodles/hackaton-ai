"use client";

import { useState, useTransition } from "react";
import { addHackathonCategory, removeHackathonCategory } from "@/lib/actions/hackathons";
import type { HackathonCategory } from "@/lib/types";

interface HackathonCategoriesProps {
  hackathonId: string;
  categories: HackathonCategory[];
}

function generateSlug(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s_]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

export default function HackathonCategories({ hackathonId, categories }: HackathonCategoriesProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);

  const handleLabelChange = (val: string) => {
    setLabel(val);
    if (!slugManual) setSlug(generateSlug(val));
  };

  const handleAdd = () => {
    if (!label.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await addHackathonCategory(
          hackathonId,
          slug.trim() || generateSlug(label.trim()),
          label.trim(),
          categories.length + 1
        );
        setLabel("");
        setSlug("");
        setSlugManual(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd dodawania kategorii");
      }
    });
  };

  const handleRemove = (categoryId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await removeHackathonCategory(categoryId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd usuwania kategorii");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Existing categories */}
      {categories.length > 0 ? (
        <div className="space-y-2">
          {categories
            .sort((a, b) => a.display_order - b.display_order)
            .map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-lg border border-outline bg-surface/60 px-4 py-3"
              >
                <div>
                  <span className="font-space-grotesk text-sm font-semibold text-on-surface">
                    {cat.label}
                  </span>
                  <span className="ml-2 font-mono text-xs text-on-surface-muted">
                    ({cat.slug})
                  </span>
                </div>
                <button
                  disabled={isPending}
                  onClick={() => handleRemove(cat.id)}
                  className="rounded-md px-3 py-1 font-space-grotesk text-xs font-semibold uppercase tracking-wider text-red-400 transition-colors hover:bg-red-500/15 disabled:opacity-50"
                >
                  Usuń
                </button>
              </div>
            ))}
        </div>
      ) : (
        <p className="rounded-lg border border-outline/50 bg-surface-high/30 px-4 py-3 text-sm text-on-surface-muted">
          Brak kategorii. Dodaj pierwszą.
        </p>
      )}

      {/* Add category */}
      <div className="rounded-lg border border-outline/50 bg-surface-high/30 p-4">
        <p className="mb-3 font-space-grotesk text-xs font-bold uppercase tracking-wider text-on-surface-muted">
          Dodaj kategorię
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="Nazwa kategorii"
            className="flex-1 rounded-lg border border-outline bg-surface/60 px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-muted/40 focus:border-primary/40 focus:outline-none"
          />
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugManual(true);
            }}
            placeholder="slug"
            className="w-32 rounded-lg border border-outline bg-surface/60 px-3 py-2 font-mono text-sm text-on-surface placeholder:text-on-surface-muted/40 focus:border-primary/40 focus:outline-none"
          />
          <button
            disabled={isPending || !label.trim()}
            onClick={handleAdd}
            className="rounded-lg bg-primary/15 px-4 py-2 font-space-grotesk text-sm font-semibold text-primary-dim transition-colors hover:bg-primary/25 disabled:opacity-50"
          >
            {isPending ? "..." : "Dodaj"}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-secondary/10 px-4 py-2 text-sm text-secondary">{error}</p>
      )}
    </div>
  );
}
