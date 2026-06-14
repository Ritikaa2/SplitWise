import React from "react";
import { money } from "../../lib/utils";

export function BarChart({ data }) {
    const max = Math.max(...data.map((d) => d.amount), 1);
    return (
      <div className="flex h-48 items-end gap-3">
        {data.map((item) => (
          <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
            <div
              title={money(item.amount)}
              className="w-full rounded-t bg-gradient-to-t from-primary to-primary-400 transition hover:opacity-80"
              style={{ height: `${(item.amount / max) * 160}px` }}
            />
            <span className="text-xs text-ink-lighter">{item.month}</span>
          </div>
        ))}
      </div>
    );
}

export function DonutChart({ data }) {
    return (
      <div className="grid gap-3">
        {data.map((item) => (
          <div key={item.name} className="grid grid-cols-[80px_1fr_40px] items-center gap-3 text-sm">
            <span className="text-ink-light">{item.name}</span>
            <div className="h-2 rounded-full bg-surface-tertiary">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${item.value}%` }} />
            </div>
            <span className="text-right text-ink-lighter">{item.value}%</span>
          </div>
        ))}
      </div>
    );
}