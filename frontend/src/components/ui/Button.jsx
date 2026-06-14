import React from "react";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export const Button = forwardRef(({ className, variant = "primary", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex h-11 items-center justify-center gap-2.5 rounded-xl px-5 text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
      variant === "primary" && "bg-gradient-to-r from-primary to-primary-600 text-white shadow-glow hover:from-primary-400 hover:to-primary-600 hover:shadow-[0_8px_30px_rgba(16,185,129,0.35)] active:scale-[0.98]",
      variant === "secondary" && "border border-ink-border bg-surface-secondary/80 text-ink-light backdrop-blur-sm hover:bg-surface-tertiary hover:border-ink-muted",
      variant === "ghost" && "text-ink-muted hover:bg-surface-tertiary hover:text-ink",
      variant === "danger" && "bg-danger text-white shadow-sm hover:bg-red-600",
      variant === "dark" && "bg-ink text-surface hover:bg-ink-light",
      className,
    )}
    {...props}
  />
));
Button.displayName = "Button";