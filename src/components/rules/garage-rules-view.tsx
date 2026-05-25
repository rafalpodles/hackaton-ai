"use client";

import type { RulesContent } from "@/lib/types";
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

const PRIZE_ICONS: Record<RulesContent["prizes"][number]["icon_key"], React.ReactNode> = {
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
        <p className="mb-6 text-on-surface/60">3 kategorie, 3 zwycięzców.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {content.prizes.map((p, i) => (
            <PrizeCard
              key={i}
              icon={PRIZE_ICONS[p.icon_key]}
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
