import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, FileUp, Home, LogOut, Settings, Users, Wallet } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../store/auth";
import { api } from "../../lib/api";

const nav = [
  { to: "/app", label: "Dashboard", icon: Home },
  { to: "/app/groups", label: "Groups", icon: Users },
  { to: "/app/expenses", label: "Expenses", icon: Wallet },
  { to: "/app/import", label: "Import", icon: FileUp },
  { to: "/app/reports", label: "Reports", icon: BarChart3 },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const navigate = useNavigate();
  const logout = useAuth((s) => s.logout);
  const storedUser = useAuth((s) => s.user);
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: api.me, initialData: storedUser, retry: false });
  const initials = (user?.name ?? "SP")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-ink-border bg-surface-secondary flex flex-col">
        <div className="p-5 border-b border-ink-border">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-sm font-black text-white shadow-glow">
              S
            </div>
            <div>
              <p className="text-sm font-bold text-ink">SplitWise</p>
              <p className="text-xs text-ink-lighter">Expense sharing</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-ink-border">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-tertiary text-sm font-bold text-ink-light">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{user?.name ?? "User"}</p>
              <p className="truncate text-xs text-ink-lighter">{user?.email ?? "Loading..."}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/app"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-ink-lighter hover:bg-surface-tertiary hover:text-ink"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-ink-border space-y-2">
          <Button
            variant="secondary"
            className="w-full justify-start"
            onClick={() => navigate("/app/import")}
          >
            <FileUp className="h-4 w-4" />
            Import CSV
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => { logout(); navigate("/login"); }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-6xl mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}