import { Bot, ClipboardList, ListChecks, ShieldAlert, Syringe, UtensilsCrossed } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { formatHealthStatus, HealthStatus } from '../../services/healthCheckApi';
import { HealthReportTemplate } from '../../services/healthKnowledgeBase';
import { HealthLibraryRecommendation } from '../../services/healthLibraryApi';

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
  if (!value) return 'Pending save';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const STATUS_STYLES: Record<HealthStatus, string> = {
  HEALTHY: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  MILD_CONCERN: 'bg-amber-100 text-amber-700 border-amber-200',
  MODERATE_CONCERN: 'bg-orange-100 text-orange-700 border-orange-200',
  SEVERE: 'bg-rose-100 text-rose-700 border-rose-200',
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
};

export function RobotHealthReport({
  template,
  healthStatus,
  confidencePercent,
  checkedAt,
  batchLabel,
  topPredictionLabel,
  title = 'Automated Health Report',
  compact = false,
  libraryRecommendation,
  requireLibraryRecommendation = false,
}: RobotHealthReportProps) {
  const predictionLabel = topPredictionLabel || template.title;
  const adminRecommendations = libraryRecommendation?.recommendations?.length
    ? libraryRecommendation.recommendations
    : null;
  const showMissingAdminRecommendation = requireLibraryRecommendation && !adminRecommendations;
  const summary = libraryRecommendation?.summary || template.summary;
  const symptoms = libraryRecommendation?.symptoms?.length ? libraryRecommendation.symptoms : template.symptoms;
  const feedingGuidance = libraryRecommendation?.feedingGuidance?.length
    ? libraryRecommendation.feedingGuidance
    : template.feedingGuidance;
  const recoveryChecklist = libraryRecommendation?.recoveryChecklist?.length
    ? libraryRecommendation.recoveryChecklist
    : template.recoveryChecklist;
  const preventiveMeasures = libraryRecommendation?.preventiveMeasures?.length
    ? libraryRecommendation.preventiveMeasures
    : template.preventiveMeasures;
  const quarantineAdvice = libraryRecommendation?.quarantineAdvice || template.quarantineAdvice;
  const medicineName = libraryRecommendation?.medicineName;
  const libraryRange = libraryRecommendation?.range;
  const showTemplateFallback = !requireLibraryRecommendation;

  return (
    <Card className="w-full border-[#D8EDF1] bg-gradient-to-br from-[#F7FCFD] via-white to-[#F2F8FB] shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#B9E0E7] bg-white px-3 py-1 text-xs font-semibold text-[#0A4D68]">
              <Bot className="h-3.5 w-3.5" />
              Robot-generated report
            </div>
            <CardTitle className="text-lg text-slate-900">{title}</CardTitle>
            <p className="mt-1 text-sm text-slate-600">
              {template.title} {batchLabel ? `• ${batchLabel}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={STATUS_STYLES[healthStatus]}>
              {formatHealthStatus(healthStatus)}
            </Badge>
            {confidencePercent != null && (
              <Badge className="bg-[#0A4D68] text-white">
                {confidencePercent.toFixed(1)}% confidence
              </Badge>
            )}
          </div>
        </div>
        <div className="grid gap-3 rounded-2xl border border-[#D7E9EE] bg-white/90 p-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Detected Pattern
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{predictionLabel}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Saved At
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(checkedAt)}</p>
          </div>
          {libraryRecommendation && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Disease Library Level
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {libraryRecommendation.status}
                {libraryRecommendation.level ? ` • ${libraryRecommendation.level}` : ''}
              </p>
              {libraryRange && (
                <p className="mt-1 text-xs text-slate-500">
                  {libraryRange.min}% - {libraryRange.max}%
                </p>
              )}
            </div>
          )}
          {medicineName && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Medicine Name
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{medicineName}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {libraryRecommendation && (
          <div className="rounded-2xl border border-[#B9E0E7] bg-[#F4FBFC] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[#0A4D68]">
                <ListChecks className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wide">Matched Health Library Rule</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-[#B9E0E7] text-[#0A4D68]">
                  {libraryRecommendation.conditionId}
                </Badge>
                <Badge variant="outline" className="border-[#B9E0E7] text-[#0A4D68]">
                  {libraryRecommendation.status}
                </Badge>
                {libraryRecommendation.level && (
                  <Badge className="bg-[#0A4D68] text-white">{libraryRecommendation.level}</Badge>
                )}
                {libraryRange && (
                  <Badge variant="outline" className="border-[#B9E0E7] text-[#0A4D68]">
                    {libraryRange.min}% - {libraryRange.max}%
                  </Badge>
                )}
              </div>
            </div>
            {libraryRecommendation.risk && (
              <p className="mb-3 text-sm font-semibold text-slate-800">{libraryRecommendation.risk}</p>
            )}
            {libraryRecommendation.message && (
              <p className="mb-3 text-sm text-slate-700">{libraryRecommendation.message}</p>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-[#D7E9EE] bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-[#0A4D68]">
            <ClipboardList className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">Diagnosis Summary</p>
          </div>
          <p className="text-sm leading-6 text-slate-700">{summary}</p>
        </div>

        <div className={`grid gap-4 ${compact ? '' : 'lg:grid-cols-2'}`}>
          <div className="rounded-2xl border border-[#E4EEF2] bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-700">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <p className="text-xs font-semibold uppercase tracking-wide">Observed Signs</p>
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
              {symptoms.map((symptom) => (
                <li key={symptom}>• {symptom}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#E4EEF2] bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-700">
              <Syringe className="h-4 w-4 text-[#088395]" />
              <p className="text-xs font-semibold uppercase tracking-wide">
                {adminRecommendations || showMissingAdminRecommendation
                  ? 'Admin Health Library Recommendations'
                  : 'Standard Protocol'}
              </p>
            </div>
            {showMissingAdminRecommendation ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                No Disease Library level matched this disease and confidence range. Add the level controls in Health Library for this disease.
              </div>
            ) : (
              <ul className="space-y-2 text-sm text-slate-700">
                {(adminRecommendations || (showTemplateFallback ? template.treatmentProtocol : [])).map((step) => (
                  <li key={step}>• {step}</li>
                ))}
              </ul>
            )}
            {showTemplateFallback && !adminRecommendations && !showMissingAdminRecommendation && (template.dosageInstructions || template.suggestedDuration) && (
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                {template.dosageInstructions && <p>Dosage: {template.dosageInstructions}</p>}
                {template.suggestedDuration && <p className="mt-1">Duration: {template.suggestedDuration}</p>}
              </div>
            )}
          </div>

          {!compact && (
            <div className="rounded-2xl border border-[#E4EEF2] bg-white p-4">
              <div className="mb-2 flex items-center gap-2 text-slate-700">
                <UtensilsCrossed className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-semibold uppercase tracking-wide">Feeding Guidance</p>
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
                {feedingGuidance.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-[#E4EEF2] bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-700">
              <ClipboardList className="h-4 w-4 text-violet-600" />
              <p className="text-xs font-semibold uppercase tracking-wide">Recovery Checklist</p>
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
              {recoveryChecklist.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        {!compact && (
          <div className="rounded-2xl border border-[#E4EEF2] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Prevention and Quarantine
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {preventiveMeasures.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              {quarantineAdvice}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
