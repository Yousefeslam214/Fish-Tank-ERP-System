import { apiGet } from '../api';
import {
  getTankHealthHistory,
  HealthCheckResponseDTO,
  isActiveHealthConcern,
  sortHealthChecks,
} from './healthCheckApi';
import { resolveHealthReportTemplate } from './healthKnowledgeBase';

const extractArray = (payload: unknown): any[] => {
  const root = payload && typeof payload === 'object' ? (payload as Record<string, any>) : {};
  const unwrapped = root.data ?? root;
  if (Array.isArray(unwrapped)) return unwrapped;
  if (Array.isArray((unwrapped as Record<string, any>)?.items)) {
    return (unwrapped as Record<string, any>).items;
  }
  if (Array.isArray((unwrapped as Record<string, any>)?.records)) {
    return (unwrapped as Record<string, any>).records;
  }
  if (Array.isArray((unwrapped as Record<string, any>)?.history)) {
    return (unwrapped as Record<string, any>).history;
  }
  return [];
};

export interface BatchHealthOverview {
  batch: any;
  history: HealthCheckResponseDTO[];
  latestRecord: HealthCheckResponseDTO | null;
  latestActiveRecord: HealthCheckResponseDTO | null;
  requiresAttention: boolean;
  isRecovered: boolean;
  recoveredAt?: string;
}

export interface TankHealthOverview {
  tank: any;
  batches: any[];
  healthChecks: HealthCheckResponseDTO[];
  batchOverviews: BatchHealthOverview[];
  latestRecord: HealthCheckResponseDTO | null;
  latestActiveRecord: HealthCheckResponseDTO | null;
  latestHealthyRecord: HealthCheckResponseDTO | null;
  requiresAttention: boolean;
  isRecovered: boolean;
  recoveredAt?: string;
  currentDiseaseLabel: string;
  currentTemplateKey: string;
}

const buildBatchOverview = (batch: any, history: HealthCheckResponseDTO[]): BatchHealthOverview => {
  const sorted = sortHealthChecks(history);
  const latestRecord = sorted[0] || null;
  const latestActiveRecord = sorted.find(isActiveHealthConcern) || null;
  const latestHealthyRecord = sorted.find((record) => !isActiveHealthConcern(record)) || null;
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
    history: sorted,
    latestRecord,
    latestActiveRecord,
    requiresAttention,
    isRecovered,
    recoveredAt: isRecovered ? latestHealthyRecord?.checkedAt : undefined,
  };
};

export const buildTankHealthOverview = (
  tank: any,
  batches: any[],
  records: HealthCheckResponseDTO[],
): TankHealthOverview => {
  const sorted = sortHealthChecks(records);
  const latestRecord = sorted[0] || null;
  const latestActiveRecord = sorted.find(isActiveHealthConcern) || null;
  const latestHealthyRecord = sorted.find((record) => !isActiveHealthConcern(record)) || null;
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

  const batchOverviews = batches.map((batch) =>
    buildBatchOverview(
      batch,
      sorted.filter((record) => record.batchId === batch.id),
    ),
  );

  const diseaseSource = latestActiveRecord || latestRecord;
  const template = resolveHealthReportTemplate(diseaseSource?.bacterialType);

  return {
    tank,
    batches,
    healthChecks: sorted,
    batchOverviews,
    latestRecord,
    latestActiveRecord,
    latestHealthyRecord,
    requiresAttention,
    isRecovered,
    recoveredAt: isRecovered ? latestHealthyRecord?.checkedAt : undefined,
    currentDiseaseLabel: diseaseSource?.bacterialType || template.title,
    currentTemplateKey: template.key,
  };
};

export const fetchTankHealthOverview = async (
  tank: any,
): Promise<TankHealthOverview> => {
  const batchesPayload = await apiGet<unknown>(`/tanks/${tank.id}/batches`);
  const batches = extractArray(batchesPayload);
  const history = await getTankHealthHistory(batches.map((batch) => batch.id));
  return buildTankHealthOverview(tank, batches, history);
};

export const fetchAllTankHealthOverviews = async (
  incomingTanks?: any[],
): Promise<{
  tanks: any[];
  overviews: TankHealthOverview[];
  batchesByTank: Record<string, any[]>;
  historyByTank: Record<string, HealthCheckResponseDTO[]>;
}> => {
  const tanks = incomingTanks && incomingTanks.length > 0
    ? incomingTanks
    : extractArray(await apiGet<unknown>('/tanks'));

  const overviewResults = await Promise.all(
    tanks.map(async (tank) => {
      try {
        return await fetchTankHealthOverview(tank);
      } catch {
        return buildTankHealthOverview(tank, [], []);
      }
    }),
  );

  const batchesByTank: Record<string, any[]> = {};
  const historyByTank: Record<string, HealthCheckResponseDTO[]> = {};

  overviewResults.forEach((overview) => {
    batchesByTank[overview.tank.id] = overview.batches;
    historyByTank[overview.tank.id] = overview.healthChecks;
  });

  return {
    tanks,
    overviews: overviewResults,
    batchesByTank,
    historyByTank,
  };
};
