import React from "react";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{group?.name ?? "Group"}</h1>
          <p className="text-sm text-ink-lighter mt-1">{group?.description ?? "Group details and management"}</p>
        </div>
        <span className="rounded-lg bg-ink px-3 py-1.5 text-sm font-semibold text-white">{group?.default_currency ?? "INR"}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-ink-border pb-0.5">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
              tab === item
                ? "bg-white text-ink border border-ink-border border-b-white -mb-px"
                : "text-ink-lighter hover:text-ink"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="font-semibold text-ink mb-1">Net Balances</h2>
            <p className="text-sm text-ink-lighter mb-4">Positive means receive, negative means owe</p>
            <div className="space-y-2">
              {(balances?.balances ?? []).map((item) => (
                <div key={item.user_id} className="flex items-center justify-between rounded-lg border border-ink-border bg-surface-secondary p-3">
                  <span className="text-sm font-medium text-ink">User {item.user_id}</span>
                  <span className={`font-semibold ${item.amount >= 0 ? "text-success" : "text-danger"}`}>{money(item.amount)}</span>
                </div>
              ))}
              {!(balances?.balances ?? []).length && <p className="text-sm text-ink-lighter">No balances yet.</p>}
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="font-semibold text-ink mb-1">Settlement Plan</h2>
            <p className="text-sm text-ink-lighter mb-4">Who pays whom</p>
            <div className="space-y-2">
              {(balances?.settlement_plan ?? []).map((item) => (
                <div key={`${item.from_user_id}-${item.to_user_id}`} className="rounded-lg bg-surface-tertiary p-4">
                  <p className="text-sm font-medium text-ink">{item.from_user_name} pays {item.to_user_name}</p>
                  <p className="mt-1 text-xl font-bold text-primary">{money(item.amount)}</p>
                </div>
              ))}
              {!(balances?.settlement_plan ?? []).length && (
                <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Everyone is settled.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {tab === "Expenses" && (
        <Card className="p-6">
          <h2 className="font-semibold text-ink mb-4">Expense Ledger</h2>
          <div className="space-y-2">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between rounded-lg border border-ink-border bg-surface-secondary p-3">
                <div className="flex items-center gap-3">
                  <Receipt className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-ink">{expense.title}</p>
                    <p className="text-xs text-ink-lighter">{expense.date} &middot; {expense.split_type}</p>
                  </div>
                </div>
                <span className="font-semibold text-ink">{expense.amount} {expense.currency}</span>
              </div>
            ))}
            {!expenses.length && <p className="text-sm text-ink-lighter">No expenses yet.</p>}
          </div>
        </Card>
      )}

      {tab === "Members" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="font-semibold text-ink mb-4">Members</h2>
            <div className="space-y-2">
              {(group?.members ?? []).map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-lg border border-ink-border bg-surface-secondary p-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{member.user.name}</p>
                    <p className="text-xs text-ink-lighter">Joined {member.joined_at}{member.left_at ? ` - Left ${member.left_at}` : " - Active"}</p>
                  </div>
                  {!member.left_at && (
                    <button onClick={() => removeMember.mutate(member.user_id)} className="text-ink-lighter hover:text-danger transition" title="Remove member">
                      <UserMinus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="font-semibold text-ink mb-4">Add member</h2>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (memberEmail) addMember.mutate();
              }}
            >
              <Input type="email" placeholder="sam@example.com" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} />
              <div>
                <label className="block text-sm text-ink-lighter mb-1">Join date</label>
                <Input type="date" value={joinedAt} onChange={(event) => setJoinedAt(event.target.value)} />
              </div>
              <Button disabled={!memberEmail || addMember.isPending} className="w-full">
                <UserPlus className="h-4 w-4" />
                Add member
              </Button>
              {addMember.error && <p className="text-sm text-danger">{addMember.error.message}</p>}
            </form>
            <p className="mt-3 flex gap-2 text-xs text-ink-lighter">
              <CalendarPlus className="h-4 w-4" />
              Join dates protect members from old expenses
            </p>
          </Card>
        </div>
      )}

      {tab === "Settlements" && (
        <Card className="p-6">
          <h2 className="font-semibold text-ink">Settlements</h2>
          <p className="mt-1 text-sm text-ink-lighter">Use the settlement plan above to record payments and reduce open balances.</p>
        </Card>
      )}

      {tab === "Reports" && (
        <Card className="p-6">
          <h2 className="font-semibold text-ink">Explainability</h2>
          <p className="mt-1 text-sm text-ink-lighter">Reports expose each member balance and the expenses that produced it.</p>
        </Card>
      )}
    </div>
  );
}