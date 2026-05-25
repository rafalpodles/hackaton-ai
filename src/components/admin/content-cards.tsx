import Link from "next/link";

interface ContentCardsProps {
  slug: string;
  faqSectionCount: number;
  ideasCount: number;
  promptsCount: number;
}

interface CardProps {
  href: string;
  emoji: string;
  title: string;
  subtitle: string;
}

function Card({ href, emoji, title, subtitle }: CardProps) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-outline bg-surface-low p-5 transition-colors hover:border-primary/30"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{emoji}</span>
        <div>
          <h3 className="font-space-grotesk text-base font-bold text-on-surface group-hover:text-primary-dim">
            {title}
          </h3>
          <p className="mt-1 text-xs text-on-surface-muted">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

export default function ContentCards({
  slug,
  faqSectionCount,
  ideasCount,
  promptsCount,
}: ContentCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Card
        href={`/h/${slug}/admin/content/rules`}
        emoji="📋"
        title="Garage Rules"
        subtitle="Zasady, harmonogram, nagrody"
      />
      <Card
        href={`/h/${slug}/admin/content/faq`}
        emoji="❓"
        title="FAQ"
        subtitle={`${faqSectionCount} sekcji`}
      />
      <Card
        href={`/h/${slug}/admin/content/ideas`}
        emoji="💡"
        title="Pomysły"
        subtitle={`${ideasCount} pozycji`}
      />
      <Card
        href={`/h/${slug}/admin/content/prompts`}
        emoji="🧠"
        title="Prompty"
        subtitle={`${promptsCount} pozycji`}
      />
    </div>
  );
}
