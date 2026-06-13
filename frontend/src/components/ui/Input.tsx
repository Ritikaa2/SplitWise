import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn("h-11 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-sm text-text outline-none transition placeholder:text-slate-500 focus:border-accent focus:ring-2 focus:ring-accent/25", className)}
    {...props}
  />
));
Input.displayName = "Input";

