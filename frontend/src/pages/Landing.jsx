import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, FileWarning, ShieldCheck, Sparkles, UsersRound, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const features = [
  ["Groups that feel real", "Home bills, trips, projects and one-off plans all keep their own people and rules.", UsersRound],
  ["Balances you can explain", "Every number links back to who paid, who joined, who left and who shared the cost.", ShieldCheck],
  ["Clean imports", "CSV rows are checked for missing fields, duplicates, odd dates and settlement-looking entries.", FileWarning],
  ["Budgets and reminders", "Categories, recurring costs and settlement suggestions help the group close the loop.", Sparkles],
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary font-black text-white">S</div>
          <div>
            <div className="text-lg font-black text-ink">SplitWise Pro</div>
            <p className="hidden text-xs text-ink/55 sm:block">Shared money without the awkward math</p>
          </div>
        </Link>
        <div className="flex gap-2">
          <Link to="/login"><Button variant="secondary">Sign in</Button></Link>
          <Link to="/register"><Button>Get started</Button></Link>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-92px)] max-w-7xl items-center gap-10 px-5 pb-10 lg:grid-cols-[1fr_540px]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" />
            Demo workspace included
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-tight text-ink md:text-7xl">SplitWise Pro</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/68">
            Track shared expenses with the tone people actually need: clear, calm and specific about who paid, who owes and what has already been settled.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register"><Button>Start free <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link to="/login"><Button variant="secondary">View dashboard</Button></Link>
          </div>
          <p className="mt-4 text-sm text-ink/55">Demo login: aisha@example.com / password123</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative">
          <div className="rounded-lg border border-ink/10 bg-ink p-4 text-white shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-white/65">Tonight's money check-in</p>
                <h2 className="text-2xl font-black">Home Circle</h2>
              </div>
              <span className="rounded-lg bg-success/15 px-2 py-1 text-sm font-semibold text-success">Ready</span>
            </div>
            <div className="grid gap-3">
              {["Rohan pays Aisha INR 5,000", "June rent split between active members", "Cafe card swipe converted from USD", "Two import rows need a human look"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-lg bg-white/10 p-4">
                  <span>{item}</span>
                  <CheckCircle2 className="h-5 w-5 text-secondary" />
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {["Budgets", "Recurring", "CSV"].map((item) => (
                <div key={item} className="rounded-lg bg-white/8 p-3">
                  <WalletCards className="mb-2 h-4 w-4 text-secondary" />
                  <p className="text-sm font-semibold">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-20 md:grid-cols-4">
        {features.map(([feature, copy, Icon]) => (
          <Card key={feature}>
            <Icon className="mb-4 h-6 w-6 text-primary" />
            <h3 className="font-bold text-ink">{feature}</h3>
            <p className="mt-2 text-sm leading-6 text-ink/60">{copy}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
