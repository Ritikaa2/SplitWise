import React from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, CheckSquare, Plus, ReceiptText } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { api } from "../lib/api";
import { money } from "../lib/utils";

const splitTypes = [
  ["EQUAL", "Everyone selected pays the same share."],
  ["EXACT", "Each participant gets a precise amount."],
  ["PERCENTAGE", "Shares must add up to 100."],
  ["SHARES", "Relative weights like 1, 2, 3."],
];

export default function Expenses() {
  const client = useQueryClient();
  const [groupId, setGroupId] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: "",
    currency: "INR",
    date: new Date().toISOString().slice(0, 10),
    paid_by_id: "",
    split_type: "EQUAL",
  });
  const [selected, setSelected] = useState({});
  const [shares, setShares] = useState({});

  const { data: groups = [] } = useQuery({ queryKey: ["groups", ""], queryFn: () => api.groups("") });
  const { data: group } = useQuery({ queryKey: ["group", groupId], queryFn: () => api.group(groupId), enabled: Boolean(groupId) });
  const { data: expenses = [] } = useQuery({ queryKey: ["expenses", groupId], queryFn: () => api.expenses(groupId), enabled: Boolean(groupId) });

  const activeMembers = useMemo(() => (group?.members ?? []).filter((member) => !member.left_at), [group]);
  const participantIds = Object.entries(selected).filter(([, checked]) => checked).map(([id]) => Number(id));
  const isEqual = form.split_type === "EQUAL";
  const canCreate = groupId && form.title && Number(form.amount) > 0 && form.paid_by_id && participantIds.length > 0;

  const create = useMutation({
    mutationFn: () => api.createExpense(groupId, {
      ...form,
      amount: Number(form.amount),
      paid_by_id: Number(form.paid_by_id),
      participants: participantIds.map((user_id) => ({
        user_id,
        share_value: isEqual ? null : Number(shares[user_id] || 0),
      })),
    }),
    onSuccess: () => {
      setForm({ title: "", description: "", amount: "", currency: "INR", date: new Date().toISOString().slice(0, 10), paid_by_id: "", split_type: "EQUAL" });
      setSelected({});
      setShares({});
      client.invalidateQueries({ queryKey: ["expenses", groupId] });
      client.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Expenses</h1>
        <p className="text-sm text-ink-lighter mt-1">Create and manage expenses with split types</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[440px_1fr]">
        <Card className="p-6">
          <h2 className="font-semibold text-ink mb-5">Create expense</h2>
          <div className="space-y-3">
            <select
              className="field"
              value={groupId}
              onChange={(event) => setGroupId(event.target.value)}
            >
              <option value="">Select group</option>
              {groups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <Input placeholder="Title, e.g. March electricity" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            <Input placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" min="0" step="0.01" placeholder="Amount" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
              <select className="field" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            <select className="field" value={form.paid_by_id} onChange={(event) => setForm({ ...form, paid_by_id: event.target.value })}>
              <option value="">Paid by</option>
              {activeMembers.map((member) => <option key={member.user_id} value={member.user_id}>{member.user.name}</option>)}
            </select>
            <select className="field" value={form.split_type} onChange={(event) => setForm({ ...form, split_type: event.target.value })}>
              {splitTypes.map(([type]) => <option key={type} value={type}>{type}</option>)}
            </select>

            <div className="rounded-lg border border-ink-border bg-surface-secondary p-3 space-y-2">
              <p className="text-sm font-medium text-ink">Participants</p>
              {activeMembers.map((member) => (
                <label key={member.user_id} className="grid grid-cols-[1fr_120px] items-center gap-3 text-sm text-ink-light">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={Boolean(selected[member.user_id])} onChange={(event) => setSelected({ ...selected, [member.user_id]: event.target.checked })} className="rounded border-ink-border text-primary" />
                    {member.user.name}
                  </span>
                  <Input
                    disabled={isEqual || !selected[member.user_id]}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={isEqual ? "Auto" : "Share"}
                    value={shares[member.user_id] ?? ""}
                    onChange={(event) => setShares({ ...shares, [member.user_id]: event.target.value })}
                  />
                </label>
              ))}
            </div>

            <Button disabled={!canCreate || create.isPending} className="w-full">
              <Plus className="h-4 w-4" />
              Create expense
            </Button>
            {create.error && <p className="text-sm text-danger">{create.error.message}</p>}
          </div>
        </Card>

        <div className="space-y-6">
          {/* Split types */}
          <div className="grid gap-3 md:grid-cols-2">
            {splitTypes.map(([type, copy]) => (
              <Card key={type} className="p-4">
                <Calculator className="mb-2 h-5 w-5 text-primary" />
                <h3 className="font-semibold text-ink">{type}</h3>
                <p className="mt-1 text-sm text-ink-lighter">{copy}</p>
              </Card>
            ))}
          </div>

          {/* Current ledger */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ReceiptText className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-ink">Current ledger</h2>
            </div>
            <div className="space-y-2">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between rounded-lg border border-ink-border bg-surface-secondary p-3 text-sm">
                  <div>
                    <p className="font-medium text-ink">{expense.title}</p>
                    <p className="text-ink-lighter">{expense.date} &middot; {expense.currency} &middot; {expense.split_type}</p>
                  </div>
                  <span className="font-semibold text-ink">{money(Number(expense.converted_amount_inr ?? expense.amount))}</span>
                </div>
              ))}
              {!expenses.length && (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-ink-border bg-surface-secondary p-5 text-sm text-ink-lighter">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  Select a group to view expenses
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}