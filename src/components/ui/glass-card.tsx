interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`bg-surface-high/40 backdrop-blur-[20px] border border-outline rounded-xl p-8 ${className}`}
    >
      {children}
    </div>
  );
}
