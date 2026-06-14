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
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold uppercase text-primary">Expense ledger</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">Create and inspect expenses</h1>
        <p className="mt-1 text-slate-500">Supports the split types present in the CSV: equal, exact, percentage, and shares.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[440px_1fr]">
        <Card>
          <h2 className="font-bold text-slate-950">Create expense</h2>
          <div className="mt-5 grid gap-3">
            <select
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
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
              <select className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            <select className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm" value={form.paid_by_id} onChange={(event) => setForm({ ...form, paid_by_id: event.target.value })}>
              <option value="">Paid by</option>
              {activeMembers.map((member) => <option key={member.user_id} value={member.user_id}>{member.user.name}</option>)}
            </select>
            <select className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm" value={form.split_type} onChange={(event) => setForm({ ...form, split_type: event.target.value })}>
              {splitTypes.map(([type]) => <option key={type} value={type}>{type}</option>)}
            </select>

            <div className="grid gap-2 rounded-lg border border-slate-200 bg-background p-3">
              <p className="text-sm font-bold text-slate-800">Participants</p>
              {activeMembers.map((member) => (
                <label key={member.user_id} className="grid grid-cols-[1fr_120px] items-center gap-3 text-sm text-slate-700">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={Boolean(selected[member.user_id])} onChange={(event) => setSelected({ ...selected, [member.user_id]: event.target.checked })} />
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

            <Button disabled={!canCreate || create.isPending} onClick={() => create.mutate()}>
              <Plus className="h-4 w-4" />
              Create expense
            </Button>
            {create.error && <p className="text-sm text-danger">{create.error.message}</p>}
          </div>
        </Card>

        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            {splitTypes.map(([type, copy]) => (
              <Card key={type} className="p-4">
                <Calculator className="mb-3 h-5 w-5 text-primary" />
                <h2 className="font-bold text-slate-950">{type}</h2>
                <p className="mt-2 text-sm leading-5 text-slate-500">{copy}</p>
              </Card>
            ))}
          </div>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-slate-950">Current group ledger</h2>
            </div>
            <div className="grid gap-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-background p-3">
                  <div>
                    <p className="font-semibold text-slate-950">{expense.title}</p>
                    <p className="text-sm text-slate-500">{expense.date} - {expense.currency} - {expense.split_type}</p>
                  </div>
                  <span className="font-bold text-slate-950">{money(Number(expense.converted_amount_inr ?? expense.amount))}</span>
                </div>
              ))}
              {!expenses.length && (
                <p className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-background p-5 text-sm text-slate-500">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  Select a group to view expenses or create the first one.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
