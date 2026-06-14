import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Chrome, Eye, EyeOff, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../store/auth";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

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
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[460px_1fr]">
        <Card>
          <p className="text-sm font-semibold uppercase text-primary">Create account</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Start tracking clean balances</h1>
          <p className="mt-2 text-sm text-slate-500">
            Built for Aisha, Rohan, Priya, Sam, Meera, and any flat that needs explainable settlements.
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
            {google.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Chrome className="h-4 w-4" />}
            Sign up with Google
          </Button>
          {googleMessage && <p className="mt-2 text-sm text-warning">{googleMessage}</p>}

          <form onSubmit={submit} className="mt-5 grid gap-4" noValidate>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Full name
              <span className="relative">
                <UserRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
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

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Email
              <span className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
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

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Password
              <span className="relative">
                <LockKeyhole className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
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
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-900"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
              <span className="grid grid-cols-4 gap-1">
                {Array.from({ length: 4 }).map((_, index) => (
                  <span key={index} className={`h-1.5 rounded ${index < score ? "bg-primary" : "bg-slate-200"}`} />
                ))}
              </span>
              {(submitted || form.password) && !validation.password && <span className="text-xs text-danger">Password must be at least 8 characters.</span>}
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
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

            <label className="flex items-start gap-2 text-sm text-slate-600">
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

          <p className="mt-5 text-center text-sm text-slate-500">
            Have an account? <Link className="font-semibold text-primary" to="/login">Sign in</Link>
          </p>
        </Card>

        <section className="hidden rounded-lg border border-slate-200 bg-white p-6 shadow-card lg:block">
          <div className="grid h-full content-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase text-secondary">Product controls</p>
              <h2 className="mt-2 text-4xl font-black text-slate-950">Everything reviewers will ask you to explain.</h2>
            </div>
            <div className="grid gap-3">
              {[
                ["Aisha", "One settlement plan: who pays whom, how much."],
                ["Rohan", "Every balance has an expense trail."],
                ["Priya", "USD rows convert before INR balances are calculated."],
                ["Sam", "Join and leave dates filter membership liability."],
                ["Meera", "Duplicates go to an approval queue."],
              ].map(([name, copy]) => (
                <div key={name} className="rounded-lg border border-slate-200 bg-background p-4">
                  <p className="font-semibold text-slate-950">{name}</p>
                  <p className="mt-1 text-sm text-slate-600">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
