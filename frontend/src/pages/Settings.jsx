import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Database,
  Download,
  Globe2,
  HelpCircle,
  KeyRound,
  Mail,
  Moon,
  Palette,
  ReceiptText,
  Shield,
  Smartphone,
  UserRound,
  WalletCards,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { api } from "../lib/api";
import { useAuth } from "../store/auth";

const preferences = [
  ["Default currency", "INR", Globe2],
  ["Monthly reset day", "1st day", CalendarClock],
  ["App density", "Comfortable", Palette],
  ["Theme mode", "Bright", Moon],
];

const notifications = [
  ["Settlement reminders", "Every Monday at 9:00 AM", Bell, true],
  ["Large expense review", "When a split crosses INR 10,000", ReceiptText, true],
  ["Import anomaly alerts", "Email and in-app inbox", Mail, true],
  ["Mobile approvals", "Push-ready channel prepared", Smartphone, false],
];

const security = [
  ["Password reset", "Enabled through secure reset tokens", CheckCircle2],
  ["Session tokens", "Bearer auth with saved login controls", KeyRound],
  ["CSV guardrails", "Duplicates, refunds and membership dates are flagged", Shield],
];

const dataTools = [
  ["Export account data", "Download groups, expenses, balances and import reports.", Download],
  ["Archive old workspace", "Keep reports while hiding inactive groups from dashboards.", Database],
  ["Settlement statement", "Generate a clean final statement for every member.", WalletCards],
];

const supportLinks = [
  ["Demo workspace", "aisha@example.com / password123"],
  ["Review checklist", "Groups, imports, reports, settings, settlements"],
  ["Support window", "Weekdays 10:00 AM to 6:00 PM IST"],
];

export default function Settings() {
  const storedUser = useAuth((s) => s.user);
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: api.me, initialData: storedUser, retry: false });
  const initials = (user?.name ?? "SP")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="grid gap-6">
      <section className="page-hero soft-grid p-5 md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">Settings</p>
            <h1 className="mt-2 max-w-4xl text-3xl font-black leading-tight text-ink md:text-5xl">
              Control center for your money workspace.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65 md:text-base">
              Manage profile details, app preferences, privacy checks, data tools, notification routes and the inbuilt demo content from one polished place.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:w-[460px]">
            {[
              ["Status", "Ready"],
              ["Currency", "INR"],
              ["Plan", "Pro Demo"],
              ["Region", "India"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-ink/10 bg-white/80 p-3 shadow-sm">
                <p className="text-xs font-bold uppercase text-ink/45">{label}</p>
                <p className="mt-1 font-black text-ink">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card className="surface-hover">
          <div className="flex items-start gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-accent text-2xl font-black text-white shadow-card">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase text-primary">Profile</p>
              <h2 className="mt-1 truncate text-2xl font-black text-ink">{user?.name ?? "SplitWise User"}</h2>
              <p className="mt-1 truncate text-sm text-ink/60">{user?.email ?? "Loading account email"}</p>
              <span className="mt-3 inline-flex rounded-lg bg-success/10 px-3 py-1 text-xs font-bold text-success">Verified workspace owner</span>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <label className="grid gap-2 text-sm font-bold text-ink/70">
              Display name
              <Input value={user?.name ?? "SplitWise User"} readOnly />
            </label>
            <label className="grid gap-2 text-sm font-bold text-ink/70">
              Email address
              <Input value={user?.email ?? "profile@example.com"} readOnly />
            </label>
            <Button variant="secondary" type="button">
              <UserRound className="h-4 w-4" />
              Profile managed by account login
            </Button>
          </div>
        </Card>

        <Card className="surface-hover">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-secondary">Workspace preferences</p>
              <h2 className="mt-1 text-2xl font-black text-ink">Beautiful defaults already configured</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
                These settings keep reports readable, imports predictable and settlements consistent for every group.
              </p>
            </div>
            <Button type="button">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </Button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {preferences.map(([label, value, Icon]) => (
              <div key={label} className="rounded-lg border border-ink/10 bg-background/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-ink">{label}</p>
                    <p className="mt-1 text-sm text-ink/55">{value}</p>
                  </div>
                  <span className="icon-tile">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card className="surface-hover">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase text-primary">Notifications</p>
              <h2 className="mt-1 text-2xl font-black text-ink">Keep the right people in the loop</h2>
            </div>
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div className="grid gap-3">
            {notifications.map(([title, copy, Icon, active]) => (
              <div key={title} className="grid gap-3 rounded-lg border border-ink/10 bg-white/80 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="flex items-start gap-3">
                  <span className="icon-tile">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-bold text-ink">{title}</p>
                    <p className="mt-1 text-sm text-ink/55">{copy}</p>
                  </div>
                </div>
                <span className={`pill ${active ? "text-success" : "text-ink/45"}`}>{active ? "Active" : "Prepared"}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="surface-hover">
          <p className="text-sm font-semibold uppercase text-secondary">Privacy and security</p>
          <h2 className="mt-1 text-2xl font-black text-ink">Protection checklist</h2>
          <div className="mt-5 grid gap-3">
            {security.map(([title, copy, Icon]) => (
              <div key={title} className="rounded-lg border border-ink/10 bg-background/80 p-4">
                <div className="flex gap-3">
                  <span className="icon-tile">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-bold text-ink">{title}</p>
                    <p className="mt-1 text-sm leading-5 text-ink/55">{copy}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {dataTools.map(([title, copy, Icon]) => (
          <Card key={title} className="surface-hover">
            <span className="icon-tile">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-black text-ink">{title}</h3>
            <p className="mt-2 min-h-12 text-sm leading-6 text-ink/60">{copy}</p>
            <Button className="mt-5 w-full" variant="secondary" type="button">
              Open tool
            </Button>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card className="surface-hover">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase text-primary">Subscription</p>
              <h2 className="mt-1 text-2xl font-black text-ink">SplitWise Pro Demo</h2>
              <p className="mt-2 text-sm leading-6 text-ink/60">
                Includes CSV review, budget panels, group ledgers, settlement explainability and polished reports for the complete walkthrough.
              </p>
            </div>
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {["Unlimited demo groups", "Import approvals", "Audit reports"].map((item) => (
              <div key={item} className="rounded-lg bg-success/10 p-3 text-sm font-bold text-success">
                {item}
              </div>
            ))}
          </div>
        </Card>

        <Card className="surface-hover">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-6 w-6 text-secondary" />
            <h2 className="text-2xl font-black text-ink">Help and built-in content</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {supportLinks.map(([title, copy]) => (
              <div key={title} className="rounded-lg border border-ink/10 bg-background/80 p-3">
                <p className="text-sm font-bold text-ink">{title}</p>
                <p className="mt-1 text-sm text-ink/55">{copy}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
