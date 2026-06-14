import React from "react";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";
export const Input = forwardRef(({ className, ...props }, ref) => (<input ref={ref} className={cn("field text-sm placeholder:text-ink/35", className)} {...props}/>));
Input.displayName = "Input";
