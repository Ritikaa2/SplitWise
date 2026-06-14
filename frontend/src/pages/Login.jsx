import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../store/auth";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.login(form.email.toLowerCase().trim(), form.password),
    onSuccess: (data) => {
      setSession(data.token, data.user, true);
      navigate("/app");
    },
  });

  function submit(event) {
    event.preventDefault();
    if (!form.email || !form.password) return;
    mutation.mutate();
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue managing your shared expenses"
      heroTitle="Track, split, and settle"
      heroSubtitle="No more awkward math. Just clear balances and smart settlements for every group."
      showDemo
    >
      <div className="auth-card space-y-5">
        <button
          type="button"
          onClick={() => setForm({ email: "aisha@example.com", password: "password123" })}
          className="auth-demo-btn"
        >
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-lg">🚀</div>
          <div>
            <p className="font-semibold text-ink">Quick demo access</p>
            <p className="text-xs text-ink-muted">Tap to fill demo credentials instantly</p>
          </div>
        </button>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label className="auth-label" htmlFor="login-email">Email address</label>
            <div className="auth-input-wrap">
              <Mail className="auth-input-icon" />
              <Input
                id="login-email"
                className="pl-11"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="auth-label" htmlFor="login-password">Password</label>
            <div className="auth-input-wrap">
              <Lock className="auth-input-icon" />
              <Input
                id="login-password"
                className="pl-11 pr-11"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted transition-colors hover:text-ink-light"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link className="text-sm font-medium auth-link" to="/forgot-password">
              Forgot password?
            </Link>
          </div>

          {mutation.error && (
            <div className="auth-alert-error">{mutation.error.message}</div>
          )}

          <Button disabled={mutation.isPending || !form.email || !form.password} className="w-full h-12 text-base" type="submit">
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="auth-divider">
          <span className="auth-divider-line" />
          <span className="auth-divider-text">New here?</span>
          <span className="auth-divider-line" />
        </div>

        <p className="text-center text-sm text-ink-lighter">
          Don't have an account?{" "}
          <Link className="auth-link" to="/register">Create one free</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
