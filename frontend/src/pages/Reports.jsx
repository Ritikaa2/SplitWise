import React from "react";
import { Download, FileSpreadsheet, ListChecks, Printer, ReceiptText, Route, Share2, UserRoundSearch, WalletCards } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const reportTypes = [
  ["Group Balance Reports", "Creditors, debtors, settlement plan, and net balances in INR.", FileSpreadsheet, "Ready"],
  ["Individual Explainability", "Expense contribution, amount paid, amount owed, and running calculation.", UserRoundSearch, "Ready"],
  ["Import Report", "Every anomaly detected, action selected, and final import outcome.", ListChecks, "Ready"],
  ["Live Session Trace", "A reviewer can walk from CSV row to service policy to database record.", Route, "Demo"],
];

const reportPreview = [
  ["Home Circle", "Rohan pays Aisha", "INR 5,000"],
  ["Goa Weekend", "Priya receives from Sam", "INR 2,450"],
  ["Studio Snacks", "Meera pays team pool", "INR 1,180"],
];

const auditTrail = [
  ["Row 12", "Duplicate candidate", "Skipped after review"],
  ["Row 18", "USD cafe payment", "Converted to INR"],
  ["Row 27", "Settlement note", "Moved to payment flow"],
  ["Row 31", "Inactive member date", "Flagged for approval"],
];

export default function Reports() {
  return (
    <div className="grid gap-6">
      <section className="page-hero soft-grid p-5 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">Reports</p>
            <h1 className="mt-2 max-w-4xl text-3xl font-black leading-tight text-ink md:text-5xl">Audit-ready summaries that look finished.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65 md:text-base">
              Export balances, import decisions, settlement plans and member explainability with built-in demo report content.
            </p>
          </div>
          <div className="rounded-lg border border-ink/10 bg-ink p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Report pack</p>
                <h2 className="mt-1 text-2xl font-black">June closeout</h2>
              </div>
              <Printer className="h-6 w-6 text-secondary" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
              {[
                ["Groups", "6"],
                ["Rows", "124"],
                ["Exports", "4"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white/10 p-3">
                  <p className="text-xs text-white/55">{label}</p>
                  <p className="mt-1 text-xl font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {reportTypes.map(([title, copy, Icon, status], index) => (
          <Card key={title} className="surface-hover">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="pill text-primary">{status}</span>
                <h2 className="mt-4 font-black text-ink">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-ink/60">{copy}</p>
              </div>
              <div className="icon-tile">
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
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

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card className="surface-hover">
          <div className="mb-5 flex items-center gap-3">
            <WalletCards className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-black text-ink">Settlement preview</h2>
              <p className="text-sm text-ink/55">Built-in examples that make the report page useful immediately.</p>
            </div>
          </div>
          <div className="grid gap-3">
            {reportPreview.map(([group, action, amount]) => (
              <div key={`${group}-${action}`} className="grid gap-3 rounded-lg border border-ink/10 bg-background/80 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="font-black text-ink">{action}</p>
                  <p className="mt-1 text-sm text-ink/55">{group} final settlement</p>
                </div>
                <span className="text-lg font-black text-primary">{amount}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="surface-hover">
          <div className="mb-5 flex items-center gap-3">
            <ReceiptText className="h-6 w-6 text-secondary" />
            <div>
              <h2 className="text-xl font-black text-ink">Import audit trail</h2>
              <p className="text-sm text-ink/55">Every row decision stays visible.</p>
            </div>
          </div>
          <div className="grid gap-3">
            {auditTrail.map(([row, issue, outcome]) => (
              <div key={row} className="rounded-lg border border-ink/10 bg-background/80 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-ink">{row}</p>
                  <span className="text-xs font-bold text-primary">{outcome}</span>
                </div>
                <p className="mt-1 text-sm text-ink/55">{issue}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
