import React from "react";
import { Download, FileSpreadsheet, ListChecks, Printer, Route, Share2, UserRoundSearch, WalletCards } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const reportTypes = [
  ["Group Balance Reports", "Creditors, debtors, settlement plan, and net balances.", FileSpreadsheet],
  ["Individual Explainability", "Expense contribution, amount paid, amount owed.", UserRoundSearch],
  ["Import Report", "Every anomaly detected, action selected, and outcome.", ListChecks],
  ["Live Session Trace", "Walk from CSV row to service policy to database record.", Route],
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Reports</h1>
        <p className="text-sm text-ink-lighter mt-1">Export and share expense reports</p>
      </div>

      {/* Report types */}
      <div className="grid gap-4 md:grid-cols-2">
        {reportTypes.map(([title, copy, Icon], index) => (
          <Card key={title} className="surface-hover p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="icon-tile">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <span className="pill">{index === 0 ? "Ready" : index === 3 ? "Demo" : "Ready"}</span>
            </div>
            <h3 className="font-semibold text-ink">{title}</h3>
            <p className="mt-1 text-sm text-ink-lighter">{copy}</p>
            <div className="mt-4 flex gap-2">
              <Button variant={index === 0 ? "primary" : "secondary"}>
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button variant="secondary">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <WalletCards className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-ink">Settlement Preview</h2>
          </div>
          <div className="space-y-3">
            {[
              ["Rohan pays Aisha INR 5,000", "Home Circle"],
              ["Priya receives from Sam INR 2,450", "Goa Weekend"],
              ["Meera pays team pool INR 1,180", "Studio Snacks"],
            ].map(([action, group]) => (
              <div key={action} className="flex items-center justify-between rounded-lg border border-ink-border bg-surface-secondary p-3">
                <div>
                  <p className="font-medium text-ink">{action}</p>
                  <p className="text-sm text-ink-lighter">{group}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Printer className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-ink">Import Audit Trail</h2>
          </div>
          <div className="space-y-3">
            {[
              ["Row 12", "Duplicate candidate", "Skipped"],
              ["Row 18", "USD cafe payment", "Converted"],
              ["Row 27", "Settlement note", "Moved"],
              ["Row 31", "Inactive member date", "Flagged"],
            ].map(([row, issue, outcome]) => (
              <div key={row} className="flex items-center justify-between rounded-lg border border-ink-border bg-surface-secondary p-3 text-sm">
                <div>
                  <span className="font-medium text-ink">{row}</span>
                  <span className="text-ink-lighter ml-2">{issue}</span>
                </div>
                <span className="text-primary font-medium">{outcome}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}