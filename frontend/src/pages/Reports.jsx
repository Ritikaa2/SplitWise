import { Download, FileSpreadsheet, ListChecks, Route, UserRoundSearch } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const reportTypes = [
  ["Group Balance Reports", "Creditors, debtors, settlement plan, and net balances in INR.", FileSpreadsheet],
  ["Individual Explainability", "Expense contribution, amount paid, amount owed, and running calculation.", UserRoundSearch],
  ["Import Report", "Every anomaly detected, action selected, and final import outcome.", ListChecks],
  ["Live Session Trace", "A reviewer can walk from CSV row to service policy to database record.", Route],
];

export default function Reports() {
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold uppercase text-primary">Reports</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">Audit-ready summaries</h1>
        <p className="mt-1 text-slate-500">Designed for the 45-minute live review: balances, import decisions, and explanations in one place.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {reportTypes.map(([title, copy, Icon], index) => (
          <Card key={title}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <Button className="mt-5" variant={index === 0 ? "primary" : "secondary"}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
