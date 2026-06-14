import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileWarning,
  PieChart,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const features = [
  ["Real groups", "Home bills, trips, projects and food tabs keep separate members, timelines and currencies.", UsersRound],
  ["Explainable balances", "Every number traces back to who paid, who joined, who left and who shared the cost.", ShieldCheck],
  ["Clean imports", "CSV rows are checked for missing fields, duplicates, odd dates and settlement-looking entries.", FileWarning],
  ["Reports and budgets", "Category limits, recurring costs and settlement summaries are ready for review.", Sparkles],
];

const dashboardRows = [
  ["Aisha receives from Rohan", "INR 5,000", "Ready"],
  ["Goa fuel split", "INR 3,240", "Shared"],
  ["Cafe swipe converted from USD", "INR 1,860", "Checked"],
  ["Duplicate import row", "Needs review", "Flagged"],
];

const metrics = [
  ["Tracked this month", "INR 82,450", ReceiptText],
  ["Active groups", "6", UsersRound],
  ["Open settlements", "4", WalletCards],
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary font-black text-[#06111f] shadow-glow">S</div>
          <div>
            <div className="text-lg font-black text-ink">SplitWise Pro</div>
            <p className="hidden text-xs text-ink/55 sm:block">Shared money without awkward math</p>
          </div>
        </Link>
        <div className="flex gap-2">
          <Link to="/login"><Button variant="secondary">Sign in</Button></Link>
          <Link to="/register"><Button>Get started</Button></Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-10">
        <div className="page-hero soft-grid min-h-[calc(100vh-112px)] p-5 md:p-8 lg:p-10">
          <div className="grid min-h-[calc(100vh-192px)] items-center gap-8 lg:grid-cols-[1fr_520px]">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                Demo workspace included
              </div>
              <h1 className="max-w-4xl text-5xl font-black leading-tight text-ink md:text-7xl">SplitWise Pro</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/70">
                A polished shared-expense workspace with built-in groups, import checks, budgets, reports and settlement content ready to explore.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/register"><Button>Start free <ArrowRight className="h-4 w-4" /></Button></Link>
                <Link to="/login"><Button variant="secondary">View dashboard</Button></Link>
              </div>
              <p className="mt-4 text-sm font-semibold text-ink/55">Demo login: aisha@example.com / password123</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }}>
              <div className="rounded-lg border border-ink/10 bg-white/85 p-4 shadow-lift backdrop-blur">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-primary">Live money room</p>
                    <h2 className="text-2xl font-black text-ink">Home Circle</h2>
                  </div>
                  <span className="pill text-success">Balanced</span>
                </div>
                <div className="grid gap-3">
                  {dashboardRows.map(([item, value, status]) => (
                    <div key={item} className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 bg-background/80 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">{item}</p>
                        <p className="text-xs text-ink/50">{status}</p>
                      </div>
                      <span className="shrink-0 text-sm font-black text-ink">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {metrics.map(([label, value, Icon]) => (
                    <div key={label} className="rounded-lg bg-ink p-3 text-white">
                      <Icon className="mb-2 h-4 w-4 text-secondary" />
                      <p className="text-xs text-white/60">{label}</p>
                      <p className="mt-1 font-black">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-10 md:grid-cols-4">
        {features.map(([feature, copy, Icon]) => (
          <Card key={feature} className="surface-hover">
            <Icon className="mb-4 h-6 w-6 text-primary" />
            <h3 className="font-bold text-ink">{feature}</h3>
            <p className="mt-2 text-sm leading-6 text-ink/60">{copy}</p>
          </Card>
        ))}
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-20 lg:grid-cols-[1fr_1fr]">
        <Card className="surface-hover">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-accent" />
            <h2 className="text-xl font-black text-ink">Built-in walkthrough content</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink/60">
            The demo includes home, travel and work groups with sample expenses, INR and USD rows, recurring costs, budgets and settlement examples.
          </p>
        </Card>
        <Card className="surface-hover">
          <div className="flex items-center gap-3">
            <PieChart className="h-6 w-6 text-secondary" />
            <h2 className="text-xl font-black text-ink">Review-ready decisions</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink/60">
            Import anomalies, membership dates, category spend and final balances are shown as clear actions instead of hidden calculations.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm font-bold text-success">
            <CheckCircle2 className="h-4 w-4" />
            Settings, reports and dashboards are prefilled.
          </div>
        </Card>
      </section>
    </div>
  );
}
