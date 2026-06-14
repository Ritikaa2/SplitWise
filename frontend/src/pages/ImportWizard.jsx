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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">CSV Import</h1>
          <p className="text-sm text-ink-lighter mt-1">Upload and validate expense CSV files</p>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="rounded-lg bg-danger/10 px-3 py-1.5 font-medium text-danger">{errorCount} errors</span>
          <span className="rounded-lg bg-warning/10 px-3 py-1.5 font-medium text-warning">{warningCount} warnings</span>
          <span className="rounded-lg bg-primary/10 px-3 py-1.5 font-medium text-primary">{result?.rows ?? 0} rows</span>
          <span className="rounded-lg bg-ink px-3 py-1.5 font-medium text-white">{result?.status ?? "Ready"}</span>
        </div>
      </div>

      {/* Steps */}
      <div className="grid gap-3 md:grid-cols-5">
        {steps.map((step, index) => (
          <div key={step} className="rounded-lg border border-ink-border bg-surface-secondary p-3">
            <p className="text-xs font-semibold uppercase text-primary">Step {index + 1}</p>
            <p className="mt-1 text-sm font-medium text-ink">{step}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        {/* Upload */}
        <Card className="p-6">
          <h2 className="font-semibold text-ink mb-1">Upload file</h2>
          <p className="text-sm text-ink-lighter mb-4">Choose a group and upload your CSV</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <select
                className="field"
                value={groupId}
                onChange={(event) => setGroupId(event.target.value)}
              >
                <option value="">Select group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <Input type="file" accept=".csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            </div>
            <Button disabled={!groupId || !file || upload.isPending} onClick={() => upload.mutate()}>
              {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              Upload
            </Button>
          </div>
          {upload.error && <p className="mt-3 text-sm text-danger">{upload.error.message}</p>}
        </Card>

        {/* Policies */}
        <Card className="p-6">
          <h2 className="font-semibold text-ink mb-4">Import policies</h2>
          <div className="space-y-2">
            {policies.map(([name, policy]) => (
              <div key={name} className="rounded-lg border border-ink-border bg-surface-secondary p-3">
                <p className="text-sm font-medium text-ink">{name}</p>
                <p className="text-xs text-ink-lighter mt-1">{policy}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Anomaly Review */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-ink">Anomaly Review</h2>
            <p className="text-sm text-ink-lighter">Choose what happens to each flagged row</p>
          </div>
          <ShieldAlert className="h-5 w-5 text-warning" />
        </div>

        {!anomalies.length && !report.length ? (
          <div className="rounded-lg border border-dashed border-ink-border bg-surface-secondary p-6 text-sm text-ink-lighter text-center">
            Upload a CSV to view validation rows
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(anomaliesByRow).map(([row, items]) => (
              <div key={row} className="rounded-lg border border-ink-border bg-surface-secondary p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium text-ink">Row {row}</p>
                    <div className="mt-2 space-y-1">
                      {items.map((item) => (
                        <p key={item.id} className="flex items-start gap-2 text-sm text-ink-light">
                          {item.severity === "ERROR" ? <AlertTriangle className="mt-0.5 h-4 w-4 text-danger" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />}
                          <span><strong>{item.field_name ?? "row"}:</strong> {item.issue}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                  <select
                    className="field w-auto"
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

      {/* Import Report */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-ink">Import Report</h2>
        </div>
        {report.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-ink-border text-xs uppercase text-ink-lighter">
                <tr>
                  <th className="py-2 pr-4">Row</th>
                  <th className="py-2 pr-4">Severity</th>
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2">Issue</th>
                </tr>
              </thead>
              <tbody>
                {report.map((item) => (
                  <tr key={`${item.row_number}-${item.action_taken}`} className="border-b border-ink-border">
                    <td className="py-3 pr-4 font-medium text-ink">{item.row_number}</td>
                    <td className="py-3 pr-4 text-ink-lighter">{item.severity ?? "INFO"}</td>
                    <td className="py-3 pr-4 font-medium text-primary">{item.action_taken}</td>
                    <td className="py-3 text-ink-lighter">{item.issue ?? "Imported without anomaly"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <pre className="max-h-60 overflow-auto rounded-lg bg-surface-tertiary p-4 text-sm text-ink-lighter">
            {JSON.stringify(result ?? { report: "No import session yet." }, null, 2)}
          </pre>
        )}
      </Card>
    </div>
  );
}