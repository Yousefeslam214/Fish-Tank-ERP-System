import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  CheckCircle2,
  ClipboardList,
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

  const totalChecks = healthChecks.length;
  const activeBatches = batchEntries.filter(
    (entry) => entry.requiresAttention,
  ).length;
  const recoveredBatches = batchEntries.filter(
    (entry) => entry.isRecovered,
  ).length;
  const latestRecord = healthChecks[0] || null;
  const isTechnician = user?.role === "technician";
  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Checks</CardTitle>
            <Stethoscope className="h-4 w-4 text-[#088395]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChecks}</div>
            <p className="mt-1 text-xs text-gray-500">Saved for this tank</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Active Batches</CardTitle>
            <Activity className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBatches}</div>
            <p className="mt-1 text-xs text-gray-500">Need follow-up now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Recovered Batches</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recoveredBatches}</div>
            <p className="mt-1 text-xs text-gray-500">Treatment completed</p>
          </CardContent>
        </Card>
        <Card>
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

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">
              Batch-by-Batch Health History
            </CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              Each batch keeps its own separate AI report list. Reports are
              fixed and linked to the detected disease template.
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
              >
                <ShieldPlus className="mr-2 h-4 w-4" />
                Run AI Check
              </Button>
            )}
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
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <Stethoscope className="mx-auto mb-3 h-12 w-12 text-slate-400" />
              <p className="text-base font-semibold text-slate-700">
                No batches available for this tank.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {batchEntries.map((entry) => (
                  <button
                    key={entry.batch.id}
                    onClick={() => setSelectedBatchId(entry.batch.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                      selectedBatchId === entry.batch.id
                        ? "border-[#088395] bg-[#F3FBFC]"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {getBatchLabel(entry.batch)}
                      </p>
                      {entry.latestRecord ? (
                        <Badge
                          variant="outline"
                          className={getHealthStatusColor(
                            entry.latestRecord.healthStatus,
                          )}
                        >
                          {formatHealthStatus(entry.latestRecord.healthStatus)}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-slate-200 text-slate-500"
                        >
                          No records
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {entry.history.length} report
                      {entry.history.length === 1 ? "" : "s"}
                    </p>
                  </button>
                ))}
              </div>

              {selectedBatchEntry ? (
                <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
                  <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
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
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                        No health reports saved for this batch yet.
                      </div>
                    ) : (
                      selectedBatchHistory.map((record) => (
                        <button
                          key={record.id}
                          onClick={() => setSelectedRecordId(record.id)}
                          className={`w-full rounded-2xl border p-3 text-left transition-colors ${
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

                  {selectedRecord ? (
                    <>
                      <RobotHealthReport
                        template={selectedTemplate}
                        healthStatus={selectedRecord.healthStatus}
                        confidencePercent={
                          selectedRecord.bacterialLoadPercentage ?? null
                        }
                        checkedAt={selectedRecord.checkedAt}
                        batchLabel={getBatchLabel(selectedBatchEntry.batch)}
                        topPredictionLabel={selectedRecord.bacterialType}
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
                    </>
                  ) : (
                    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
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
