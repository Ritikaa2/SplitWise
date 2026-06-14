import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../store/auth";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/ui/Button";
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
      setSession(data.token, data.user, true);
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
    <AuthLayout
      title="Create account"
      subtitle="Join SplitWise and start tracking shared expenses"
      heroTitle="Start tracking expenses together"
      heroSubtitle="Create your workspace and invite friends, family, or teammates in seconds."
    >
      <div className="auth-card">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label className="auth-label" htmlFor="register-name">Full name</label>
            <div className="auth-input-wrap">
              <User className="auth-input-icon" />
              <Input
                id="register-name"
                className="pl-11"
                placeholder="Aisha Sharma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="name"
              />
            </div>
            {submitted && !validation.name && (
              <p className="mt-1.5 text-xs text-danger">Name must be at least 2 characters.</p>
            )}
          </div>

          <div>
            <label className="auth-label" htmlFor="register-email">Email address</label>
            <div className="auth-input-wrap">
              <Mail className="auth-input-icon" />
              <Input
                id="register-email"
                className="pl-11"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>
            {(submitted || form.email) && !validation.email && (
              <p className="mt-1.5 text-xs text-danger">Use a valid email address.</p>
            )}
          </div>

          <div>
            <label className="auth-label" htmlFor="register-password">Password</label>
            <div className="auth-input-wrap">
              <Lock className="auth-input-icon" />
              <Input
                id="register-password"
                className="pl-11 pr-11"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted transition-colors hover:text-ink-light"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-2.5 flex gap-1.5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className={`auth-strength-bar ${index < score ? "bg-primary shadow-glow" : "bg-ink-border/60"}`}
                />
              ))}
            </div>
            {(submitted || form.password) && !validation.password && (
              <p className="mt-1.5 text-xs text-danger">Password must be at least 8 characters.</p>
            )}
          </div>

          <div>
            <label className="auth-label" htmlFor="register-confirm">Confirm password</label>
            <Input
              id="register-confirm"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              autoComplete="new-password"
            />
            {(submitted || form.confirm) && !validation.confirm && (
              <p className="mt-1.5 text-xs text-danger">Passwords do not match.</p>
            )}
          </div>

          <label className="auth-checkbox-card">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-ink-border bg-surface-secondary text-primary focus:ring-primary/30"
            />
            I accept the terms and privacy policy
          </label>
          {submitted && !validation.accepted && (
            <p className="text-xs text-danger">Please accept the terms.</p>
          )}

          {mutation.error && (
            <div className="auth-alert-error">{mutation.error.message}</div>
          )}

          <Button disabled={mutation.isPending || (submitted && !isValid)} className="w-full h-12 text-base" type="submit">
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mutation.isPending ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <div className="auth-divider mt-6">
          <span className="auth-divider-line" />
          <span className="auth-divider-text">Already joined?</span>
          <span className="auth-divider-line" />
        </div>

        <p className="mt-5 text-center text-sm text-ink-lighter">
          Have an account?{" "}
          <Link className="auth-link" to="/login">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
