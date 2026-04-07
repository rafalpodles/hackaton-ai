"use client";

interface GarageRulesViewProps {
  hackathonDate: string | null;
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

export function GarageRulesView({ hackathonDate }: GarageRulesViewProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-16 pb-20">
      {/* ── Hero ── */}
      <section className="space-y-4 pt-4 text-center">
        <h1 className="bg-gradient-to-r from-primary-dim to-secondary bg-clip-text font-space-grotesk text-5xl font-black uppercase tracking-wider text-transparent sm:text-6xl">
          Garage Rules
        </h1>
        <p className="text-xl font-medium text-on-surface">
          Nie buduj ładnego. Buduj użytecznego.
        </p>
        {hackathonDate && (
          <p className="font-space-grotesk text-sm uppercase tracking-widest text-on-surface-muted">
            {formatDate(hackathonDate)} &bull; 15:00&ndash;19:00
          </p>
        )}
      </section>

      {/* ── What is this ── */}
      <Section title="Czym jest ten hackathon">
        <p className="text-lg leading-relaxed text-on-surface/80">
          ~3h warsztat budowania <Strong>realnych rzeczy z AI</Strong>. Nie
          event teoretyczny. Nie prezentacja slajdów. Zero teorii o modelach.
          Tylko praktyka.
        </p>
        <ul className="mt-4 space-y-2">
          <BulletItem>Solo lub grupy 2&ndash;3 osoby</BulletItem>
          <BulletItem>
            Otwarte dla wszystkich &mdash; nie tylko developerzy. QA, PM,
            Backoffice &mdash; każdy mile widziany
          </BulletItem>
          <BulletItem>
            Cel: pokazać, że <Strong>każdy może zbudować coś użytecznego</Strong>{" "}
            z pomocą AI
          </BulletItem>
        </ul>
      </Section>

      {/* ── Rules ── */}
      <Section title="Zasady gry">
        <div className="grid gap-4 sm:grid-cols-2">
          <RuleCard emoji="01" title="Vibecoduj">
            Buduj aplikację bez głębokiego pisania kodu. AI pisze &mdash; Ty
            sterujesz.
          </RuleCard>
          <RuleCard emoji="02" title="Nowy projekt">
            Stwórz coś nowego. Nie kontynuuj starych projektów.
          </RuleCard>
          <RuleCard emoji="03" title="Liczy się pomysł + AI">
            Nie oceniamy jakości kodu. Liczy się pomysł i to, jak
            wykorzystałeś AI.
          </RuleCard>
          <RuleCard emoji="04" title="Automatyzuj irytacje">
            Jeśli coś Cię irytuje w codziennej pracy &mdash; zautomatyzuj to.
            To jest ten moment.
          </RuleCard>
        </div>
      </Section>

      {/* ── Before you come ── */}
      <Section title="Zanim przyjdziesz">
        <p className="mb-6 text-on-surface/60">
          Hackathon to czas na budowanie, nie na konfigurację. Przygotuj się
          wcześniej.
        </p>

        <div className="space-y-3">
          <CheckItem checked>Firmowy laptop (nie prywatny)</CheckItem>
          <CheckItem checked>Sieć firmowa (nie hotspot)</CheckItem>
          <CheckItem checked>
            Zalogowane narzędzie AI &mdash; sprawdź{" "}
            <Strong>przed</Strong> hackatonem
          </CheckItem>
          <CheckItem checked>Możliwość instalowania paczek</CheckItem>
          <CheckItem checked>
            Konto GitHub &mdash; załóż wcześniej jeśli nie masz
          </CheckItem>
          <CheckItem checked>
            Przyjdź z <Strong>pełnym limitem tokenów</Strong> &mdash; nie
            zużywaj ich wcześniej tego dnia
          </CheckItem>
        </div>

        <div className="mt-6 rounded-xl border border-secondary/20 bg-secondary/5 p-5">
          <p className="font-space-grotesk text-sm font-bold uppercase tracking-wider text-secondary-dim">
            Tokeny AI
          </p>
          <p className="mt-2 text-on-surface/80">
            Każdy uczestnik otrzyma <Strong>API key</Strong> jeśli nie ma
            subskrypcji lub skończą mu się limity podczas hackathonu. Limit:{" "}
            <Strong>$5 na tokeny</Strong> per osoba. Klucz znajdziesz w swoim{" "}
            <a
              href="/profile"
              className="text-primary-dim underline underline-offset-2 transition-colors hover:text-primary"
            >
              profilu
            </a>
            .
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-5">
          <p className="font-space-grotesk text-sm font-bold uppercase tracking-wider text-red-400">
            Nie przychodź żeby
          </p>
          <ul className="mt-2 space-y-1 text-on-surface/70">
            <li>&bull; Instalować wszystko od zera</li>
            <li>&bull; Pracować na prywatnym komputerze</li>
            <li>&bull; Łączyć się przez hotspot</li>
          </ul>
        </div>
      </Section>

      {/* ── Prizes ── */}
      <Section title="Nagrody">
        <p className="mb-6 text-on-surface/60">
          3 kategorie, 3 zwycięzców.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <PrizeCard
            icon={
              <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            }
            title="Droga od koncepcji do realizacji"
            description="Jak doszedłeś od pomysłu do działającego projektu"
          />
          <PrizeCard
            icon={
              <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            }
            title="Kreatywność pomysłu"
            description="Oryginalność i nieszablonowe podejście"
          />
          <PrizeCard
            icon={
              <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-3.06a1.5 1.5 0 01-.75-1.3V6.75a1.5 1.5 0 01.75-1.3l5.1-3.06a1.5 1.5 0 011.5 0l5.1 3.06a1.5 1.5 0 01.75 1.3v4.06a1.5 1.5 0 01-.75 1.3l-5.1 3.06a1.5 1.5 0 01-1.5 0z" />
              </svg>
            }
            title="Przydatność / wartość użytkowa"
            description="Coś, co realnie rozwiązuje problem w pracy"
          />
        </div>
      </Section>

      {/* ── Schedule ── */}
      <Section title="Harmonogram">
        <div className="relative space-y-0">
          <TimelineItem
            time="15:00 – 15:15"
            title="Wprowadzenie"
            location="Sky Garden"
            last={false}
          />
          <TimelineItem
            time="15:15 – 18:15"
            title="3h hackowania!"
            location="Wszystkie przestrzenie wspólne — Sky Garden i Ahoy"
            last={false}
          />
          <TimelineItem
            time="18:15 – 18:30"
            title="Zakończenie i rozpoczęcie głosowania"
            location="Sky Garden"
            last
          />
        </div>

        <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-5">
          <p className="font-space-grotesk text-sm font-bold uppercase tracking-wider text-primary-dim">
            Pizza &amp; luźna atmosfera
          </p>
          <p className="mt-2 text-on-surface/80">
            Nie możesz być od początku? Spoko &mdash; prezentacja z
            wprowadzenia będzie <Strong>dostępna online</Strong>, więc
            możesz dołączyć i zacząć hackować, kiedy tylko będziesz
            dostępny.
          </p>
          <p className="mt-2 text-on-surface/80">
            Będzie <Strong>pizza</Strong> 🍕 &mdash; zadbamy o to, żebyście
            nie hackowali na głodniaka. Zależy nam na{" "}
            <Strong>luźnej atmosferze</Strong> &mdash; to ma być frajda, nie
            korpo-event. Przyjdź, baw się, buduj.
          </p>
        </div>
      </Section>
    </div>
  );
}

/* ── Sub-components ── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-6 font-space-grotesk text-2xl font-bold uppercase tracking-wider text-on-surface">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-on-surface">{children}</span>;
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-on-surface/80">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-dim" />
      <span>{children}</span>
    </li>
  );
}

function RuleCard({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group rounded-xl border border-outline bg-surface-low p-5 transition-colors hover:border-primary/30">
      <p className="font-space-grotesk text-xs font-bold tracking-widest text-primary-dim">
        {emoji}
      </p>
      <h3 className="mt-2 font-space-grotesk text-base font-bold text-on-surface">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-on-surface-muted">
        {children}
      </p>
    </div>
  );
}

function CheckItem({
  children,
  checked,
}: {
  children: React.ReactNode;
  checked?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
          checked
            ? "border-primary/30 bg-primary/10 text-primary-dim"
            : "border-outline text-transparent"
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

function PrizeCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-outline bg-surface-low p-6 text-center transition-colors hover:border-secondary/30">
      <div className="text-secondary-dim">{icon}</div>
      <h3 className="mt-3 font-space-grotesk text-sm font-bold uppercase tracking-wider text-on-surface">
        {title}
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-on-surface-muted">
        {description}
      </p>
    </div>
  );
}

function TimelineItem({
  time,
  title,
  location,
  last,
}: {
  time: string;
  title: string;
  location?: string;
  last: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
          <div className="h-2 w-2 rounded-full bg-primary-dim" />
        </div>
        {!last && <div className="w-px flex-1 bg-outline" />}
      </div>
      <div className={`${last ? "pb-0" : "pb-8"}`}>
        <p className="font-space-grotesk text-xs font-bold uppercase tracking-widest text-primary-dim">
          {time}
        </p>
        <p className="mt-1 text-on-surface">{title}</p>
        {location && (
          <p className="mt-0.5 text-sm text-on-surface-muted">📍 {location}</p>
        )}
      </div>
    </div>
  );
}
