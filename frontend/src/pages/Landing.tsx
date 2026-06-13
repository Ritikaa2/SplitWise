import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Layers, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const features = ["Temporal memberships", "Explainable balances", "CSV anomaly review", "INR/USD conversion"];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <div className="text-lg font-bold">SplitWise Pro</div>
        <Link to="/login"><Button variant="secondary">Sign in</Button></Link>
      </header>
      <section className="mx-auto grid min-h-[calc(100vh-92px)] max-w-7xl items-center gap-10 px-5 pb-10 lg:grid-cols-[1fr_520px]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-sm text-cyan-100">
            <Sparkles className="h-4 w-4" /> Premium shared expense operations
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-normal md:text-7xl">SplitWise Pro</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">A production-ready shared expenses platform with audit-grade CSV imports, timeline-aware group memberships, settlement planning, and a dashboard built for real teams.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register"><Button>Start free <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link to="/login"><Button variant="secondary">View dashboard</Button></Link>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative">
          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div><p className="text-sm text-slate-400">Group balance</p><h2 className="text-2xl font-bold">Bali Product Offsite</h2></div>
              <span className="rounded bg-success/15 px-2 py-1 text-sm text-success">Settling</span>
            </div>
            <div className="grid gap-3">
              {["Aarav pays Meera INR 4,200", "Nina receives INR 8,900", "CSV import flagged 3 warnings"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-lg bg-slate-950/50 p-4">
                  <span>{item}</span><CheckCircle2 className="h-5 w-5 text-accent" />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-20 md:grid-cols-4">
        {features.map((feature, index) => (
          <Card key={feature}>
            {index % 2 ? <ShieldCheck className="mb-4 h-6 w-6 text-accent" /> : <Layers className="mb-4 h-6 w-6 text-primary" />}
            <h3 className="font-semibold">{feature}</h3>
            <p className="mt-2 text-sm text-slate-400">Clean architecture, service layer, and observable workflows for internship-grade evaluation.</p>
          </Card>
        ))}
      </section>
    </div>
  );
}

