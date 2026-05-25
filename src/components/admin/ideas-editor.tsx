"use client";

import { useState, useTransition } from "react";
import { updateIdeas, type ProjectIdeaInput } from "@/lib/actions/content";
import type { ProjectIdea } from "@/lib/types";

interface IdeasEditorProps {
  hackathonId: string;
  initial: ProjectIdea[];
}

type LocalIdea = ProjectIdeaInput & { uid: string; tagsInput: string };

export default function IdeasEditor({ hackathonId, initial }: IdeasEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [ideas, setIdeas] = useState<LocalIdea[]>(() =>
    initial.map((i) => ({
      uid: crypto.randomUUID(),
      name: i.name,
      description: i.description,
      tags: i.tags,
      tagsInput: i.tags.join(", "),
    }))
  );

  const updateIdea = (uid: string, patch: Partial<Omit<LocalIdea, "uid">>) =>
    setIdeas((prev) => prev.map((it) => (it.uid === uid ? { ...it, ...patch } : it)));

  const addIdea = () =>
    setIdeas((prev) => [
      ...prev,
      { uid: crypto.randomUUID(), name: "", description: "", tags: [], tagsInput: "" },
    ]);

  const removeIdea = (uid: string) => setIdeas((prev) => prev.filter((it) => it.uid !== uid));

  const moveIdea = (uid: string, dir: -1 | 1) =>
    setIdeas((prev) => {
      const i = prev.findIndex((s) => s.uid === uid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const payload: ProjectIdeaInput[] = ideas.map((it) => ({
        name: it.name,
        description: it.description,
        tags: it.tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      }));
      const result = await updateIdeas(hackathonId, payload);
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  };

  const fieldCls =
    "w-full rounded-lg border border-outline bg-surface/60 px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-muted/40 focus:border-primary/40 focus:outline-none";

  return (
    <div className="space-y-3">
      {ideas.map((it) => (
        <div key={it.uid} className="rounded-xl border border-outline bg-surface-low/60 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <button onClick={() => moveIdea(it.uid, -1)} type="button" className="text-on-surface-muted hover:text-on-surface">↑</button>
            <button onClick={() => moveIdea(it.uid, 1)} type="button" className="text-on-surface-muted hover:text-on-surface">↓</button>
            <input
              className={fieldCls}
              value={it.name}
              onChange={(e) => updateIdea(it.uid, { name: e.target.value })}
              placeholder="Nazwa pomysłu"
            />
            <button
              type="button"
              onClick={() => removeIdea(it.uid)}
              className="text-on-surface-muted hover:text-secondary"
            >
              ✕
            </button>
          </div>
          <textarea
            className={fieldCls}
            rows={2}
            value={it.description}
            onChange={(e) => updateIdea(it.uid, { description: e.target.value })}
            placeholder="Opis"
          />
          <input
            className={fieldCls}
            value={it.tagsInput}
            onChange={(e) => updateIdea(it.uid, { tagsInput: e.target.value })}
            placeholder="tagi (po przecinku)"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addIdea}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-outline px-4 py-2 text-sm text-on-surface-muted hover:border-primary-dim hover:text-primary-dim"
      >
        + dodaj pomysł
      </button>

      {error && <p className="rounded-lg bg-secondary/10 px-4 py-2 text-sm text-secondary">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-2.5 font-space-grotesk text-sm font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(70,70,204,0.3)] disabled:opacity-50"
      >
        {saved ? "Zapisano!" : isPending ? "Zapisywanie..." : "Zapisz pomysły"}
      </button>
    </div>
  );
}
