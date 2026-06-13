import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Receipt, Users, Wallet } from "lucide-react";
import { BarChart, DonutChart } from "../components/charts/SimpleCharts";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { api } from "../lib/api";
import { money } from "../lib/utils";

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard,
  });

  const stats = data
    ? [
        ["Total Expenses", data.total_expenses, Receipt],
        ["Amount Spent", data.amount_spent, Wallet],
        ["Amount Owed", data.amount_owed, ArrowDownLeft],
        ["To Receive", data.amount_to_receive, ArrowUpRight],
        ["Active Groups", data.active_groups, Users],
        ["Pending Settlements", data.pending_settlements, Receipt],
      ]
    : [];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-slate-400">
          Your current spend, balances, and settlement pressure.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map(([label, value, Icon]) => (
            <Card
              key={label}
              className="transition hover:-translate-y-1 hover:border-accent/50"
            >
              <Icon className="mb-4 h-5 w-5 text-accent" />
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-1 text-2xl font-bold">
                {label.includes("Groups") || label.includes("Pending")
                  ? value
                  : money(value)}
              </p>
            </Card>
          ))}
        </div>
      )}

      {data && (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card>
            <h2 className="mb-5 font-semibold">Monthly Expenses</h2>
            <BarChart data={data.monthly_expenses} />
          </Card>
          <Card>
            <h2 className="mb-5 font-semibold">Category Breakdown</h2>
            <DonutChart data={data.category_breakdown} />
          </Card>
        </div>
      )}

      <Card>
        <h2 className="mb-4 font-semibold">Recent Activity</h2>
        <div className="grid gap-3">
          {(data?.recent_activity ?? []).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg bg-slate-950/40 p-3"
            >
              <div>
                <p>{item.title}</p>
                <p className="text-sm text-slate-500">
                  {item.group} / {item.date}
                </p>
              </div>
              <span className="font-semibold">{money(item.amount)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
