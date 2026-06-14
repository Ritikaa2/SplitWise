import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, FileUp, Home, LogOut, Settings, Sparkles, Users, WalletCards } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../store/auth";
import { api } from "../../lib/api";

const nav = [
  { to: "/app", label: "Dashboard", icon: Home },
  { to: "/app/groups", label: "Groups", icon: Users },
  { to: "/app/expenses", label: "Expenses", icon: WalletCards },
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
    <div className="min-h-screen md:grid md:grid-cols-[292px_1fr]">
      <aside className="sticky top-0 z-20 border-b border-ink/10 bg-cream/92 p-3 shadow-card backdrop-blur md:h-screen md:border-b-0 md:border-r md:p-5">
        <div className="flex h-full items-center justify-between gap-3 md:flex-col md:items-stretch">
          <div className="min-w-0">
            <div className="hidden md:block">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-lg font-black text-white shadow-glow">S</div>
                <div>
                  <p className="text-lg font-black text-ink">SplitWise Pro</p>
                  <p className="text-xs text-ink/55">Shared money, calmer endings</p>
                </div>
              </div>
              <div className="mt-6 rounded-lg border border-ink/10 bg-white p-3">
                <p className="text-xs font-semibold uppercase text-ink/50">Signed in as</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-sm font-bold text-white">{initials}</div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{user?.name ?? "User"}</p>
                    <p className="truncate text-xs text-ink/55">{user?.email ?? "Loading profile"}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-primary/15 bg-primary/8 p-3">
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <Sparkles className="h-4 w-4" />
                  Demo ready
                </div>
                <p className="mt-1 text-xs leading-5 text-ink/60">Try `aisha@example.com` with `password123` to see groups, budgets and settlements already filled in.</p>
              </div>
            </div>

            <nav className="flex gap-1 overflow-x-auto md:mt-6 md:flex-col">
              {nav.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/app"}
                  className={({ isActive }) =>
                    `flex h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${
                      isActive ? "bg-ink text-white shadow-glow" : "text-ink/65 hover:bg-white hover:text-ink hover:shadow-card"
                    }`
                  }
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 md:grid">
            <Button
              variant="secondary"
              className="hidden md:inline-flex"
              onClick={() => navigate("/app/import")}
            >
              <FileUp className="h-4 w-4" />
              Import CSV
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </aside>
      <main className="p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
