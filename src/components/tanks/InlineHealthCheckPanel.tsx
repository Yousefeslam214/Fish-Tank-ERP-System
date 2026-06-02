import { useEffect, useMemo, useState } from 'react';
import { Bot, ImagePlus, Loader2, Sparkles, Stethoscope, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  AIPredictResponse,
  AutomatedHealthReport,
  buildAutomatedHealthReportWithLibrary,
  getAnnotatedImageSrc,
  predictFishDisease,
} from '../../services/aiDetectionApi';
import { createHealthCheck } from '../../services/healthCheckApi';
import { RobotHealthReport } from '../health/RobotHealthReport';
import { apiGet } from '../../api';

interface InlineHealthCheckPanelProps {
  tankName?: string;
  tankBatches: any[];
  batchId?: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

const getBatchLabel = (batch: any) =>
  batch?.batchNumber ? `Batch ${batch.batchNumber}` : `Batch ${String(batch?.id || '').slice(0, 8)}`;

export function InlineHealthCheckPanel({
  tankName,
  tankBatches,
  batchId,
  onClose,
  onSuccess,
}: InlineHealthCheckPanelProps) {
  const defaultBatchId = useMemo(() => batchId || tankBatches[0]?.id || '', [batchId, tankBatches]);
  const [selectedBatchId, setSelectedBatchId] = useState(defaultBatchId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIPredictResponse | null>(null);
  const [report, setReport] = useState<AutomatedHealthReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedImage, setExpandedImage] = useState<{ src: string; title: string } | null>(null);
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [medicineOptions, setMedicineOptions] = useState<{ id: string; name: string }[]>([]);

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

  useEffect(() => {
    const loadMedicineTypes = async () => {
      try {
        const res = await apiGet<any>('/inventory/medicine-types');
        const data = res?.data ?? res;
        const items = Array.isArray(data)
          ? data.map((entry: any) => {
            const id = String(entry?.id || entry?._id || '').trim();
            const name = String(entry?.name || '').trim();
            if (!id || !name) return null;
            return { id, name };
          }).filter(Boolean)
          : [];
        setMedicineOptions(items);
      } catch {
        setMedicineOptions([]);
      }
    };
    void loadMedicineTypes();
  }, []);

  const selectedBatch = tankBatches.find((batch) => batch.id === selectedBatchId) || null;
  const annotatedImageSrc = getAnnotatedImageSrc(analysis);

  const resetAll = () => {
    setSelectedFile(null);
    setAnalysis(null);
    setReport(null);
    setExpandedImage(null);
    setSelectedMedicineId('');
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error('Choose a fish image before running the AI check.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await predictFishDisease(selectedFile);
      setAnalysis(result);
      setReport(await buildAutomatedHealthReportWithLibrary(result));
      toast.success('AI report generated.');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedBatchId) {
      toast.error('Select a batch before saving the health report.');
      return;
    }
    if (!report) {
      toast.error('Run the AI check first.');
      return;
    }
    if (!report.isKnownClassification) {
      toast.error(report.saveBlockedReason || 'Unknown AI results cannot be saved to history.');
      return;
    }

    setIsSaving(true);
    try {
      await createHealthCheck(selectedBatchId, {
        batchId: selectedBatchId,
        healthStatus: report.payload.healthStatus!,
        checkType: report.payload.checkType || 'TARGETED',
        bacterialType: report.payload.bacterialType,
        bacterialLoadPercentage: report.payload.bacterialLoadPercentage,
        treatmentSuggestion: report.payload.treatmentSuggestion,
        feedingAdvice: report.payload.feedingAdvice,
        checkedAt: report.payload.checkedAt,
        medicineId: selectedMedicineId || undefined,
      });
      toast.success('Health report saved to batch history.');
      resetAll();
      onSuccess?.();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-[1120px] rounded-3xl border border-[#B9E0E7] bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#B9E0E7] bg-[#F4FBFC] px-3 py-1 text-xs font-semibold text-[#0A4D68]">
            <Stethoscope className="h-3.5 w-3.5" />
            Inline AI Health Check
          </div>
          <p className="text-lg font-semibold text-slate-900">
            {tankName || 'Tank'} {selectedBatch ? `• ${getBatchLabel(selectedBatch)}` : ''}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Run the AI check directly inside the page body. No popup is used here.
          </p>
        </div>
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)] lg:items-start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inline-health-batch">Batch</Label>
            <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
              <SelectTrigger id="inline-health-batch">
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="inline-health-medicine">Medicine</Label>
            <Select value={selectedMedicineId} onValueChange={setSelectedMedicineId}>
              <SelectTrigger id="inline-health-medicine">
                <SelectValue placeholder="-- اختر الدواء --" />
              </SelectTrigger>
              <SelectContent>
                {medicineOptions.map((med) => (
                  <SelectItem key={med.id} value={med.id}>
                    {med.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            id="inline-health-ai-image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          />

          <div className="grid w-fit grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Original</p>
              <div className="h-40 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:h-48 sm:w-48">
                {previewUrl ? (
                  <button
                    type="button"
                    className="relative h-full w-full overflow-hidden"
                    onClick={() => setExpandedImage({ src: previewUrl, title: 'Original fish image' })}
                  >
                    <img src={previewUrl} alt="Fish preview" className="h-full w-full object-contain p-2" />
                  </button>
                ) : (
                  <label
                    htmlFor="inline-health-ai-image"
                    className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-2 text-center transition-colors hover:bg-[#F4FBFC]"
                  >
                    <ImagePlus className="mb-2 h-7 w-7 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-700">Upload</p>
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI Output</p>
              <div className="h-40 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:h-48 sm:w-48">
                {annotatedImageSrc ? (
                  <button
                    type="button"
                    className="relative h-full w-full overflow-hidden"
                    onClick={() => setExpandedImage({ src: annotatedImageSrc, title: 'Annotated AI output' })}
                  >
                    <img src={annotatedImageSrc} alt="Annotated result" className="h-full w-full object-contain p-2" />
                  </button>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center">
                    <Bot className="mb-2 h-7 w-7 text-slate-300" />
                    <p className="text-[11px] font-semibold text-slate-600">After AI</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex w-fit flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <label htmlFor="inline-health-ai-image" className="cursor-pointer">
                {previewUrl ? 'Change Image' : 'Choose Image'}
              </label>
            </Button>
            <Button
              size="sm"
              className="bg-[#088395] hover:bg-[#0A4D68]"
              onClick={handleAnalyze}
              disabled={!selectedFile || isAnalyzing}
            >
              {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Run AI Check
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={resetAll}>
              Reset
            </Button>
          </div>

          {expandedImage && (
            <div className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{expandedImage.title}</p>
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setExpandedImage(null)}>
                  Hide
                </Button>
              </div>
              <div className="flex h-[300px] items-center justify-center overflow-auto rounded-xl bg-slate-50">
                <img src={expandedImage.src} alt={expandedImage.title} className="max-h-[280px] w-auto max-w-full object-contain p-2" />
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-[#D7E9EE] bg-[#F8FBFC] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Selected save target</p>
                <p className="text-sm text-slate-500">
                  {tankName || 'No tank selected'}
                  {selectedBatch ? ` • ${getBatchLabel(selectedBatch)}` : ''}
                </p>
              </div>
              {report && <Badge className="bg-[#0A4D68] text-white">{report.topPredictionDisplay}</Badge>}
            </div>
          </div>

          <div className="max-h-[62vh] overflow-y-auto pr-1">
            {report ? (
              <div className="space-y-4">
                {!report.isKnownClassification && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    {report.saveBlockedReason || 'Unknown AI results are displayed for review only and cannot be saved to history.'}
                  </div>
                )}
                <RobotHealthReport
                  template={report.template}
                  healthStatus={report.mappedHealthStatus}
                  confidencePercent={report.confidencePercent}
                  checkedAt={report.payload.checkedAt}
                  batchLabel={selectedBatch ? getBatchLabel(selectedBatch) : undefined}
                  topPredictionLabel={report.topPredictionDisplay}
                  title="Fixed AI Health Report"
                  compact
                  libraryRecommendation={report.libraryRecommendation}
                  requireLibraryRecommendation
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="bg-[#088395] hover:bg-[#0A4D68]"
                    onClick={handleSave}
                    disabled={isSaving || !report.isKnownClassification}
                  >
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Stethoscope className="mr-2 h-4 w-4" />}
                    Save Health Report
                  </Button>
                  {onClose && (
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <Bot className="mb-4 h-12 w-12 text-slate-400" />
                <p className="text-base font-semibold text-slate-800">No report generated yet</p>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                  Upload a fish image and run the AI check. The report will appear here inside the same page body.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
