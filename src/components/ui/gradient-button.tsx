import { forwardRef, type ButtonHTMLAttributes } from "react";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  fullWidth?: boolean;
}

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  function GradientButton(
    { children, variant = "primary", fullWidth = false, className = "", disabled, ...props },
    ref
  ) {
    const base =
      "font-chakra-petch font-bold text-sm uppercase tracking-[0.08em] transition-all duration-200 rounded-[12px] px-6 py-3 cursor-pointer";
    const width = fullWidth ? "w-full" : "";
    const variants = {
      primary:
        "bg-[linear-gradient(120deg,var(--color-primary),var(--color-violet),var(--color-secondary))] text-white shadow-[0_12px_30px_-12px_rgba(129,90,241,.7)] hover:shadow-[0_16px_40px_-12px_rgba(129,90,241,.9)] disabled:opacity-50 disabled:cursor-not-allowed",
      ghost:
        "gbtn-ghost bg-white/[0.04] border border-white/[0.14] text-on-surface hover:border-white/40",
    };
    return (
      <button
        ref={ref}
        className={`${base} ${width} ${variants[variant]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);
