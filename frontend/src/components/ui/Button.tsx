import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "primary", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60",
      variant === "primary" && "bg-primary text-white shadow-glow hover:bg-indigo-500",
      variant === "secondary" && "bg-white/10 text-text hover:bg-white/15",
      variant === "ghost" && "text-slate-300 hover:bg-white/10 hover:text-white",
      variant === "danger" && "bg-danger text-white hover:bg-red-500",
      className,
    )}
    {...props}
  />
));
Button.displayName = "Button";

