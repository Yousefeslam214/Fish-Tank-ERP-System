import type { CreateHealthCheckDTO, HealthStatus } from './healthCheckApi';
import { resolveHealthReportTemplate } from './healthKnowledgeBase';
import {
  HealthLibraryRecommendation,
  listHealthLibraryConfigurations,
  resolveHealthLibraryRecommendation,
} from './healthLibraryApi';

export interface AIPredictionClass {
  class: string;
  confidence: number;
  raw_output?: number;
}

export interface AIDetectionObject {
  class: string;
  confidence: number;
  bbox: number[];
}

export interface AIPredictResponse {
  success?: boolean;
  predictions: AIPredictionClass[];
  top_prediction: AIPredictionClass;
  processing_time_ms?: number;
  timestamp?: string;
  annotated_image?: string;
  detections?: AIDetectionObject[];
  error?: string;
}

export interface AIHealthServiceStatus {
  status?: string;
  model_loaded?: boolean;
  version?: string;
  timestamp?: string;
}

export interface AutomatedHealthReport {
  topPredictionLabel: string;
  topPredictionDisplay: string;
  confidencePercent: number;
  template: ReturnType<typeof resolveHealthReportTemplate>;
  payload: Partial<CreateHealthCheckDTO>;
  diseaseDetected: boolean;
  mappedHealthStatus: HealthStatus;
  isKnownClassification: boolean;
  saveBlockedReason?: string;
  libraryRecommendation?: HealthLibraryRecommendation | null;
}

const DEFAULT_AI_API_BASE = 'https://yousseftallal-ai-fisherman.hf.space';

const getEnvValue = (key: string): string | undefined => {
  const importMetaEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const fromVite = importMetaEnv?.[key];
  if (fromVite?.trim()) return fromVite.trim();

  if (typeof process !== 'undefined' && process.env?.[key]?.trim()) {
    return process.env[key]?.trim();
  }

  return undefined;
};

export const AI_API_BASE = (
  getEnvValue('VITE_FISH_AI_API_BASE_URL') ||
  getEnvValue('FISH_AI_API_BASE_URL') ||
  DEFAULT_AI_API_BASE
).replace(/\/+$/, '');

const normalizeConfidence = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return value <= 1 ? value * 100 : value;
};

export const confidenceToPercent = (value: number) =>
  Math.max(0, Math.min(100, normalizeConfidence(value)));

export const humanizePredictionLabel = (value?: string) => {
  if (!value) return 'Unknown';
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

export const isHealthyPrediction = (value?: string) =>
  (value || '').toLowerCase().includes('healthy');

const UNKNOWN_CLASSIFICATION_MARKERS = [
  'unknown',
  'unrecognized',
  'other',
  'non fish',
  'non-fish',
  'not fish',
  'no fish',
  'invalid',
  'background',
  'noise',
];

export const isKnownDiseaseClassification = (value?: string) => {
  const normalized = (value || '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return false;
  return !UNKNOWN_CLASSIFICATION_MARKERS.some((marker) => normalized.includes(marker));
};

export const mapPredictionToHealthStatus = (
  value?: string,
  confidence = 0,
): HealthStatus => {
  if (isHealthyPrediction(value)) return 'HEALTHY';

  const percent = confidenceToPercent(confidence);
  if (percent >= 90) return 'CRITICAL';
  if (percent >= 80) return 'SEVERE';
  if (percent >= 65) return 'MODERATE_CONCERN';
  return 'MILD_CONCERN';
};

export const buildAutomatedHealthReportFromAnalysis = (
  analysis: AIPredictResponse,
  libraryRecommendation?: HealthLibraryRecommendation | null,
): AutomatedHealthReport => {
  const topPrediction = analysis.top_prediction;
  const confidencePercent = confidenceToPercent(topPrediction?.confidence ?? 0);
  const topPredictionLabel = topPrediction?.class || '';
  const topPredictionDisplay = humanizePredictionLabel(topPredictionLabel);
  const template = resolveHealthReportTemplate(topPredictionLabel);
  const mappedHealthStatus = mapPredictionToHealthStatus(
    topPredictionLabel,
    topPrediction?.confidence,
  );
  const isKnownClassification = isKnownDiseaseClassification(topPredictionLabel);
  const diseaseDetected = isKnownClassification && mappedHealthStatus !== 'HEALTHY';
  const saveBlockedReason = isKnownClassification
    ? undefined
    : 'The AI marked this image as unknown or not a valid fish disease case, so it cannot be saved to history.';
  const adminRecommendationLines = libraryRecommendation?.recommendations?.length
    ? [
      ...(libraryRecommendation.level ? [`Level: ${libraryRecommendation.level}`] : []),
      ...(libraryRecommendation.status ? [`Status: ${libraryRecommendation.status}`] : []),
      ...(libraryRecommendation.risk ? [`Risk: ${libraryRecommendation.risk}`] : []),
      ...(libraryRecommendation.medicineName ? [`Medicine: ${libraryRecommendation.medicineName}`] : []),
      ...libraryRecommendation.recommendations,
    ]
    : [];

  return {
    topPredictionLabel,
    topPredictionDisplay,
    confidencePercent,
    template,
    diseaseDetected,
    mappedHealthStatus,
    isKnownClassification,
    saveBlockedReason,
    libraryRecommendation: libraryRecommendation || null,
    payload: {
      checkType: 'TARGETED',
      healthStatus: diseaseDetected ? mappedHealthStatus : 'HEALTHY',
      bacterialType: isKnownClassification ? template.title : 'Unknown / Unrecognized Result',
      bacterialLoadPercentage: Number(confidencePercent.toFixed(2)),
      treatmentSuggestion: isKnownClassification
        ? (adminRecommendationLines.length
          ? adminRecommendationLines.join(' ')
          : 'No Disease Library level matched this disease and confidence range.')
        : 'No treatment protocol is generated for unknown or invalid classifications.',
      dosageInstructions: undefined,
      suggestedDuration: undefined,
      feedingAdvice: isKnownClassification
        ? (libraryRecommendation?.feedingGuidance?.join(' ') || libraryRecommendation?.message || libraryRecommendation?.risk || undefined)
        : 'Run another check with a clear fish image before taking action.',
      medicineId: undefined,
      checkedAt: analysis.timestamp || new Date().toISOString(),
    },
  };
};

const resolveLibraryRecommendationFromAnalysis = (
  analysis: AIPredictResponse,
  configs: Parameters<typeof resolveHealthLibraryRecommendation>[0] = [],
) => {
  const topPrediction = analysis.top_prediction;
  const label = topPrediction?.class || '';
  const template = resolveHealthReportTemplate(label);
  const confidencePercent = confidenceToPercent(topPrediction?.confidence ?? 0);
  const isKnownClassification = isKnownDiseaseClassification(label);

  return isKnownClassification
    ? resolveHealthLibraryRecommendation(
      configs,
      [label, template.key, template.title, ...template.aliases],
      confidencePercent,
      isHealthyPrediction(label),
    )
    : null;
};

export const buildAutomatedHealthReportWithLibrary = async (
  analysis: AIPredictResponse,
): Promise<AutomatedHealthReport> => {
  try {
    const configs = await listHealthLibraryConfigurations();
    const recommendation = resolveLibraryRecommendationFromAnalysis(analysis, configs);
    return buildAutomatedHealthReportFromAnalysis(analysis, recommendation);
  } catch {
    return buildAutomatedHealthReportFromAnalysis(
      analysis,
      resolveLibraryRecommendationFromAnalysis(analysis),
    );
  }
};

export const buildHealthCheckDraftFromAnalysis = (
  analysis: AIPredictResponse,
): Partial<CreateHealthCheckDTO> => buildAutomatedHealthReportFromAnalysis(analysis).payload;

export const getAnnotatedImageSrc = (analysis?: AIPredictResponse | null) => {
  const image = analysis?.annotated_image?.trim();
  if (!image) return null;
  return image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
};

export const getAIServiceHealth = async (): Promise<AIHealthServiceStatus> => {
  const response = await fetch(`${AI_API_BASE}/health`);
  const text = await response.text();
  const parsed = text.trim() ? (JSON.parse(text) as AIHealthServiceStatus) : null;

  if (!response.ok) {
    throw new Error(`AI health check failed [${response.status}]: ${text || response.statusText}`);
  }

  return parsed || {};
};

export const predictFishDisease = async (
  file: File,
): Promise<AIPredictResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${AI_API_BASE}/predict`, {
    method: 'POST',
    body: formData,
  });

  const text = await response.text();
  const parsed = text.trim() ? (JSON.parse(text) as AIPredictResponse) : null;

  if (!response.ok) {
    const errorMessage =
      parsed?.error ||
      (parsed as Record<string, any> | null)?.detail ||
      text ||
      response.statusText;
    throw new Error(`AI prediction failed [${response.status}]: ${errorMessage}`);
  }

  if (!parsed?.top_prediction) {
    throw new Error('AI prediction response is missing the top prediction.');
  }

  return parsed;
};
