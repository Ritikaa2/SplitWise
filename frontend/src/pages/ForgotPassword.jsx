import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, KeyRound, Loader2, Lock, Mail, Shield } from "lucide-react";
import { api } from "../lib/api";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/ui/Button";
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
  const [otp, setOtp] = useState(params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [devOtp, setDevOtp] = useState("");

  const score = passwordScore(password);
  const canReset = otp.length >= 6 && password.length >= 8 && password === confirm;

  const forgot = useMutation({
    mutationFn: () => api.forgotPassword(email.trim().toLowerCase()),
    onSuccess: (data) => {
      if (data.dev_otp) {
        setDevOtp(data.dev_otp);
        setOtp(data.dev_otp);
      }
    },
  });

  const reset = useMutation({
    mutationFn: () => api.resetPassword(otp.trim(), password, email.trim().toLowerCase()),
    onSuccess: () => {
      setTimeout(() => navigate("/login"), 1200);
    },
  });

  const tokenPreview = useMemo(() => (otp ? `${otp.slice(0, 3)}...${otp.slice(-3)}` : ""), [otp]);

  return (
    <AuthLayout
      title="Reset password"
      subtitle="We'll send a secure 6-digit code to your email"
      heroTitle="Recover your account"
      heroSubtitle="Reset your password safely with a one-time verification code sent to your registered email."
    >
      <div className="auth-card space-y-6">
        <div className="space-y-4">
          <div className="auth-step-badge">
            <Shield className="h-3.5 w-3.5" />
            Step 1 · Request code
          </div>

          <div>
            <label className="auth-label" htmlFor="forgot-email">Email address</label>
            <div className="auth-input-wrap">
              <Mail className="auth-input-icon" />
              <Input
                id="forgot-email"
                className="pl-11"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <Button
            disabled={!email || forgot.isPending}
            className="w-full h-11"
            type="button"
            onClick={() => forgot.mutate()}
          >
            {forgot.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {forgot.isPending ? "Sending..." : "Send verification code"}
          </Button>

          {devOtp && (
            <div className="auth-alert-info text-center">
              <p className="text-xs font-semibold uppercase tracking-wide mb-1">Development code</p>
              <p className="text-2xl font-bold tracking-[0.3em]">{devOtp}</p>
              <p className="text-xs opacity-70 mt-1">Auto-filled for local testing</p>
            </div>
          )}

          {forgot.data && !devOtp && (
            <div className="auth-alert-success flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {forgot.data.message || "If the email exists, reset instructions have been sent."}
            </div>
          )}
          {forgot.error && (
            <div className="auth-alert-error">{forgot.error.message}</div>
          )}
        </div>

        <div className="auth-divider">
          <span className="auth-divider-line" />
        </div>

        <div className="space-y-4">
          <div className="auth-step-badge">
            <Lock className="h-3.5 w-3.5" />
            Step 2 · Set new password
          </div>

          <div>
            <label className="auth-label" htmlFor="forgot-otp">Verification code</label>
            <Input
              id="forgot-otp"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              maxLength={6}
              inputMode="numeric"
            />
            {tokenPreview && !devOtp && (
              <p className="mt-1.5 text-xs text-ink-muted">Code: {tokenPreview}</p>
            )}
          </div>

          <div>
            <label className="auth-label" htmlFor="forgot-password">New password</label>
            <div className="auth-input-wrap">
              <Lock className="auth-input-icon" />
              <Input
                id="forgot-password"
                className="pl-11"
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="mt-2.5 flex gap-1.5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className={`auth-strength-bar ${index < score ? "bg-primary shadow-glow" : "bg-ink-border/60"}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="auth-label" htmlFor="forgot-confirm">Confirm password</label>
            <Input
              id="forgot-confirm"
              type="password"
              placeholder="Re-enter password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
            />
            {confirm && password !== confirm && (
              <p className="mt-1.5 text-xs text-danger">Passwords don't match</p>
            )}
          </div>

          {reset.error && (
            <div className="auth-alert-error">{reset.error.message}</div>
          )}
          {reset.isSuccess && (
            <div className="auth-alert-success flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Password updated! Redirecting to login...
            </div>
          )}

          <Button
            disabled={!canReset || reset.isPending}
            className="w-full h-12 text-base"
            type="button"
            onClick={() => reset.mutate()}
          >
            {reset.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {reset.isPending ? "Updating..." : "Update password"}
          </Button>
        </div>

        <p className="text-center pt-1">
          <Link className="text-sm auth-link" to="/login">
            ← Back to login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
