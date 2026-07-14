interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`rounded-[20px] border border-outline bg-surface/60 p-8 backdrop-blur-[14px] ${className}`}
    >
      {children}
    </div>
  );
}
