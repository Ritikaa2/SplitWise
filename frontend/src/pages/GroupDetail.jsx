import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { CalendarPlus, CheckCircle2, Receipt, UserMinus, UserPlus } from "lucide-react";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { money } from "../lib/utils";

const tabs = ["Overview", "Expenses", "Members", "Settlements", "Reports"];

export default function GroupDetail() {
  const { id = "" } = useParams();
  const client = useQueryClient();
  const [tab, setTab] = useState("Overview");
  const [memberEmail, setMemberEmail] = useState("");
  const [joinedAt, setJoinedAt] = useState(new Date().toISOString().slice(0, 10));
  const { data: group } = useQuery({ queryKey: ["group", id], queryFn: () => api.group(id) });
  const { data: expenses = [] } = useQuery({ queryKey: ["expenses", id], queryFn: () => api.expenses(id), enabled: Boolean(id) });
  const { data: balances } = useQuery({ queryKey: ["balances", id], queryFn: () => api.balances(id), enabled: Boolean(id) });

  const addMember = useMutation({
    mutationFn: () => api.addMember(id, { user_email: memberEmail.trim(), joined_at: joinedAt }),
    onSuccess: () => {
      setMemberEmail("");
      client.invalidateQueries({ queryKey: ["group", id] });
    },
  });
  const removeMember = useMutation({
    mutationFn: (userId) => api.removeMember(id, userId),
    onSuccess: () => client.invalidateQueries({ queryKey: ["group", id] }),
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">Group detail</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">{group?.name ?? "Group"}</h1>
          <p className="mt-1 text-slate-500">{group?.description ?? "Overview of balances, members, expenses, settlements, and reports."}</p>
        </div>
        <span className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white">{group?.default_currency ?? "INR"}</span>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((item) => (
          <Button key={item} variant={tab === item ? "dark" : "secondary"} onClick={() => setTab(item)}>
            {item}
          </Button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
          <Card>
            <h2 className="font-bold text-slate-950">Net Balances</h2>
            <p className="mt-1 text-sm text-slate-500">Positive means the member should receive money. Negative means they owe.</p>
            <div className="mt-5 grid gap-3">
              {(balances?.balances ?? []).map((item) => (
                <div key={item.user_id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-background p-3">
                  <span className="font-semibold text-slate-800">User {item.user_id}</span>
                  <span className={`font-black ${item.amount >= 0 ? "text-success" : "text-danger"}`}>{money(item.amount)}</span>
                </div>
              ))}
              {!(balances?.balances ?? []).length && <p className="text-sm text-slate-500">No balances yet.</p>}
            </div>
          </Card>
          <Card>
            <h2 className="font-bold text-slate-950">Settlement Plan</h2>
            <p className="mt-1 text-sm text-slate-500">Aisha-style final answer: who pays whom.</p>
            <div className="mt-5 grid gap-3">
              {(balances?.settlement_plan ?? []).map((item) => (
                <div key={`${item.from_user_id}-${item.to_user_id}-${item.amount}`} className="rounded-lg bg-slate-950 p-4 text-white">
                  <p className="font-bold">{item.from_user_name} pays {item.to_user_name}</p>
                  <p className="mt-1 text-2xl font-black">{money(item.amount)}</p>
                </div>
              ))}
              {!(balances?.settlement_plan ?? []).length && (
                <p className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm font-semibold text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Everyone is settled.
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {tab === "Expenses" && (
        <Card>
          <h2 className="font-bold text-slate-950">Expense Ledger</h2>
          <div className="mt-5 grid gap-3">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-background p-3">
                <div className="flex items-center gap-3">
                  <Receipt className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-semibold text-slate-900">{expense.title}</p>
                    <p className="text-sm text-slate-500">{expense.date} - {expense.split_type}</p>
                  </div>
                </div>
                <span className="font-bold text-slate-950">{expense.amount} {expense.currency}</span>
              </div>
            ))}
            {!expenses.length && <p className="text-sm text-slate-500">No expenses yet. Import CSV or create expenses manually.</p>}
          </div>
        </Card>
      )}

      {tab === "Members" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
          <Card>
            <h2 className="font-bold text-slate-950">Membership Timeline</h2>
            <div className="mt-5 grid gap-3">
              {(group?.members ?? []).map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-background p-3">
                  <div>
                    <p className="font-semibold text-slate-900">{member.user.name}</p>
                    <p className="text-sm text-slate-500">Joined {member.joined_at}{member.left_at ? ` - Left ${member.left_at}` : " - Active"}</p>
                  </div>
                  {!member.left_at && (
                    <Button variant="ghost" onClick={() => removeMember.mutate(member.user_id)} title="Mark member as left">
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="font-bold text-slate-950">Add member</h2>
            <form
              className="mt-5 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (memberEmail) addMember.mutate();
              }}
            >
              <Input type="email" placeholder="sam@example.com" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} />
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Join date
                <Input type="date" value={joinedAt} onChange={(event) => setJoinedAt(event.target.value)} />
              </label>
              <Button disabled={!memberEmail || addMember.isPending}>
                <UserPlus className="h-4 w-4" />
                Add member
              </Button>
              {addMember.error && <p className="text-sm text-danger">{addMember.error.message}</p>}
            </form>
            <p className="mt-4 flex gap-2 text-sm text-slate-500">
              <CalendarPlus className="mt-0.5 h-4 w-4 text-primary" />
              Join dates protect Sam from old expenses and Meera from new ones.
            </p>
          </Card>
        </div>
      )}

      {tab === "Settlements" && (
        <Card>
          <h2 className="font-bold text-slate-950">Settlements</h2>
          <p className="mt-2 text-sm text-slate-500">Use the settlement plan above to record payments and reduce open balances.</p>
        </Card>
      )}

      {tab === "Reports" && (
        <Card>
          <h2 className="font-bold text-slate-950">Explainability</h2>
          <p className="mt-2 text-sm text-slate-500">Reports expose each member balance and the expenses that produced it for live walkthroughs.</p>
        </Card>
      )}
    </div>
  );
}
