import { useEffect, useMemo, useState } from 'react';
import { Bot, ImagePlus, Loader2, Sparkles, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  AIPredictResponse,
  AutomatedHealthReport,
  buildAutomatedHealthReportWithLibrary,
  getAnnotatedImageSrc,
  predictFishDisease,
} from '../../../services/aiDetectionApi';
import { createHealthCheck } from '../../../services/healthCheckApi';
import { RobotHealthReport } from '../../health/RobotHealthReport';
import { apiGet } from '../../../api';

interface HealthCheckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tank: any;
  tankBatches: any[];
  batchId?: string;
  onSuccess?: () => void;
}

const getBatchLabel = (batch: any) =>
  batch?.batchNumber ? `Batch ${batch.batchNumber}` : `Batch ${String(batch?.id || '').slice(0, 8)}`;

export function HealthCheckModal({
  open,
  onOpenChange,
  tank,
  tankBatches,
  batchId,
  onSuccess,
}: HealthCheckModalProps) {
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
    if (!open) return;
    setSelectedBatchId(defaultBatchId);
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysis(null);
    setReport(null);
    setExpandedImage(null);
    setSelectedMedicineId('');
  }, [defaultBatchId, open]);

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

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error('Choose a fish image before running the AI check.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await predictFishDisease(selectedFile);
      const automatedReport = await buildAutomatedHealthReportWithLibrary(result);
      setAnalysis(result);
      setReport(automatedReport);
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
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-[#088395]" />
            AI Health Check
          </DialogTitle>
          <DialogDescription>
            Upload a fish image, generate a fixed robot report, then save it to the selected batch in {tank?.name || 'this tank'}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[430px_minmax(0,640px)] lg:items-start lg:justify-start">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="health-batch">Batch</Label>
                  <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                    <SelectTrigger id="health-batch">
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
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="health-medicine">Medicine</Label>
                  <Select value={selectedMedicineId} onValueChange={setSelectedMedicineId}>
                    <SelectTrigger id="health-medicine">
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
              </div>
            </div>

            <Input
              id="health-ai-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            />

            <div className="grid w-fit grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Original image</p>
                  {previewUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-[#0A4D68]"
                      onClick={() => setExpandedImage({ src: previewUrl, title: 'Original fish image' })}
                    >
                      Preview
                    </Button>
                  )}
                </div>
                <div className="h-44 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:h-52 sm:w-52">
                  {previewUrl ? (
                    <button
                      type="button"
                      className="relative h-full w-full cursor-zoom-in overflow-hidden"
                      onClick={() => setExpandedImage({ src: previewUrl, title: 'Original fish image' })}
                    >
                      <img src={previewUrl} alt="Fish preview" className="h-full w-full object-contain p-2" />
                      <span className="absolute bottom-2 left-2 rounded-md bg-slate-900/75 px-2 py-1 text-[10px] font-medium text-white">
                        Show below
                      </span>
                    </button>
                  ) : (
                    <label
                      htmlFor="health-ai-image"
                      className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-3 text-center transition-colors hover:bg-[#F4FBFC]"
                    >
                      <ImagePlus className="mb-3 h-10 w-10 text-slate-400" />
                      <p className="text-sm font-semibold text-slate-800">Upload image</p>
                      <p className="mt-1 text-xs text-slate-500">Stays inside this square</p>
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI output</p>
                  {annotatedImageSrc && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-[#0A4D68]"
                      onClick={() => setExpandedImage({ src: annotatedImageSrc, title: 'Annotated AI output' })}
                    >
                      Preview
                    </Button>
                  )}
                </div>
                <div className="h-44 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:h-52 sm:w-52">
                  {annotatedImageSrc ? (
                    <button
                      type="button"
                      className="relative h-full w-full cursor-zoom-in overflow-hidden"
                      onClick={() => setExpandedImage({ src: annotatedImageSrc, title: 'Annotated AI output' })}
                    >
                      <img src={annotatedImageSrc} alt="Annotated result" className="h-full w-full object-contain p-2" />
                      <span className="absolute bottom-2 left-2 rounded-md bg-slate-900/75 px-2 py-1 text-[10px] font-medium text-white">
                        Show below
                      </span>
                    </button>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center">
                      <Bot className="mb-3 h-10 w-10 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-700">AI result</p>
                      <p className="mt-1 text-xs text-slate-500">Appears here after analysis</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex w-fit flex-wrap gap-2">
              <Button asChild variant="outline">
                <label htmlFor="health-ai-image" className="cursor-pointer">
                  {previewUrl ? 'Change Image' : 'Choose Image'}
                </label>
              </Button>
              <Button
                className="bg-[#088395] hover:bg-[#0A4D68]"
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
                variant="outline"
                onClick={() => {
                  setSelectedFile(null);
                  setAnalysis(null);
                  setReport(null);
                }}
              >
                Reset
              </Button>
            </div>

            {expandedImage && (
              <div className="w-full max-w-[430px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{expandedImage.title}</p>
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setExpandedImage(null)}>
                    Hide
                  </Button>
                </div>
                <div className="flex h-[320px] items-center justify-center overflow-auto rounded-xl bg-slate-50">
                  <img src={expandedImage.src} alt={expandedImage.title} className="max-h-[300px] w-auto max-w-full object-contain p-2" />
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 max-w-[640px] space-y-4">
            <div className="rounded-2xl border border-[#D7E9EE] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Selected save target</p>
                  <p className="text-sm text-slate-500">
                    {tank?.name || 'No tank selected'}
                    {selectedBatch ? ` • ${getBatchLabel(selectedBatch)}` : ''}
                  </p>
                </div>
                {report && (
                  <Badge className="bg-[#0A4D68] text-white">
                    {report.topPredictionDisplay}
                  </Badge>
                )}
              </div>
            </div>

            <div className="max-h-[58vh] overflow-y-auto pr-1">
            {report ? (
              <>
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
                  libraryRecommendation={report.libraryRecommendation}
                  requireLibraryRecommendation
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#088395] hover:bg-[#0A4D68]"
                    onClick={handleSave}
                    disabled={isSaving || !report.isKnownClassification}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Stethoscope className="mr-2 h-4 w-4" />
                    )}
                    Save Health Report
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <Bot className="mb-4 h-14 w-14 text-slate-400" />
                <p className="text-base font-semibold text-slate-800">No report generated yet</p>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                  The AI output will be transformed into a locked report based on the disease template and saved directly to batch health history.
                </p>
              </div>
            )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
