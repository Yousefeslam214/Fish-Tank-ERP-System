import {
  Bot,
  CalendarClock,
  ClipboardList,
  ListChecks,
  Printer,
  ShieldAlert,
  Syringe,
  UtensilsCrossed,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  formatHealthStatus,
  HealthStatus,
} from "../../services/healthCheckApi";
import { HealthReportTemplate } from "../../services/healthKnowledgeBase";
import { HealthLibraryRecommendation } from "../../services/healthLibraryApi";

interface RobotHealthReportProps {
  template: HealthReportTemplate;
  healthStatus: HealthStatus;
  confidencePercent?: number | null;
  checkedAt?: string;
  batchLabel?: string;
  topPredictionLabel?: string;
  title?: string;
  compact?: boolean;
  libraryRecommendation?: HealthLibraryRecommendation | null;
  requireLibraryRecommendation?: boolean;
}

const formatDateTime = (value?: string) => {
  if (!value) return "Pending save";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_STYLES: Record<HealthStatus, string> = {
  HEALTHY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MILD_CONCERN: "bg-amber-50 text-amber-700 border-amber-200",
  MODERATE_CONCERN: "bg-orange-50 text-orange-700 border-orange-200",
  SEVERE: "bg-rose-50 text-rose-700 border-rose-200",
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
};

const cleanItems = (items?: string[], limit = 4) =>
  (items || [])
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);

const uniqueItems = (...groups: Array<string[] | undefined>) => {
  const seen = new Set<string>();
  return groups
    .flatMap((group) => cleanItems(group, 8))
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const listMarkup = (items: string[]) =>
  items.length
    ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : '<p class="muted">Not configured</p>';

function InfoBlock({
  icon,
  title,
  items,
  emptyText,
}: {
  icon: ReactNode;
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-slate-800">
        {icon}
        <p className="text-sm font-semibold">{title}</p>
      </div>
      {items.length ? (
        <ul className="space-y-2 text-sm leading-6 text-slate-700">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#088395]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">{emptyText}</p>
      )}
    </div>
  );
}

export function RobotHealthReport({
  template,
  healthStatus,
  confidencePercent,
  checkedAt,
  batchLabel,
  topPredictionLabel,
  title = "AI Health Check",
  compact = false,
  libraryRecommendation,
  requireLibraryRecommendation = false,
}: RobotHealthReportProps) {
  const predictionLabel = topPredictionLabel || template.title;
  const confidenceLabel =
    confidencePercent == null
      ? "Not available"
      : `${confidencePercent.toFixed(1)}%`;
  const matchedRange = libraryRecommendation?.range
    ? `${libraryRecommendation.range.min}% - ${libraryRecommendation.range.max}%`
    : null;
  const libraryMissing =
    requireLibraryRecommendation &&
    !libraryRecommendation?.recommendations?.length;
  const summary = libraryRecommendation?.summary || template.summary;
  const treatmentItems = uniqueItems(
    libraryRecommendation?.recommendations,
    libraryMissing ? [] : template.treatmentProtocol,
  ).slice(0, compact ? 3 : 5);
  const feedingItems = uniqueItems(
    libraryRecommendation?.feedingGuidance,
    template.feedingGuidance,
  ).slice(0, compact ? 2 : 4);
  const followUpItems = uniqueItems(
    libraryRecommendation?.recoveryChecklist,
    template.recoveryChecklist,
  ).slice(0, compact ? 2 : 4);
  const signsItems = cleanItems(
    libraryRecommendation?.symptoms?.length
      ? libraryRecommendation.symptoms
      : template.symptoms,
    4,
  );
  const preventionItems = cleanItems(
    libraryRecommendation?.preventiveMeasures?.length
      ? libraryRecommendation.preventiveMeasures
      : template.preventiveMeasures,
    4,
  );
  const handlePrint = () => {
    if (typeof window === "undefined") return;
    const printWindow = window.open("", "_blank", "width=900,height=720");
    if (!printWindow) {
      window.print();
      return;
    }
    const libraryLabel =
      libraryRecommendation?.level ||
      libraryRecommendation?.status ||
      (libraryMissing ? "Missing rule" : "Default protocol");
    const ruleDetails = [
      libraryRecommendation?.conditionId,
      libraryRecommendation?.medicineName,
      libraryRecommendation?.risk || libraryRecommendation?.message,
    ].filter(Boolean) as string[];

    printWindow.document.write(`<!doctype html>
<html>
  <head>
    <title>${escapeHtml(title)}</title>
    <style>
      body { color: #0f172a; font-family: Arial, sans-serif; margin: 32px; }
      header { border-bottom: 2px solid #0a4d68; margin-bottom: 20px; padding-bottom: 16px; }
      h1 { font-size: 24px; margin: 0 0 8px; }
      h2 { color: #0a4d68; font-size: 15px; margin: 22px 0 8px; }
      p { line-height: 1.55; margin: 0 0 8px; }
      .grid { display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 16px 0; }
      .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; }
      .label { color: #64748b; font-size: 11px; margin-bottom: 4px; text-transform: uppercase; }
      .value { font-size: 14px; font-weight: 700; }
      ul { margin: 0; padding-left: 20px; }
      li { margin: 5px 0; }
      .muted { color: #64748b; }
      @media print { body { margin: 18mm; } }
    </style>
  </head>
  <body>
    <header>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(summary)}</p>
    </header>
    <section class="grid">
      <div class="box"><div class="label">Detected pattern</div><div class="value">${escapeHtml(predictionLabel)}</div></div>
      <div class="box"><div class="label">Status</div><div class="value">${escapeHtml(formatHealthStatus(healthStatus))}</div></div>
      <div class="box"><div class="label">Confidence</div><div class="value">${escapeHtml(confidenceLabel)}</div></div>
      <div class="box"><div class="label">Batch</div><div class="value">${escapeHtml(batchLabel || "Not selected")}</div></div>
      <div class="box"><div class="label">Checked at</div><div class="value">${escapeHtml(formatDateTime(checkedAt))}</div></div>
      <div class="box"><div class="label">Library match</div><div class="value">${escapeHtml(libraryLabel)}</div></div>
    </section>
    ${ruleDetails.length ? `<h2>Health Library Rule</h2>${listMarkup(ruleDetails)}` : ""}
    <h2>Next Actions</h2>${listMarkup(treatmentItems)}
    <h2>Feeding</h2>${listMarkup(feedingItems)}
    <h2>Follow-up</h2>${listMarkup(followUpItems)}
    ${compact ? "" : `<h2>Main Signs</h2>${listMarkup(signsItems)}<h2>Prevention</h2><p>${escapeHtml(libraryRecommendation?.quarantineAdvice || template.quarantineAdvice)}</p>${listMarkup(preventionItems)}`}
  </body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Card className="w-full border-slate-200 bg-white shadow-sm">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#B9E0E7] bg-[#F4FBFC] px-3 py-1 text-xs font-semibold text-[#0A4D68]">
              <Bot className="h-3.5 w-3.5" />
              AI generated
            </div>
            <CardTitle className="text-lg text-slate-950">{title}</CardTitle>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              {summary}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={STATUS_STYLES[healthStatus]}>
              {formatHealthStatus(healthStatus)}
            </Badge>
            <Badge className="bg-[#0A4D68] text-white">{confidenceLabel}</Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
            >
              <Printer className="mr-2 h-3.5 w-3.5" />
              Print
            </Button>
          </div>
        </div>

        <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Detected pattern
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {predictionLabel}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Batch</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {batchLabel || "Not selected"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Checked at</p>
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-950">
              <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
              {formatDateTime(checkedAt)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Library match</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {libraryRecommendation?.level ||
                libraryRecommendation?.status ||
                (libraryMissing ? "Missing rule" : "Default protocol")}
            </p>
            {matchedRange && (
              <p className="mt-1 text-xs text-slate-500">{matchedRange}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {libraryRecommendation && (
          <div className="rounded-lg border border-[#B9E0E7] bg-[#F4FBFC] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[#0A4D68]">
                <ListChecks className="h-4 w-4" />
                <p className="text-sm font-semibold">
                  Matched health library rule
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="border-[#B9E0E7] text-[#0A4D68]"
                >
                  {libraryRecommendation.conditionId}
                </Badge>
                {libraryRecommendation.medicineName && (
                  <Badge className="bg-[#0A4D68] text-white">
                    {libraryRecommendation.medicineName}
                  </Badge>
                )}
              </div>
            </div>
            {(libraryRecommendation.risk || libraryRecommendation.message) && (
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {libraryRecommendation.risk || libraryRecommendation.message}
              </p>
            )}
          </div>
        )}

        {libraryMissing && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No matching health library level exists for this disease and
            confidence range. Add a level in Health Library before relying on
            automated treatment instructions.
          </div>
        )}

        <div className={`grid gap-4 ${compact ? "" : "xl:grid-cols-3"}`}>
          <InfoBlock
            icon={<Syringe className="h-4 w-4 text-[#088395]" />}
            title="Next actions"
            items={treatmentItems}
            emptyText="No treatment actions are configured yet."
          />
          <InfoBlock
            icon={<UtensilsCrossed className="h-4 w-4 text-emerald-600" />}
            title="Feeding"
            items={feedingItems}
            emptyText="No feeding guidance is configured yet."
          />
          <InfoBlock
            icon={<ClipboardList className="h-4 w-4 text-violet-600" />}
            title="Follow-up"
            items={followUpItems}
            emptyText="No follow-up checklist is configured yet."
          />
        </div>

        {!compact && (
          <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
            <InfoBlock
              icon={<ShieldAlert className="h-4 w-4 text-amber-600" />}
              title="Main signs"
              items={signsItems}
              emptyText="No symptom list is configured yet."
            />
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Prevention and quarantine
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {libraryRecommendation?.quarantineAdvice ||
                  template.quarantineAdvice}
              </p>
              <ul className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                {preventionItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
