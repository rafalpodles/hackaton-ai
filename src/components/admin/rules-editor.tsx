"use client";

import { useState, useTransition } from "react";
import { updateRules } from "@/lib/actions/content";
import type { RulesContent, PrizeIconKey } from "@/lib/types";
import { PRIZE_ICON_KEYS } from "@/lib/types";

interface RulesEditorProps {
  hackathonId: string;
  initial: RulesContent;
}

const PRIZE_ICON_LABELS: Record<PrizeIconKey, string> = {
  energy: "⚡ Energia",
  idea: "💡 Pomysł",
  value: "⚙️ Wartość",
  trophy: "🏆 Trofeum",
  star: "⭐ Gwiazda",
  heart: "❤️ Serce",
  rocket: "🚀 Rakieta",
  crown: "👑 Korona",
};

export default function RulesEditor({ hackathonId, initial }: RulesEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [content, setContent] = useState<RulesContent>(initial);

  const update = <K extends keyof RulesContent>(key: K, value: RulesContent[K]) =>
    setContent((c) => ({ ...c, [key]: value }));

  const updateCard = (i: number, patch: Partial<RulesContent["rules_cards"][number]>) =>
    setContent((c) => ({
      ...c,
      rules_cards: c.rules_cards.map((card, idx) => (idx === i ? { ...card, ...patch } : card)),
    }));

  const updatePrize = (i: number, patch: Partial<RulesContent["prizes"][number]>) =>
    setContent((c) => ({
      ...c,
      prizes: c.prizes.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    }));

  const addPrize = () =>
    setContent((c) => ({
      ...c,
      prizes: [...c.prizes, { icon_key: "trophy", title: "", description: "" }],
    }));

  const removePrize = (i: number) =>
    setContent((c) => ({ ...c, prizes: c.prizes.filter((_, idx) => idx !== i) }));

  const movePrize = (i: number, dir: -1 | 1) =>
    setContent((c) => {
      const j = i + dir;
      if (j < 0 || j >= c.prizes.length) return c;
      const next = [...c.prizes];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...c, prizes: next };
    });

  const updateScheduleItem = (i: number, patch: Partial<RulesContent["schedule"][number]>) =>
    setContent((c) => ({
      ...c,
      schedule: c.schedule.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));

  const addScheduleItem = () =>
    setContent((c) => ({
      ...c,
      schedule: [...c.schedule, { time: "", title: "", location: "" }],
    }));

  const removeScheduleItem = (i: number) =>
    setContent((c) => ({ ...c, schedule: c.schedule.filter((_, idx) => idx !== i) }));

  const updateChecklist = (i: number, value: string) =>
    setContent((c) => ({
      ...c,
      before_checklist: c.before_checklist.map((it, idx) => (idx === i ? value : it)),
    }));

  const addChecklist = () =>
    setContent((c) => ({ ...c, before_checklist: [...c.before_checklist, ""] }));

  const removeChecklist = (i: number) =>
    setContent((c) => ({
      ...c,
      before_checklist: c.before_checklist.filter((_, idx) => idx !== i),
    }));

  const updateDontCome = (i: number, value: string) =>
    setContent((c) => ({
      ...c,
      dont_come_if: c.dont_come_if.map((it, idx) => (idx === i ? value : it)),
    }));

  const addDontCome = () =>
    setContent((c) => ({ ...c, dont_come_if: [...c.dont_come_if, ""] }));

  const removeDontCome = (i: number) =>
    setContent((c) => ({
      ...c,
      dont_come_if: c.dont_come_if.filter((_, idx) => idx !== i),
    }));

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateRules(hackathonId, content);
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  };

  const fieldCls =
    "w-full rounded-lg border border-outline bg-surface/60 px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-muted/40 focus:border-primary/40 focus:outline-none";
  const labelCls =
    "mb-1.5 block font-space-grotesk text-xs font-bold uppercase tracking-wider text-on-surface-muted";

  return (
    <div className="space-y-8">
      <Section title="Hero">
        <div>
          <label className={labelCls}>Tagline</label>
          <input className={fieldCls} value={content.tagline} onChange={(e) => update("tagline", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Godziny</label>
          <input className={fieldCls} value={content.time_range} onChange={(e) => update("time_range", e.target.value)} />
        </div>
      </Section>

      <Section title="Czym jest (markdown)">
        <textarea
          className={`${fieldCls} font-mono`}
          rows={6}
          value={content.what_is_md}
          onChange={(e) => update("what_is_md", e.target.value)}
        />
      </Section>

      <Section title="Zasady gry (4 karty)">
        {content.rules_cards.map((card, i) => (
          <div key={i} className="rounded-lg bg-surface-high/40 p-3 space-y-2">
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <input
                className={fieldCls}
                value={card.number}
                onChange={(e) => updateCard(i, { number: e.target.value })}
                placeholder="01"
              />
              <input
                className={fieldCls}
                value={card.title}
                onChange={(e) => updateCard(i, { title: e.target.value })}
                placeholder="Tytuł"
              />
            </div>
            <textarea
              className={fieldCls}
              rows={2}
              value={card.description}
              onChange={(e) => updateCard(i, { description: e.target.value })}
              placeholder="Opis"
            />
          </div>
        ))}
      </Section>

      <Section title="Zanim przyjdziesz">
        <div>
          <label className={labelCls}>Intro</label>
          <input className={fieldCls} value={content.before_intro} onChange={(e) => update("before_intro", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Checklist</label>
          {content.before_checklist.map((item, i) => (
            <div key={i} className="mt-2 flex gap-2">
              <input className={fieldCls} value={item} onChange={(e) => updateChecklist(i, e.target.value)} />
              <button type="button" onClick={() => removeChecklist(i)} className="text-on-surface-muted hover:text-secondary">
                ✕
              </button>
            </div>
          ))}
          <button type="button" onClick={addChecklist} className="mt-2 text-sm text-primary-dim hover:underline">
            + dodaj punkt
          </button>
        </div>
        <div>
          <label className={labelCls}>Box „Tokeny AI" (markdown)</label>
          <textarea className={`${fieldCls} font-mono`} rows={4} value={content.tokens_box_md} onChange={(e) => update("tokens_box_md", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>„Nie przychodź żeby"</label>
          {content.dont_come_if.map((item, i) => (
            <div key={i} className="mt-2 flex gap-2">
              <input className={fieldCls} value={item} onChange={(e) => updateDontCome(i, e.target.value)} />
              <button type="button" onClick={() => removeDontCome(i)} className="text-on-surface-muted hover:text-secondary">
                ✕
              </button>
            </div>
          ))}
          <button type="button" onClick={addDontCome} className="mt-2 text-sm text-primary-dim hover:underline">
            + dodaj punkt
          </button>
        </div>
      </Section>

      <Section title="Nagrody (dowolna liczba)">
        <div>
          <label className={labelCls}>Nagłówek sekcji</label>
          <input
            className={fieldCls}
            value={content.prizes_title ?? ""}
            onChange={(e) => update("prizes_title", e.target.value)}
            placeholder="Nagrody"
          />
        </div>
        <div>
          <label className={labelCls}>Podtytuł</label>
          <input
            className={fieldCls}
            value={content.prizes_subtitle ?? ""}
            onChange={(e) => update("prizes_subtitle", e.target.value)}
            placeholder='Puste = auto: „X kategorii, Y zwycięzców"'
          />
        </div>
        {content.prizes.map((p, i) => (
          <div key={i} className="rounded-lg bg-surface-high/40 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => movePrize(i, -1)} className="text-on-surface-muted hover:text-on-surface" disabled={i === 0}>↑</button>
              <button type="button" onClick={() => movePrize(i, 1)} className="text-on-surface-muted hover:text-on-surface" disabled={i === content.prizes.length - 1}>↓</button>
              <select
                className={`${fieldCls} w-40`}
                value={p.icon_key}
                onChange={(e) => updatePrize(i, { icon_key: e.target.value as PrizeIconKey })}
              >
                {PRIZE_ICON_KEYS.map((k) => (
                  <option key={k} value={k}>{PRIZE_ICON_LABELS[k]}</option>
                ))}
              </select>
              <input className={`${fieldCls} flex-1`} value={p.title} onChange={(e) => updatePrize(i, { title: e.target.value })} placeholder="Tytuł" />
              <button type="button" onClick={() => removePrize(i)} className="text-on-surface-muted hover:text-secondary">✕</button>
            </div>
            <textarea className={fieldCls} rows={2} value={p.description} onChange={(e) => updatePrize(i, { description: e.target.value })} placeholder="Opis" />
          </div>
        ))}
        <button
          type="button"
          onClick={addPrize}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-outline px-4 py-2 text-sm text-on-surface-muted hover:border-primary-dim hover:text-primary-dim"
        >
          + dodaj nagrodę
        </button>
      </Section>

      <Section title="Harmonogram">
        {content.schedule.map((s, i) => (
          <div key={i} className="rounded-lg bg-surface-high/40 p-3 space-y-2">
            <div className="grid grid-cols-[140px_1fr_auto] gap-2">
              <input className={fieldCls} value={s.time} onChange={(e) => updateScheduleItem(i, { time: e.target.value })} placeholder="15:00 – 16:00" />
              <input className={fieldCls} value={s.title} onChange={(e) => updateScheduleItem(i, { title: e.target.value })} placeholder="Tytuł" />
              <button type="button" onClick={() => removeScheduleItem(i)} className="text-on-surface-muted hover:text-secondary">✕</button>
            </div>
            <input className={fieldCls} value={s.location} onChange={(e) => updateScheduleItem(i, { location: e.target.value })} placeholder="Lokalizacja" />
          </div>
        ))}
        <button type="button" onClick={addScheduleItem} className="text-sm text-primary-dim hover:underline">
          + dodaj punkt harmonogramu
        </button>
      </Section>

      <Section title="Callout końcowy (markdown)">
        <textarea
          className={`${fieldCls} font-mono`}
          rows={5}
          value={content.closing_callout_md}
          onChange={(e) => update("closing_callout_md", e.target.value)}
        />
      </Section>

      {error && <p className="rounded-lg bg-secondary/10 px-4 py-2 text-sm text-secondary">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-2.5 font-space-grotesk text-sm font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(70,70,204,0.3)] disabled:opacity-50"
      >
        {saved ? "Zapisano!" : isPending ? "Zapisywanie..." : "Zapisz zmiany"}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-outline bg-surface-low/60 p-5">
      <h3 className="font-space-grotesk text-base font-bold text-on-surface">{title}</h3>
      {children}
    </section>
  );
}
