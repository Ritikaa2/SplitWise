import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { BarChart, DonutChart } from "../components/charts/SimpleCharts";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { api } from "../lib/api";
import { money } from "../lib/utils";

const fallbackMonthly = [
  { month: "Jan", amount: 18000 },
  { month: "Feb", amount: 24000 },
  { month: "Mar", amount: 31000 },
  { month: "Apr", amount: 28000 },
  { month: "May", amount: 39000 },
  { month: "Jun", amount: 82450 },
];

const fallbackCategories = [
  { name: "Rent", value: 38 },
  { name: "Food", value: 24 },
  { name: "Travel", value: 21 },
  { name: "Utilities", value: 17 },
];

const recentActivity = [
  "June rent split / Home Circle / INR 48,000",
  "Goa fuel advance / Goa Weekend / INR 6,400",
  "Studio snacks / Studio Snacks / INR 2,180",
];

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard,
  });

  const stats = data
    ? [
        { label: "Total Expenses", value: data.total_expenses, icon: Receipt },
        { label: "Amount Spent", value: data.amount_spent, icon: Wallet },
        { label: "Amount Owed", value: data.amount_owed, icon: ArrowDownLeft },
        { label: "To Receive", value: data.amount_to_receive, icon: ArrowUpRight },
        { label: "Active Groups", value: data.active_groups, icon: Users },
        { label: "Open Settlements", value: data.pending_settlements, icon: TrendingUp },
      ]
    : [
        { label: "Total Expenses", value: 42, icon: Receipt },
        { label: "Amount Spent", value: 82450, icon: Wallet },
        { label: "Amount Owed", value: 12500, icon: ArrowDownLeft },
        { label: "To Receive", value: 18200, icon: ArrowUpRight },
        { label: "Active Groups", value: 6, icon: Users },
        { label: "Open Settlements", value: 4, icon: TrendingUp },
      ];

  const monthly = data?.monthly_expenses?.length ? data.monthly_expenses : fallbackMonthly;
  const categories = data?.category_breakdown?.length ? data.category_breakdown : fallbackCategories;
  const recent = data?.recent_activity ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-ink-lighter mt-1">Overview of your shared expenses</p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/import"><Button variant="secondary">Import CSV</Button></Link>
          <Link to="/app/groups"><Button>View groups</Button></Link>
        </div>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="surface-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-lighter">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-ink">
                    {["Total Expenses", "Active Groups", "Open Settlements"].includes(label)
                      ? value
                      : money(value)}
                  </p>
                </div>
                <div className="icon-tile">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Charts Section */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="surface-hover">
          <h2 className="font-semibold text-ink mb-1">Monthly Spending</h2>
          <p className="text-sm text-ink-lighter mb-4">How shared spending moved across months</p>
          <BarChart data={monthly} />
        </Card>

        <Card className="surface-hover">
          <h2 className="font-semibold text-ink mb-1">Where the money went</h2>
          <p className="text-sm text-ink-lighter mb-4">Category breakdown</p>
          <DonutChart data={categories} />
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="surface-hover">
        <h2 className="font-semibold text-ink mb-1">Recent Activity</h2>
        <p className="text-sm text-ink-lighter mb-4">Latest expenses across your groups</p>
        <div className="space-y-2">
          {(recent.length ? recent : recentActivity).map((item, i) => {
            const display = typeof item === "string" ? item : `${item.title} / ${item.group} / ${money(item.amount)}`;
            return (
              <div key={i} className="flex items-center justify-between rounded-lg border border-ink-border bg-surface-secondary p-3 text-sm">
                <span className="text-ink">{display}</span>
                <ArrowRight className="h-4 w-4 text-ink-muted" />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}