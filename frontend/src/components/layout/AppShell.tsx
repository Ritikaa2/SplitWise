import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, FileUp, Home, LogOut, Settings, Users, WalletCards } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../store/auth";

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
  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <aside className="glass sticky top-0 z-20 flex h-auto items-center justify-between gap-3 border-x-0 border-t-0 p-4 md:h-screen md:flex-col md:items-stretch md:border-y-0 md:border-l-0">
        <div>
          <div className="mb-6 hidden text-xl font-bold md:block">SplitWise Pro</div>
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === "/app"} className={({ isActive }) => `flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition ${isActive ? "bg-primary text-white" : "text-slate-300 hover:bg-white/10"}`}>
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <Button variant="ghost" onClick={() => { logout(); navigate("/login"); }} aria-label="Logout">
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">Logout</span>
        </Button>
      </aside>
      <main className="p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}

