"use client";

import { useState, useTransition, useRef } from "react";
import {
  createGuideStep,
  updateGuideStep,
  deleteGuideStep,
  reorderGuideSteps,
  uploadGuideImage,
} from "@/lib/actions/content";
import type { HackathonGuideStep } from "@/lib/types";

const CATEGORY_LABELS = {
  fundamenty: "Fundamenty",
  "ai-tools": "AI Tools",
  weryfikacja: "Weryfikacja",
} as const;

type Category = keyof typeof CATEGORY_LABELS;

interface GuideEditorProps {
  hackathonId: string;
  initial: HackathonGuideStep[];
}

const fieldCls =
  "w-full rounded-lg border border-outline bg-surface/60 px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-muted/40 focus:border-primary/40 focus:outline-none";

export default function GuideEditor({ hackathonId, initial }: GuideEditorProps) {
  const [steps, setSteps] = useState<HackathonGuideStep[]>(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<HackathonGuideStep>>({});
  const [addingNew, setAddingNew] = useState(false);
  const [newDraft, setNewDraft] = useState<{ category: Category; title: string; content_md: string }>({
    category: "fundamenty",
    title: "",
    content_md: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAdd = () => {
    if (!newDraft.title.trim()) {
      setError("Tytuł kroku jest wymagany.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createGuideStep(hackathonId, {
        category: newDraft.category,
        title: newDraft.title,
        content_md: newDraft.content_md,
        order_index: steps.filter((s) => s.category === newDraft.category).length,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      const newStep: HackathonGuideStep = {
        id: result.id!,
        hackathon_id: hackathonId,
        category: newDraft.category,
        order_index: steps.filter((s) => s.category === newDraft.category).length,
        title: newDraft.title,
        content_md: newDraft.content_md,
        created_at: new Date().toISOString(),
      };
      setSteps((prev) => [...prev, newStep]);
      setNewDraft({ category: "fundamenty", title: "", content_md: "" });
      setAddingNew(false);
      flash();
    });
  };

  const handleSaveEdit = (stepId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await updateGuideStep(stepId, hackathonId, editDraft);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, ...editDraft } : s))
      );
      setExpandedId(null);
      setEditDraft({});
      flash();
    });
  };

  const handleDelete = (stepId: string) => {
    if (!confirm("Usunąć ten krok?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteGuideStep(stepId, hackathonId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSteps((prev) => prev.filter((s) => s.id !== stepId));
      flash();
    });
  };

  const handleMove = (stepId: string, dir: -1 | 1) => {
    const step = steps.find((s) => s.id === stepId)!;
    const categorySteps = steps
      .filter((s) => s.category === step.category)
      .sort((a, b) => a.order_index - b.order_index);
    const idx = categorySteps.findIndex((s) => s.id === stepId);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= categorySteps.length) return;

    const updated = [...categorySteps];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    const reordered = updated.map((s, i) => ({ ...s, order_index: i }));

    setSteps((prev) => {
      const others = prev.filter((s) => s.category !== step.category);
      return [...others, ...reordered];
    });

    startTransition(async () => {
      await reorderGuideSteps(
        hackathonId,
        reordered.map((s) => ({ id: s.id, order_index: s.order_index }))
      );
    });
  };

  const handleImageUpload = async (
    file: File,
    onInsert: (url: string) => void
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const result = await uploadGuideImage(hackathonId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      onInsert(result.url!);
    });
  };

  const categoriesInOrder: Category[] = ["fundamenty", "ai-tools", "weryfikacja"];

  return (
    <div className="space-y-8">
      {/* Step list per category */}
      {categoriesInOrder.map((cat) => {
        const catSteps = steps
          .filter((s) => s.category === cat)
          .sort((a, b) => a.order_index - b.order_index);

        return (
          <div key={cat}>
            <h2 className="mb-3 font-space-grotesk text-base font-semibold text-on-surface-muted uppercase tracking-widest">
              {CATEGORY_LABELS[cat]}
            </h2>
            <div className="space-y-2">
              {catSteps.length === 0 && (
                <p className="text-sm text-on-surface-muted">Brak custom kroków w tej kategorii.</p>
              )}
              {catSteps.map((step, idx) => (
                <div
                  key={step.id}
                  className="rounded-xl border border-outline bg-surface-low/60 p-4"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleMove(step.id, -1)}
                        disabled={idx === 0 || isPending}
                        className="rounded px-1 text-on-surface-muted hover:text-on-surface disabled:opacity-20"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(step.id, 1)}
                        disabled={idx === catSteps.length - 1 || isPending}
                        className="rounded px-1 text-on-surface-muted hover:text-on-surface disabled:opacity-20"
                      >
                        ↓
                      </button>
                    </div>
                    <span className="flex-1 font-medium text-on-surface">{step.title}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (expandedId === step.id) {
                          setExpandedId(null);
                          setEditDraft({});
                        } else {
                          setExpandedId(step.id);
                          setEditDraft({
                            category: step.category,
                            title: step.title,
                            content_md: step.content_md,
                          });
                        }
                      }}
                      className="text-sm text-on-surface-muted hover:text-on-surface"
                    >
                      {expandedId === step.id ? "Anuluj" : "Edytuj"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(step.id)}
                      disabled={isPending}
                      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      Usuń
                    </button>
                  </div>

                  {expandedId === step.id && (
                    <div className="mt-4 space-y-3 border-t border-outline pt-4">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-on-surface-muted">
                          Kategoria
                        </label>
                        <select
                          className={fieldCls}
                          value={editDraft.category ?? step.category}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, category: e.target.value as Category }))
                          }
                        >
                          {categoriesInOrder.map((c) => (
                            <option key={c} value={c}>
                              {CATEGORY_LABELS[c]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-on-surface-muted">
                          Tytuł
                        </label>
                        <input
                          type="text"
                          className={fieldCls}
                          value={editDraft.title ?? step.title}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, title: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-on-surface-muted">
                          Treść (Markdown)
                        </label>
                        <textarea
                          className={`${fieldCls} min-h-[200px] font-mono text-xs`}
                          value={editDraft.content_md ?? step.content_md}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, content_md: e.target.value }))
                          }
                        />
                        <div className="mt-1">
                          <input
                            ref={editFileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              handleImageUpload(file, (url) => {
                                setEditDraft((d) => ({
                                  ...d,
                                  content_md: (d.content_md ?? step.content_md) + `\n![](${url})`,
                                }));
                              });
                              e.target.value = "";
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => editFileInputRef.current?.click()}
                            disabled={isPending}
                            className="text-xs text-on-surface-muted hover:text-on-surface disabled:opacity-50"
                          >
                            + Wgraj zdjęcie
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(step.id)}
                        disabled={isPending}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {isPending ? "Zapisywanie..." : "Zapisz krok"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add new step */}
      <div className="rounded-xl border border-dashed border-outline p-4">
        {!addingNew ? (
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="text-sm text-on-surface-muted hover:text-on-surface"
          >
            + Dodaj krok
          </button>
        ) : (
          <div className="space-y-3">
            <h3 className="font-space-grotesk text-sm font-semibold text-on-surface">
              Nowy krok
            </h3>
            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-muted">
                Kategoria
              </label>
              <select
                className={fieldCls}
                value={newDraft.category}
                onChange={(e) =>
                  setNewDraft((d) => ({ ...d, category: e.target.value as Category }))
                }
              >
                {categoriesInOrder.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-muted">
                Tytuł
              </label>
              <input
                type="text"
                className={fieldCls}
                value={newDraft.title}
                onChange={(e) => setNewDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="np. Qt Setup"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-muted">
                Treść (Markdown)
              </label>
              <textarea
                className={`${fieldCls} min-h-[200px] font-mono text-xs`}
                value={newDraft.content_md}
                onChange={(e) => setNewDraft((d) => ({ ...d, content_md: e.target.value }))}
                placeholder="## Nagłówek&#10;&#10;Treść kroku w Markdown..."
              />
              <div className="mt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    handleImageUpload(file, (url) => {
                      setNewDraft((d) => ({
                        ...d,
                        content_md: d.content_md + `\n![](${url})`,
                      }));
                    });
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                  className="text-xs text-on-surface-muted hover:text-on-surface disabled:opacity-50"
                >
                  + Wgraj zdjęcie
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAdd}
                disabled={isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isPending ? "Dodawanie..." : "Dodaj krok"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingNew(false);
                  setNewDraft({ category: "fundamenty", title: "", content_md: "" });
                  setError(null);
                }}
                className="text-sm text-on-surface-muted hover:text-on-surface"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback */}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && <p className="text-sm text-green-400">Zapisano!</p>}
    </div>
  );
}
