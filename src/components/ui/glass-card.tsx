interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`rounded-[20px] border border-white/10 bg-[rgba(14,14,21,.6)] p-8 backdrop-blur-[14px] ${className}`}
    >
      {children}
    </div>
  );
}
