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

export interface FeedingWeightRange {
  min: number | null;
  max: number | null;
}

export interface FeedingRateMatrix {
  weight_ranges: FeedingWeightRange[];
  temperatures: number[];
  rates: number[][];
}

// Meal frequency removed

export interface ProteinRequirementRule {
  minWeight: number | null;
  maxWeight: number | null;
  proteinPercentage: number;
}

export interface ExpectedGradeDistributionEntry {
  gradePricingId: string;
  percentage: number;
}

export interface FoodTypeOption {
  id: string;
  name: string;
  arabicName?: string;
  proteinPercentage?: number;
  isActive: boolean;
}

export interface FishTypeRecord {
  id: string;
  name: string;
  scientificName: string;
  arabicName?: string;
  description?: string;
  tempMin: number;
  tempOptimal: number;
  tempMax: number;
  doMin: number;
  doSafe: number;
  phMin: number;
  phMax: number;
  nh3Safe: number;
  nh3Critical: number;
  no2Max: number;
  no3Max?: number;
  salinityMin?: number;
  salinityMax?: number;
  alkalinityMin?: number;
  alkalinityMax?: number;
  turbidityMin?: number;
  turbidityMax?: number;
  fcrMin: number;
  fcrMax: number;
  survivalRate: number;
  targetSGR?: number;
  targetWeightForHarvest?: number;
  defaultMarketPrice?: number;
  feedingRateMatrix: FeedingRateMatrix;
  criticalParameters: string[];
  proteinRequirements: ProteinRequirementRule[];
  expectedGradeDistribution?: ExpectedGradeDistributionEntry[];
  allowedFoodTypeIds: string[];
  allowedFoodTypes: FoodTypeOption[];
  notes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FishTypeUpsertPayload {
  name: string;
  scientificName: string;
  arabicName?: string;
  description?: string;
  tempMin: number;
  tempOptimal: number;
  tempMax: number;
  doMin: number;
  doSafe: number;
  phMin: number;
  phMax: number;
  nh3Safe: number;
  nh3Critical: number;
  no2Max: number;
  no3Max?: number;
  salinityMin?: number;
  salinityMax?: number;
  alkalinityMin?: number;
  alkalinityMax?: number;
  turbidityMin?: number;
  turbidityMax?: number;
  fcrMin: number;
  fcrMax: number;
  survivalRate: number;
  targetSGR?: number;
  targetWeightForHarvest?: number;
  defaultMarketPrice?: number;
  feedingRateMatrix: FeedingRateMatrix;
  criticalParameters?: string[];
  notes?: string;
  allowedFoodTypeIds?: string[];
  expectedGradeDistribution?: ExpectedGradeDistributionEntry[];
  proteinRequirements?: ProteinRequirementRule[];
  isActive?: boolean;
}

export interface FeedingRateResult {
  fishTypeId: string;
  weight: number;
  temperature: number;
  feedingRatePercentage: number;
}

// Meal frequency removed

export interface ProteinRequirementResult {
  fishTypeId: string;
  weight: number;
  proteinPercentage: number;
}

const ALLOWED_FOOD_RELATION_SET_ERROR = 'allowedfoodtypes.set is not a function';

const stripAllowedFoodTypeIds = (payload: FishTypeUpsertPayload): FishTypeUpsertPayload => {
  const { allowedFoodTypeIds: _allowedFoodTypeIds, ...rest } = payload;
  return rest;
};

const isAllowedFoodRelationSetError = (error: unknown): boolean => {
  if (error instanceof ApiClientError) {
    if (error.message.toLowerCase().includes(ALLOWED_FOOD_RELATION_SET_ERROR)) {
      return true;
    }
    const payload = asRecord(error.payload);
    const message = payload?.message;
    if (typeof message === 'string' && message.toLowerCase().includes(ALLOWED_FOOD_RELATION_SET_ERROR)) {
      return true;
    }
    if (Array.isArray(message)) {
      return message.some(
        (entry) => typeof entry === 'string' && entry.toLowerCase().includes(ALLOWED_FOOD_RELATION_SET_ERROR),
      );
    }
    return false;
  }

  if (error instanceof Error) {
    return error.message.toLowerCase().includes(ALLOWED_FOOD_RELATION_SET_ERROR);
  }

  return false;
};

const parseFishTypeUpsertResponse = (response: unknown, operation: 'create' | 'update'): FishTypeRecord => {
  const data = unwrapApiData<unknown>(response);
  const normalized = normalizeFishType(data);
  if (!normalized) {
    throw new Error(`Malformed fish type ${operation} response.`);
  }
  return normalized;
};

const normalizeRange = (value: unknown): FeedingWeightRange | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  return {
    min: asNumber(record.min) ?? null,
    max: asNumber(record.max) ?? null,
  };
};

const normalizeFeedingRateMatrix = (value: unknown): FeedingRateMatrix => {
  const record = asRecord(value);
  if (!record) {
    return {
      weight_ranges: [],
      temperatures: [],
      rates: [],
    };
  }

  return {
    weight_ranges: asArray(record.weight_ranges)
      .map(normalizeRange)
      .filter((range): range is FeedingWeightRange => range !== null),
    temperatures: asArray(record.temperatures)
      .map((entry) => asNumber(entry))
      .filter((entry): entry is number => entry !== undefined),
    rates: asArray(record.rates).map((row) =>
      asArray(row)
        .map((entry) => asNumber(entry) ?? 0)
        .filter((entry) => Number.isFinite(entry)),
    ),
  };
};

// Normalizer for meals removed

const normalizeProteinRequirements = (value: unknown): ProteinRequirementRule[] =>
  asArray(value)
    .map((entry) => {
      const record = asRecord(entry);
      if (!record) {
        return null;
      }
      return {
        minWeight: asNumber(record.minWeight) ?? null,
        maxWeight: asNumber(record.maxWeight) ?? null,
        proteinPercentage: asNumber(record.proteinPercentage) ?? 0,
      };
    })
    .filter((entry): entry is ProteinRequirementRule => entry !== null);

const normalizeExpectedGradeDistribution = (value: unknown): ExpectedGradeDistributionEntry[] =>
  asArray(value)
    .map((entry) => {
      const record = asRecord(entry);
      if (!record) {
        return null;
      }

      const gradePricingId = asString(record.gradePricingId) || asString(record.pricingId) || asString(record.gradeId);
      if (!gradePricingId) {
        return null;
      }

      return {
        gradePricingId,
        percentage: asNumber(record.percentage) ?? 0,
      };
    })
    .filter((entry): entry is ExpectedGradeDistributionEntry => entry !== null);

const normalizeFoodType = (value: unknown): FoodTypeOption | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = asString(record.id) || asString(record._id);
  const name = asString(record.name);
  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    arabicName: asString(record.arabicName),
    proteinPercentage: asNumber(record.proteinPercentage),
    isActive: asBoolean(record.isActive) ?? true,
  };
};

const normalizeFishType = (value: unknown): FishTypeRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = asString(record.id);
  const name = asString(record.name);
  const scientificName = asString(record.scientificName);
  if (!id || !name || !scientificName) {
    return null;
  }

  const allowedFoodTypesRaw = asArray(record.allowedFoodTypes);
  const allowedFoodTypeIdsFromRelations = allowedFoodTypesRaw
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry;
      }
      const relationRecord = asRecord(entry);
      return asString(relationRecord?.id) || asString(relationRecord?._id);
    })
    .filter((entry): entry is string => Boolean(entry));

  const allowedFoodTypeIdsFromField = asArray(record.allowedFoodTypeIds)
    .map((entry) => asString(entry))
    .filter((entry): entry is string => Boolean(entry));

  const allowedFoodTypeIds = Array.from(
    new Set([...allowedFoodTypeIdsFromField, ...allowedFoodTypeIdsFromRelations]),
  );

  const allowedFoodTypes = allowedFoodTypesRaw
    .map(normalizeFoodType)
    .filter((entry): entry is FoodTypeOption => entry !== null);

  return {
    id,
    name,
    scientificName,
    arabicName: asString(record.arabicName),
    description: asString(record.description),
    tempMin: asNumber(record.tempMin) ?? 0,
    tempOptimal: asNumber(record.tempOptimal) ?? 0,
    tempMax: asNumber(record.tempMax) ?? 0,
    doMin: asNumber(record.doMin) ?? 0,
    doSafe: asNumber(record.doSafe) ?? 0,
    phMin: asNumber(record.phMin) ?? 0,
    phMax: asNumber(record.phMax) ?? 0,
    nh3Safe: asNumber(record.nh3Safe) ?? 0,
    nh3Critical: asNumber(record.nh3Critical) ?? 0,
    no2Max: asNumber(record.no2Max) ?? 0,
    no3Max: asNumber(record.no3Max),
    salinityMin: asNumber(record.salinityMin),
    salinityMax: asNumber(record.salinityMax),
    alkalinityMin: asNumber(record.alkalinityMin),
    alkalinityMax: asNumber(record.alkalinityMax),
    turbidityMin: asNumber(record.turbidityMin),
    turbidityMax: asNumber(record.turbidityMax),
    fcrMin: asNumber(record.fcrMin) ?? 0,
    fcrMax: asNumber(record.fcrMax) ?? 0,
    survivalRate: asNumber(record.survivalRate) ?? 0,
    targetSGR: asNumber(record.targetSGR),
    targetWeightForHarvest: asNumber(record.targetWeightForHarvest),
    defaultMarketPrice: asNumber(record.defaultMarketPrice),
    feedingRateMatrix: normalizeFeedingRateMatrix(record.feedingRateMatrix),
    criticalParameters: asArray(record.criticalParameters)
      .map((entry) => asString(entry))
      .filter((entry): entry is string => Boolean(entry)),
    proteinRequirements: normalizeProteinRequirements(record.proteinRequirements),
    expectedGradeDistribution: normalizeExpectedGradeDistribution(record.expectedGradeDistribution),
    allowedFoodTypeIds,
    allowedFoodTypes,
    notes: asString(record.notes),
    isActive: asBoolean(record.isActive) ?? true,
    createdAt: asString(record.createdAt),
    updatedAt: asString(record.updatedAt),
  };
};

const normalizeCalculatorResult = (payload: unknown): Record<string, unknown> => {
  const data = unwrapApiData<unknown>(payload);
  return asRecord(data) ?? {};
};

const normalizeFishTypeList = (payload: unknown): FishTypeRecord[] => {
  const data = unwrapApiData<unknown>(payload);
  return asArray(data)
    .map(normalizeFishType)
    .filter((entry): entry is FishTypeRecord => entry !== null);
};

export const getFishTypes = async (includeInactive = false): Promise<FishTypeRecord[]> => {
  const payload = await requestJson(`/farm/fish-types?includeInactive=${String(includeInactive)}&limit=100`);
  return normalizeFishTypeList(payload);
};

export const getFishTypeById = async (fishTypeId: string): Promise<FishTypeRecord> => {
  const payload = await requestJson(`/farm/fish-types/${fishTypeId}`);
  const data = unwrapApiData<unknown>(payload);
  const normalized = normalizeFishType(data);
  if (!normalized) {
    throw new Error('Malformed fish type detail response.');
  }
  return normalized;
};

export const createFishType = async (payload: FishTypeUpsertPayload): Promise<FishTypeRecord> => {
  const { isActive: _isActive, ...createPayload } = payload as FishTypeUpsertPayload & { isActive?: boolean };
  try {
    const response = await requestJson('/farm/fish-types', {
      method: 'POST',
      body: createPayload,
    });
    return parseFishTypeUpsertResponse(response, 'create');
  } catch (error) {
    if (isAllowedFoodRelationSetError(error) && createPayload.allowedFoodTypeIds !== undefined) {
      const response = await requestJson('/farm/fish-types', {
        method: 'POST',
        body: stripAllowedFoodTypeIds(createPayload),
      });
      return parseFishTypeUpsertResponse(response, 'create');
    } else {
      throw error;
    }
  }
};

export const updateFishType = async (
  fishTypeId: string,
  payload: FishTypeUpsertPayload,
): Promise<FishTypeRecord> => {
  try {
    const response = await requestJson(`/farm/fish-types/${fishTypeId}`, {
      method: 'PUT',
      body: payload,
    });
    return parseFishTypeUpsertResponse(response, 'update');
  } catch (error) {
    if (isAllowedFoodRelationSetError(error) && payload.allowedFoodTypeIds !== undefined) {
      const response = await requestJson(`/farm/fish-types/${fishTypeId}`, {
        method: 'PUT',
        body: stripAllowedFoodTypeIds(payload),
      });
      return parseFishTypeUpsertResponse(response, 'update');
    } else {
      throw error;
    }
  }
};

export const getFeedingRate = async (
  fishTypeId: string,
  weight: number,
  temperature: number,
): Promise<FeedingRateResult> => {
  const payload = await requestJson(
    `/farm/fish-types/${fishTypeId}/feeding-rate?weight=${weight}&temperature=${temperature}`,
  );
  const data = normalizeCalculatorResult(payload);
  return {
    fishTypeId: asString(data.fishTypeId) || fishTypeId,
    weight: asNumber(data.weight) ?? weight,
    temperature: asNumber(data.temperature) ?? temperature,
    feedingRatePercentage: asNumber(data.feedingRatePercentage) ?? 0,
  };
};

// getMealFrequency removed

export const getProteinRequirement = async (
  fishTypeId: string,
  weight: number,
): Promise<ProteinRequirementResult> => {
  const payload = await requestJson(`/farm/fish-types/${fishTypeId}/protein-requirement?weight=${weight}`);
  const data = normalizeCalculatorResult(payload);
  return {
    fishTypeId: asString(data.fishTypeId) || fishTypeId,
    weight: asNumber(data.weight) ?? weight,
    proteinPercentage: asNumber(data.proteinPercentage) ?? 0,
  };
};

export const getFoodTypes = async (): Promise<FoodTypeOption[]> => {
  const payload = await requestJson('/aquaculture/food-types');
  const data = unwrapApiData<unknown>(payload);
  return asArray(data)
    .map(normalizeFoodType)
    .filter((entry): entry is FoodTypeOption => entry !== null);
};
