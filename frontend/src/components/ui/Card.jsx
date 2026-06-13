import { cn } from "../../lib/utils";
export function Card({ className, ...props }) {
    return <div className={cn("glass rounded-lg p-5 shadow-2xl shadow-black/10", className)} {...props}/>;
}
