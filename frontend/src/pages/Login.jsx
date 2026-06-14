import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  Globe,
  Eye,
  EyeOff,
  FileWarning,
  Loader2,
  LockKeyhole,
  Mail
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../store/auth";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

const proofPoints = [
  ["CSV reviewed", "21 anomaly checks", FileWarning],
  ["Groups ready", "Home, Goa, Studio", UsersRound],
  ["Settlement plan", "Who pays whom", WalletCards],
];

const demoRows = [
  ["Aisha receives", "INR 5,000"],
  ["USD cafe row", "Converted"],
  ["Duplicate import", "Flagged"],
  ["June rent", "Timeline checked"],
];

function emailLooksValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitted, setSubmitted] = useState(false);
  const [googleMessage, setGoogleMessage] = useState("");

  const errors = {
    email: form.email && !emailLooksValid(form.email) ? "Enter a valid email address." : "",
    password: form.password && form.password.length < 8 ? "Password must be at least 8 characters." : "",
  };
  const isValid = emailLooksValid(form.email) && form.password.length >= 8;

  const mutation = useMutation({
    mutationFn: () => api.login(form.email.trim().toLowerCase(), form.password),
    onSuccess: (data) => {
      setSession(data.access_token, data.user, remember);
      navigate("/app");
    },
  });

  const google = useMutation({
    mutationFn: () => api.googleLogin("frontend-google-placeholder"),
    onError: (error) => setGoogleMessage(error.message),
    onSuccess: (data) => {
      setSession(data.access_token, data.user, remember);
      navigate("/app");
    },
  });

  function submit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (!isValid) return;
    mutation.mutate();
  }

  function fillDemo() {
    setForm({ email: "aisha@example.com", password: "password123" });
    setSubmitted(false);
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_460px]">
        <section className="page-hero soft-grid hidden overflow-hidden p-8 text-ink shadow-lift lg:block">
          <div className="flex min-h-full flex-col justify-between gap-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-bold text-primary">
                <ShieldCheck className="h-4 w-4" />
                Audit-ready expense splitting
              </div>
              <h1 className="mt-8 max-w-xl text-5xl font-black leading-tight">
                Login to a workspace that already tells the money story.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-ink/65">
                Review built-in demo groups, import decisions, balances, reports and settlement recommendations without setting up data first.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-3">
                {proofPoints.map(([label, value, Icon]) => (
                  <div key={label} className="rounded-lg border border-ink/10 bg-white/80 p-3">
                    <Icon className="mb-3 h-5 w-5 text-primary" />
                    <p className="text-xs font-bold uppercase text-ink/45">{label}</p>
                    <p className="mt-1 text-sm font-black text-ink">{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-ink/10 bg-ink p-4 text-white">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-white/70">Demo money room</p>
                  <Sparkles className="h-4 w-4 text-secondary" />
                </div>
                <div className="grid gap-2">
                  {demoRows.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 text-sm">
                      <span>{label}</span>
                      <span className="font-bold text-secondary">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <Card className="w-full p-6 md:p-7">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase text-primary">Welcome back</p>
            <h2 className="mt-2 text-3xl font-black text-ink">Login to SplitWise Pro</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">Manage groups, imports, balances, reports and settlements from a polished dashboard.</p>
          </div>

          <div className="mb-5 rounded-lg border border-primary/15 bg-primary/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-ink">Instant demo access</p>
                <p className="mt-1 text-xs font-semibold text-ink/55">aisha@example.com / password123</p>
              </div>
              <Button type="button" variant="secondary" onClick={fillDemo}>
                Use demo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              setGoogleMessage("");
              google.mutate();
            }}
            disabled={google.isPending}
          >
            {google.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe  className="h-4 w-4" />}
            Continue with Google
          </Button>
          {googleMessage && <p className="mt-2 text-sm text-warning">{googleMessage}</p>}

          <div className="my-5 flex items-center gap-3 text-xs uppercase text-ink/40">
            <span className="h-px flex-1 bg-ink/10" />
            or use email
            <span className="h-px flex-1 bg-ink/10" />
          </div>

          <form onSubmit={submit} className="grid gap-4" noValidate>
            <label className="grid gap-2 text-sm font-semibold text-ink/70">
              Email address
              <span className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-ink/35" />
                <Input
                  className="pl-9"
                  type="email"
                  placeholder="aisha@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
              </span>
              {(submitted || form.email) && errors.email && <span className="text-xs text-danger">{errors.email}</span>}
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
                  autoComplete="current-password"
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
              {(submitted || form.password) && errors.password && <span className="text-xs text-danger">{errors.password}</span>}
            </label>

            <div className="flex items-center justify-between gap-3 text-sm">
              <label className="flex items-center gap-2 text-ink/60">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Remember me
              </label>
              <Link className="font-semibold text-primary hover:text-primary/80" to="/forgot-password">
                Forgot password?
              </Link>
            </div>

            {mutation.error && <p className="text-sm text-danger">{mutation.error.message}</p>}
            <Button disabled={mutation.isPending || (submitted && !isValid)} className="w-full">
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-ink/55">
            No account? <Link className="font-semibold text-primary" to="/register">Create one</Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
