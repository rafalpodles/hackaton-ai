import { ButtonHTMLAttributes } from "react";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  fullWidth?: boolean;
}

export function GradientButton({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: GradientButtonProps) {
  const base =
    "font-space-grotesk font-bold text-sm tracking-wide uppercase transition-all duration-200 rounded-md px-6 py-3 cursor-pointer";
  const width = fullWidth ? "w-full" : "";
  const variants = {
    primary:
      "bg-gradient-to-r from-primary to-secondary text-white hover:shadow-[0_0_20px_rgba(70,70,204,0.4)] disabled:opacity-50 disabled:cursor-not-allowed",
    ghost:
      "bg-transparent border border-outline text-primary-dim hover:border-primary-dim",
  };
  return (
    <button
      className={`${base} ${width} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
