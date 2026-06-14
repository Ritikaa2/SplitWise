import { Bell, Moon, Shield, UserRound } from "lucide-react";
import { Card } from "../components/ui/Card";

const settings = [
  ["Profile", "Name and email are protected by the authenticated account.", UserRound, "Ready"],
  ["Security", "Password reset and token-based sessions are enabled.", Shield, "Enabled"],
  ["Theme", "Clean light interface optimized for live walkthroughs.", Moon, "Light"],
  ["Notifications", "Import warnings and settlement reminders can be routed here.", Bell, "Planned"],
];

export default function Settings() {
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold uppercase text-primary">Settings</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">Account and app controls</h1>
        <p className="mt-1 text-slate-500">Security, profile, theme, and future notification preferences.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {settings.map(([item, copy, Icon, status]) => (
          <Card key={item}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-950">{item}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p>
              </div>
              <div className="rounded-lg bg-secondary/10 p-3 text-secondary">
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <span className="mt-5 inline-flex rounded-lg bg-background px-3 py-1 text-sm font-semibold text-slate-600">{status}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
