import {
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

export interface MealFrequencyRule {
  maxWeight: number | null;
  mealsPerDay: number;
}

export interface ProteinRequirementRule {
  minWeight: number | null;
  maxWeight: number | null;
  proteinPercentage: number;
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
  fcrMin: number;
  fcrMax: number;
  survivalRate: number;
  targetSGR?: number;
  feedingRateMatrix: FeedingRateMatrix;
  mealFrequencyRules: MealFrequencyRule[];
  criticalParameters: string[];
  proteinRequirements: ProteinRequirementRule[];
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
  fcrMin: number;
  fcrMax: number;
  survivalRate: number;
  targetSGR?: number;
  feedingRateMatrix: FeedingRateMatrix;
  mealFrequencyRules: MealFrequencyRule[];
  criticalParameters?: string[];
  notes?: string;
  allowedFoodTypeIds?: string[];
  expectedGradeDistribution?: unknown[];
  proteinRequirements?: ProteinRequirementRule[];
  isActive?: boolean;
}

export interface FeedingRateResult {
  fishTypeId: string;
  weight: number;
  temperature: number;
  feedingRatePercentage: number;
}

export interface MealFrequencyResult {
  fishTypeId: string;
  weight: number;
  mealsPerDay: number;
}

export interface ProteinRequirementResult {
  fishTypeId: string;
  weight: number;
  proteinPercentage: number;
}

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

const normalizeMealFrequencyRules = (value: unknown): MealFrequencyRule[] =>
  asArray(value)
    .map((entry) => {
      const record = asRecord(entry);
      if (!record) {
        return null;
      }
      return {
        maxWeight: asNumber(record.maxWeight) ?? null,
        mealsPerDay: asNumber(record.mealsPerDay) ?? 0,
      };
    })
    .filter((entry): entry is MealFrequencyRule => entry !== null);

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

const normalizeFoodType = (value: unknown): FoodTypeOption | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = asString(record.id);
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
  const allowedFoodTypeIds = allowedFoodTypesRaw
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry;
      }
      return asString(asRecord(entry)?.id);
    })
    .filter((entry): entry is string => Boolean(entry));

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
    fcrMin: asNumber(record.fcrMin) ?? 0,
    fcrMax: asNumber(record.fcrMax) ?? 0,
    survivalRate: asNumber(record.survivalRate) ?? 0,
    targetSGR: asNumber(record.targetSGR),
    feedingRateMatrix: normalizeFeedingRateMatrix(record.feedingRateMatrix),
    mealFrequencyRules: normalizeMealFrequencyRules(record.mealFrequencyRules),
    criticalParameters: asArray(record.criticalParameters)
      .map((entry) => asString(entry))
      .filter((entry): entry is string => Boolean(entry)),
    proteinRequirements: normalizeProteinRequirements(record.proteinRequirements),
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
  const payload = await requestJson(`/farm/fish-types?includeInactive=${String(includeInactive)}`);
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
  const response = await requestJson('/farm/fish-types', {
    method: 'POST',
    body: payload,
  });

  const data = unwrapApiData<unknown>(response);
  const normalized = normalizeFishType(data);
  if (!normalized) {
    throw new Error('Malformed fish type create response.');
  }

  return normalized;
};

export const updateFishType = async (
  fishTypeId: string,
  payload: FishTypeUpsertPayload,
): Promise<FishTypeRecord> => {
  const response = await requestJson(`/farm/fish-types/${fishTypeId}`, {
    method: 'PUT',
    body: payload,
  });

  const data = unwrapApiData<unknown>(response);
  const normalized = normalizeFishType(data);
  if (!normalized) {
    throw new Error('Malformed fish type update response.');
  }

  return normalized;
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

export const getMealFrequency = async (
  fishTypeId: string,
  weight: number,
): Promise<MealFrequencyResult> => {
  const payload = await requestJson(`/farm/fish-types/${fishTypeId}/meal-frequency?weight=${weight}`);
  const data = normalizeCalculatorResult(payload);
  return {
    fishTypeId: asString(data.fishTypeId) || fishTypeId,
    weight: asNumber(data.weight) ?? weight,
    mealsPerDay: asNumber(data.mealsPerDay) ?? 0,
  };
};

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
