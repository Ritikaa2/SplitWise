import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileUp } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
const steps = ["Upload CSV", "Validation", "Detect Anomalies", "User Approval", "Import Report"];
export default function ImportWizard() {
    const [groupId, setGroupId] = useState("");
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const upload = useMutation({ mutationFn: () => api.uploadCsv(groupId, file), onSuccess: setResult });
    return (<div className="grid gap-6">
      <div><h1 className="text-3xl font-bold">Import Wizard</h1><p className="text-slate-400">Every anomaly is shown for approval. Nothing is silently fixed.</p></div>
      <div className="grid gap-3 md:grid-cols-5">{steps.map((step, index) => <Card key={step} className="p-4"><span className="text-sm text-accent">Step {index + 1}</span><h2 className="mt-1 font-semibold">{step}</h2></Card>)}</div>
      <Card>
        <div className="grid gap-4 md:grid-cols-[160px_1fr_auto]">
          <Input placeholder="Group ID" value={groupId} onChange={(e) => setGroupId(e.target.value)}/>
          <Input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)}/>
          <Button disabled={!groupId || !file || upload.isPending} onClick={() => upload.mutate()}><FileUp className="h-4 w-4"/>Upload</Button>
        </div>
      </Card>
      <Card><pre className="max-h-96 overflow-auto text-sm text-slate-300">{JSON.stringify(result ?? { report: "Upload a CSV to view validation rows, color-coded anomalies, and approval actions." }, null, 2)}</pre></Card>
    </div>);
}
