import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Receipt, Users, Wallet, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const features = [
  { icon: Users, title: "Shared Groups", desc: "Create groups for home, trips, or projects with their own members and budgets." },
  { icon: Receipt, title: "Expense Tracking", desc: "Track who paid what and split expenses equally or by custom shares." },
  { icon: BarChart3, title: "Smart Reports", desc: "See balances, budgets, and settlement plans at a glance." },
  { icon: Wallet, title: "Easy Settlements", desc: "Know exactly who pays whom to settle up." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-ink-border bg-surface/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-base font-black text-white shadow-glow">S</div>
            <span className="text-lg font-bold text-ink">SplitWise</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
            <Link to="/register"><Button>Get started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-medium text-primary mb-8">
              <Sparkles className="h-4 w-4" />
              Smart expense sharing
            </span>
            <h1 className="text-5xl font-bold tracking-tight text-ink md:text-7xl glow-text">
              Split expenses.{" "}
              <span className="text-primary">No math.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-lighter max-w-xl mx-auto leading-relaxed">
              Track shared expenses, split bills, and settle up with friends. Clean, simple, and transparent.
            </p>
            <div className="mt-10 flex items-center justify-center gap-3">
              <Link to="/register">
                <Button className="h-12 px-8 text-base shadow-glow">
                  Start free <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" className="h-12 px-8 text-base">
                  View demo
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink-muted">Demo: aisha@example.com / password123</p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-ink-border bg-surface-secondary">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-3xl font-bold text-center text-ink mb-4">Everything you need</h2>
          <p className="text-ink-lighter text-center mb-12 max-w-lg mx-auto">Split expenses with friends, family, and teammates without the headaches.</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="p-6 text-center surface-hover">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 mb-4 shadow-glow">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm text-ink-lighter">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-border py-8">
        <div className="mx-auto max-w-6xl px-5 text-center text-sm text-ink-muted">
          <p>SplitWise &mdash; Smart expense sharing for everyone.</p>
        </div>
      </footer>
    </div>
  );
}