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
import {
  ExpectedGradeDistributionEntry,
  FeedingRateMatrix,
  FeedingRateResult,
  FishTypeRecord,
  FishTypeUpsertPayload,
  FoodTypeOption,
  MealFrequencyResult,
  MealFrequencyRule,
  ProteinRequirementResult,
  ProteinRequirementRule,
  createFishType,
  getFeedingRate,
  getFishTypeById,
  getFishTypes,
  getFoodTypes,
  getMealFrequency,
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
  tempOptimal: number;
  tempMax: number;
  doMin: number;
  doSafe: number;
  phMin: number;
  phMax: number;
  nh3Safe: number;
  nh3Critical: number;
  no2Max: number;
  no3Max: number;
  salinityMin: number;
  salinityMax: number;
  alkalinityMin: number;
  alkalinityMax: number;
  fcrMin: number;
  fcrMax: number;
  survivalRate: number;
  targetSGR: number;
  targetWeightForHarvest: number;
  defaultMarketPrice: number;
  criticalParameters: string[];
  feedingRateMatrix: FeedingRateMatrix;
  mealFrequencyRules: MealFrequencyRule[];
  proteinRequirements: ProteinRequirementRule[];
  expectedGradeDistribution: ExpectedGradeDistributionEntry[];
  notes: string;
  allowedFoodTypeIds: string[];
  isActive: boolean;
}

const CRITICAL_PARAMETER_OPTIONS = ['Temperature', 'DO', 'pH', 'NH3', 'NO2', 'NO3', 'Salinity'];

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

const createDefaultMealFrequencyRules = (): MealFrequencyRule[] => [
  { maxWeight: 5, mealsPerDay: 6 },
  { maxWeight: 10, mealsPerDay: 5 },
  { maxWeight: 25, mealsPerDay: 4 },
  { maxWeight: 50, mealsPerDay: 3 },
  { maxWeight: null, mealsPerDay: 2 },
];

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
  tempOptimal: 28,
  tempMax: 32,
  doMin: 3,
  doSafe: 5,
  phMin: 6.5,
  phMax: 8.5,
  nh3Safe: 0.02,
  nh3Critical: 0.05,
  no2Max: 0.2,
  no3Max: 40,
  salinityMin: 0,
  salinityMax: 12,
  alkalinityMin: 50,
  alkalinityMax: 300,
  fcrMin: 1.2,
  fcrMax: 1.8,
  survivalRate: 85,
  targetSGR: 2,
  targetWeightForHarvest: 0,
  defaultMarketPrice: 0,
  criticalParameters: ['DO', 'NH3', 'Temperature'],
  feedingRateMatrix: createDefaultFeedingRateMatrix(),
  mealFrequencyRules: createDefaultMealFrequencyRules(),
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
  tempOptimal: fishType.tempOptimal,
  tempMax: fishType.tempMax,
  doMin: fishType.doMin,
  doSafe: fishType.doSafe,
  phMin: fishType.phMin,
  phMax: fishType.phMax,
  nh3Safe: fishType.nh3Safe,
  nh3Critical: fishType.nh3Critical,
  no2Max: fishType.no2Max,
  no3Max: fishType.no3Max ?? 0,
  salinityMin: fishType.salinityMin ?? 0,
  salinityMax: fishType.salinityMax ?? 0,
  alkalinityMin: fishType.alkalinityMin ?? 0,
  alkalinityMax: fishType.alkalinityMax ?? 0,
  fcrMin: fishType.fcrMin,
  fcrMax: fishType.fcrMax,
  survivalRate: fishType.survivalRate,
  targetSGR: fishType.targetSGR ?? 0,
  targetWeightForHarvest: fishType.targetWeightForHarvest ?? 0,
  defaultMarketPrice: fishType.defaultMarketPrice ?? 0,
  criticalParameters: fishType.criticalParameters,
  feedingRateMatrix: normalizeFeedingRateMatrix(fishType.feedingRateMatrix),
  mealFrequencyRules:
    fishType.mealFrequencyRules.length > 0
      ? fishType.mealFrequencyRules.map((rule) => ({ maxWeight: rule.maxWeight, mealsPerDay: rule.mealsPerDay }))
      : createDefaultMealFrequencyRules(),
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

  const invalidMeals = form.mealFrequencyRules.some((rule) => !Number.isFinite(rule.mealsPerDay) || rule.mealsPerDay <= 0);
  if (invalidMeals) {
    return 'Each meal frequency rule must have meals per day greater than 0.';
  }

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
  tempOptimal: form.tempOptimal,
  tempMax: form.tempMax,
  doMin: form.doMin,
  doSafe: form.doSafe,
  phMin: form.phMin,
  phMax: form.phMax,
  nh3Safe: form.nh3Safe,
  nh3Critical: form.nh3Critical,
  no2Max: form.no2Max,
  no3Max: form.no3Max,
  salinityMin: form.salinityMin,
  salinityMax: form.salinityMax,
  alkalinityMin: form.alkalinityMin,
  alkalinityMax: form.alkalinityMax,
  fcrMin: form.fcrMin,
  fcrMax: form.fcrMax,
  survivalRate: form.survivalRate,
  targetSGR: form.targetSGR,
  targetWeightForHarvest: form.targetWeightForHarvest,
  defaultMarketPrice: form.defaultMarketPrice,
  feedingRateMatrix: cloneFeedingRateMatrix(form.feedingRateMatrix),
  mealFrequencyRules: form.mealFrequencyRules.map((rule) => ({
    maxWeight: rule.maxWeight,
    mealsPerDay: rule.mealsPerDay,
  })),
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
  allowedFoodTypeIds: form.allowedFoodTypeIds,
  isActive: form.isActive,
});

export default function FishTypeManagementEnhanced({ user, selectedFarm }: FishTypeManagementProps) {
  const [fishTypes, setFishTypes] = useState<FishTypeRecord[]>([]);
  const [foodTypes, setFoodTypes] = useState<FoodTypeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingFoodTypes, setIsLoadingFoodTypes] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<FormTab>('basic');
  const [editingFishTypeId, setEditingFishTypeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FishTypeFormState>(getDefaultFormState());

  const [calculatorFishTypeId, setCalculatorFishTypeId] = useState('');
  const [calculatorWeight, setCalculatorWeight] = useState(45);
  const [calculatorTemperature, setCalculatorTemperature] = useState(27);
  const [isRunningCalculator, setIsRunningCalculator] = useState(false);
  const [calculatorError, setCalculatorError] = useState<string | null>(null);
  const [feedingRateResult, setFeedingRateResult] = useState<FeedingRateResult | null>(null);
  const [mealFrequencyResult, setMealFrequencyResult] = useState<MealFrequencyResult | null>(null);
  const [proteinRequirementResult, setProteinRequirementResult] = useState<ProteinRequirementResult | null>(null);

  const currentFarmLabel = selectedFarm?.name || 'Current Farm';

  const foodTypeMap = useMemo(() => new Map(foodTypes.map((foodType) => [foodType.id, foodType])), [foodTypes]);

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
    setIsModalOpen(true);
  };

  const openEditModal = async (fishTypeId: string) => {
    setEditingFishTypeId(fishTypeId);
    setFormError(null);
    setActiveFormTab('basic');
    setIsModalOpen(true);
    setIsSaving(true);
    try {
      const detail = await getFishTypeById(fishTypeId);
      setFormState(toFormState(detail));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to load fish type details.');
    } finally {
      setIsSaving(false);
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

  const updateMealFrequencyRule = (index: number, field: keyof MealFrequencyRule, value: number | null) => {
    setFormState((previous) => ({
      ...previous,
      mealFrequencyRules: previous.mealFrequencyRules.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, [field]: value } : rule,
      ),
    }));
  };

  const addMealFrequencyRule = () => {
    setFormState((previous) => ({
      ...previous,
      mealFrequencyRules: [...previous.mealFrequencyRules, { maxWeight: null, mealsPerDay: 2 }],
    }));
  };

  const removeMealFrequencyRule = (index: number) => {
    setFormState((previous) => ({
      ...previous,
      mealFrequencyRules:
        previous.mealFrequencyRules.length === 1
          ? previous.mealFrequencyRules
          : previous.mealFrequencyRules.filter((_, ruleIndex) => ruleIndex !== index),
    }));
  };

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
      const [feedingRate, mealFrequency, proteinRequirement] = await Promise.all([
        getFeedingRate(calculatorFishTypeId, calculatorWeight, calculatorTemperature),
        getMealFrequency(calculatorFishTypeId, calculatorWeight),
        getProteinRequirement(calculatorFishTypeId, calculatorWeight),
      ]);

      setFeedingRateResult(feedingRate);
      setMealFrequencyResult(mealFrequency);
      setProteinRequirementResult(proteinRequirement);
    } catch (error) {
      setCalculatorError(error instanceof Error ? error.message : 'Failed to run calculators.');
    } finally {
      setIsRunningCalculator(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#F4FAFB] via-[#EDF6F8] to-[#E8F1F4] flex flex-col">
      <div className="bg-gradient-to-r from-[#0A4D68] via-[#0D5D75] to-[#117487] text-white px-6 py-4 border-b border-white/15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fish className="w-6 h-6" />
            <span className="text-xl font-semibold">Fish Type Management</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">{currentFarmLabel}</span>
            <div className="w-10 h-10 rounded-full bg-[#11A0B2] flex items-center justify-center font-semibold ring-2 ring-white/30">
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
            <Button className="bg-[#0D8FA3] hover:bg-[#0A6F83] border border-[#0A6F83]" onClick={openCreateModal}>
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
              <Card key={fishType.id} className="bg-white shadow-sm border border-[#CFE0E6]">
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
                  <p>DO Safe: {fishType.doSafe} mg/L</p>
                  <p>FCR Target: {fishType.fcrMin} - {fishType.fcrMax}</p>
                  <p>Survival Rate: {fishType.survivalRate}%</p>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Allowed Food Types</p>
                    {fishType.allowedFoodTypeIds.length === 0 ? (
                      <p className="text-xs text-gray-500">No food types assigned.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {fishType.allowedFoodTypeIds.map((foodTypeId) => (
                          <Badge key={foodTypeId} variant="outline" className="text-xs">
                            {foodTypeMap.get(foodTypeId)?.name || foodTypeId}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => void openEditModal(fishType.id)}>
                    Edit
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="border border-[#CFE0E6] bg-white/90">
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
            <Button className="bg-[#0D8FA3] hover:bg-[#0A6F83] border border-[#0A6F83]" onClick={() => void runCalculators()} disabled={isRunningCalculator}>
              {isRunningCalculator ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Run Calculators
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[#F4FAFC] border border-[#D3E3EA]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Feeding Rate</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {feedingRateResult ? `${feedingRateResult.feedingRatePercentage}% body weight/day` : 'Run calculator'}
                </CardContent>
              </Card>
              <Card className="bg-[#F4FAFC] border border-[#D3E3EA]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Meal Frequency</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {mealFrequencyResult ? `${mealFrequencyResult.mealsPerDay} meals/day` : 'Run calculator'}
                </CardContent>
              </Card>
              <Card className="bg-[#F4FAFC] border border-[#D3E3EA]">
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
        <DialogContent className="max-w-[95vw] w-[860px] max-h-[95vh] overflow-y-auto p-0 bg-gradient-to-b from-[#F9FCFD] to-[#EDF4F7] border border-[#BFD2DA] shadow-2xl">
          <div className="px-6 pt-6 pb-4 border-b border-[#C8D9E0] bg-white/70">
            <DialogHeader className="gap-0">
              <DialogTitle className="text-[2.1rem] leading-none font-bold text-[#1F2937] pr-8">
                {editingFishTypeId ? 'Edit Fish Type' : 'Create New Fish Type'}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Configure fish type profile, water quality, feeding matrix, protein rules, and food compatibility.
              </DialogDescription>
            </DialogHeader>
            {formError ? <p className="text-sm text-red-700 mt-4">{formError}</p> : null}
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
              Protein & Meals
              </TabsTrigger>
              <TabsTrigger value="food" className="h-auto min-h-10 whitespace-normal text-center leading-tight py-2 px-2 text-sm font-semibold rounded-lg border border-transparent text-[#2C4250] data-[state=active]:bg-white data-[state=active]:text-[#0A4D68] data-[state=active]:border-[#AEC7D2] data-[state=active]:shadow-sm">
              Food Types
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fish-type-name">Name *</Label>
                  <Input
                    id="fish-type-name"
                    value={formState.name}
                    onChange={(event) => setFormState((previous) => ({ ...previous, name: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="fish-type-scientific-name">Scientific Name *</Label>
                  <Input
                    id="fish-type-scientific-name"
                    value={formState.scientificName}
                    onChange={(event) =>
                      setFormState((previous) => ({ ...previous, scientificName: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>Arabic Name</Label>
                  <Input
                    value={formState.arabicName}
                    onChange={(event) => setFormState((previous) => ({ ...previous, arabicName: event.target.value }))}
                  />
                </div>
                <div>
                  <Label>Target SGR (%/day)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formState.targetSGR}
                    onChange={(event) =>
                      setFormState((previous) => ({ ...previous, targetSGR: toNumber(event.target.value) }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  rows={3}
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
                        className={`px-3 py-2 rounded-lg border text-sm text-left ${
                          selected ? 'bg-[#E0F4F5] border-[#088395] text-[#0A4D68]' : 'bg-white border-gray-300'
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

            <TabsContent value="water" className="space-y-6 mt-0">
              <h3 className="text-[1.8rem] font-semibold text-[#1F2937]">Water Quality Parameters</h3>

              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-[#374151]">Temperature (°C)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600">Minimum</Label>
                    <Input
                      type="number"
                      value={formState.tempMin}
                      onChange={(event) => setFormState((previous) => ({ ...previous, tempMin: toNumber(event.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Optimal</Label>
                    <Input
                      type="number"
                      value={formState.tempOptimal}
                      onChange={(event) =>
                        setFormState((previous) => ({ ...previous, tempOptimal: toNumber(event.target.value) }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Maximum</Label>
                    <Input
                      type="number"
                      value={formState.tempMax}
                      onChange={(event) => setFormState((previous) => ({ ...previous, tempMax: toNumber(event.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-[#374151]">Dissolved Oxygen (mg/L)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-600">Minimum</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formState.doMin}
                        onChange={(event) =>
                          setFormState((previous) => ({ ...previous, doMin: toNumber(event.target.value) }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Safe</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formState.doSafe}
                        onChange={(event) =>
                          setFormState((previous) => ({ ...previous, doSafe: toNumber(event.target.value) }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-[#374151]">pH Range</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-600">Minimum</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formState.phMin}
                        onChange={(event) =>
                          setFormState((previous) => ({ ...previous, phMin: toNumber(event.target.value) }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Maximum</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formState.phMax}
                        onChange={(event) =>
                          setFormState((previous) => ({ ...previous, phMax: toNumber(event.target.value) }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-sm font-semibold">NH₃ Safe (mg/L)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formState.nh3Safe}
                    onChange={(event) => setFormState((previous) => ({ ...previous, nh3Safe: toNumber(event.target.value) }))}
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">NH₃ Critical (mg/L)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formState.nh3Critical}
                    onChange={(event) =>
                      setFormState((previous) => ({ ...previous, nh3Critical: toNumber(event.target.value) }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">NO₂ Max (mg/L)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formState.no2Max}
                    onChange={(event) => setFormState((previous) => ({ ...previous, no2Max: toNumber(event.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-[1.5rem] font-semibold text-[#1F2937]">Performance Benchmarks</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-sm font-semibold">FCR Minimum (Best)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formState.fcrMin}
                      onChange={(event) => setFormState((previous) => ({ ...previous, fcrMin: toNumber(event.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">FCR Maximum (Acceptable)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formState.fcrMax}
                      onChange={(event) => setFormState((previous) => ({ ...previous, fcrMax: toNumber(event.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Expected Survival Rate (%)</Label>
                    <Input
                      type="number"
                      value={formState.survivalRate}
                      onChange={(event) =>
                        setFormState((previous) => ({ ...previous, survivalRate: toNumber(event.target.value) }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-sm font-semibold">NO₃ Max (mg/L)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formState.no3Max}
                      onChange={(event) => setFormState((previous) => ({ ...previous, no3Max: toNumber(event.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Target Weight For Harvest (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formState.targetWeightForHarvest}
                      onChange={(event) =>
                        setFormState((previous) => ({ ...previous, targetWeightForHarvest: toNumber(event.target.value) }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Default Market Price (EGP/kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formState.defaultMarketPrice}
                      onChange={(event) =>
                        setFormState((previous) => ({ ...previous, defaultMarketPrice: toNumber(event.target.value) }))
                      }
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="feeding" className="space-y-4 mt-0">
              <div className="flex flex-wrap gap-2 justify-between items-center">
                <h3 className="text-lg font-semibold">Feeding Rate Matrix</h3>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={addFeedingTemperature}>
                    <Plus className="w-3 h-3 mr-1" />
                    Temperature
                  </Button>
                  <Button type="button" size="sm" className="bg-[#088395] hover:bg-[#0A4D68]" onClick={addWeightRange}>
                    <Plus className="w-3 h-3 mr-1" />
                    Weight Range
                  </Button>
                </div>
              </div>

              <Card className="bg-white">
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
                          className="h-8 w-8 p-0"
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
                      <tr key={`weight-range-${weightIndex}`}>
                        <td className="px-3 py-2 border-b">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              className="h-8"
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
                              className="h-8"
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
                              className="h-8"
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

            <TabsContent value="protein" className="space-y-4 mt-0">
              <Card className="bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Meal Frequency Rules</span>
                    <Button type="button" size="sm" variant="outline" onClick={addMealFrequencyRule}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add Rule
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {formState.mealFrequencyRules.map((rule, index) => (
                    <div key={`meal-rule-${index}`} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                      <div>
                        <Label className="text-xs">Max Weight (g)</Label>
                        <Input
                          type="number"
                          value={rule.maxWeight ?? ''}
                          placeholder="Leave empty for no max"
                          onChange={(event) =>
                            updateMealFrequencyRule(index, 'maxWeight', toNullableNumber(event.target.value))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Meals Per Day</Label>
                        <Input
                          type="number"
                          min="1"
                          value={rule.mealsPerDay}
                          onChange={(event) =>
                            updateMealFrequencyRule(index, 'mealsPerDay', Math.max(0, toNumber(event.target.value)))
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMealFrequencyRule(index)}
                        disabled={formState.mealFrequencyRules.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Protein Requirements</span>
                    <Button type="button" size="sm" variant="outline" onClick={addProteinRequirement}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add Rule
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {formState.proteinRequirements.map((rule, index) => (
                    <div key={`protein-rule-${index}`} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                      <div>
                        <Label className="text-xs">Min Weight (g)</Label>
                        <Input
                          type="number"
                          value={rule.minWeight ?? ''}
                          onChange={(event) =>
                            updateProteinRequirement(index, 'minWeight', toNullableNumber(event.target.value))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Max Weight (g)</Label>
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
                        <Label className="text-xs">Protein %</Label>
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
                        onClick={() => removeProteinRequirement(index)}
                        disabled={formState.proteinRequirements.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="food" className="space-y-4 mt-0">
              <Card className="bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Allowed Food Types</CardTitle>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {foodTypes.map((foodType) => {
                        const checked = formState.allowedFoodTypeIds.includes(foodType.id);
                        return (
                          <label
                            key={foodType.id}
                            className={`border rounded-md p-2 text-sm flex items-center justify-between ${
                              checked ? 'bg-[#E0F4F5] border-[#088395]' : 'bg-white border-gray-300'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <Wheat className="w-4 h-4 text-[#088395]" />
                              {foodType.name}
                            </span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) => toggleAllowedFoodType(foodType.id, event.target.checked)}
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Harvest yield prediction configuration.</span>
                    <Button type="button" size="sm" variant="outline" onClick={addExpectedDistributionRow}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add Row
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {formState.expectedGradeDistribution.length === 0 ? (
                    <p className="text-sm text-gray-600">No grade distribution configured.</p>
                  ) : (
                    formState.expectedGradeDistribution.map((row, index) => (
                      <div key={`distribution-row-${index}`} className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-2 items-end">
                        <div>
                          <Label className="text-xs">Grade Pricing ID</Label>
                          <Input
                            value={row.gradePricingId}
                            onChange={(event) =>
                              updateExpectedDistributionRow(index, 'gradePricingId', event.target.value)
                            }
                            placeholder="pricing-uuid"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Percentage</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.percentage}
                            onChange={(event) => updateExpectedDistributionRow(index, 'percentage', toNumber(event.target.value))}
                          />
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeExpectedDistributionRow(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}

                  {formState.expectedGradeDistribution.length > 0 && (
                    <p
                      className={`text-xs font-medium ${
                        Math.abs(distributionTotal - 100) <= 0.01 ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      Total: {distributionTotal.toFixed(2)}%
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <Label>Active Status</Label>
                      <p className="text-xs text-gray-600">Enable this fish type in operational flows</p>
                    </div>
                    <Switch
                      checked={formState.isActive}
                      onCheckedChange={(checked) => setFormState((previous) => ({ ...previous, isActive: checked }))}
                    />
                  </div>

                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      rows={3}
                      value={formState.notes}
                      onChange={(event) => setFormState((previous) => ({ ...previous, notes: event.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <div className="border-t border-gray-300 pt-4 flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-11 bg-[#0C8C9F] hover:bg-[#0A4D68]"
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
