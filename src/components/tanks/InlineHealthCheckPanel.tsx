import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  ImagePlus,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
  Stethoscope,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  AIPredictResponse,
  AutomatedHealthReport,
  buildAutomatedHealthReportWithLibrary,
  getAnnotatedImageSrc,
  predictFishDisease,
} from "../../services/aiDetectionApi";
import { createHealthCheck } from "../../services/healthCheckApi";
import { RobotHealthReport } from "../health/RobotHealthReport";

interface InlineHealthCheckPanelProps {
  tankName?: string;
  tankBatches: any[];
  batchId?: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

const getBatchLabel = (batch: any) =>
  batch?.batchNumber
    ? `Batch ${batch.batchNumber}`
    : `Batch ${String(batch?.id || "").slice(0, 8)}`;

export function InlineHealthCheckPanel({
  tankName,
  tankBatches,
  batchId,
  onClose,
  onSuccess,
}: InlineHealthCheckPanelProps) {
  const defaultBatchId = useMemo(
    () => batchId || tankBatches[0]?.id || "",
    [batchId, tankBatches],
  );
  const [selectedBatchId, setSelectedBatchId] = useState(defaultBatchId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIPredictResponse | null>(null);
  const [report, setReport] = useState<AutomatedHealthReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedImage, setExpandedImage] = useState<{
    src: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    setSelectedBatchId(defaultBatchId);
  }, [defaultBatchId]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const selectedBatch =
    tankBatches.find((batch) => batch.id === selectedBatchId) || null;
  const annotatedImageSrc = getAnnotatedImageSrc(analysis);
  const hasImage = Boolean(selectedFile && previewUrl);
  const canSaveReport = Boolean(report?.isKnownClassification);

  const resetAll = () => {
    setSelectedFile(null);
    setAnalysis(null);
    setReport(null);
    setExpandedImage(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error("Choose a fish image before running the AI check.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await predictFishDisease(selectedFile);
      setAnalysis(result);
      setReport(await buildAutomatedHealthReportWithLibrary(result));
      toast.success("AI report generated.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedBatchId) {
      toast.error("Select a batch before saving the health report.");
      return;
    }
    if (!report) {
      toast.error("Run the AI check first.");
      return;
    }
    if (!report.isKnownClassification) {
      toast.error(
        report.saveBlockedReason ||
          "Unknown AI results cannot be saved to history.",
      );
      return;
    }

    setIsSaving(true);
    try {
      await createHealthCheck(selectedBatchId, {
        batchId: selectedBatchId,
        healthStatus: report.payload.healthStatus!,
        checkType: report.payload.checkType || "TARGETED",
        bacterialType: report.payload.bacterialType,
        bacterialLoadPercentage: report.payload.bacterialLoadPercentage,
        treatmentSuggestion: report.payload.treatmentSuggestion,
        feedingAdvice: report.payload.feedingAdvice,
        checkedAt: report.payload.checkedAt,
        medicineId: report.payload.medicineId || undefined,
      });
      toast.success("Health report saved to batch history.");
      resetAll();
      onSuccess?.();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full rounded-lg border border-[#B9E0E7] bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-[#B9E0E7] bg-[#F4FBFC] px-3 py-1 text-xs font-semibold text-[#0A4D68]">
              <Stethoscope className="h-3.5 w-3.5" />
              AI Health Check
            </div>
            <p className="text-lg font-semibold text-slate-900">
              {tankName || "Tank"}{" "}
              {selectedBatch ? `- ${getBatchLabel(selectedBatch)}` : ""}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Select the batch, upload a fish image, then save the verified
              report.
            </p>
          </div>
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          )}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            [
              "1",
              "Target batch",
              selectedBatch ? getBatchLabel(selectedBatch) : "Not selected",
            ],
            ["2", "Image check", hasImage ? "Image ready" : "Waiting image"],
            ["3", "Report", report ? "Ready to review" : "Not generated"],
          ].map(([step, label, value]) => (
            <div
              key={step}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0A4D68] text-xs font-bold text-white">
                {step}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900">{label}</p>
                <p className="truncate text-xs text-slate-500">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-5 border-b border-slate-200 p-4 lg:border-b-0 lg:border-r">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">
              Save target
            </label>
            <Select
              value={selectedBatchId}
              onValueChange={setSelectedBatchId}
              disabled={tankBatches.length === 0}
            >
              <SelectTrigger className="h-11 bg-white">
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                {tankBatches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {getBatchLabel(batch)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs text-slate-500">
              The report will be saved under this batch history.
            </p>
          </div>

          <Input
            id="inline-health-ai-image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) =>
              setSelectedFile(event.target.files?.[0] || null)
            }
          />

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">Fish image</p>
              {hasImage && (
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Ready
                </Badge>
              )}
            </div>
            <div className="aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-white">
              {previewUrl ? (
                <button
                  type="button"
                  className="relative h-full w-full overflow-hidden"
                  onClick={() =>
                    setExpandedImage({
                      src: previewUrl,
                      title: "Original fish image",
                    })
                  }
                >
                  <img
                    src={previewUrl}
                    alt="Fish preview"
                    className="h-full w-full object-contain p-3"
                  />
                </button>
              ) : (
                <label
                  htmlFor="inline-health-ai-image"
                  className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-6 text-center transition-colors hover:bg-[#F4FBFC]"
                >
                  <ImagePlus className="mb-3 h-9 w-9 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-800">
                    Choose fish image
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    JPG, PNG, or camera photo
                  </p>
                </label>
              )}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Button asChild variant="outline" className="h-11">
              <label
                htmlFor="inline-health-ai-image"
                className="cursor-pointer"
              >
                <ImagePlus className="mr-2 h-4 w-4" />
                {previewUrl ? "Change Image" : "Choose Image"}
              </label>
            </Button>
            <Button
              className="h-11 bg-[#088395] hover:bg-[#0A4D68]"
              onClick={handleAnalyze}
              disabled={!selectedFile || isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Run AI Check
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 sm:col-span-2 lg:col-span-1 xl:col-span-2"
              onClick={resetAll}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>

          {expandedImage && (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {expandedImage.title}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setExpandedImage(null)}
                >
                  Hide
                </Button>
              </div>
              <div className="flex h-[260px] items-center justify-center overflow-auto rounded-lg bg-slate-50">
                <img
                  src={expandedImage.src}
                  alt={expandedImage.title}
                  className="max-h-[240px] w-auto max-w-full object-contain p-2"
                />
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-4 p-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,320px)_1fr]">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">
                  AI output
                </p>
                {analysis && (
                  <Badge className="bg-[#0A4D68] text-white">
                    {report?.topPredictionDisplay || "Analyzed"}
                  </Badge>
                )}
              </div>
              <div className="aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-white">
                {annotatedImageSrc ? (
                  <button
                    type="button"
                    className="relative h-full w-full overflow-hidden"
                    onClick={() =>
                      setExpandedImage({
                        src: annotatedImageSrc,
                        title: "Annotated AI output",
                      })
                    }
                  >
                    <img
                      src={annotatedImageSrc}
                      alt="Annotated result"
                      className="h-full w-full object-contain p-3"
                    />
                  </button>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                    <Bot className="mb-3 h-9 w-9 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">
                      Run AI to show output
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0">
              {report ? (
                <div className="space-y-4">
                  {!report.isKnownClassification && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      {report.saveBlockedReason ||
                        "Unknown AI results are displayed for review only and cannot be saved to history."}
                    </div>
                  )}
                  {report.isKnownClassification && (
                    <RobotHealthReport
                      template={report.template}
                      healthStatus={report.mappedHealthStatus}
                      confidencePercent={report.confidencePercent}
                      checkedAt={report.payload.checkedAt}
                      batchLabel={
                        selectedBatch ? getBatchLabel(selectedBatch) : undefined
                      }
                      topPredictionLabel={report.topPredictionDisplay}
                      title="AI Health Report"
                      compact
                      libraryRecommendation={report.libraryRecommendation}
                      requireLibraryRecommendation={report.diseaseDetected}
                    />
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="bg-[#088395] hover:bg-[#0A4D68]"
                      onClick={handleSave}
                      disabled={isSaving || !canSaveReport}
                    >
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save to Health History
                    </Button>
                    {onClose && (
                      <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <Bot className="mb-4 h-12 w-12 text-slate-400" />
                  <p className="text-base font-semibold text-slate-800">
                    Report will appear here
                  </p>
                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    Results, health library match, treatment actions, and save
                    button stay in one place.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
