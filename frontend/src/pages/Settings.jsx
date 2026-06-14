import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarClock, CreditCard, Database, Download, Globe2, HelpCircle, KeyRound, Moon, Palette, ReceiptText, Shield, Smartphone, UserRound, WalletCards } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { api } from "../lib/api";
import { useAuth } from "../store/auth";

export default function Settings() {
  const storedUser = useAuth((s) => s.user);
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: api.me, initialData: storedUser, retry: false });
  const initials = (user?.name ?? "SP")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Settings</h1>
        <p className="text-sm text-ink-lighter mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-surface-tertiary text-xl font-bold text-ink-lighter">
            {initials}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-ink">{user?.name ?? "User"}</h2>
            <p className="text-sm text-ink-lighter">{user?.email ?? "Loading..."}</p>
            <div className="mt-3 flex gap-2">
              <span className="pill text-success bg-success/10">Verified</span>
              <span className="pill">Pro Demo</span>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Display name</label>
            <Input value={user?.name ?? "User"} readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
            <Input value={user?.email ?? "user@example.com"} readOnly />
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card className="p-6">
        <h2 className="font-semibold text-ink mb-4">Preferences</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            ["Default currency", "INR", Globe2],
            ["Monthly reset day", "1st day", CalendarClock],
            ["App density", "Comfortable", Palette],
            ["Theme mode", "Light", Moon],
          ].map(([label, value, Icon]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border border-ink-border bg-surface-secondary p-3">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-ink-lighter" />
                <div>
                  <p className="text-sm font-medium text-ink">{label}</p>
                  <p className="text-xs text-ink-lighter">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-ink">Notifications</h2>
        </div>
        <div className="space-y-3">
          {[
            ["Settlement reminders", "Every Monday at 9:00 AM", true],
            ["Large expense review", "When a split crosses INR 10,000", true],
            ["Import anomaly alerts", "Email and in-app", true],
            ["Mobile approvals", "Push-ready", false],
          ].map(([title, copy, active]) => (
            <div key={title} className="flex items-center justify-between rounded-lg border border-ink-border bg-surface-secondary p-3">
              <div>
                <p className="text-sm font-medium text-ink">{title}</p>
                <p className="text-xs text-ink-lighter">{copy}</p>
              </div>
              <span className={`pill ${active ? "text-success bg-success/10" : "text-ink-lighter"}`}>
                {active ? "Active" : "Prepared"}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Security */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-ink">Security</h2>
        </div>
        <div className="space-y-3">
          {[
            ["Password reset", "Enabled through secure reset tokens", KeyRound],
            ["Session tokens", "Bearer auth with saved login controls", KeyRound],
            ["CSV guardrails", "Duplicates, refunds and membership dates flagged", Shield],
          ].map(([title, copy, Icon]) => (
            <div key={title} className="flex items-center gap-3 rounded-lg border border-ink-border bg-surface-secondary p-3">
              <Icon className="h-5 w-5 text-ink-lighter" />
              <div>
                <p className="text-sm font-medium text-ink">{title}</p>
                <p className="text-xs text-ink-lighter">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Data tools */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Export account data", "Download groups, expenses, balances and reports.", Download],
          ["Archive workspace", "Keep reports while hiding inactive groups.", Database],
          ["Settlement statement", "Generate a clean final statement.", WalletCards],
        ].map(([title, copy, Icon]) => (
          <Card key={title} className="p-6 surface-hover">
            <Icon className="h-5 w-5 text-primary mb-3" />
            <h3 className="font-semibold text-ink">{title}</h3>
            <p className="mt-1 text-sm text-ink-lighter">{copy}</p>
            <Button variant="secondary" className="mt-4 w-full">Open</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}