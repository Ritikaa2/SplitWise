import React from "react";
import { cn } from "../../lib/utils";
export function Skeleton({ className = "" }) {
    return <div className={cn("animate-pulse rounded-lg bg-surface-tertiary", className)}/>;
}