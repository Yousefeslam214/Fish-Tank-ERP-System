import {
  asArray,
  asBoolean,
  asNumber,
  asRecord,
  asString,
  requestJson,
  unwrapApiData,
} from './httpClient';
import { BuoyancyType, ManufacturingProcess, GrowthStage } from '../types';

export interface FoodType {
  id: string;
  name: string;
  arabicName?: string;
  proteinPercentage: number;
  fatPercentage?: number;
  fiberPercentage?: number;
  moisturePercentage?: number;
  ashPercentage?: number;
  pelletSizeMm: number;
  buoyancyType: BuoyancyType;
  manufacturingProcess: ManufacturingProcess;
  applicableStages: GrowthStage[];
  minFishWeightGrams?: number;
  maxFishWeightGrams?: number;
  shelfLifeDays?: number;
  storageInstructions?: string;
  waterStabilityMinutes?: number;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FoodTypeUpsertPayload {
  name: string;
  arabicName?: string;
  proteinPercentage: number;
  fatPercentage?: number;
  fiberPercentage?: number;
  moisturePercentage?: number;
  ashPercentage?: number;
  pelletSizeMm: number;
  buoyancyType: BuoyancyType;
  manufacturingProcess: ManufacturingProcess;
  applicableStages: GrowthStage[];
  minFishWeightGrams?: number;
  maxFishWeightGrams?: number;
  shelfLifeDays?: number;
  storageInstructions?: string;
  waterStabilityMinutes?: number;
  isActive?: boolean;
  notes?: string;
}

const normalizeFoodType = (value: unknown): FoodType | null => {
  const record = asRecord(value);
  if (!record) return null;

  const id = asString(record.id);
  const name = asString(record.name);
  if (!id || !name) return null;

  return {
    id,
    name,
    arabicName: asString(record.arabicName),
    proteinPercentage: asNumber(record.proteinPercentage) ?? 0,
    fatPercentage: asNumber(record.fatPercentage),
    fiberPercentage: asNumber(record.fiberPercentage),
    moisturePercentage: asNumber(record.moisturePercentage),
    ashPercentage: asNumber(record.ashPercentage),
    pelletSizeMm: asNumber(record.pelletSizeMm) ?? 0,
    buoyancyType: (asString(record.buoyancyType) as BuoyancyType) || 'FLOATING',
    manufacturingProcess: (asString(record.manufacturingProcess) as ManufacturingProcess) || 'EXTRUDED',
    applicableStages: asArray(record.applicableStages).map(s => asString(s) as GrowthStage),
    minFishWeightGrams: asNumber(record.minFishWeightGrams),
    maxFishWeightGrams: asNumber(record.maxFishWeightGrams),
    shelfLifeDays: asNumber(record.shelfLifeDays),
    storageInstructions: asString(record.storageInstructions),
    waterStabilityMinutes: asNumber(record.waterStabilityMinutes),
    isActive: asBoolean(record.isActive) ?? true,
    notes: asString(record.notes),
    createdAt: asString(record.createdAt),
    updatedAt: asString(record.updatedAt),
  };
};

export const getFoodTypes = async (): Promise<FoodType[]> => {
  const payload = await requestJson('/aquaculture/food-types');
  const data = unwrapApiData<unknown>(payload);
  return asArray(data)
    .map(normalizeFoodType)
    .filter((entry): entry is FoodType => entry !== null);
};

export const getFoodTypesBySpecies = async (speciesName: string): Promise<FoodType[]> => {
  const payload = await requestJson(`/aquaculture/food-types/species?name=${encodeURIComponent(speciesName)}`);
  const data = unwrapApiData<unknown>(payload);
  return asArray(data)
    .map(normalizeFoodType)
    .filter((entry): entry is FoodType => entry !== null);
};

export const getFoodTypeById = async (id: string): Promise<FoodType> => {
  const payload = await requestJson(`/aquaculture/food-types/${id}`);
  const data = unwrapApiData<unknown>(payload);
  const normalized = normalizeFoodType(data);
  if (!normalized) throw new Error('Malformed food type response');
  return normalized;
};

export const createFoodType = async (payload: FoodTypeUpsertPayload): Promise<FoodType> => {
  const response = await requestJson('/aquaculture/food-types', {
    method: 'POST',
    body: payload,
  });
  const data = unwrapApiData<unknown>(response);
  const normalized = normalizeFoodType(data);
  if (!normalized) throw new Error('Malformed food type create response');
  return normalized;
};

export const updateFoodType = async (id: string, payload: FoodTypeUpsertPayload): Promise<FoodType> => {
  const response = await requestJson(`/aquaculture/food-types/${id}`, {
    method: 'PUT',
    body: payload,
  });
  const data = unwrapApiData<unknown>(response);
  const normalized = normalizeFoodType(data);
  if (!normalized) throw new Error('Malformed food type update response');
  return normalized;
};

export const deleteFoodType = async (id: string): Promise<void> => {
  await requestJson(`/aquaculture/food-types/${id}`, {
    method: 'DELETE',
  });
};
