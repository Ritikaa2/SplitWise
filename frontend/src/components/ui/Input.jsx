import React from "react";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";
export const Input = forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn("field", className)}
    {...props}
  />
));
Input.displayName = "Input";