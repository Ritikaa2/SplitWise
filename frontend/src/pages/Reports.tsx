import { Download } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

export default function Reports() {
  return (
    <div className="grid gap-6">
      <div><h1 className="text-3xl font-bold">Reports</h1><p className="text-slate-400">Group balances, individual reports, and export-ready summaries.</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><h2 className="font-semibold">Group Balance Reports</h2><p className="mt-2 text-sm text-slate-400">Creditors, debtors, settlement plan, and net balances in INR.</p><Button className="mt-5"><Download className="h-4 w-4" />PDF Export</Button></Card>
        <Card><h2 className="font-semibold">Individual Reports</h2><p className="mt-2 text-sm text-slate-400">Expense contribution, amount paid, amount owed, and running calculation.</p><Button className="mt-5" variant="secondary"><Download className="h-4 w-4" />Excel Export</Button></Card>
      </div>
    </div>
  );
}

