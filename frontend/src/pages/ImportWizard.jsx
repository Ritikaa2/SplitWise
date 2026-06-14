import React from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileText, FileUp, Loader2, ShieldAlert } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

const steps = ["Upload CSV", "Validate rows", "Review anomalies", "Approve actions", "Import report"];
const policies = [
  ["Negative amount", "Flag as error. Import only after approval or correction."],
  ["Duplicate entry", "Surface candidate rows. User chooses skip or import."],
  ["Settlement row", "Treat as payment workflow, not a normal expense."],
  ["USD currency", "Convert to INR before balance calculation."],
  ["Inactive member", "Flag date conflict against join/leave timeline."],
];

function groupByRow(anomalies) {
  return anomalies.reduce((acc, item) => {
    const row = item.row_number ?? "unknown";
    acc[row] = acc[row] ?? [];
    acc[row].push(item);
    return acc;
  }, {});
}

export default function ImportWizard() {
  const [groupId, setGroupId] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [actions, setActions] = useState({});

  const { data: groups = [] } = useQuery({ queryKey: ["groups", ""], queryFn: () => api.groups("") });
  const upload = useMutation({
    mutationFn: () => api.uploadCsv(groupId, file),
    onSuccess: (data) => {
      setResult(data);
      const nextActions = {};
      (data.anomalies ?? []).forEach((item) => {
        nextActions[item.row_number] = item.severity === "WARNING" ? "APPROVE" : "SKIP";
      });
      setActions(nextActions);
    },
  });
  const approve = useMutation({
    mutationFn: () => api.approveImport(result.session_id, Object.entries(actions).map(([row_number, action]) => ({
      row_number: Number(row_number),
      action,
    }))),
    onSuccess: setResult,
  });

  const anomalies = result?.anomalies ?? [];
  const anomaliesByRow = useMemo(() => groupByRow(anomalies), [anomalies]);
  const report = result?.report ?? [];
  const errorCount = anomalies.filter((item) => item.severity === "ERROR").length;
  const warningCount = anomalies.filter((item) => item.severity === "WARNING").length;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">Core requirement</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">CSV Import Wizard</h1>
          <p className="mt-1 text-slate-500">Upload `expenses_export.csv` exactly as provided. Every anomaly is visible before import.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
          <span className="rounded-lg bg-danger/10 px-3 py-2 font-semibold text-danger">{errorCount} errors</span>
          <span className="rounded-lg bg-warning/10 px-3 py-2 font-semibold text-warning">{warningCount} warnings</span>
          <span className="rounded-lg bg-primary/10 px-3 py-2 font-semibold text-primary">{result?.rows ?? 0} rows</span>
          <span className="rounded-lg bg-slate-950 px-3 py-2 font-semibold text-white">{result?.status ?? "Ready"}</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {steps.map((step, index) => (
          <div key={step} className="rounded-lg border border-slate-200 bg-white p-4 shadow-card">
            <span className="text-xs font-bold uppercase text-primary">Step {index + 1}</span>
            <h2 className="mt-1 text-sm font-bold text-slate-950">{step}</h2>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card>
          <h2 className="font-bold text-slate-950">Upload file</h2>
          <p className="mt-1 text-sm text-slate-500">Choose a group first so membership timeline checks can run.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <select
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              value={groupId}
              onChange={(event) => setGroupId(event.target.value)}
            >
              <option value="">Select group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
            <Input type="file" accept=".csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <Button disabled={!groupId || !file || upload.isPending} onClick={() => upload.mutate()}>
              {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              Upload
            </Button>
          </div>
          {upload.error && <p className="mt-3 text-sm text-danger">{upload.error.message}</p>}
        </Card>

        <Card>
          <h2 className="font-bold text-slate-950">Import policies</h2>
          <div className="mt-4 grid gap-3">
            {policies.map(([name, policy]) => (
              <div key={name} className="rounded-lg border border-slate-200 bg-background p-3">
                <p className="text-sm font-bold text-slate-900">{name}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{policy}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-950">Anomaly Review</h2>
            <p className="text-sm text-slate-500">Choose what happens to each flagged row before processing.</p>
          </div>
          <ShieldAlert className="h-5 w-5 text-warning" />
        </div>

        {!anomalies.length && !report.length ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-background p-6 text-sm text-slate-500">
            Upload a CSV to view validation rows, anomalies, and approval actions.
          </div>
        ) : (
          <div className="grid gap-3">
            {Object.entries(anomaliesByRow).map(([row, items]) => (
              <div key={row} className="rounded-lg border border-slate-200 bg-background p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-bold text-slate-950">Row {row}</p>
                    <div className="mt-2 grid gap-2">
                      {items.map((item) => (
                        <p key={item.id} className="flex items-start gap-2 text-sm text-slate-600">
                          {item.severity === "ERROR" ? <AlertTriangle className="mt-0.5 h-4 w-4 text-danger" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />}
                          <span><strong>{item.field_name ?? "row"}:</strong> {item.issue}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                  <select
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950"
                    value={actions[row] ?? "SKIP"}
                    onChange={(event) => setActions({ ...actions, [row]: event.target.value })}
                  >
                    <option value="SKIP">Skip row</option>
                    <option value="APPROVE">Approve import</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {anomalies.length > 0 && (
          <div className="mt-5 flex justify-end">
            <Button disabled={approve.isPending} onClick={() => approve.mutate()}>
              {approve.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Process approved actions
            </Button>
          </div>
        )}
        {approve.error && <p className="mt-3 text-sm text-danger">{approve.error.message}</p>}
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-slate-950">Import Report</h2>
        </div>
        {report.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Row</th>
                  <th className="py-2">Severity</th>
                  <th className="py-2">Action</th>
                  <th className="py-2">Issue</th>
                </tr>
              </thead>
              <tbody>
                {report.map((item) => (
                  <tr key={`${item.row_number}-${item.action_taken}`} className="border-b border-slate-100">
                    <td className="py-3 font-semibold text-slate-950">{item.row_number}</td>
                    <td className="py-3">{item.severity ?? "INFO"}</td>
                    <td className="py-3 font-semibold text-primary">{item.action_taken}</td>
                    <td className="py-3 text-slate-600">{item.issue ?? "Imported without anomaly"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <pre className="max-h-80 overflow-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
            {JSON.stringify(result ?? { report: "No import session yet." }, null, 2)}
          </pre>
        )}
      </Card>
    </div>
  );
}
