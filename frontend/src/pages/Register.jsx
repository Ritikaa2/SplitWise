import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  UsersRound,
  Globe,
  Eye,
  EyeOff,
  FileCheck2,
  Loader2,
  LockKeyhole,
  WalletCards,
  Mail
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../store/auth";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

const onboarding = [
  ["Create groups", "Separate home, travel, team and food spending.", UsersRound],
  ["Review imports", "Approve duplicate, refund and settlement-looking rows.", FileCheck2],
  ["Settle clearly", "Show who pays whom and how every balance was formed.", WalletCards],
];

const personas = [
  ["Aisha", "Receives final settlement and exports a report."],
  ["Rohan", "Sees every balance with an expense trail."],
  ["Priya", "Gets USD rows converted before INR totals."],
  ["Sam", "Is protected by accurate join dates."],
  ["Meera", "Reviews duplicate rows before import."],
];

function emailLooksValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function passwordScore(password) {
  return [
    password.length >= 8,
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
}

export default function Register() {
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [googleMessage, setGoogleMessage] = useState("");

  const score = passwordScore(form.password);
  const validation = useMemo(() => ({
    name: form.name.trim().length >= 2,
    email: emailLooksValid(form.email),
    password: form.password.length >= 8,
    confirm: form.confirm.length > 0 && form.password === form.confirm,
    accepted,
  }), [form, accepted]);
  const isValid = Object.values(validation).every(Boolean);

  const mutation = useMutation({
    mutationFn: () => api.register(form.name.trim(), form.email.trim().toLowerCase(), form.password),
    onSuccess: (data) => {
      setSession(data.access_token, data.user, true);
      navigate("/app");
    },
  });

  const google = useMutation({
    mutationFn: () => api.googleLogin("frontend-google-placeholder"),
    onError: (error) => setGoogleMessage(error.message),
    onSuccess: (data) => {
      setSession(data.access_token, data.user, true);
      navigate("/app");
    },
  });

  function submit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (!isValid) return;
    mutation.mutate();
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[470px_1fr]">
        <Card className="p-6 md:p-7">
          <p className="text-sm font-semibold uppercase text-primary">Create account</p>
          <h1 className="mt-2 text-3xl font-black text-ink">Start with clean balances</h1>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Create your own workspace or use the built-in demo to inspect beautiful groups, imports, settings and reports.
          </p>

          <Button
            type="button"
            variant="secondary"
            className="mt-6 w-full"
            onClick={() => {
              setGoogleMessage("");
              google.mutate();
            }}
            disabled={google.isPending}
          >
            {google.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            Sign up with Google
          </Button>
          {googleMessage && <p className="mt-2 text-sm text-warning">{googleMessage}</p>}

          <form onSubmit={submit} className="mt-5 grid gap-4" noValidate>
            <label className="grid gap-2 text-sm font-semibold text-ink/70">
              Full name
              <span className="relative">
                <UserRound className="absolute left-3 top-3.5 h-4 w-4 text-ink/35" />
                <Input
                  className="pl-9"
                  placeholder="Aisha Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoComplete="name"
                />
              </span>
              {submitted && !validation.name && <span className="text-xs text-danger">Name must be at least 2 characters.</span>}
            </label>

            <label className="grid gap-2 text-sm font-semibold text-ink/70">
              Email
              <span className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-ink/35" />
                <Input
                  className="pl-9"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
              </span>
              {(submitted || form.email) && !validation.email && <span className="text-xs text-danger">Use a valid email address.</span>}
            </label>

            <label className="grid gap-2 text-sm font-semibold text-ink/70">
              Password
              <span className="relative">
                <LockKeyhole className="absolute left-3 top-3.5 h-4 w-4 text-ink/35" />
                <Input
                  className="pl-9 pr-10"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-ink/55 hover:text-ink"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
              <span className="grid grid-cols-4 gap-1">
                {Array.from({ length: 4 }).map((_, index) => (
                  <span key={index} className={`h-1.5 rounded ${index < score ? "bg-primary" : "bg-ink/10"}`} />
                ))}
              </span>
              {(submitted || form.password) && !validation.password && <span className="text-xs text-danger">Password must be at least 8 characters.</span>}
            </label>

            <label className="grid gap-2 text-sm font-semibold text-ink/70">
              Confirm password
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                autoComplete="new-password"
              />
              {(submitted || form.confirm) && !validation.confirm && <span className="text-xs text-danger">Passwords do not match.</span>}
            </label>

            <label className="flex items-start gap-2 rounded-lg border border-ink/10 bg-background/80 p-3 text-sm text-ink/60">
              <input className="mt-1" type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              I understand imports can flag duplicates, refunds, settlement rows, and membership-date conflicts for approval.
            </label>
            {submitted && !validation.accepted && <p className="text-xs text-danger">Please accept the import review policy.</p>}

            {mutation.error && <p className="text-sm text-danger">{mutation.error.message}</p>}
            <Button disabled={mutation.isPending || (submitted && !isValid)} className="w-full">
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-ink/55">
            Have an account? <Link className="font-semibold text-primary" to="/login">Sign in</Link>
          </p>
        </Card>

        <section className="page-hero soft-grid hidden p-8 shadow-lift lg:block">
          <div className="grid h-full content-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-secondary/20 bg-secondary/10 px-3 py-2 text-sm font-bold text-secondary">
                <ShieldCheck className="h-4 w-4" />
                Product controls included
              </div>
              <h2 className="mt-6 max-w-2xl text-4xl font-black leading-tight text-ink">
                Everything reviewers will ask you to explain, already represented.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-ink/60">
                The app includes sample people, groups, import policies, settlement notes and reporting content so every screen has substance.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-3">
                {onboarding.map(([title, copy, Icon]) => (
                  <div key={title} className="rounded-lg border border-ink/10 bg-white/80 p-4">
                    <Icon className="mb-3 h-5 w-5 text-primary" />
                    <p className="font-black text-ink">{title}</p>
                    <p className="mt-2 text-xs leading-5 text-ink/55">{copy}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-ink/10 bg-white/80 p-4">
                <p className="text-sm font-bold uppercase text-ink/45">Demo members</p>
                <div className="mt-3 grid gap-2">
                  {personas.map(([name, copy]) => (
                    <div key={name} className="grid grid-cols-[84px_1fr] gap-3 rounded-lg bg-background/80 p-3 text-sm">
                      <span className="font-black text-ink">{name}</span>
                      <span className="text-ink/60">{copy}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
