import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowDownLeft, ArrowRight, ArrowUpRight, CalendarClock, CheckCircle2, FileSearch, Receipt, Target, Users, Wallet } from "lucide-react";
import { BarChart, DonutChart } from "../components/charts/SimpleCharts";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { api } from "../lib/api";
import { money } from "../lib/utils";

const importSignals = [
  ["Duplicate-looking rows", "Needs a look", AlertTriangle],
  ["Settlement notes", "Separated from expenses", CheckCircle2],
  ["USD payments", "Converted to INR", CheckCircle2],
  ["Join and leave dates", "Checked before splitting", AlertTriangle],
];

const moments = [
  ["Home Circle", "Monthly bills stay visible before anyone asks twice."],
  ["Goa Weekend", "Trip swipes, fuel and food live in one place."],
  ["Studio Snacks", "Team subscriptions and lunches are tracked without side chats."],
  ["Budget notes", "Category limits make overspending obvious early."],
  ["Settlement memory", "Recorded payments reduce the plan automatically."],
];

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
        ["Open Settlements", data.pending_settlements, Receipt],
      ]
    : [];

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-lg bg-ink p-5 text-white shadow-card lg:grid-cols-[1fr_auto] lg:p-7">
        <div>
          <p className="text-sm font-semibold uppercase text-secondary">Today at a glance</p>
          <h1 className="mt-2 text-3xl font-black md:text-5xl">Shared expenses, translated into plain decisions.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70 md:text-base">
            See what was paid, what is still owed, which budgets are getting warm and which settlements would make everyone square.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Link to="/app/import"><Button>Review import <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link to="/app/groups"><Button variant="secondary">Manage groups</Button></Link>
        </div>
      </section>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stats.map(([label, value, Icon]) => (
            <Card key={label} className="surface-hover">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-ink/55">{label}</p>
                  <p className="mt-2 text-3xl font-black text-ink">
                    {label.includes("Groups") || label.includes("Settlements") ? value : money(value)}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        {data && (
          <Card className="surface-hover">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-ink">Monthly rhythm</h2>
                <p className="text-sm text-ink/55">How shared spending moved across recent months.</p>
              </div>
              <span className="rounded-lg bg-secondary/10 px-3 py-1 text-sm font-semibold text-secondary">INR</span>
            </div>
            <BarChart data={data.monthly_expenses} />
          </Card>
        )}

        <Card className="surface-hover">
          <h2 className="font-bold text-ink">Import guardrails</h2>
          <p className="mt-1 text-sm text-ink/55">Checks that keep awkward mistakes out of the group total.</p>
          <div className="mt-5 grid gap-3">
            {importSignals.map(([label, status, Icon]) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 bg-cream p-3">
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${status.includes("Needs") ? "text-warning" : "text-success"}`} />
                  <span className="text-sm font-semibold text-ink">{label}</span>
                </div>
                <span className="text-xs text-ink/55">{status}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        {data && (
          <Card className="surface-hover">
            <h2 className="mb-5 font-bold text-ink">Where the money went</h2>
            <DonutChart data={data.category_breakdown} />
          </Card>
        )}

        <Card className="surface-hover">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-ink">Recent activity</h2>
              <p className="text-sm text-ink/55">Latest expenses across your groups.</p>
            </div>
            <FileSearch className="h-5 w-5 text-primary" />
          </div>
          <div className="grid gap-3">
            {(data?.recent_activity ?? []).length ? (
              data.recent_activity.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 bg-cream p-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{item.title}</p>
                    <p className="text-sm text-ink/55">{item.group} / {item.category ?? "General"} / {item.date}</p>
                  </div>
                  <span className="shrink-0 font-bold text-ink">{money(item.amount)}</span>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-ink/20 bg-cream p-5 text-sm text-ink/55">
                Create your first expense or import a CSV to start the activity trail.
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="surface-hover">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-ink">Budgets this month</h2>
          </div>
          <div className="grid gap-3">
            {(data?.budgets ?? []).slice(0, 5).map((budget) => (
              <div key={`${budget.group_name}-${budget.category}`} className="rounded-lg border border-ink/10 bg-cream p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-ink">{budget.category} / {budget.group_name}</span>
                  <span className="text-ink/60">{money(budget.spent)} of {money(budget.monthly_limit)}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${budget.progress}%` }} />
                </div>
              </div>
            ))}
            {!(data?.budgets ?? []).length && <p className="text-sm text-ink/55">Budgets will appear after you add category limits to a group.</p>}
          </div>
        </Card>

        <Card className="surface-hover">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-secondary" />
            <h2 className="font-bold text-ink">Recurring commitments</h2>
          </div>
          <div className="grid gap-3">
            {(data?.recurring ?? []).slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-ink/10 bg-cream p-3">
                <div>
                  <p className="font-semibold text-ink">{item.title}</p>
                  <p className="text-sm text-ink/55">{item.group} / {item.category}</p>
                </div>
                <span className="font-bold text-ink">{money(item.amount)}</span>
              </div>
            ))}
            {!(data?.recurring ?? []).length && <p className="text-sm text-ink/55">Mark rent, subscriptions or routine bills as recurring when creating an expense.</p>}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {moments.map(([title, copy]) => (
          <Card key={title} className="surface-hover p-4">
            <h3 className="font-bold text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink/60">{copy}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
