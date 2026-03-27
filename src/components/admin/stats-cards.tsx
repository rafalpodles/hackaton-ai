interface StatsCardsProps {
  stats: { label: string; value: string | number; change?: string }[];
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-outline bg-surface-low/60 p-5 backdrop-blur-md"
        >
          <p className="font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
            {stat.label}
          </p>
          <p className="mt-2 font-space-grotesk text-2xl font-bold text-on-surface">
            {stat.value}
          </p>
          {stat.change && (
            <p className="mt-1 text-xs text-primary-dim">{stat.change}</p>
          )}
        </div>
      ))}
    </div>
  );
}
