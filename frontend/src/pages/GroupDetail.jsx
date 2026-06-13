import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
const tabs = ["Overview", "Expenses", "Members", "Settlements", "Reports"];
export default function GroupDetail() {
    const { id = "" } = useParams();
    const [tab, setTab] = useState("Overview");
    const { data: group } = useQuery({ queryKey: ["group", id], queryFn: () => api.group(id) });
    const { data: expenses = [] } = useQuery({ queryKey: ["expenses", id], queryFn: () => api.expenses(id), enabled: Boolean(id) });
    const { data: balances } = useQuery({ queryKey: ["balances", id], queryFn: () => api.balances(id), enabled: Boolean(id) });
    return (<div className="grid gap-6">
      <div><h1 className="text-3xl font-bold">{group?.name ?? "Group"}</h1><p className="text-slate-400">{group?.description ?? "Overview of balances, members, expenses, settlements, and reports."}</p></div>
      <div className="flex gap-2 overflow-x-auto">{tabs.map((item) => <Button key={item} variant={tab === item ? "primary" : "secondary"} onClick={() => setTab(item)}>{item}</Button>)}</div>
      <Card>
        {tab === "Overview" && <pre className="overflow-auto text-sm text-slate-300">{JSON.stringify(balances ?? { message: "No balances yet" }, null, 2)}</pre>}
        {tab === "Expenses" && <div className="grid gap-3">{expenses.map((e) => <div key={e.id} className="rounded bg-slate-950/40 p-3">{e.title} · {e.amount} {e.currency}</div>)}</div>}
        {tab === "Members" && <div className="grid gap-3">{group?.members?.map((m) => <div key={m.id} className="rounded bg-slate-950/40 p-3">{m.user.name} · joined {m.joined_at}</div>)}</div>}
        {tab === "Settlements" && <p className="text-slate-400">Record partial or full settlements from the Expenses or Reports workflow.</p>}
        {tab === "Reports" && <p className="text-slate-400">Export-ready balance reports are available from the Reports page.</p>}
      </Card>
    </div>);
}
