import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export const Button = forwardRef(({ className, variant = "primary", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition duration-200 focus:outline-none focus:ring-4 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60",
      variant === "primary" && "bg-primary text-[#06111f] shadow-glow hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lift",
      variant === "secondary" && "border border-ink/10 bg-white/90 text-ink shadow-sm hover:-translate-y-0.5 hover:border-accent/35 hover:bg-white hover:shadow-card",
      variant === "ghost" && "text-ink/70 hover:bg-ink/5 hover:text-ink",
      variant === "danger" && "bg-danger text-white shadow-sm hover:-translate-y-0.5 hover:bg-danger/90",
      variant === "dark" && "bg-ink text-white shadow-card hover:-translate-y-0.5 hover:bg-ink/90",
      className,
    )}
    {...props}
  />
));
Button.displayName = "Button";
