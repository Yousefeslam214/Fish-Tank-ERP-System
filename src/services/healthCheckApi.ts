import { apiDelete, apiGet, apiPatch, apiPost } from '../api';
import { resolveHealthReportTemplate } from './healthKnowledgeBase';

export type HealthStatus =
  | 'HEALTHY'
  | 'MILD_CONCERN'
  | 'MODERATE_CONCERN'
  | 'SEVERE'
  | 'CRITICAL';

export type CheckType =
  | 'ROUTINE'
  | 'TARGETED'
  | 'POST_TREATMENT'
  | 'EMERGENCY';

export interface CreateHealthCheckDTO {
  batchId: string;
  healthStatus: HealthStatus;
  checkType: CheckType;
  bacterialType?: string;
  bacterialLoadPercentage?: number;
  treatmentSuggestion?: string;
  dosageInstructions?: string;
  suggestedDuration?: string;
  feedingAdvice?: string;
  photos?: string;
  medicineId?: string;
  checkedAt?: string;
}

export interface UpdateHealthCheckDTO {
  healthStatus?: HealthStatus;
  checkType?: CheckType;
  bacterialType?: string;
  bacterialLoadPercentage?: number;
  treatmentSuggestion?: string;
  dosageInstructions?: string;
  suggestedDuration?: string;
  feedingAdvice?: string;
  photos?: string;
  medicineId?: string;
  diseaseDetected?: boolean;
  mortalityEvent?: boolean;
}

export interface HealthCheckResponseDTO {
  id: string;
  batchId: string;
  checkedAt: string;
  checkType: CheckType;
  healthStatus: HealthStatus;
  diseaseDetected: boolean;
  mortalityEvent: boolean;
  bacterialType?: string;
  bacterialLoadPercentage?: number;
  treatmentSuggestion?: string;
  dosageInstructions?: string;
  suggestedDuration?: string;
  feedingAdvice?: string;
  photos?: string;
  medicineId?: string;
  treatmentApplied: boolean;
  treatmentStartDate?: string;
  treatmentEndDate?: string;
  treatmentNotes?: string;
  notes?: string;
}

const asRecord = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' ? (value as Record<string, any>) : {};

const unwrapPayload = <T>(payload: unknown): T => {
  const record = asRecord(payload);
  return (record.data ?? record.result ?? record.item ?? payload) as T;
};

const unwrapArray = <T>(payload: unknown): T[] => {
  const unwrapped = unwrapPayload<any>(payload);
  if (Array.isArray(unwrapped)) return unwrapped as T[];

  const record = asRecord(unwrapped);
  if (Array.isArray(record.items)) return record.items as T[];
  if (Array.isArray(record.records)) return record.records as T[];
  if (Array.isArray(record.history)) return record.history as T[];

  return [];
};

export const sortHealthChecks = (records: HealthCheckResponseDTO[]) =>
  [...records].sort(
    (left, right) =>
      new Date(right.checkedAt || 0).getTime() -
      new Date(left.checkedAt || 0).getTime(),
  );

export const isActiveHealthConcern = (
  record?: Pick<HealthCheckResponseDTO, 'healthStatus' | 'diseaseDetected'> | null,
) => !!record && (record.healthStatus !== 'HEALTHY' || record.diseaseDetected);

export const createHealthCheck = async (
  batchId: string,
  data: CreateHealthCheckDTO,
): Promise<HealthCheckResponseDTO> => {
  const payload = await apiPost<unknown>(`/tanks/health-checks/${batchId}`, data);
  return unwrapPayload<HealthCheckResponseDTO>(payload);
};

export const getBatchHealthHistory = async (
  batchId: string,
): Promise<HealthCheckResponseDTO[]> => {
  const payload = await apiGet<unknown>(`/tanks/health-checks/batch/${batchId}`);
  return sortHealthChecks(unwrapArray<HealthCheckResponseDTO>(payload));
};

export const getHealthCheckById = async (
  id: string,
): Promise<HealthCheckResponseDTO> => {
  const payload = await apiGet<unknown>(`/tanks/health-checks/${id}`);
  return unwrapPayload<HealthCheckResponseDTO>(payload);
};

export const updateHealthCheck = async (
  id: string,
  data: UpdateHealthCheckDTO,
): Promise<HealthCheckResponseDTO> => {
  const payload = await apiPatch<unknown>(`/tanks/health-checks/${id}`, data);
  return unwrapPayload<HealthCheckResponseDTO>(payload);
};

export const deleteHealthCheck = async (id: string): Promise<void> => {
  await apiDelete(`/tanks/health-checks/${id}`);
};

export const getTankHealthHistory = async (
  batchIds: string[],
): Promise<HealthCheckResponseDTO[]> => {
  const uniqueBatchIds = [...new Set(batchIds.filter(Boolean))];
  if (uniqueBatchIds.length === 0) return [];

  const results = await Promise.allSettled(
    uniqueBatchIds.map((batchId) => getBatchHealthHistory(batchId)),
  );

  return sortHealthChecks(
    results.flatMap((result) => (result.status === 'fulfilled' ? result.value : [])),
  );
};

export const buildRecoveryHealthCheckPayload = (
  batchId: string,
  sourceRecord: HealthCheckResponseDTO,
): CreateHealthCheckDTO => {
  const template = resolveHealthReportTemplate(sourceRecord.bacterialType);
  const trackedDisease = sourceRecord.bacterialType || template.title;

  return {
    batchId,
    checkedAt: new Date().toISOString(),
    checkType: 'POST_TREATMENT',
    healthStatus: 'HEALTHY',
    bacterialType: trackedDisease,
    bacterialLoadPercentage: 0,
    treatmentSuggestion: `Recovery confirmed after treatment for ${trackedDisease}. Continue routine observation and keep the batch under daily review.`,
    dosageInstructions:
      'No additional medication is recommended now unless symptoms return and the health team confirms relapse.',
    suggestedDuration: '7 days post-treatment observation',
    feedingAdvice:
      'Return gradually to the standard feeding schedule while monitoring appetite and swimming behavior.',
  };
};

export const recordRecoveredHealthCheck = async (
  batchId: string,
  sourceRecord: HealthCheckResponseDTO,
): Promise<HealthCheckResponseDTO> =>
  createHealthCheck(batchId, buildRecoveryHealthCheckPayload(batchId, sourceRecord));

export const getHealthStatusColor = (status: string) => {
  const normalized = status.toUpperCase();
  switch (normalized) {
    case 'HEALTHY':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'MILD_CONCERN':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'MODERATE_CONCERN':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'SEVERE':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'CRITICAL':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const formatHealthStatus = (status: string) =>
  status
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

export const formatCheckType = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
