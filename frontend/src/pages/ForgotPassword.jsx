import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, KeyRound, Loader2, Mail } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

function passwordScore(password) {
  return [
    password.length >= 8,
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const score = passwordScore(password);
  const canReset = token.length >= 10 && password.length >= 8 && password === confirm;

  const forgot = useMutation({
    mutationFn: () => api.forgotPassword(email.trim().toLowerCase()),
    onSuccess: (data) => {
      if (data.reset_token) setToken(data.reset_token);
    },
  });

  const reset = useMutation({
    mutationFn: () => api.resetPassword(token.trim(), password),
    onSuccess: () => {
      setTimeout(() => navigate("/login"), 900);
    },
  });

  const tokenPreview = useMemo(() => token ? `${token.slice(0, 20)}...${token.slice(-8)}` : "", [token]);

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <Card className="w-full max-w-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">Account recovery</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Reset your password</h1>
            <p className="mt-2 text-sm text-slate-500">
              Request a reset token, then set a new password. In this local build the token is shown for testing.
            </p>
          </div>
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
        </div>

        <form
          className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-background p-4"
          onSubmit={(event) => {
            event.preventDefault();
            forgot.mutate();
          }}
        >
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Email address
            <span className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                className="pl-9"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </span>
          </label>
          <Button disabled={!email || forgot.isPending}>
            {forgot.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Send reset token
          </Button>
          {forgot.data && (
            <p className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              {forgot.data.message}
            </p>
          )}
          {forgot.error && <p className="text-sm text-danger">{forgot.error.message}</p>}
        </form>

        <form
          className="mt-5 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canReset) reset.mutate();
          }}
        >
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Reset token
            <Input
              placeholder="Paste token from email"
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
          </label>
          {tokenPreview && <p className="text-xs text-slate-500">Active token: {tokenPreview}</p>}

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            New password
            <Input
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <span className="grid grid-cols-4 gap-1">
              {Array.from({ length: 4 }).map((_, index) => (
                <span key={index} className={`h-1.5 rounded ${index < score ? "bg-primary" : "bg-slate-200"}`} />
              ))}
            </span>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Confirm new password
            <Input
              type="password"
              placeholder="Re-enter password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
            {confirm && password !== confirm && <span className="text-xs text-danger">Passwords do not match.</span>}
          </label>

          {reset.error && <p className="text-sm text-danger">{reset.error.message}</p>}
          {reset.isSuccess && <p className="text-sm text-success">Password updated. Taking you back to login.</p>}
          <Button disabled={!canReset || reset.isPending}>
            {reset.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Remembered it? <Link className="font-semibold text-primary" to="/login">Back to login</Link>
        </p>
      </Card>
    </main>
  );
}
