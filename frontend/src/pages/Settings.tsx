import { Card } from "../components/ui/Card";

export default function Settings() {
  return (
    <div className="grid gap-6">
      <div><h1 className="text-3xl font-bold">Settings</h1><p className="text-slate-400">Profile, security, theme, and notifications.</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        {["Profile", "Security", "Theme", "Notifications"].map((item) => <Card key={item}><h2 className="font-semibold">{item}</h2><p className="mt-2 text-sm text-slate-400">Production settings panel ready for account-specific controls.</p></Card>)}
      </div>
    </div>
  );
}

