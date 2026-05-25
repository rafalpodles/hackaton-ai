"use client";

import { useState, useTransition } from "react";
import { updateFaq, type FaqSectionInput } from "@/lib/actions/content";
import type { FaqSectionWithItems } from "@/lib/types";

interface FaqEditorProps {
  hackathonId: string;
  initial: FaqSectionWithItems[];
}

type LocalSection = FaqSectionInput & { uid: string; itemUids: string[] };

function toLocal(sections: FaqSectionWithItems[]): LocalSection[] {
  return sections.map((s) => ({
    uid: crypto.randomUUID(),
    slug: s.slug,
    title: s.title,
    icon: s.icon,
    items: s.items.map((it) => ({ question: it.question, answer: it.answer })),
    itemUids: s.items.map(() => crypto.randomUUID()),
  }));
}

export default function FaqEditor({ hackathonId, initial }: FaqEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [sections, setSections] = useState<LocalSection[]>(() => toLocal(initial));
  const [openSection, setOpenSection] = useState<string | null>(null);

  const updateSection = (uid: string, patch: Partial<Omit<LocalSection, "uid" | "items" | "itemUids">>) =>
    setSections((prev) => prev.map((s) => (s.uid === uid ? { ...s, ...patch } : s)));

  const addSection = () =>
    setSections((prev) => [
      ...prev,
      { uid: crypto.randomUUID(), slug: "", title: "Nowa sekcja", icon: "key", items: [], itemUids: [] },
    ]);

  const removeSection = (uid: string) =>
    setSections((prev) => prev.filter((s) => s.uid !== uid));

  const moveSection = (uid: string, dir: -1 | 1) =>
    setSections((prev) => {
      const i = prev.findIndex((s) => s.uid === uid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const addItem = (sectionUid: string) =>
    setSections((prev) =>
      prev.map((s) =>
        s.uid === sectionUid
          ? {
              ...s,
              items: [...s.items, { question: "", answer: "" }],
              itemUids: [...s.itemUids, crypto.randomUUID()],
            }
          : s
      )
    );

  const updateItem = (sectionUid: string, i: number, patch: Partial<{ question: string; answer: string }>) =>
    setSections((prev) =>
      prev.map((s) =>
        s.uid === sectionUid
          ? { ...s, items: s.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }
          : s
      )
    );

  const removeItem = (sectionUid: string, i: number) =>
    setSections((prev) =>
      prev.map((s) =>
        s.uid === sectionUid
          ? {
              ...s,
              items: s.items.filter((_, idx) => idx !== i),
              itemUids: s.itemUids.filter((_, idx) => idx !== i),
            }
          : s
      )
    );

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const payload: FaqSectionInput[] = sections.map((s) => ({
        slug: s.slug || s.title.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        title: s.title,
        icon: s.icon,
        items: s.items,
      }));
      const result = await updateFaq(hackathonId, payload);
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
    <div className="space-y-4">
      {sections.map((s) => (
        <div key={s.uid} className="rounded-xl border border-outline bg-surface-low/60">
          <div className="flex items-center gap-2 p-3">
            <button onClick={() => moveSection(s.uid, -1)} className="text-on-surface-muted hover:text-on-surface" type="button">↑</button>
            <button onClick={() => moveSection(s.uid, 1)} className="text-on-surface-muted hover:text-on-surface" type="button">↓</button>
            <input
              className={`${fieldCls} flex-1`}
              value={s.title}
              onChange={(e) => updateSection(s.uid, { title: e.target.value })}
              placeholder="Tytuł sekcji"
            />
            <input
              className={`${fieldCls} w-32`}
              value={s.slug}
              onChange={(e) => updateSection(s.uid, { slug: e.target.value })}
              placeholder="slug"
            />
            <input
              className={`${fieldCls} w-24`}
              value={s.icon}
              onChange={(e) => updateSection(s.uid, { icon: e.target.value })}
              placeholder="icon"
            />
            <button
              type="button"
              onClick={() => setOpenSection(openSection === s.uid ? null : s.uid)}
              className="text-sm text-on-surface-muted hover:text-on-surface"
            >
              {openSection === s.uid ? "▲" : "▼"} {s.items.length} q&a
            </button>
            <button
              type="button"
              onClick={() => removeSection(s.uid)}
              className="text-on-surface-muted hover:text-secondary"
            >
              ✕
            </button>
          </div>

          {openSection === s.uid && (
            <div className="space-y-3 border-t border-outline px-3 pb-3 pt-3">
              {s.items.map((it, i) => (
                <div key={s.itemUids[i]} className="rounded-lg bg-surface-high/40 p-3 space-y-2">
                  <input
                    className={fieldCls}
                    value={it.question}
                    onChange={(e) => updateItem(s.uid, i, { question: e.target.value })}
                    placeholder="Pytanie"
                  />
                  <textarea
                    className={`${fieldCls} font-mono`}
                    rows={4}
                    value={it.answer}
                    onChange={(e) => updateItem(s.uid, i, { answer: e.target.value })}
                    placeholder="Odpowiedź (markdown)"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(s.uid, i)}
                    className="text-xs text-on-surface-muted hover:text-secondary"
                  >
                    usuń pytanie
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addItem(s.uid)}
                className="text-sm text-primary-dim hover:underline"
              >
                + dodaj pytanie
              </button>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addSection}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-outline px-4 py-2 text-sm text-on-surface-muted hover:border-primary-dim hover:text-primary-dim"
      >
        + dodaj sekcję
      </button>

      {error && <p className="rounded-lg bg-secondary/10 px-4 py-2 text-sm text-secondary">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-2.5 font-space-grotesk text-sm font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(70,70,204,0.3)] disabled:opacity-50"
      >
        {saved ? "Zapisano!" : isPending ? "Zapisywanie..." : "Zapisz FAQ"}
      </button>
    </div>
  );
}
