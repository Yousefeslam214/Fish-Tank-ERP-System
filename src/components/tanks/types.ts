import { User } from '../../types';

export interface ApiTankBiomass {
  actual?: number;
  capacity?: number;
  unit?: string;
  overstockPercentage?: number | null;
}

export interface ApiTankWaterQuality {
  overallStatus?: string;
  temperature?: number;
  dissolvedOxygen?: number;
  ph?: number;
  ammonia?: number;
}

export interface ApiTankFeeding {
  currentMeal?: number;
  totalMeals?: number;
  weightFed?: number;
  targetWeight?: number;
  percentage?: number;
}

export interface RawApiTank {
  id: string;
  name: string;
  status: string;
  fishType?: string;
  biomass?: ApiTankBiomass;
  waterQuality: ApiTankWaterQuality | null;
  feeding: ApiTankFeeding | null;
  batches?: any[];
}

export interface ApiTank {
  id: string;
  name: string;
  farmId?: string;
  status: string;
  fishType?: string;
  species: string;
  biomass: number;
  capacity: number;
  volume: number;
  waterQuality: {
    overall: string;
    temp: { value: number; status: string };
    do: { value: number; status: string };
    ph: { value: number; status: string };
    nh3: { value: number; status: string };
  } | null;
  feeding: {
    todayMeals: number;
    totalMeals: number;
    todayFed: number;
    recommended: number;
  } | null;
  batches?: any[];
}
