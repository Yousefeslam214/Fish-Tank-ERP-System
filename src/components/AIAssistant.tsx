import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  History,
  Loader2,
  RefreshCw,
  Sparkles,
  Stethoscope,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { User } from '../types';
import {
  AI_API_BASE,
  AIHealthServiceStatus,
  AIPredictResponse,
  AutomatedHealthReport,
  buildAutomatedHealthReportWithLibrary,
  confidenceToPercent,
  getAIServiceHealth,
  getAnnotatedImageSrc,
  humanizePredictionLabel,
  predictFishDisease,
} from '../services/aiDetectionApi';
import {
  createHealthCheck,
  formatHealthStatus,
  getHealthStatusColor,
  HealthCheckResponseDTO,
  recordRecoveredHealthCheck,
} from '../services/healthCheckApi';
import { fetchAllTankHealthOverviews, TankHealthOverview } from '../services/tankHealthOverview';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { HealthCheckModal } from './tanks/modals/HealthCheckModal';
import { HealthChecksTab } from './tanks/tabs/HealthChecksTab';
import { RobotHealthReport } from './health/RobotHealthReport';

interface AIAssistantProps {
  user: User;
}

const getBatchLabel = (batch: any) =>
  batch?.batchNumber ? `Batch ${batch.batchNumber}` : `Batch ${String(batch?.id || '').slice(0, 8)}`;

const formatDateTime = (value?: string) => {
  if (!value) return 'Unknown';
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

export default function AIAssistant({ user }: AIAssistantProps) {
  const [tanks, setTanks] = useState<any[]>([]);
  const [batchesByTank, setBatchesByTank] = useState<Record<string, any[]>>({});
  const [healthHistoryByTank, setHealthHistoryByTank] = useState<Record<string, HealthCheckResponseDTO[]>>({});
  const [healthOverviewByTank, setHealthOverviewByTank] = useState<Record<string, TankHealthOverview>>({});
  const [selectedTankId, setSelectedTankId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIPredictResponse | null>(null);
  const [report, setReport] = useState<AutomatedHealthReport | null>(null);
  const [aiHealth, setAiHealth] = useState<AIHealthServiceStatus | null>(null);
  const [loadingAIHealth, setLoadingAIHealth] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavingCheck, setIsSavingCheck] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [selectedBatchForModal, setSelectedBatchForModal] = useState<any>(null);
  const [improvingRecordId, setImprovingRecordId] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<{ src: string; title: string } | null>(null);

  const loadTankHealthHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const result = await fetchAllTankHealthOverviews();
      const overviewMap = result.overviews.reduce<Record<string, TankHealthOverview>>((acc, overview) => {
        acc[overview.tank.id] = overview;
        return acc;
      }, {});

      setTanks(result.tanks);
      setBatchesByTank(result.batchesByTank);
      setHealthHistoryByTank(result.historyByTank);
      setHealthOverviewByTank(overviewMap);
      setSelectedTankId((previous) => {
        if (previous && result.tanks.some((tank) => tank.id === previous)) return previous;
        return result.tanks[0]?.id || '';
      });
    } catch (error) {
      toast.error(`Failed to load tank health history: ${(error as Error).message}`);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const loadAIHealth = useCallback(async () => {
    setLoadingAIHealth(true);
    try {
      const nextHealth = await getAIServiceHealth();
      setAiHealth(nextHealth);
    } catch (error) {
      toast.error(`AI endpoint health check failed: ${(error as Error).message}`);
      setAiHealth(null);
    } finally {
      setLoadingAIHealth(false);
    }
  }, []);

  useEffect(() => {
    void loadTankHealthHistory();
    void loadAIHealth();
  }, [loadAIHealth, loadTankHealthHistory]);

  useEffect(() => {
    const currentBatches = batchesByTank[selectedTankId] || [];
    setSelectedBatchId((previous) => {
      if (previous && currentBatches.some((batch) => batch.id === previous)) {
        return previous;
      }
      return currentBatches[0]?.id || '';
    });
  }, [batchesByTank, selectedTankId]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const selectedTank = useMemo(
    () => tanks.find((tank) => tank.id === selectedTankId) || null,
    [selectedTankId, tanks],
  );
  const selectedTankBatches = useMemo(
    () => batchesByTank[selectedTankId] || [],
    [batchesByTank, selectedTankId],
  );
  const selectedTankHistory = useMemo(
    () => healthHistoryByTank[selectedTankId] || [],
    [healthHistoryByTank, selectedTankId],
  );
  const selectedTankOverview = healthOverviewByTank[selectedTankId] || null;
  const recentHistory = selectedTankHistory.slice(0, 3);
  const selectedBatch = selectedTankBatches.find((batch) => batch.id === selectedBatchId) || null;
  const annotatedImageSrc = getAnnotatedImageSrc(analysis);
  const matchingDiseaseHistory = useMemo(() => {
    if (!report?.isKnownClassification) return [];
    const labels = [
      report.payload.bacterialType,
      report.template.key,
      report.template.title,
      ...report.template.aliases,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());

    return selectedTankHistory
      .filter((record) => {
        const disease = String(record.bacterialType || '').toLowerCase();
        return labels.some((label) => disease && (disease.includes(label) || label.includes(disease)));
      })
      .slice(0, 5);
  }, [report, selectedTankHistory]);

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error('Please choose an image first.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await predictFishDisease(selectedFile);
      setAnalysis(result);
      setReport(await buildAutomatedHealthReportWithLibrary(result));
      toast.success('AI image analysis completed.');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!selectedBatchId) {
      toast.error('Please choose a tank batch before saving.');
      return;
    }
    if (!report) {
      toast.error('Run AI analysis before saving a health check.');
      return;
    }
    if (!report.isKnownClassification) {
      toast.error(report.saveBlockedReason || 'Unknown AI results cannot be saved to history.');
      return;
    }

    setIsSavingCheck(true);
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
        medicineId: report.payload.medicineId || undefined,
      });
      toast.success('AI health report saved to tank history.');
      await loadTankHealthHistory();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSavingCheck(false);
    }
  };

  const handleMarkImproved = async (_batch: any, record: HealthCheckResponseDTO) => {
    setImprovingRecordId(record.id);
    try {
      await recordRecoveredHealthCheck(record.batchId, record);
      toast.success('Recovery report saved.');
      await loadTankHealthHistory();
    } catch (error) {
      toast.error(`Failed to save recovery report: ${(error as Error).message}`);
    } finally {
      setImprovingRecordId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl">AI Assistant</h1>
          <p className="text-gray-600">
            Live AI endpoint status, fixed robot reports, and batch-by-batch tank health history.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-purple-100 text-purple-700">
            <Sparkles className="mr-1 h-3 w-3" />
            AI-Powered
          </Badge>
          <Badge variant="outline" className={aiHealth?.status === 'healthy' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}>
            {loadingAIHealth
              ? 'Checking AI endpoint...'
              : aiHealth?.status === 'healthy'
                ? `AI API Healthy • ${aiHealth.version || 'ready'}`
                : 'AI API status unavailable'}
          </Badge>
          <Button variant="outline" onClick={() => void loadAIHealth()} disabled={loadingAIHealth}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loadingAIHealth ? 'animate-spin' : ''}`} />
            Check AI Link
          </Button>
          <Button variant="outline" onClick={() => void loadTankHealthHistory()} disabled={loadingHistory}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loadingHistory ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 p-4 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
          <span>AI endpoint: {AI_API_BASE}</span>
          <span>
            {aiHealth?.timestamp ? `Last health check: ${formatDateTime(aiHealth.timestamp)}` : 'Health check pending'}
          </span>
        </CardContent>
      </Card>

      <Tabs defaultValue="disease" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-white lg:w-auto">
          <TabsTrigger value="disease">
            <Camera className="mr-2 h-4 w-4" />
            Disease Detection
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            Tank Health History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="disease" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Generate Fixed AI Health Report</CardTitle>
              <p className="text-xs text-gray-600">
                Select the tank and batch, run the AI image analysis, then save the fixed report into the health-check history endpoint.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="ai-tank-select">Tank</Label>
                <Select value={selectedTankId} onValueChange={setSelectedTankId}>
                  <SelectTrigger id="ai-tank-select">
                    <SelectValue placeholder="Select tank" />
                  </SelectTrigger>
                  <SelectContent>
                    {tanks.map((tank) => (
                      <SelectItem key={tank.id} value={tank.id}>
                        {tank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-batch-select">Batch</Label>
                <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                  <SelectTrigger id="ai-batch-select">
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedTankBatches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {getBatchLabel(batch)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Current tank status</Label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {selectedTankOverview?.latestRecord
                    ? `${formatHealthStatus(selectedTankOverview.latestRecord.healthStatus)} • ${selectedTankOverview.currentDiseaseLabel}`
                    : 'No saved reports yet'}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[460px_minmax(0,760px)] lg:items-start lg:justify-start">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Upload Fish Image</CardTitle>
                <p className="text-xs text-gray-600">This uses the verified AI endpoint from the CRM app integration.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  id="ai-health-image"
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
                    <div className="h-44 w-44 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 sm:h-52 sm:w-52">
                      {previewUrl ? (
                        <button
                          type="button"
                          className="relative h-full w-full cursor-zoom-in overflow-hidden"
                          onClick={() => setExpandedImage({ src: previewUrl, title: 'Original fish image' })}
                        >
                          <img src={previewUrl} alt="Selected fish" className="h-full w-full object-contain p-2" />
                          <span className="absolute bottom-2 left-2 rounded-md bg-slate-900/75 px-2 py-1 text-[10px] font-medium text-white">
                            Show below
                          </span>
                        </button>
                      ) : (
                        <label
                          htmlFor="ai-health-image"
                          className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-3 text-center transition-colors hover:bg-[#F3FBFC]"
                        >
                          <Upload className="mb-3 h-10 w-10 text-slate-400" />
                          <p className="text-sm font-medium text-slate-700">Upload image</p>
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
                    <div className="h-44 w-44 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 sm:h-52 sm:w-52">
                      {annotatedImageSrc ? (
                        <button
                          type="button"
                          className="relative h-full w-full cursor-zoom-in overflow-hidden"
                          onClick={() => setExpandedImage({ src: annotatedImageSrc, title: 'Annotated AI output' })}
                        >
                          <img src={annotatedImageSrc} alt="Annotated AI result" className="h-full w-full object-contain p-2" />
                          <span className="absolute bottom-2 left-2 rounded-md bg-slate-900/75 px-2 py-1 text-[10px] font-medium text-white">
                            Show below
                          </span>
                        </button>
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center">
                          <Camera className="mb-3 h-10 w-10 text-slate-300" />
                          <p className="text-sm font-medium text-slate-700">AI output</p>
                          <p className="mt-1 text-xs text-slate-500">Appears here after analysis</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex w-fit flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <label htmlFor="ai-health-image" className="cursor-pointer">
                      {previewUrl ? 'Change Image' : 'Choose Image'}
                    </label>
                  </Button>
                  <Button
                    className="flex-1 bg-[#088395] hover:bg-[#0A4D68]"
                    onClick={handleAnalyze}
                    disabled={!selectedFile || isAnalyzing}
                  >
                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Analyze
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
                  <div className="w-full max-w-[460px] overflow-hidden rounded-lg border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{expandedImage.title}</p>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setExpandedImage(null)}>
                        Hide
                      </Button>
                    </div>
                    <div className="flex h-[320px] items-center justify-center overflow-auto rounded-lg bg-slate-50">
                      <img src={expandedImage.src} alt={expandedImage.title} className="max-h-[300px] w-auto max-w-full object-contain p-2" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="w-full max-w-[760px]">
              <CardHeader>
                <CardTitle className="text-sm">AI Analysis Result</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[70vh] overflow-y-auto pr-1">
                {report ? (
                  <div className="space-y-4">
                    {!report.isKnownClassification && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        {report.saveBlockedReason || 'Unknown AI results are displayed for review only and cannot be saved to history.'}
                      </div>
                    )}
                    <div className="rounded-lg border border-[#CBE7EC] bg-[#F4FBFC] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#088395]">Top Prediction</p>
                          <p className="mt-1 text-lg font-bold text-slate-900">{report.topPredictionDisplay}</p>
                        </div>
                        <Badge className="bg-[#0A4D68] text-white">{report.confidencePercent.toFixed(1)}%</Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        Save target: {selectedTank?.name || 'No tank selected'}
                        {selectedBatch ? ` • ${getBatchLabel(selectedBatch)}` : ''}
                      </p>
                    </div>

                    {analysis?.predictions?.length ? (
                      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prediction Breakdown</p>
                        {analysis.predictions.slice(0, 4).map((prediction) => (
                          <div key={`${prediction.class}-${prediction.confidence}`} className="space-y-1">
                            <div className="flex items-center justify-between text-sm text-slate-700">
                              <span>{humanizePredictionLabel(prediction.class)}</span>
                              <span>{confidenceToPercent(prediction.confidence).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-[#088395]"
                                style={{ width: `${confidenceToPercent(prediction.confidence)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {report.isKnownClassification && (
                      <>
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
                          requireLibraryRecommendation={report.diseaseDetected}
                        />

                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">Previous records for this disease</p>
                              <p className="mt-1 text-xs text-slate-500">
                                Matched from saved health records for this tank using the disease name and Health Library aliases.
                              </p>
                            </div>
                            <Badge variant="outline" className="border-[#B9E0E7] text-[#0A4D68]">
                              {matchingDiseaseHistory.length} record{matchingDiseaseHistory.length === 1 ? '' : 's'}
                            </Badge>
                          </div>
                          {matchingDiseaseHistory.length === 0 ? (
                            <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                              No older saved records for this disease in the selected tank yet.
                            </p>
                          ) : (
                            <div className="mt-4 space-y-2">
                              {matchingDiseaseHistory.map((record) => (
                                <div key={record.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-slate-900">
                                      {record.bacterialType || 'Automated report'}
                                    </p>
                                    <Badge variant="outline" className={getHealthStatusColor(record.healthStatus)}>
                                      {formatHealthStatus(record.healthStatus)}
                                    </Badge>
                                  </div>
                                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(record.checkedAt)}</p>
                                  {record.bacterialLoadPercentage != null && (
                                    <p className="mt-2 text-xs text-slate-600">
                                      Recorded disease percentage: {Number(record.bacterialLoadPercentage).toFixed(1)}%
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <Button
                      className="w-full bg-[#088395] hover:bg-[#0A4D68]"
                      onClick={handleSaveAnalysis}
                      disabled={!report || !selectedBatchId || isSavingCheck || !report.isKnownClassification}
                    >
                      {isSavingCheck ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Stethoscope className="mr-2 h-4 w-4" />}
                      Save to Health History
                    </Button>
                  </div>
                ) : (
                  <div className="flex min-h-[320px] flex-col items-center justify-center text-center text-gray-500">
                    <Camera className="mb-3 h-12 w-12 text-gray-400" />
                    <p className="text-sm">Upload an image and run AI analysis first.</p>
                    <p className="mt-1 text-xs text-gray-400">The result will be saved as a fixed report tied to the detected disease template.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Checks for Selected Tank</CardTitle>
            </CardHeader>
            <CardContent>
              {recentHistory.length === 0 ? (
                <p className="py-4 text-sm text-gray-500">No health checks recorded for the selected tank yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentHistory.map((record) => (
                    <div key={record.id} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={getHealthStatusColor(record.healthStatus)}>
                          {formatHealthStatus(record.healthStatus)}
                        </Badge>
                        <Badge variant="outline" className="border-slate-200 text-slate-600">
                          {record.bacterialType || 'Automated report'}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-900">{record.bacterialType || 'No saved disease label'}</p>
                      <p className="mt-1 text-sm text-slate-500">{formatDateTime(record.checkedAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {loadingHistory && tanks.length === 0 ? (
            <Card>
              <CardContent className="flex min-h-[280px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#088395]" />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tanks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tanks.map((tank) => {
                    const overview = healthOverviewByTank[tank.id];
                    const tankHistory = healthHistoryByTank[tank.id] || [];
                    const tankBatches = batchesByTank[tank.id] || [];
                    const isActive = tank.id === selectedTankId;

                    return (
                      <button
                        key={tank.id}
                        onClick={() => setSelectedTankId(tank.id)}
                        className={`w-full rounded-lg border p-3 text-left transition-colors ${
                          isActive ? 'border-[#088395] bg-[#F3FBFC]' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{tank.name}</p>
                            <p className="text-xs text-slate-500">
                              {tankBatches.length} batch{tankBatches.length === 1 ? '' : 'es'} • {tankHistory.length} report{tankHistory.length === 1 ? '' : 's'}
                            </p>
                          </div>
                          {overview?.latestRecord ? (
                            <Badge variant="outline" className={getHealthStatusColor(overview.latestRecord.healthStatus)}>
                              {formatHealthStatus(overview.latestRecord.healthStatus)}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-slate-200 text-slate-500">No data</Badge>
                          )}
                        </div>
                        {overview?.currentDiseaseLabel && tankHistory.length > 0 && (
                          <p className="mt-2 text-xs text-slate-500">{overview.currentDiseaseLabel}</p>
                        )}
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              {selectedTank ? (
                <HealthChecksTab
                  tankBatches={selectedTankBatches}
                  healthChecks={selectedTankHistory}
                  loading={loadingHistory}
                  onCreate={(batch) => {
                    setSelectedBatchForModal(batch ?? selectedTankBatches[0] ?? null);
                    setShowHealthModal(true);
                  }}
                  onRefresh={() => void loadTankHealthHistory()}
                  onMarkImproved={handleMarkImproved}
                  improvingRecordId={improvingRecordId}
                />
              ) : (
                <Card>
                  <CardContent className="flex min-h-[280px] items-center justify-center text-sm text-slate-500">
                    Select a tank to view its health history.
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedTank && (
        <HealthCheckModal
          open={showHealthModal}
          onOpenChange={setShowHealthModal}
          tank={selectedTank}
          tankBatches={selectedTankBatches}
          batchId={selectedBatchForModal?.id}
          onSuccess={() => void loadTankHealthHistory()}
        />
      )}
    </div>
  );
}
