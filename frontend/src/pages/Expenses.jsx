import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
export default function Expenses() {
    return (<div className="grid gap-6">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold">Expenses</h1><p className="text-slate-400">Create, edit, delete, and inspect expenses with equal, exact, percentage, or share splits.</p></div><Button>Create Expense</Button></div>
      <Card>
        <div className="grid gap-3 md:grid-cols-4">
          {["Equal", "Exact", "Percentage", "Shares"].map((type) => <div key={type} className="rounded-lg border border-slate-700 bg-slate-950/40 p-4"><h2 className="font-semibold">{type}</h2><p className="mt-2 text-sm text-slate-400">Validated by the backend split engine.</p></div>)}
        </div>
      </Card>
    </div>);
}
