import {
  ApiClientError,
  asArray,
  asBoolean,
  asNumber,
  asRecord,
  asString,
  requestJson,
  unwrapApiData,
} from './httpClient';
import {
  HarvestTypeValue,
  getHarvestTypeLabel,
  normalizeHarvestTypeValue,
} from './harvestConstants';

export type HarvestCondition = 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'DAMAGED';

export interface HarvestEventRecord {
  id: string;
  tankId: string;
  harvestType: HarvestTypeValue;
  harvestTypeLabel: string;
  estimatedWeight: number;
  actualTotalWeight: number;
  totalRevenue: number;
  status: string;
  harvestDate: string;
}

export interface HarvestActiveTankRecord {
  harvestEventId: string;
  tankId: string;
  harvestType: HarvestTypeValue;
  harvestTypeLabel: string;
  harvestDate: string;
  status: string;
}

export interface HarvestGradingRecord {
  id: string;
  fishTypeId?: string;
  gradeId: string;
  pricingId?: string;
  sourceBatchId?: string;
  weightKg: number;
  count: number;
  condition: string;
  gradeName?: string;
  gradeType?: string;
  pricePerKg: number;
  totalValue: number;
  createdAt?: string;
}

export interface HarvestPredictionRecord {
  predictedWeightKg: number;
  predictedRevenue: number;
  daysToHarvest: number;
  recommendation: string;
  actions: string[];
  revenueByGrade: Record<string, number>;
  raw: Record<string, unknown>;
}

export interface FishGradePricingRecord {
  id: string;
  fishTypeId: string;
  gradeName: string;
  minWeight: number;
  maxWeight: number;
  numOfFishInKilo: number;
  pricePerKg: number;
  isWaste: boolean;
  isActive: boolean;
}

export interface HarvestTankRecord {
  id: string;
  name: string;
  status: string;
  fishType?: string;
  biomassKg: number;
  capacityKg?: number;
}

export interface TankBatchRecord {
  id: string;
  fishType?: string;
  status: string;
  currentCount?: number;
  currentAvgWeightG?: number;
  biomassKg?: number;
}

export interface TankBatchesResponse {
  summary: Record<string, unknown> | null;
  batches: TankBatchRecord[];
}

export interface StartHarvestPayload {
  tankId: string;
  harvestType: HarvestTypeValue;
}

export interface AddHarvestGradingPayload {
  pricingId: string;
  sourceBatchId: string;
  weightKg: number;
  count?: number;
  condition?: HarvestCondition;
  // Legacy compatibility fields
  fishTypeId?: string;
  gradeId?: string;
  weight?: number;
}

export interface CompleteHarvestPayload {
  notes?: string;
}

export interface CreateFishGradePricingPayload {
  fishTypeId: string;
  gradeName: string;
  minWeight: number;
  maxWeight: number;
  numOfFishInKilo: number;
  pricePerKg: number;
  isWaste?: boolean;
  isActive?: boolean;
}

export type UpdateFishGradePricingPayload = Partial<CreateFishGradePricingPayload>;

const extractNumber = (value: unknown, fallback = 0): number => asNumber(value) ?? fallback;

const normalizeHarvestEvent = (value: unknown): HarvestEventRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = asString(record.id);
  const tankId = asString(record.tankId);
  if (!id || !tankId) {
    return null;
  }

  const harvestType = normalizeHarvestTypeValue(record.harvestType);
  return {
    id,
    tankId,
    harvestType,
    harvestTypeLabel: getHarvestTypeLabel(harvestType),
    estimatedWeight: extractNumber(record.estimatedWeight),
    actualTotalWeight: extractNumber(record.actualTotalWeight),
    totalRevenue: extractNumber(record.totalRevenue),
    status: asString(record.status) || 'UNKNOWN',
    harvestDate: asString(record.harvestDate) || '',
  };
};

const normalizeActiveTank = (value: unknown): HarvestActiveTankRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const harvestEventId = asString(record.harvestEventId);
  const tankId = asString(record.tankId);
  if (!harvestEventId || !tankId) {
    return null;
  }

  const harvestType = normalizeHarvestTypeValue(record.harvestType);
  return {
    harvestEventId,
    tankId,
    harvestType,
    harvestTypeLabel: getHarvestTypeLabel(harvestType),
    harvestDate: asString(record.harvestDate) || '',
    status: asString(record.status) || 'UNKNOWN',
  };
};

const normalizeGrading = (value: unknown): HarvestGradingRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const pricingRecord = asRecord(record.pricing);
  const gradeRecord = asRecord(record.grade);
  const id =
    asString(record.id) ||
    asString(record._id) ||
    asString(record.gradingId) ||
    `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const gradeId =
    asString(record.gradeId) ||
    asString(record.pricingId) ||
    asString(pricingRecord?.id) ||
    asString(gradeRecord?.id) ||
    'UNKNOWN';

  return {
    id,
    fishTypeId: asString(record.fishTypeId),
    gradeId,
    pricingId: asString(record.pricingId),
    sourceBatchId: asString(record.sourceBatchId),
    weightKg: extractNumber(record.weightKg ?? record.weight),
    count: extractNumber(record.count ?? record.fishCount),
    condition: asString(record.condition) || 'GOOD',
    gradeName:
      asString(record.gradeName) ||
      asString(gradeRecord?.name) ||
      asString(pricingRecord?.gradeName),
    gradeType: asString(record.gradeType),
    pricePerKg: extractNumber(record.pricePerKg),
    totalValue: extractNumber(record.totalValue),
    createdAt: asString(record.createdAt) || asString(record.timestamp),
  };
};

const postWithFallback = async (
  primaryPath: string,
  fallbackPath: string,
  primaryBody: unknown,
  fallbackBody: unknown,
): Promise<unknown> => {
  try {
    return await requestJson(primaryPath, {
      method: 'POST',
      body: primaryBody,
    });
  } catch (error) {
    if (!(error instanceof ApiClientError) || (error.status !== 404 && error.status !== 405)) {
      throw error;
    }
  }

  return requestJson(fallbackPath, {
    method: 'POST',
    body: fallbackBody,
  });
};

const shouldRetryLegacyGradingPayload = (error: unknown): boolean => {
  if (!(error instanceof ApiClientError)) {
    return false;
  }

  if (error.status === 404 || error.status === 405) {
    return true;
  }

  if (error.status !== 400) {
    return false;
  }

  const message = String(error.message || '').toLowerCase();
  return (
    message.includes('pricingid should not exist') ||
    message.includes('sourcebatchid should not exist') ||
    message.includes('weightkg should not exist')
  );
};

const normalizePricing = (value: unknown): FishGradePricingRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = asString(record.id);
  const fishTypeId = asString(record.fishTypeId);
  const gradeName = asString(record.gradeName);
  if (!id || !fishTypeId || !gradeName) {
    return null;
  }

  return {
    id,
    fishTypeId,
    gradeName,
    minWeight: extractNumber(record.minWeight),
    maxWeight: extractNumber(record.maxWeight),
    numOfFishInKilo: extractNumber(record.numOfFishInKilo),
    pricePerKg: extractNumber(record.pricePerKg),
    isWaste: asBoolean(record.isWaste) ?? false,
    isActive: asBoolean(record.isActive) ?? true,
  };
};

const parseFirstNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const match = value.match(/-?\d+(\.\d+)?/);
    if (match) {
      const parsed = Number(match[0]);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return undefined;
};

const normalizeTank = (value: unknown): HarvestTankRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = asString(record.id);
  const name = asString(record.name);
  if (!id || !name) {
    return null;
  }

  const biomassRecord = asRecord(record.biomass);
  return {
    id,
    name,
    status: asString(record.status) || 'UNKNOWN',
    fishType: asString(record.fishType),
    biomassKg: extractNumber(biomassRecord?.actual ?? record.biomass),
    capacityKg: asNumber(biomassRecord?.capacity),
  };
};

const normalizeTankBatch = (value: unknown): TankBatchRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = asString(record.id);
  if (!id) {
    return null;
  }

  const counts = asRecord(record.counts);
  const weights = asRecord(record.weights);

  return {
    id,
    fishType: asString(record.fishType),
    status: asString(record.status) || 'unknown',
    currentCount: asNumber(counts?.current),
    currentAvgWeightG: parseFirstNumber(weights?.currentAvg),
    biomassKg: parseFirstNumber(record.biomass),
  };
};

const normalizePrediction = (payload: unknown): HarvestPredictionRecord => {
  const record = asRecord(payload) ?? {};
  const prediction = asRecord(record.prediction);
  const economics = asRecord(record.economics);

  const revenueByGradeRaw = asRecord(record.revenueByGrade) || asRecord(economics?.predictedRevenueByGrade) || {};
  const revenueByGrade: Record<string, number> = {};
  Object.entries(revenueByGradeRaw).forEach(([key, value]) => {
    const parsed = asNumber(value);
    if (parsed !== undefined) {
      revenueByGrade[key] = parsed;
    }
  });

  return {
    predictedWeightKg:
      extractNumber(record.predictedWeightKg) ||
      extractNumber(prediction?.predictedWeight) ||
      extractNumber(prediction?.predictedWeightKg),
    predictedRevenue:
      extractNumber(record.predictedRevenue) ||
      extractNumber(economics?.predictedRevenue),
    daysToHarvest:
      extractNumber(record.daysToHarvest) ||
      extractNumber(prediction?.daysToTarget),
    recommendation: asString(record.recommendation) || 'NO_RECOMMENDATION',
    actions: asArray<string>(record.actions).filter((item) => typeof item === 'string'),
    revenueByGrade,
    raw: record,
  };
};

const readList = <T>(payload: unknown, itemNormalizer: (value: unknown) => T | null): T[] => {
  const list = unwrapApiData<unknown>(payload);
  return asArray(list).map(itemNormalizer).filter((item): item is T => item !== null);
};

export const getHarvestEvents = async (): Promise<HarvestEventRecord[]> => {
  const payload = await requestJson('/harvest/events');
  return readList(payload, normalizeHarvestEvent);
};

export const getHarvestEventsByTank = async (tankId: string): Promise<HarvestEventRecord[]> => {
  const payload = await requestJson(`/harvest/events/tank/${tankId}`);
  return readList(payload, normalizeHarvestEvent);
};

export const getHarvestGradings = async (eventId: string): Promise<HarvestGradingRecord[]> => {
  const payload = await requestJson(`/harvest/events/${eventId}/gradings`);
  return readList(payload, normalizeGrading);
};

export const getActiveHarvestTanks = async (): Promise<HarvestActiveTankRecord[]> => {
  const payload = await requestJson('/harvest/events/active-tanks');
  return readList(payload, normalizeActiveTank);
};

export const getHarvestPrediction = async (batchId: string): Promise<HarvestPredictionRecord> => {
  const payload = await requestJson(`/harvest/events/prediction/batch/${batchId}`);
  const data = unwrapApiData<unknown>(payload);
  return normalizePrediction(data);
};

export const startHarvestEvent = async (payload: StartHarvestPayload): Promise<HarvestEventRecord> => {
  const response = await requestJson('/harvest/events/start', {
    method: 'POST',
    body: payload,
  });
  const data = unwrapApiData<unknown>(response);
  const event = normalizeHarvestEvent(data);
  if (!event) {
    throw new Error('Malformed response while starting harvest event.');
  }
  return event;
};

export const addHarvestGradingRecord = async (
  eventId: string,
  payload: AddHarvestGradingPayload,
): Promise<HarvestGradingRecord> => {
  const weightValue = payload.weightKg ?? payload.weight;
  const gradeValue = payload.pricingId || payload.gradeId;

  const primaryBody = {
    pricingId: gradeValue,
    sourceBatchId: payload.sourceBatchId,
    weightKg: weightValue,
    condition: payload.condition,
  };

  const fallbackBody = {
    fishTypeId: payload.fishTypeId,
    gradeId: gradeValue,
    weight: weightValue,
    count: payload.count,
    sourceBatchId: payload.sourceBatchId,
    condition: payload.condition,
  };
  let response: unknown;

  try {
    response = await requestJson(`/harvest/events/${eventId}/grading`, {
      method: 'POST',
      body: primaryBody,
    });
  } catch (error) {
    if (!shouldRetryLegacyGradingPayload(error)) {
      throw error;
    }

    response = await requestJson(`/harvest/events/${eventId}/grading`, {
      method: 'POST',
      body: fallbackBody,
    });
  }

  const data = unwrapApiData<unknown>(response);
  const grading = normalizeGrading(data);
  if (!grading) {
    const fallback: HarvestGradingRecord = {
      id: `local-${Date.now()}`,
      fishTypeId: payload.fishTypeId,
      gradeId: gradeValue || '',
      pricingId: gradeValue || '',
      sourceBatchId: payload.sourceBatchId,
      weightKg: weightValue || 0,
      count: payload.count || 0,
      condition: payload.condition || 'GOOD',
      pricePerKg: 0,
      totalValue: 0,
    };
    return fallback;
  }

  return grading;
};

export const completeHarvestEvent = async (
  eventId: string,
  payload: CompleteHarvestPayload,
): Promise<HarvestEventRecord> => {
  let response: unknown;
  try {
    response = await requestJson(`/harvest/events/${eventId}/complete`, {
      method: 'POST',
    });
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.status !== 400) {
      throw error;
    }

    const message = String(error.message || '').toLowerCase();
    if (!message.includes('should not be empty') && !message.includes('required')) {
      throw error;
    }

    response = await requestJson(`/harvest/events/${eventId}/complete`, {
      method: 'POST',
      body: {},
    });
  }

  const data = unwrapApiData<unknown>(response);
  const event = normalizeHarvestEvent(data);
  if (!event) {
    throw new Error('Malformed response while completing harvest event.');
  }
  return event;
};

export const getPricingByFishType = async (fishTypeId: string): Promise<FishGradePricingRecord[]> => {
  const payload = await requestJson(`/harvest/pricing/fish-type/${fishTypeId}`);
  return readList(payload, normalizePricing);
};

export const createFishGradePricing = async (
  payload: CreateFishGradePricingPayload,
): Promise<FishGradePricingRecord> => {
  const response = await requestJson('/harvest/pricing', {
    method: 'POST',
    body: payload,
  });
  const data = unwrapApiData<unknown>(response);
  const pricing = normalizePricing(data);
  if (!pricing) {
    throw new Error('Malformed response while creating pricing.');
  }
  return pricing;
};

export const updateFishGradePricing = async (
  pricingId: string,
  payload: UpdateFishGradePricingPayload,
): Promise<FishGradePricingRecord> => {
  const response = await requestJson(`/harvest/pricing/${pricingId}`, {
    method: 'PATCH',
    body: payload,
  });
  const data = unwrapApiData<unknown>(response);
  const pricing = normalizePricing(data);
  if (!pricing) {
    throw new Error('Malformed response while updating pricing.');
  }
  return pricing;
};

export const getHarvestTanks = async (): Promise<HarvestTankRecord[]> => {
  const payload = await requestJson('/tanks');
  return readList(payload, normalizeTank);
};

export const getTankBatches = async (tankId: string): Promise<TankBatchesResponse> => {
  const payload = await requestJson(`/tanks/${tankId}/batches`);
  const data = unwrapApiData<unknown>(payload);
  const record = asRecord(data);
  if (!record) {
    return { summary: null, batches: [] };
  }

  const summary = asRecord(record.summary) || null;
  const batches = asArray(record.batches)
    .map(normalizeTankBatch)
    .filter((batch): batch is TankBatchRecord => batch !== null);

  return { summary, batches };
};
