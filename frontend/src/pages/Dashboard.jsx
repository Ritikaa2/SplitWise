import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  FileSearch,
  Receipt,
  ShieldCheck,
  Sparkles,
  Target,
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

const importSignals = [
  ["Duplicate-looking rows", "Needs a look", AlertTriangle],
  ["Settlement notes", "Separated from expenses", CheckCircle2],
  ["USD payments", "Converted to INR", CheckCircle2],
  ["Join and leave dates", "Checked before splitting", AlertTriangle],
];

const nextActions = [
  ["Review two import rows", "Duplicate cafe swipe and one settlement note are waiting.", AlertTriangle, "text-warning"],
  ["Close Home Circle", "One payment from Rohan to Aisha clears the biggest balance.", Wallet, "text-primary"],
  ["Watch travel budget", "Goa Weekend travel is at 82 percent of its monthly cap.", Target, "text-secondary"],
];

const moments = [
  ["Home Circle", "Monthly bills stay visible before anyone asks twice."],
  ["Goa Weekend", "Trip swipes, fuel and food live in one place."],
  ["Studio Snacks", "Team subscriptions and lunches are tracked without side chats."],
  ["Budget notes", "Category limits make overspending obvious early."],
  ["Settlement memory", "Recorded payments reduce the plan automatically."],
];

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
    : [
        ["Total Expenses", 42, Receipt],
        ["Amount Spent", 82450, Wallet],
        ["Amount Owed", 12500, ArrowDownLeft],
        ["To Receive", 18200, ArrowUpRight],
        ["Active Groups", 6, Users],
        ["Open Settlements", 4, Receipt],
      ];

  const monthly = data?.monthly_expenses?.length ? data.monthly_expenses : fallbackMonthly;
  const categories = data?.category_breakdown?.length ? data.category_breakdown : fallbackCategories;
  const recent = data?.recent_activity ?? [];
  const budgets = data?.budgets ?? [];
  const recurring = data?.recurring ?? [];

  return (
    <div className="grid gap-6">
      <section className="page-hero soft-grid p-5 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-bold text-primary">
              <Sparkles className="h-4 w-4" />
              Built-in demo content active
            </div>
            <h1 className="mt-4 max-w-5xl text-3xl font-black leading-tight text-ink md:text-5xl">
              Shared expenses, translated into plain decisions.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65 md:text-base">
              See what was paid, what is still owed, which budgets are getting warm and which settlements would make everyone square.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/app/import"><Button>Review import <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/app/groups"><Button variant="secondary">Manage groups</Button></Link>
            </div>
          </div>

          <div className="rounded-lg border border-ink/10 bg-ink p-4 text-white shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Today&apos;s clean-up plan</p>
                <h2 className="mt-1 text-2xl font-black">4 payments to close</h2>
              </div>
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
            <div className="mt-4 grid gap-2">
              {["Rohan pays Aisha INR 5,000", "Priya confirms USD conversion", "Sam excluded from old rent", "Meera reviews duplicate cafe row"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg bg-white/10 p-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-secondary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
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
                <div className="icon-tile">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <Card className="surface-hover">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-ink">Monthly rhythm</h2>
              <p className="text-sm text-ink/55">How shared spending moved across recent months.</p>
            </div>
            <span className="pill text-secondary">INR</span>
          </div>
          <BarChart data={monthly} />
        </Card>

        <Card className="surface-hover">
          <h2 className="text-lg font-black text-ink">Next best actions</h2>
          <p className="mt-1 text-sm text-ink/55">Built-in guidance that makes the dashboard feel alive.</p>
          <div className="mt-5 grid gap-3">
            {nextActions.map(([label, copy, Icon, color]) => (
              <div key={label} className="rounded-lg border border-ink/10 bg-background/80 p-3">
                <div className="flex gap-3">
                  <Icon className={`mt-0.5 h-4 w-4 ${color}`} />
                  <div>
                    <p className="text-sm font-black text-ink">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-ink/55">{copy}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Card className="surface-hover">
          <h2 className="mb-5 text-lg font-black text-ink">Where the money went</h2>
          <DonutChart data={categories} />
        </Card>

        <Card className="surface-hover">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-ink">Recent activity</h2>
              <p className="text-sm text-ink/55">Latest expenses across your groups.</p>
            </div>
            <FileSearch className="h-5 w-5 text-primary" />
          </div>
          <div className="grid gap-3">
            {recent.length ? (
              recent.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 bg-background/80 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{item.title}</p>
                    <p className="text-sm text-ink/55">{item.group} / {item.category ?? "General"} / {item.date}</p>
                  </div>
                  <span className="shrink-0 font-bold text-ink">{money(item.amount)}</span>
                </div>
              ))
            ) : (
              ["June rent split / Home Circle / INR 48,000", "Goa fuel advance / Goa Weekend / INR 6,400", "Studio snacks / Studio Snacks / INR 2,180"].map((item) => (
                <div key={item} className="rounded-lg border border-dashed border-ink/15 bg-background/80 p-3 text-sm font-semibold text-ink/60">
                  {item}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="surface-hover xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-black text-ink">Budgets this month</h2>
          </div>
          <div className="grid gap-3">
            {(budgets.length ? budgets.slice(0, 5) : [
              { group_name: "Home Circle", category: "Utilities", spent: 9200, monthly_limit: 12000, progress: 77 },
              { group_name: "Goa Weekend", category: "Travel", spent: 20500, monthly_limit: 25000, progress: 82 },
              { group_name: "Studio Snacks", category: "Food", spent: 7800, monthly_limit: 15000, progress: 52 },
            ]).map((budget) => (
              <div key={`${budget.group_name}-${budget.category}`} className="rounded-lg border border-ink/10 bg-background/80 p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-ink">{budget.category} / {budget.group_name}</span>
                  <span className="text-ink/60">{money(budget.spent)} of {money(budget.monthly_limit)}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(Number(budget.progress ?? 0), 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="surface-hover">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-secondary" />
            <h2 className="text-lg font-black text-ink">Recurring commitments</h2>
          </div>
          <div className="grid gap-3">
            {(recurring.length ? recurring.slice(0, 5) : [
              { id: "rent", title: "Monthly rent", group: "Home Circle", category: "Rent", amount: 48000 },
              { id: "wifi", title: "Broadband", group: "Home Circle", category: "Utilities", amount: 1499 },
              { id: "tools", title: "Design tools", group: "Studio Snacks", category: "Software", amount: 3200 },
            ]).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 bg-background/80 p-3">
                <div>
                  <p className="font-semibold text-ink">{item.title}</p>
                  <p className="text-sm text-ink/55">{item.group} / {item.category}</p>
                </div>
                <span className="font-bold text-ink">{money(item.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[390px_1fr]">
        <Card className="surface-hover">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-success" />
            <h2 className="text-lg font-black text-ink">Import guardrails</h2>
          </div>
          <p className="mt-1 text-sm text-ink/55">Checks that keep awkward mistakes out of the group total.</p>
          <div className="mt-5 grid gap-3">
            {importSignals.map(([label, status, Icon]) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 bg-background/80 p-3">
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${status.includes("Needs") ? "text-warning" : "text-success"}`} />
                  <span className="text-sm font-semibold text-ink">{label}</span>
                </div>
                <span className="text-xs text-ink/55">{status}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {moments.map(([title, copy]) => (
            <Card key={title} className="surface-hover p-4">
              <h3 className="font-bold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink/60">{copy}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
