import { useEffect, useMemo, useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { AlertCircle, Fish, Loader2, Plus, RefreshCcw, Trash2, Wheat } from 'lucide-react';
import { Farm, User } from '../types';
import { FishGradePricingRecord, getPricingByFishType } from '../services/harvestApi';
import {
  ExpectedGradeDistributionEntry,
  FeedingRateMatrix,
  FeedingRateResult,
  FishTypeRecord,
  FishTypeUpsertPayload,
  FoodTypeOption,
  ProteinRequirementResult,
  ProteinRequirementRule,
  createFishType,
  getFeedingRate,
  getFishTypeById,
  getFishTypes,
  getFoodTypes,
  getProteinRequirement,
  updateFishType,
} from '../services/fishTypesApi';

interface FishTypeManagementProps {
  user: User;
  selectedFarm: Farm | null;
}

type FormTab = 'basic' | 'water' | 'feeding' | 'protein' | 'food';

interface FishTypeFormState {
  name: string;
  scientificName: string;
  arabicName: string;
  description: string;
  tempMin: number;
  tempMax: number;
  doMin: number;
  doMax: number;
  phMin: number;
  phMax: number;
  nh3Min: number;
  nh3Max: number;
  no2Min: number;
  no2Max: number;
  turbidityMin: number;
  turbidityMax: number;
  fcrMin: number;
  fcrMax: number;
  survivalRate: number;
  targetSGR: number;
  targetWeightForHarvest: number;
  defaultMarketPrice: number;
  criticalParameters: string[];
  feedingRateMatrix: FeedingRateMatrix;
  proteinRequirements: ProteinRequirementRule[];
  expectedGradeDistribution: ExpectedGradeDistributionEntry[];
  notes: string;
  allowedFoodTypeIds: string[];
  isActive: boolean;
}

const CRITICAL_PARAMETER_OPTIONS = ['Temperature', 'Dissolved Oxygen', 'pH', 'Ammonia', 'Nitrite', 'Turbidity'];

const createDefaultFeedingRateMatrix = (): FeedingRateMatrix => ({
  weight_ranges: [
    { min: 10, max: 15 },
    { min: 15, max: 20 },
    { min: 20, max: 30 },
  ],
  temperatures: [18, 23, 26, 30],
  rates: [
    [2.0, 3.0, 4.25, 4.5],
    [2.0, 2.75, 4.0, 4.25],
    [1.8, 2.5, 3.75, 4.0],
  ],
});

// Meal defaults removed

const createDefaultProteinRequirements = (): ProteinRequirementRule[] => [
  { minWeight: 0, maxWeight: 10, proteinPercentage: 35 },
  { minWeight: 10, maxWeight: 50, proteinPercentage: 32 },
  { minWeight: 50, maxWeight: 200, proteinPercentage: 30 },
  { minWeight: 200, maxWeight: null, proteinPercentage: 28 },
];

const cloneFeedingRateMatrix = (matrix: FeedingRateMatrix): FeedingRateMatrix => ({
  weight_ranges: matrix.weight_ranges.map((range) => ({ min: range.min, max: range.max })),
  temperatures: [...matrix.temperatures],
  rates: matrix.rates.map((row) => [...row]),
});

const normalizeFeedingRateMatrix = (matrix: FeedingRateMatrix): FeedingRateMatrix => {
  const temperatures = matrix.temperatures.length > 0 ? [...matrix.temperatures] : [20, 24, 28];
  const weightRanges =
    matrix.weight_ranges.length > 0
      ? matrix.weight_ranges.map((range) => ({ min: range.min ?? 0, max: range.max ?? 0 }))
      : [{ min: 0, max: 10 }];

  const rates = weightRanges.map((_, rowIndex) =>
    temperatures.map((_, colIndex) => {
      const value = matrix.rates[rowIndex]?.[colIndex];
      return Number.isFinite(value) ? value : 0;
    }),
  );

  return {
    weight_ranges: weightRanges,
    temperatures,
    rates,
  };
};

const getDefaultFormState = (): FishTypeFormState => ({
  name: '',
  scientificName: '',
  arabicName: '',
  description: '',
  tempMin: 20,
  tempMax: 32,
  doMin: 3,
  doMax: 8,
  phMin: 6.5,
  phMax: 8.5,
  nh3Min: 0,
  nh3Max: 0.05,
  no2Min: 0,
  no2Max: 0.2,
  turbidityMin: 0,
  turbidityMax: 10,
  fcrMin: 1.2,
  fcrMax: 1.8,
  survivalRate: 85,
  targetSGR: 2,
  targetWeightForHarvest: 0,
  defaultMarketPrice: 0,
  criticalParameters: ['DO', 'NH3', 'Temperature'],
  feedingRateMatrix: createDefaultFeedingRateMatrix(),
  proteinRequirements: createDefaultProteinRequirements(),
  expectedGradeDistribution: [],
  notes: '',
  allowedFoodTypeIds: [],
  isActive: true,
});

const toFormState = (fishType: FishTypeRecord): FishTypeFormState => ({
  name: fishType.name,
  scientificName: fishType.scientificName,
  arabicName: fishType.arabicName || '',
  description: fishType.description || '',
  tempMin: fishType.tempMin,
  tempMax: fishType.tempMax,
  doMin: fishType.doMin,
  doMax: fishType.doSafe || 0,
  phMin: fishType.phMin,
  phMax: fishType.phMax,
  nh3Min: fishType.nh3Safe || 0,
  nh3Max: fishType.nh3Critical || 0,
  no2Min: 0,
  no2Max: fishType.no2Max,
  turbidityMin: fishType.turbidityMin || 0,
  turbidityMax: fishType.turbidityMax || 0,
  fcrMin: fishType.fcrMin,
  fcrMax: fishType.fcrMax,
  survivalRate: fishType.survivalRate,
  targetSGR: fishType.targetSGR ?? 0,
  targetWeightForHarvest: fishType.targetWeightForHarvest ?? 0,
  defaultMarketPrice: fishType.defaultMarketPrice ?? 0,
  criticalParameters: fishType.criticalParameters,
  feedingRateMatrix: normalizeFeedingRateMatrix(fishType.feedingRateMatrix),
  proteinRequirements:
    fishType.proteinRequirements.length > 0
      ? fishType.proteinRequirements.map((rule) => ({
        minWeight: rule.minWeight,
        maxWeight: rule.maxWeight,
        proteinPercentage: rule.proteinPercentage,
      }))
      : createDefaultProteinRequirements(),
  expectedGradeDistribution: fishType.expectedGradeDistribution || [],
  notes: fishType.notes || '',
  allowedFoodTypeIds: fishType.allowedFoodTypeIds,
  isActive: fishType.isActive,
});

const toNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toNullableNumber = (value: string): number | null => {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
};

const calculateDistributionTotal = (entries: ExpectedGradeDistributionEntry[]): number =>
  entries.reduce((sum, entry) => sum + (Number.isFinite(entry.percentage) ? entry.percentage : 0), 0);

const validateForm = (form: FishTypeFormState): string | null => {
  if (!form.name.trim() || !form.scientificName.trim()) {
    return 'Name and scientific name are required.';
  }

  if (form.feedingRateMatrix.weight_ranges.length === 0 || form.feedingRateMatrix.temperatures.length === 0) {
    return 'Feeding matrix must include at least one weight range and one temperature.';
  }

  const invalidRange = form.feedingRateMatrix.weight_ranges.find((range) =>
    range.min === null || range.max === null || range.max <= range.min,
  );
  if (invalidRange) {
    return 'Each feeding weight range must have a maximum greater than minimum.';
  }

  const invalidRateShape = form.feedingRateMatrix.rates.some(
    (row) => row.length !== form.feedingRateMatrix.temperatures.length,
  );
  if (invalidRateShape || form.feedingRateMatrix.rates.length !== form.feedingRateMatrix.weight_ranges.length) {
    return 'Feeding matrix rates must align with all weight ranges and temperatures.';
  }

  // Meal validation removed

  const invalidProtein = form.proteinRequirements.some(
    (rule) => !Number.isFinite(rule.proteinPercentage) || rule.proteinPercentage <= 0,
  );
  if (invalidProtein) {
    return 'Each protein requirement rule must have protein percentage greater than 0.';
  }

  if (form.expectedGradeDistribution.length > 0) {
    const invalidDistributionRow = form.expectedGradeDistribution.some(
      (row) => !row.gradePricingId.trim() || !Number.isFinite(row.percentage) || row.percentage <= 0,
    );
    if (invalidDistributionRow) {
      return 'Each expected grade distribution row needs grade pricing id and percentage > 0.';
    }

    const total = calculateDistributionTotal(form.expectedGradeDistribution);
    if (Math.abs(total - 100) > 0.01) {
      return 'Expected grade distribution percentages must sum to 100.';
    }
  }

  return null;
};

const toUpsertPayload = (form: FishTypeFormState): FishTypeUpsertPayload => ({
  name: form.name.trim(),
  scientificName: form.scientificName.trim(),
  arabicName: form.arabicName.trim() || undefined,
  description: form.description.trim() || undefined,
  tempMin: form.tempMin,
  tempOptimal: (form.tempMin + form.tempMax) / 2,
  tempMax: form.tempMax,
  doMin: form.doMin,
  doSafe: form.doMax,
  phMin: form.phMin,
  phMax: form.phMax,
  nh3Safe: form.nh3Min,
  nh3Critical: form.nh3Max,
  no2Max: form.no2Max,
  turbidityMin: form.turbidityMin,
  turbidityMax: form.turbidityMax,
  fcrMin: form.fcrMin,
  fcrMax: form.fcrMax,
  survivalRate: form.survivalRate,
  targetSGR: form.targetSGR,
  targetWeightForHarvest: form.targetWeightForHarvest,
  defaultMarketPrice: form.defaultMarketPrice,
  feedingRateMatrix: cloneFeedingRateMatrix(form.feedingRateMatrix),
  proteinRequirements: form.proteinRequirements.map((rule) => ({
    minWeight: rule.minWeight,
    maxWeight: rule.maxWeight,
    proteinPercentage: rule.proteinPercentage,
  })),
  criticalParameters: form.criticalParameters,
  expectedGradeDistribution:
    form.expectedGradeDistribution.length > 0
      ? form.expectedGradeDistribution.map((row) => ({
        gradePricingId: row.gradePricingId.trim(),
        percentage: row.percentage,
      }))
      : undefined,
  notes: form.notes.trim() || undefined,
  allowedFoodTypeIds: form.allowedFoodTypeIds.length > 0 ? form.allowedFoodTypeIds : undefined,
  isActive: form.isActive,
});

export default function FishTypeManagementEnhanced({ user, selectedFarm }: FishTypeManagementProps) {
  const [fishTypes, setFishTypes] = useState<FishTypeRecord[]>([]);
  const [foodTypes, setFoodTypes] = useState<FoodTypeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingFoodTypes, setIsLoadingFoodTypes] = useState(false);
  const [isLoadingGradePricing, setIsLoadingGradePricing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gradePricingError, setGradePricingError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<FormTab>('basic');
  const [editingFishTypeId, setEditingFishTypeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FishTypeFormState>(getDefaultFormState());
  const [gradePricingOptions, setGradePricingOptions] = useState<FishGradePricingRecord[]>([]);

  const [calculatorFishTypeId, setCalculatorFishTypeId] = useState('');
  const [calculatorWeight, setCalculatorWeight] = useState(45);
  const [calculatorTemperature, setCalculatorTemperature] = useState(27);
  const [isRunningCalculator, setIsRunningCalculator] = useState(false);
  const [calculatorError, setCalculatorError] = useState<string | null>(null);
  const [feedingRateResult, setFeedingRateResult] = useState<FeedingRateResult | null>(null);
  // Meal frequency state removed
  const [proteinRequirementResult, setProteinRequirementResult] = useState<ProteinRequirementResult | null>(null);

  const currentFarmLabel = selectedFarm?.name || 'Current Farm';

  const distributionTotal = useMemo(
    () => calculateDistributionTotal(formState.expectedGradeDistribution),
    [formState.expectedGradeDistribution],
  );

  const loadFishTypes = async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const list = await getFishTypes(false);
      setFishTypes(list);
      if (!calculatorFishTypeId && list.length > 0) {
        setCalculatorFishTypeId(list[0].id);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load fish types.');
      setFishTypes([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadFoodTypes = async () => {
    setIsLoadingFoodTypes(true);
    try {
      const list = await getFoodTypes();
      setFoodTypes(list);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load food types.');
      setFoodTypes([]);
    } finally {
      setIsLoadingFoodTypes(false);
    }
  };

  useEffect(() => {
    void Promise.all([loadFishTypes(), loadFoodTypes()]);
  }, []);

  const openCreateModal = () => {
    setEditingFishTypeId(null);
    setFormError(null);
    setActiveFormTab('basic');
    setFormState(getDefaultFormState());
    setGradePricingOptions([]);
    setGradePricingError(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (fishTypeId: string) => {
    setEditingFishTypeId(fishTypeId);
    setFormError(null);
    setGradePricingError(null);
    setGradePricingOptions([]);
    setActiveFormTab('basic');
    setIsModalOpen(true);
    setIsSaving(true);
    setIsLoadingGradePricing(true);
    try {
      const [detail, pricing] = await Promise.all([
        getFishTypeById(fishTypeId),
        getPricingByFishType(fishTypeId).catch((error) => {
          setGradePricingError(error instanceof Error ? error.message : 'Failed to load grade pricing.');
          return [];
        }),
      ]);
      setFormState(toFormState(detail));
      setGradePricingOptions(pricing.filter((entry) => entry.isActive));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to load fish type details.');
    } finally {
      setIsSaving(false);
      setIsLoadingGradePricing(false);
    }
  };

  const toggleAllowedFoodType = (foodTypeId: string, checked: boolean) => {
    setFormState((previous) => {
      const nextSet = new Set(previous.allowedFoodTypeIds);
      if (checked) {
        nextSet.add(foodTypeId);
      } else {
        nextSet.delete(foodTypeId);
      }
      return { ...previous, allowedFoodTypeIds: Array.from(nextSet) };
    });
  };

  const toggleCriticalParameter = (parameter: string) => {
    setFormState((previous) => {
      const hasParameter = previous.criticalParameters.includes(parameter);
      return {
        ...previous,
        criticalParameters: hasParameter
          ? previous.criticalParameters.filter((item) => item !== parameter)
          : [...previous.criticalParameters, parameter],
      };
    });
  };

  const updateFeedingMatrix = (updater: (matrix: FeedingRateMatrix) => void) => {
    setFormState((previous) => {
      const nextMatrix = cloneFeedingRateMatrix(previous.feedingRateMatrix);
      updater(nextMatrix);
      return { ...previous, feedingRateMatrix: nextMatrix };
    });
  };

  const addFeedingTemperature = () => {
    updateFeedingMatrix((matrix) => {
      const nextTemperature = matrix.temperatures.length > 0 ? matrix.temperatures[matrix.temperatures.length - 1] + 2 : 24;
      matrix.temperatures.push(nextTemperature);
      matrix.rates = matrix.rates.map((row) => [...row, 0]);
    });
  };

  const removeFeedingTemperature = (index: number) => {
    updateFeedingMatrix((matrix) => {
      if (matrix.temperatures.length <= 1) {
        return;
      }
      matrix.temperatures = matrix.temperatures.filter((_, tempIndex) => tempIndex !== index);
      matrix.rates = matrix.rates.map((row) => row.filter((_, tempIndex) => tempIndex !== index));
    });
  };

  const addWeightRange = () => {
    updateFeedingMatrix((matrix) => {
      matrix.weight_ranges.push({ min: 0, max: 0 });
      matrix.rates.push(new Array(matrix.temperatures.length).fill(0));
    });
  };

  const removeWeightRange = (index: number) => {
    updateFeedingMatrix((matrix) => {
      if (matrix.weight_ranges.length <= 1) {
        return;
      }
      matrix.weight_ranges = matrix.weight_ranges.filter((_, rangeIndex) => rangeIndex !== index);
      matrix.rates = matrix.rates.filter((_, rowIndex) => rowIndex !== index);
    });
  };

  // Meal frequency handlers removed

  const updateProteinRequirement = (index: number, field: keyof ProteinRequirementRule, value: number | null) => {
    setFormState((previous) => ({
      ...previous,
      proteinRequirements: previous.proteinRequirements.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, [field]: value } : rule,
      ),
    }));
  };

  const addProteinRequirement = () => {
    setFormState((previous) => ({
      ...previous,
      proteinRequirements: [...previous.proteinRequirements, { minWeight: 0, maxWeight: null, proteinPercentage: 30 }],
    }));
  };

  const removeProteinRequirement = (index: number) => {
    setFormState((previous) => ({
      ...previous,
      proteinRequirements:
        previous.proteinRequirements.length === 1
          ? previous.proteinRequirements
          : previous.proteinRequirements.filter((_, ruleIndex) => ruleIndex !== index),
    }));
  };

  const addExpectedDistributionRow = () => {
    setFormState((previous) => ({
      ...previous,
      expectedGradeDistribution: [...previous.expectedGradeDistribution, { gradePricingId: '', percentage: 0 }],
    }));
  };

  const removeExpectedDistributionRow = (index: number) => {
    setFormState((previous) => ({
      ...previous,
      expectedGradeDistribution: previous.expectedGradeDistribution.filter((_, rowIndex) => rowIndex !== index),
    }));
  };

  const updateExpectedDistributionRow = (
    index: number,
    field: keyof ExpectedGradeDistributionEntry,
    value: string | number,
  ) => {
    setFormState((previous) => ({
      ...previous,
      expectedGradeDistribution: previous.expectedGradeDistribution.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    }));
  };

  const saveFishType = async () => {
    setFormError(null);

    const validationError = validateForm(formState);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = toUpsertPayload(formState);

    setIsSaving(true);
    try {
      if (editingFishTypeId) {
        await updateFishType(editingFishTypeId, payload);
      } else {
        await createFishType(payload);
      }
      setIsModalOpen(false);
      await loadFishTypes(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save fish type.');
    } finally {
      setIsSaving(false);
    }
  };

  const runCalculators = async () => {
    if (!calculatorFishTypeId) {
      setCalculatorError('Select a fish type first.');
      return;
    }

    setCalculatorError(null);
    setIsRunningCalculator(true);
    try {
      const [feedingRate, proteinRequirement] = await Promise.all([
        getFeedingRate(calculatorFishTypeId, calculatorWeight, calculatorTemperature),
        getProteinRequirement(calculatorFishTypeId, calculatorWeight),
      ]);

      setFeedingRateResult(feedingRate);
      setProteinRequirementResult(proteinRequirement);
    } catch (error) {
      setCalculatorError(error instanceof Error ? error.message : 'Failed to run calculators.');
    } finally {
      setIsRunningCalculator(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F9FAFB] flex flex-col">
      <div className="bg-[#0A4D68] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fish className="w-6 h-6" />
            <span className="text-xl font-semibold">Fish Type Management</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">{currentFarmLabel}</span>
            <div className="w-10 h-10 rounded-full bg-[#088395] flex items-center justify-center font-semibold">
              {user.name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {errorMessage && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-3 text-sm text-red-700">{errorMessage}</CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Fish Species Database</h2>
            <p className="text-gray-600 text-sm mt-1">Live backend integration for fish type profiles and calculators</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void loadFishTypes(true)} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
              Refresh
            </Button>
            <Button className="bg-[#088395] hover:bg-[#0A4D68]" onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-2" />
              Add Fish Type
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-10 flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading fish types...
            </CardContent>
          </Card>
        ) : fishTypes.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-sm text-gray-600">No fish types found.</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {fishTypes.map((fishType) => (
              <Card key={fishType.id} className="bg-white shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{fishType.name}</CardTitle>
                      <p className="text-sm text-gray-600 italic mt-1">{fishType.scientificName}</p>
                      {fishType.arabicName ? <p className="text-sm text-gray-500 mt-1">{fishType.arabicName}</p> : null}
                    </div>
                    <Badge className={fishType.isActive ? 'bg-[#10B981] text-white' : 'bg-gray-500 text-white'}>
                      {fishType.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>Temp: {fishType.tempMin} - {fishType.tempMax} °C</p>
                  <p>DO: {fishType.doMin} - {fishType.doSafe} mg/L</p>
                  <p>FCR Target: {fishType.fcrMin} - {fishType.fcrMax}</p>
                  <p>Survival Rate: {fishType.survivalRate}%</p>
                  <Button variant="outline" className="w-full" onClick={() => void openEditModal(fishType.id)}>
                    Edit
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Fish Type Calculators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {calculatorError ? (
              <div className="text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {calculatorError}
              </div>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <Label>Fish Type</Label>
                <select
                  className="mt-1 w-full h-9 border rounded-md px-3 bg-white"
                  value={calculatorFishTypeId}
                  onChange={(event) => setCalculatorFishTypeId(event.target.value)}
                >
                  <option value="">Select fish type</option>
                  {fishTypes.map((fishType) => (
                    <option key={fishType.id} value={fishType.id}>
                      {fishType.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Weight (g)</Label>
                <Input
                  type="number"
                  value={calculatorWeight}
                  onChange={(event) => setCalculatorWeight(Number(event.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Temperature (°C)</Label>
                <Input
                  type="number"
                  value={calculatorTemperature}
                  onChange={(event) => setCalculatorTemperature(Number(event.target.value) || 0)}
                />
              </div>
            </div>
            <Button className="bg-[#088395] hover:bg-[#0A4D68]" onClick={() => void runCalculators()} disabled={isRunningCalculator}>
              {isRunningCalculator ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Run Calculators
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gray-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Feeding Rate</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {feedingRateResult ? `${feedingRateResult.feedingRatePercentage}% body weight/day` : 'Run calculator'}
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Protein Requirement</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {proteinRequirementResult ? `${proteinRequirementResult.proteinPercentage}% protein` : 'Run calculator'}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            setFormError(null);
          }
          setIsModalOpen(open);
        }}
      >
        <DialogContent className="max-w-[95vw] w-[860px] max-h-[95vh] overflow-y-auto p-0 bg-white border border-[#BFD2DA] shadow-2xl">
          <div className="px-6 pt-6 pb-4 border-b border-[#C8D9E0] bg-white sticky top-0 z-10">
            <DialogHeader className="gap-0">
              <DialogTitle className="text-2xl font-bold text-[#1F2937]">
                {editingFishTypeId ? 'Edit Fish Type' : 'Create New Fish Type'}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Configure fish type profile, water quality, feeding matrix, protein rules, and food compatibility.
              </DialogDescription>
            </DialogHeader>
            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}
          </div>

          <Tabs
            value={activeFormTab}
            onValueChange={(value) => setActiveFormTab(value as FormTab)}
            className="px-6 py-5 space-y-5"
          >
            <TabsList className="grid w-full grid-cols-3 rounded-xl bg-[#E4EDF1] p-1 h-auto gap-1 border border-[#C7D8DF]">
              <TabsTrigger value="basic" className="h-auto min-h-10 whitespace-normal text-center leading-tight py-2 px-2 text-sm font-semibold rounded-lg border border-transparent text-[#2C4250] data-[state=active]:bg-white data-[state=active]:text-[#0A4D68] data-[state=active]:border-[#AEC7D2] data-[state=active]:shadow-sm">
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="water" className="h-auto min-h-10 whitespace-normal text-center leading-tight py-2 px-2 text-sm font-semibold rounded-lg border border-transparent text-[#2C4250] data-[state=active]:bg-white data-[state=active]:text-[#0A4D68] data-[state=active]:border-[#AEC7D2] data-[state=active]:shadow-sm">
                Water Quality
              </TabsTrigger>
              <TabsTrigger value="feeding" className="h-auto min-h-10 whitespace-normal text-center leading-tight py-2 px-2 text-sm font-semibold rounded-lg border border-transparent text-[#2C4250] data-[state=active]:bg-white data-[state=active]:text-[#0A4D68] data-[state=active]:border-[#AEC7D2] data-[state=active]:shadow-sm">
                Feeding Rates
              </TabsTrigger>
              <TabsTrigger value="protein" className="h-auto min-h-10 whitespace-normal text-center leading-tight py-2 px-2 text-sm font-semibold rounded-lg border border-transparent text-[#2C4250] data-[state=active]:bg-white data-[state=active]:text-[#0A4D68] data-[state=active]:border-[#AEC7D2] data-[state=active]:shadow-sm">
                Protein
              </TabsTrigger>
              <TabsTrigger value="food" className="h-auto min-h-10 whitespace-normal text-center leading-tight py-2 px-2 text-sm font-semibold rounded-lg border border-transparent text-[#2C4250] data-[state=active]:bg-white data-[state=active]:text-[#0A4D68] data-[state=active]:border-[#AEC7D2] data-[state=active]:shadow-sm">
                Food Types
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-0 border border-[#D3E1E8] rounded-lg bg-white p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fish-type-name" className="text-sm font-medium">Name *</Label>
                  <Input
                    id="fish-type-name"
                    placeholder="e.g., Tilapia"
                    value={formState.name}
                    onChange={(event) => setFormState((previous) => ({ ...previous, name: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="fish-type-scientific-name" className="text-sm font-medium">Scientific Name *</Label>
                  <Input
                    id="fish-type-scientific-name"
                    placeholder="e.g., Oreochromis niloticus"
                    value={formState.scientificName}
                    onChange={(event) => setFormState((previous) => ({ ...previous, scientificName: event.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Arabic Name</Label>
                  <Input
                    placeholder="e.g., البلطي"
                    value={formState.arabicName}
                    onChange={(event) => setFormState((previous) => ({ ...previous, arabicName: event.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Target SGR (%/day)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formState.targetSGR}
                    onChange={(event) => setFormState((previous) => ({ ...previous, targetSGR: toNumber(event.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <Textarea
                  rows={3}
                  placeholder="Additional details about this fish type..."
                  value={formState.description}
                  onChange={(event) => setFormState((previous) => ({ ...previous, description: event.target.value }))}
                />
              </div>

              <div>
                <Label className="mb-2 block">Critical Parameters</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CRITICAL_PARAMETER_OPTIONS.map((parameter) => {
                    const selected = formState.criticalParameters.includes(parameter);
                    return (
                      <button
                        type="button"
                        key={parameter}
                        className={`px-3 py-2 rounded-lg border text-sm text-left ${selected ? 'bg-[#E0F4F5] border-[#088395] text-[#0A4D68]' : 'bg-white border-gray-300'
                          }`}
                        onClick={() => toggleCriticalParameter(parameter)}
                      >
                        {parameter}
                      </button>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="water" className="space-y-6 mt-0 border border-[#D3E1E8] rounded-lg bg-white p-4">
              <div>
                <h3 className="text-lg font-semibold text-[#1F2937] mb-4">Water Quality Thresholds (Min - Max)</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Temperature (°C)', minKey: 'tempMin', maxKey: 'tempMax', step: '0.1' },
                    { label: 'Dissolved Oxygen (mg/L)', minKey: 'doMin', maxKey: 'doMax', step: '0.1' },
                    { label: 'pH', minKey: 'phMin', maxKey: 'phMax', step: '0.1' },
                    { label: 'Ammonia (mg/L)', minKey: 'nh3Min', maxKey: 'nh3Max', step: '0.01' },
                    { label: 'Nitrite (mg/L)', minKey: 'no2Min', maxKey: 'no2Max', step: '0.01' },
                    { label: 'Turbidity (NTU)', minKey: 'turbidityMin', maxKey: 'turbidityMax', step: '0.1' },
                  ].map(({ label, minKey, maxKey, step }) => (
                    <div key={label} className="p-3 border rounded-lg bg-gray-50/50 space-y-3">
                      <h4 className="text-sm font-bold text-[#0A4D68] border-b pb-1">{label}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-medium text-gray-500 mb-1 block">Minimum</Label>
                          <Input
                            type="number"
                            step={step}
                            value={formState[minKey as keyof FishTypeFormState] as number}
                            onChange={(e) => setFormState(prev => ({ ...prev, [minKey]: toNumber(e.target.value) }))}
                            className="h-9 bg-white"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-500 mb-1 block">Maximum</Label>
                          <Input
                            type="number"
                            step={step}
                            value={formState[maxKey as keyof FishTypeFormState] as number}
                            onChange={(e) => setFormState(prev => ({ ...prev, [maxKey]: toNumber(e.target.value) }))}
                            className="h-9 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#1F2937] mb-4">Performance Benchmarks</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'fcrMin', label: 'FCR Minimum (Best)' },
                      { key: 'fcrMax', label: 'FCR Maximum (Acceptable)' },
                      { key: 'survivalRate', label: 'Expected Survival Rate (%)' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <Label className="text-xs font-medium text-gray-700">{label}</Label>
                        <Input
                          type="number"
                          step={key === 'survivalRate' ? '1' : '0.1'}
                          value={formState[key as keyof FishTypeFormState] as number}
                          onChange={(event) =>
                            setFormState((previous) => ({
                              ...previous,
                              [key]: toNumber(event.target.value),
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'targetWeightForHarvest', label: 'Target Weight For Harvest (kg)' },
                      { key: 'defaultMarketPrice', label: 'Default Market Price (EGP/kg)' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <Label className="text-xs font-medium text-gray-700">{label}</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formState[key as keyof FishTypeFormState] as number}
                          onChange={(event) =>
                            setFormState((previous) => ({
                              ...previous,
                              [key]: toNumber(event.target.value),
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="feeding" className="space-y-4 mt-0 border border-[#D3E1E8] rounded-lg bg-white p-4">
              <div className="flex flex-wrap gap-2 justify-between items-center">
                <h3 className="text-base font-semibold">Feeding Rate Matrix</h3>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={addFeedingTemperature}>
                    <Plus className="w-3 h-3 mr-1" />
                    Temperature
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={addWeightRange}>
                    <Plus className="w-3 h-3 mr-1" />
                    Weight Range
                  </Button>
                </div>
              </div>

              <Card className="bg-white border border-[#D3E1E8]">
                <CardContent className="pt-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Temperature Columns (°C)</p>
                  <div className="flex flex-wrap gap-2">
                    {formState.feedingRateMatrix.temperatures.map((temperature, index) => (
                      <div key={`temperature-${index}`} className="flex items-center gap-1 border rounded-md bg-gray-50 px-2 py-1">
                        <Input
                          type="number"
                          className="w-20 h-8 bg-white"
                          value={temperature}
                          onChange={(event) =>
                            updateFeedingMatrix((matrix) => {
                              matrix.temperatures[index] = toNumber(event.target.value);
                            })
                          }
                        />
                        <span className="text-xs text-gray-600">°C</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          onClick={() => removeFeedingTemperature(index)}
                          disabled={formState.feedingRateMatrix.temperatures.length <= 1}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="overflow-x-auto border rounded-lg bg-white">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left border-b">Weight Range (g)</th>
                      {formState.feedingRateMatrix.temperatures.map((temperature, index) => (
                        <th key={`rate-head-${index}`} className="px-3 py-2 text-center border-b">
                          {temperature}°C
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center border-b">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formState.feedingRateMatrix.weight_ranges.map((range, weightIndex) => (
                      <tr key={`weight-range-${weightIndex}`} className="text-gray-900">
                        <td className="px-3 py-2 border-b">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              className="h-8 w-24 shrink-0 bg-white text-gray-900 font-medium"
                              value={range.min ?? 0}
                              onChange={(event) =>
                                updateFeedingMatrix((matrix) => {
                                  matrix.weight_ranges[weightIndex].min = toNumber(event.target.value);
                                })
                              }
                            />
                            <span>-</span>
                            <Input
                              type="number"
                              className="h-8 w-24 shrink-0 bg-white text-gray-900 font-medium"
                              value={range.max ?? 0}
                              onChange={(event) =>
                                updateFeedingMatrix((matrix) => {
                                  matrix.weight_ranges[weightIndex].max = toNumber(event.target.value);
                                })
                              }
                            />
                          </div>
                        </td>
                        {formState.feedingRateMatrix.temperatures.map((_, temperatureIndex) => (
                          <td key={`rate-cell-${weightIndex}-${temperatureIndex}`} className="px-3 py-2 border-b">
                            <Input
                              type="number"
                              step="0.01"
                              className="h-8 w-20 shrink-0 bg-white text-gray-900 font-medium"
                              value={formState.feedingRateMatrix.rates[weightIndex]?.[temperatureIndex] ?? 0}
                              onChange={(event) =>
                                updateFeedingMatrix((matrix) => {
                                  matrix.rates[weightIndex][temperatureIndex] = toNumber(event.target.value);
                                })
                              }
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2 border-b text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeWeightRange(weightIndex)}
                            disabled={formState.feedingRateMatrix.weight_ranges.length <= 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="protein" className="space-y-4 mt-0 border border-[#D3E1E8] rounded-lg bg-white p-4">
              <Card className="bg-white border border-[#D3E1E8]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="font-semibold">Protein Requirements</span>
                    <Button type="button" size="sm" variant="outline" onClick={addProteinRequirement}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add Rule
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {formState.proteinRequirements.length === 0 ? (
                    <p className="text-sm text-gray-500">No rules configured.</p>
                  ) : (
                    formState.proteinRequirements.map((rule, index) => (
                      <div key={`protein-rule-${index}`} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end p-2 border rounded-md bg-gray-50">
                        <div>
                          <Label className="text-xs font-medium text-gray-700">Min Weight (g)</Label>
                          <Input
                            type="number"
                            value={rule.minWeight ?? ''}
                            onChange={(event) =>
                              updateProteinRequirement(index, 'minWeight', toNullableNumber(event.target.value))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-700">Max Weight (g)</Label>
                          <Input
                            type="number"
                            value={rule.maxWeight ?? ''}
                            placeholder="Leave empty for no max"
                            onChange={(event) =>
                              updateProteinRequirement(index, 'maxWeight', toNullableNumber(event.target.value))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-700">Protein %</Label>
                          <Input
                            type="number"
                            min="0"
                            value={rule.proteinPercentage}
                            onChange={(event) =>
                              updateProteinRequirement(index, 'proteinPercentage', Math.max(0, toNumber(event.target.value)))
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="hover:bg-red-50 hover:text-red-600"
                          onClick={() => removeProteinRequirement(index)}
                          disabled={formState.proteinRequirements.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="food" className="space-y-4 mt-0 border border-[#D3E1E8] rounded-lg bg-white p-4">
              <Card className="bg-white border border-[#D3E1E8]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Allowed Food Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isLoadingFoodTypes ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading food types...
                    </div>
                  ) : foodTypes.length === 0 ? (
                    <p className="text-sm text-gray-600">No food types available.</p>
                  ) : (
                    (() => {
                      const selectedFoodTypes = foodTypes.filter((foodType) =>
                        formState.allowedFoodTypeIds.includes(foodType.id),
                      );
                      const nonSelectedFoodTypes = foodTypes.filter(
                        (foodType) => !formState.allowedFoodTypeIds.includes(foodType.id),
                      );

                      const renderFoodTypeOption = (foodType: FoodTypeOption, checked: boolean) => (
                        <label
                          key={foodType.id}
                          className={`border rounded-md p-3 text-sm flex items-center justify-between cursor-pointer transition-colors ${checked ? 'bg-[#DCF4F7] border-[#0D8FA3]' : 'bg-white border-[#C8D7DF] hover:border-[#0D8FA3]'}`}
                        >
                          <span className="flex items-center gap-2">
                            <Wheat className="w-4 h-4 text-[#0D8FA3]" />
                            {foodType.name}
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => toggleAllowedFoodType(foodType.id, event.target.checked)}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </label>
                      );

                      return (
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-semibold text-[#0A4D68] mb-2">
                              Selected ({selectedFoodTypes.length})
                            </p>
                            {selectedFoodTypes.length === 0 ? (
                              <p className="text-sm text-gray-500 border rounded-md p-3 bg-gray-50">
                                No selected food types.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {selectedFoodTypes.map((foodType) =>
                                  renderFoodTypeOption(foodType, true),
                                )}
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-2">
                              Not Selected ({nonSelectedFoodTypes.length})
                            </p>
                            {nonSelectedFoodTypes.length === 0 ? (
                              <p className="text-sm text-gray-500 border rounded-md p-3 bg-gray-50">
                                All food types are selected.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {nonSelectedFoodTypes.map((foodType) =>
                                  renderFoodTypeOption(foodType, false),
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </CardContent>
              </Card>



              <Card className="bg-white border border-[#D3E1E8]">
                <CardContent className="pt-4 space-y-4"> <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <Textarea
                    rows={3}
                    placeholder="Additional notes..."
                    value={formState.notes}
                    onChange={(event) => setFormState((previous) => ({ ...previous, notes: event.target.value }))}
                  />
                </div>
                </CardContent>
              </Card>
            </TabsContent>

            <div className="border-t border-[#C8D9E0] pt-4 flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-11 bg-[#0D8FA3] hover:bg-[#0A6F83] border border-[#0A6F83] text-black"
                onClick={() => void saveFishType()}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editingFishTypeId ? 'Update Fish Type' : 'Create Fish Type'}
              </Button>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
