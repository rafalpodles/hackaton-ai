"use client";

import { useState, useTransition } from "react";
import { updatePrompts, type UsefulPromptInput } from "@/lib/actions/content";
import type { UsefulPrompt } from "@/lib/types";

interface PromptsEditorProps {
  hackathonId: string;
  initial: UsefulPrompt[];
}

type LocalPrompt = UsefulPromptInput & { uid: string };

export default function PromptsEditor({ hackathonId, initial }: PromptsEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [prompts, setPrompts] = useState<LocalPrompt[]>(() =>
    initial.map((p) => ({
      uid: crypto.randomUUID(),
      number: p.number,
      title: p.title,
      description: p.description,
      prompt: p.prompt,
    }))
  );

  const updatePrompt = (uid: string, patch: Partial<Omit<LocalPrompt, "uid">>) =>
    setPrompts((prev) => prev.map((p) => (p.uid === uid ? { ...p, ...patch } : p)));

  const addPrompt = () => {
    const nextNumber = prompts.length > 0 ? Math.max(...prompts.map((p) => p.number)) + 1 : 1;
    setPrompts((prev) => [
      ...prev,
      { uid: crypto.randomUUID(), number: nextNumber, title: "", description: "", prompt: "" },
    ]);
  };

  const removePrompt = (uid: string) => setPrompts((prev) => prev.filter((p) => p.uid !== uid));

  const movePrompt = (uid: string, dir: -1 | 1) =>
    setPrompts((prev) => {
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
      const payload: UsefulPromptInput[] = prompts.map(({ uid: _uid, ...rest }) => rest);
      const result = await updatePrompts(hackathonId, payload);
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
      {prompts.map((p) => (
        <div key={p.uid} className="rounded-xl border border-outline bg-surface-low/60 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <button onClick={() => movePrompt(p.uid, -1)} type="button" className="text-on-surface-muted hover:text-on-surface">↑</button>
            <button onClick={() => movePrompt(p.uid, 1)} type="button" className="text-on-surface-muted hover:text-on-surface">↓</button>
            <input
              type="number"
              className={`${fieldCls} w-20`}
              value={p.number}
              onChange={(e) => updatePrompt(p.uid, { number: parseInt(e.target.value, 10) || 0 })}
            />
            <input
              className={fieldCls}
              value={p.title}
              onChange={(e) => updatePrompt(p.uid, { title: e.target.value })}
              placeholder="Tytuł"
            />
            <button
              type="button"
              onClick={() => removePrompt(p.uid)}
              className="text-on-surface-muted hover:text-secondary"
            >
              ✕
            </button>
          </div>
          <input
            className={fieldCls}
            value={p.description}
            onChange={(e) => updatePrompt(p.uid, { description: e.target.value })}
            placeholder="Krótki opis"
          />
          <textarea
            className={`${fieldCls} font-mono`}
            rows={6}
            value={p.prompt}
            onChange={(e) => updatePrompt(p.uid, { prompt: e.target.value })}
            placeholder="Treść promptu"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addPrompt}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-outline px-4 py-2 text-sm text-on-surface-muted hover:border-primary-dim hover:text-primary-dim"
      >
        + dodaj prompt
      </button>

      {error && <p className="rounded-lg bg-secondary/10 px-4 py-2 text-sm text-secondary">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-2.5 font-space-grotesk text-sm font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(70,70,204,0.3)] disabled:opacity-50"
      >
        {saved ? "Zapisano!" : isPending ? "Zapisywanie..." : "Zapisz prompty"}
      </button>
    </div>
  );
}
