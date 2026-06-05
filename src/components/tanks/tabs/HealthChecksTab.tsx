import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  CheckCircle2,
  ClipboardList,
  FileText,
  Pill,
  RefreshCw,
  ShieldPlus,
  Stethoscope,
} from "lucide-react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  formatCheckType,
  formatHealthStatus,
  getHealthStatusColor,
  HealthCheckResponseDTO,
  isActiveHealthConcern,
} from "../../../services/healthCheckApi";
import { resolveHealthReportTemplate } from "../../../services/healthKnowledgeBase";
import {
  HealthLibraryConfiguration,
  HealthLibraryRecommendation,
  listHealthLibraryConfigurations,
  resolveHealthLibraryRecommendation,
} from "../../../services/healthLibraryApi";
import { RobotHealthReport } from "../../health/RobotHealthReport";
import { InlineHealthCheckPanel } from "../InlineHealthCheckPanel";
import { User } from "../../../types";
interface HealthChecksTabProps {
  tankName?: string;
  tankBatches: any[];
  healthChecks: HealthCheckResponseDTO[];
  loading: boolean;
  onCreate: (batch?: any) => void;
  createBatchId?: string | null;
  onDismissCreate?: () => void;
  onCreateSuccess?: () => void;
  onRefresh: () => void;
  onMarkImproved?: (batch: any, record: HealthCheckResponseDTO) => void;
  improvingRecordId?: string | null;
  onApplyTreatment?: (medicineId?: string) => void;
  tankId?: string;
  user?: User;
}

const formatDateTime = (value?: string) => {
  if (!value) return "Unknown";
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

const getBatchLabel = (batch: any) =>
  batch?.batchNumber
    ? `Batch ${batch.batchNumber}`
    : `Batch ${String(batch?.id || "").slice(0, 8)}`;

export function HealthChecksTab({
  tankName,
  tankBatches,
  healthChecks,
  loading,
  onCreate,
  createBatchId,
  onDismissCreate,
  onCreateSuccess,
  onRefresh,
  onMarkImproved,
  improvingRecordId,
  onApplyTreatment,
  tankId,
  user,
}: HealthChecksTabProps) {
  const historyByBatch = useMemo(() => {
    const grouped = new Map<string, HealthCheckResponseDTO[]>();
    tankBatches.forEach((batch) => grouped.set(batch.id, []));
    healthChecks.forEach((record) => {
      if (!grouped.has(record.batchId)) grouped.set(record.batchId, []);
      grouped.get(record.batchId)!.push(record);
    });
    return grouped;
  }, [healthChecks, tankBatches]);

  const batchEntries = useMemo(
    () =>
      tankBatches.map((batch) => {
        const history = historyByBatch.get(batch.id) || [];
        const latestRecord = history[0] || null;
        const latestActiveRecord = history.find(isActiveHealthConcern) || null;
        const latestHealthyRecord =
          history.find((record) => !isActiveHealthConcern(record)) || null;
        const requiresAttention =
          !!latestActiveRecord &&
          (!latestHealthyRecord ||
            new Date(latestHealthyRecord.checkedAt).getTime() <
              new Date(latestActiveRecord.checkedAt).getTime());
        const isRecovered =
          !!latestActiveRecord &&
          !!latestHealthyRecord &&
          new Date(latestHealthyRecord.checkedAt).getTime() >
            new Date(latestActiveRecord.checkedAt).getTime();

        return {
          batch,
          history,
          latestRecord,
          latestActiveRecord,
          requiresAttention,
          isRecovered,
        };
      }),
    [historyByBatch, tankBatches],
  );

  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [libraryConfigs, setLibraryConfigs] = useState<HealthLibraryConfiguration[]>([]);

  useEffect(() => {
    let active = true;
    listHealthLibraryConfigurations()
      .then((configs) => {
        if (active) setLibraryConfigs(configs);
      })
      .catch(() => {
        if (active) setLibraryConfigs([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const firstBatchWithHistory = batchEntries.find(
      (entry) => entry.history.length > 0,
    )?.batch.id;
    const fallbackBatchId =
      firstBatchWithHistory || batchEntries[0]?.batch.id || "";
    setSelectedBatchId((previous) =>
      previous && batchEntries.some((entry) => entry.batch.id === previous)
        ? previous
        : fallbackBatchId,
    );
  }, [batchEntries]);

  useEffect(() => {
    if (createBatchId) {
      setSelectedBatchId(createBatchId);
    }
  }, [createBatchId]);

  const selectedBatchEntry =
    batchEntries.find((entry) => entry.batch.id === selectedBatchId) ||
    batchEntries[0] ||
    null;
  const selectedBatchHistory = selectedBatchEntry?.history || [];

  useEffect(() => {
    const fallbackRecordId = selectedBatchHistory[0]?.id || "";
    setSelectedRecordId((previous) =>
      previous && selectedBatchHistory.some((record) => record.id === previous)
        ? previous
        : fallbackRecordId,
    );
  }, [selectedBatchHistory]);

  const selectedRecord =
    selectedBatchHistory.find((record) => record.id === selectedRecordId) ||
    selectedBatchHistory[0] ||
    null;
  const selectedTemplate = resolveHealthReportTemplate(
    selectedRecord?.bacterialType,
  );
  const selectedLibraryRecommendation = useMemo<HealthLibraryRecommendation | null>(() => {
    if (!selectedRecord) return null;
    return resolveHealthLibraryRecommendation(
      libraryConfigs,
      [
        selectedRecord.bacterialType || "",
        selectedTemplate.key,
        selectedTemplate.title,
        ...selectedTemplate.aliases,
      ],
      Number(selectedRecord.bacterialLoadPercentage ?? 0),
      selectedRecord.healthStatus === "HEALTHY",
    );
  }, [libraryConfigs, selectedRecord, selectedTemplate]);

  const totalChecks = healthChecks.length;
  const activeBatches = batchEntries.filter(
    (entry) => entry.requiresAttention,
  ).length;
  const recoveredBatches = batchEntries.filter(
    (entry) => entry.isRecovered,
  ).length;
  const latestRecord = healthChecks[0] || null;
  const isTechnician = user?.role === "technician";

  const selectedBatchStatus = selectedBatchEntry?.latestRecord
    ? formatHealthStatus(selectedBatchEntry.latestRecord.healthStatus)
    : "No reports yet";
  const selectedBatchNeedsCare = Boolean(
    selectedBatchEntry?.requiresAttention,
  );

  return (
    <div className="space-y-4 pt-4">
      <div className="rounded-lg border border-[#B9E0E7] bg-[#F4FBFC] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-[#B9E0E7] bg-white px-3 py-1 text-xs font-semibold text-[#0A4D68]">
              <Stethoscope className="h-3.5 w-3.5" />
              Tank Health Checks
            </div>
            <h3 className="text-xl font-semibold text-slate-950">
              {tankName || "Selected tank"} health workspace
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Pick a batch, review its saved reports, or run an AI check from the same place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onRefresh} disabled={loading}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            {isTechnician && (
              <Button
                className="bg-[#088395] hover:bg-[#0A4D68]"
                onClick={() =>
                  onCreate(selectedBatchEntry?.batch || tankBatches[0])
                }
                disabled={tankBatches.length === 0}
              >
                <ShieldPlus className="mr-2 h-4 w-4" />
                Run AI Check
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Checks</CardTitle>
            <Stethoscope className="h-4 w-4 text-[#088395]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChecks}</div>
            <p className="mt-1 text-xs text-gray-500">Saved for this tank</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Active Batches</CardTitle>
            <Activity className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBatches}</div>
            <p className="mt-1 text-xs text-gray-500">Need follow-up now</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Recovered Batches</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recoveredBatches}</div>
            <p className="mt-1 text-xs text-gray-500">Treatment completed</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Latest Status</CardTitle>
            <ClipboardList className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {latestRecord
                ? formatHealthStatus(latestRecord.healthStatus)
                : "No Data"}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {latestRecord
                ? formatDateTime(latestRecord.checkedAt)
                : "No health history yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200">
          <div>
            <CardTitle className="text-lg">
              Batch health history
            </CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              Start by choosing a batch. The report preview updates automatically.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {createBatchId && (
            <InlineHealthCheckPanel
              tankName={tankName}
              tankBatches={tankBatches}
              batchId={createBatchId}
              onClose={onDismissCreate}
              onSuccess={onCreateSuccess}
            />
          )}

          {tankBatches.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <Stethoscope className="mx-auto mb-3 h-12 w-12 text-slate-400" />
              <p className="text-base font-semibold text-slate-700">
                No batches available for this tank.
              </p>
            </div>
          ) : (
            <>
              {selectedBatchEntry ? (
                <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
                  <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Choose batch</p>
                          <p className="text-xs text-slate-500">Reports are grouped by batch.</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            selectedBatchNeedsCare
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-slate-200 text-slate-600"
                          }
                        >
                          {selectedBatchStatus}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {batchEntries.map((entry) => {
                          const selected = selectedBatchId === entry.batch.id;
                          const statusLabel = entry.latestRecord
                            ? formatHealthStatus(entry.latestRecord.healthStatus)
                            : "No reports";
                          return (
                            <button
                              key={entry.batch.id}
                              onClick={() => setSelectedBatchId(entry.batch.id)}
                              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                                selected
                                  ? "border-[#088395] bg-white shadow-sm"
                                  : "border-transparent bg-white/70 hover:border-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {getBatchLabel(entry.batch)}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {entry.history.length} saved report
                                    {entry.history.length === 1 ? "" : "s"}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={
                                    entry.latestRecord
                                      ? getHealthStatusColor(entry.latestRecord.healthStatus)
                                      : "border-slate-200 text-slate-500"
                                  }
                                >
                                  {statusLabel}
                                </Badge>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {getBatchLabel(selectedBatchEntry.batch)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {selectedBatchHistory.length} saved report
                          {selectedBatchHistory.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-slate-200 text-slate-600"
                      >
                        {selectedBatchEntry.latestRecord
                          ? formatHealthStatus(
                              selectedBatchEntry.latestRecord.healthStatus,
                            )
                          : "No data"}
                      </Badge>
                    </div>

                    {selectedBatchEntry.latestActiveRecord &&
                      onMarkImproved &&
                      selectedBatchEntry.requiresAttention && (
                        <Button
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                          onClick={() =>
                            onMarkImproved(
                              selectedBatchEntry.batch,
                              selectedBatchEntry.latestActiveRecord!,
                            )
                          }
                          disabled={
                            improvingRecordId ===
                            selectedBatchEntry.latestActiveRecord.id
                          }
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          {improvingRecordId ===
                          selectedBatchEntry.latestActiveRecord.id
                            ? "Saving recovery..."
                            : "Mark Batch Improved"}
                        </Button>
                      )}

                    {selectedBatchHistory.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                        No health reports saved for this batch yet.
                      </div>
                    ) : (
                      selectedBatchHistory.map((record) => (
                        <button
                          key={record.id}
                          onClick={() => setSelectedRecordId(record.id)}
                          className={`w-full rounded-lg border p-3 text-left transition-colors ${
                            selectedRecord?.id === record.id
                              ? "border-[#088395] bg-white shadow-sm"
                              : "border-transparent bg-white/70 hover:border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {record.bacterialType || "Automated report"}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatDateTime(record.checkedAt)}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={getHealthStatusColor(
                                record.healthStatus,
                              )}
                            >
                              {formatHealthStatus(record.healthStatus)}
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                            <span>{formatCheckType(record.checkType)}</span>
                            {record.bacterialLoadPercentage != null && (
                              <span>
                                {Number(record.bacterialLoadPercentage).toFixed(
                                  1,
                                )}
                                %
                              </span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                    </div>
                  </div>

                  {selectedRecord ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F4FBFC] text-[#0A4D68]">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-950">Selected report</p>
                            <p className="text-xs text-slate-500">
                              {selectedRecord.bacterialType || "Automated report"} - {formatDateTime(selectedRecord.checkedAt)}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={getHealthStatusColor(selectedRecord.healthStatus)}
                        >
                          {formatHealthStatus(selectedRecord.healthStatus)}
                        </Badge>
                      </div>
                      <RobotHealthReport
                        template={selectedTemplate}
                        healthStatus={selectedRecord.healthStatus}
                        confidencePercent={
                          selectedRecord.bacterialLoadPercentage ?? null
                        }
                        checkedAt={selectedRecord.checkedAt}
                        batchLabel={getBatchLabel(selectedBatchEntry.batch)}
                        topPredictionLabel={selectedRecord.bacterialType}
                        compact
                        libraryRecommendation={selectedLibraryRecommendation}
                        requireLibraryRecommendation={selectedRecord.healthStatus !== "HEALTHY"}
                        title={
                          selectedRecord.checkType === "POST_TREATMENT"
                            ? "Recovery Health Report"
                            : "Saved Health Report"
                        }
                      />
                      {onApplyTreatment && (
                        <Button
                          className="w-full bg-[#088395] hover:bg-[#0A4D68]"
                          onClick={() =>
                            onApplyTreatment(selectedRecord.medicineId || "")
                          }
                        >
                          <Pill className="mr-2 h-4 w-4" />
                          Apply Treatment
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                      <Bot className="mb-4 h-12 w-12 text-slate-400" />
                      <p className="text-sm text-slate-600">
                        Select a report from the batch list to review the full
                        fixed report.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
