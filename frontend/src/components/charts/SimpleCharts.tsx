import { money } from "../../lib/utils";

export function BarChart({ data }: { data: { month: string; amount: number }[] }) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div className="flex h-56 items-end gap-3">
      {data.map((item) => (
        <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
          <div title={money(item.amount)} className="w-full rounded-t bg-gradient-to-t from-primary to-accent transition hover:opacity-80" style={{ height: `${(item.amount / max) * 180}px` }} />
          <span className="text-xs text-slate-400">{item.month}</span>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="grid gap-3">
      {data.map((item) => (
        <div key={item.name} className="grid grid-cols-[90px_1fr_40px] items-center gap-3 text-sm">
          <span className="text-slate-300">{item.name}</span>
          <div className="h-2 rounded bg-slate-800">
            <div className="h-2 rounded bg-accent" style={{ width: `${item.value}%` }} />
          </div>
          <span className="text-right text-slate-400">{item.value}%</span>
        </div>
      ))}
    </div>
  );
}

