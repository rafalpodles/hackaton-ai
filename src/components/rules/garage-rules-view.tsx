"use client";

import type { RulesContent, PrizeIconKey } from "@/lib/types";
import { Markdown } from "@/components/ui/markdown";

interface GarageRulesViewProps {
  hackathonDate: string | null;
  content: RulesContent;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const PRIZE_ICONS: Record<PrizeIconKey, React.ReactNode> = {
  energy: (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  idea: (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  ),
  value: (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-3.06a1.5 1.5 0 01-.75-1.3V6.75a1.5 1.5 0 01.75-1.3l5.1-3.06a1.5 1.5 0 011.5 0l5.1 3.06a1.5 1.5 0 01.75 1.3v4.06a1.5 1.5 0 01-.75 1.3l-5.1 3.06a1.5 1.5 0 01-1.5 0z" />
    </svg>
  ),
  trophy: (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .982-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
    </svg>
  ),
  star: (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  ),
  heart: (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  ),
  rocket: (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
    </svg>
  ),
  crown: (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 3.75 6l5.25 6 3-9 3 9 5.25-6 1.5 12H2.25Z" />
    </svg>
  ),
};

export function GarageRulesView({ hackathonDate, content }: GarageRulesViewProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-16 pb-20">
      <section className="space-y-4 pt-4 text-center">
        <h1 className="bg-gradient-to-r from-primary-dim to-secondary bg-clip-text font-space-grotesk text-5xl font-black uppercase tracking-wider text-transparent sm:text-6xl">
          Garage Rules
        </h1>
        <p className="text-xl font-medium text-on-surface">{content.tagline}</p>
        {hackathonDate && (
          <p className="font-space-grotesk text-sm uppercase tracking-widest text-on-surface-muted">
            {formatDate(hackathonDate)} &bull; {content.time_range}
          </p>
        )}
      </section>

      <Section title="Czym jest ten hackathon">
        <Markdown>{content.what_is_md}</Markdown>
      </Section>

      <Section title="Zasady gry">
        <div className="grid gap-4 sm:grid-cols-2">
          {content.rules_cards.map((card) => (
            <RuleCard key={card.number} emoji={card.number} title={card.title}>
              {card.description}
            </RuleCard>
          ))}
        </div>
      </Section>

      <Section title="Zanim przyjdziesz">
        <p className="mb-6 text-on-surface/60">{content.before_intro}</p>

        <div className="space-y-3">
          {content.before_checklist.map((item, i) => (
            <CheckItem key={i} checked>
              <Markdown className="inline">{item}</Markdown>
            </CheckItem>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-secondary/20 bg-secondary/5 p-5">
          <p className="font-space-grotesk text-sm font-bold uppercase tracking-wider text-secondary-dim">
            Tokeny AI
          </p>
          <div className="mt-2">
            <Markdown>{content.tokens_box_md}</Markdown>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-5">
          <p className="font-space-grotesk text-sm font-bold uppercase tracking-wider text-red-400">
            Nie przychodź żeby
          </p>
          <ul className="mt-2 space-y-1 text-on-surface/70">
            {content.dont_come_if.map((item, i) => (
              <li key={i}>&bull; {item}</li>
            ))}
          </ul>
        </div>
      </Section>

      <Section title="Nagrody">
        <p className="mb-6 text-on-surface/60">
          {content.prizes.length} {content.prizes.length === 1 ? "kategoria" : content.prizes.length < 5 ? "kategorie" : "kategorii"}, {content.prizes.length === 1 ? "1 zwycięzca" : `${content.prizes.length} zwycięzców`}.
        </p>
        <div
          className={`grid gap-4 ${
            content.prizes.length === 1
              ? ""
              : content.prizes.length === 2
                ? "sm:grid-cols-2"
                : content.prizes.length === 4
                  ? "sm:grid-cols-2 lg:grid-cols-4"
                  : "sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {content.prizes.map((p, i) => (
            <PrizeCard
              key={i}
              icon={PRIZE_ICONS[p.icon_key] ?? PRIZE_ICONS.trophy}
              title={p.title}
              description={p.description}
            />
          ))}
        </div>
      </Section>

      <Section title="Harmonogram">
        <div className="relative space-y-0">
          {content.schedule.map((item, i) => (
            <TimelineItem
              key={i}
              time={item.time}
              title={item.title}
              location={item.location}
              last={i === content.schedule.length - 1}
            />
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-5">
          <p className="font-space-grotesk text-sm font-bold uppercase tracking-wider text-primary-dim">
            Pizza &amp; luźna atmosfera
          </p>
          <div className="mt-2">
            <Markdown>{content.closing_callout_md}</Markdown>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-6 font-space-grotesk text-2xl font-bold uppercase tracking-wider text-on-surface">
        {title}
      </h2>
      {children}
    </section>
  );
}

function RuleCard({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="group rounded-xl border border-outline bg-surface-low p-5 transition-colors hover:border-primary/30">
      <p className="font-space-grotesk text-xs font-bold tracking-widest text-primary-dim">{emoji}</p>
      <h3 className="mt-2 font-space-grotesk text-base font-bold text-on-surface">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-on-surface-muted">{children}</p>
    </div>
  );
}

function CheckItem({ children, checked }: { children: React.ReactNode; checked?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
          checked ? "border-primary/30 bg-primary/10 text-primary-dim" : "border-outline text-transparent"
        }`}
      >
        {checked && (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
      </span>
      <span className="text-on-surface/80">{children}</span>
    </div>
  );
}

function PrizeCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-outline bg-surface-low p-6 text-center transition-colors hover:border-secondary/30">
      <div className="text-secondary-dim">{icon}</div>
      <h3 className="mt-3 font-space-grotesk text-sm font-bold uppercase tracking-wider text-on-surface">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-on-surface-muted">{description}</p>
    </div>
  );
}

function TimelineItem({ time, title, location, last }: { time: string; title: string; location?: string; last: boolean }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
          <div className="h-2 w-2 rounded-full bg-primary-dim" />
        </div>
        {!last && <div className="w-px flex-1 bg-outline" />}
      </div>
      <div className={`${last ? "pb-0" : "pb-8"}`}>
        <p className="font-space-grotesk text-xs font-bold uppercase tracking-widest text-primary-dim">{time}</p>
        <p className="mt-1 text-on-surface">{title}</p>
        {location && <p className="mt-0.5 text-sm text-on-surface-muted">📍 {location}</p>}
      </div>
    </div>
  );
}
