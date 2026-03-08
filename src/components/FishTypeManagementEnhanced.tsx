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
import { AlertCircle, Fish, Loader2, Plus, RefreshCcw, Wheat } from 'lucide-react';
import { Farm, User } from '../types';
import {
  FeedingRateResult,
  FishTypeRecord,
  FishTypeUpsertPayload,
  FoodTypeOption,
  MealFrequencyResult,
  ProteinRequirementResult,
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
  criticalParametersText: string;
  feedingRateMatrixJson: string;
  mealFrequencyRulesJson: string;
  proteinRequirementsJson: string;
  notes: string;
  allowedFoodTypeIds: string[];
  isActive: boolean;
}

const DEFAULT_FEEDING_MATRIX_JSON = JSON.stringify(
  {
    weight_ranges: [
      { min: 0, max: 10 },
      { min: 10, max: 50 },
    ],
    temperatures: [20, 24, 26, 28, 30],
    rates: [
      [20, 25, 30, 30, 25],
      [8, 10, 12, 12, 10],
    ],
  },
  null,
  2,
);

const DEFAULT_MEAL_RULES_JSON = JSON.stringify(
  [
    { maxWeight: 10, mealsPerDay: 6 },
    { maxWeight: 50, mealsPerDay: 4 },
    { maxWeight: null, mealsPerDay: 2 },
  ],
  null,
  2,
);

const DEFAULT_PROTEIN_RULES_JSON = JSON.stringify(
  [
    { minWeight: 0, maxWeight: 10, proteinPercentage: 40 },
    { minWeight: 10, maxWeight: 50, proteinPercentage: 32 },
    { minWeight: 50, maxWeight: null, proteinPercentage: 28 },
  ],
  null,
  2,
);

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
  criticalParametersText: '',
  feedingRateMatrixJson: DEFAULT_FEEDING_MATRIX_JSON,
  mealFrequencyRulesJson: DEFAULT_MEAL_RULES_JSON,
  proteinRequirementsJson: DEFAULT_PROTEIN_RULES_JSON,
  notes: '',
  allowedFoodTypeIds: [],
  isActive: true,
});

const parseJsonField = <T,>(label: string, value: string): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }
};

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
  criticalParametersText: fishType.criticalParameters.join(', '),
  feedingRateMatrixJson: JSON.stringify(fishType.feedingRateMatrix, null, 2),
  mealFrequencyRulesJson: JSON.stringify(fishType.mealFrequencyRules, null, 2),
  proteinRequirementsJson: JSON.stringify(fishType.proteinRequirements, null, 2),
  notes: fishType.notes || '',
  allowedFoodTypeIds: fishType.allowedFoodTypeIds,
  isActive: fishType.isActive,
});

const toUpsertPayload = (form: FishTypeFormState): FishTypeUpsertPayload => {
  const criticalParameters = form.criticalParametersText
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return {
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
    feedingRateMatrix: parseJsonField('Feeding Rate Matrix', form.feedingRateMatrixJson),
    mealFrequencyRules: parseJsonField('Meal Frequency Rules', form.mealFrequencyRulesJson),
    proteinRequirements: parseJsonField('Protein Requirements', form.proteinRequirementsJson),
    criticalParameters,
    notes: form.notes.trim() || undefined,
    allowedFoodTypeIds: form.allowedFoodTypeIds,
    isActive: form.isActive,
  };
};

export default function FishTypeManagementEnhanced({ user, selectedFarm }: FishTypeManagementProps) {
  const [fishTypes, setFishTypes] = useState<FishTypeRecord[]>([]);
  const [foodTypes, setFoodTypes] = useState<FoodTypeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingFoodTypes, setIsLoadingFoodTypes] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
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
    setFormState(getDefaultFormState());
    setIsModalOpen(true);
  };

  const openEditModal = async (fishTypeId: string) => {
    setEditingFishTypeId(fishTypeId);
    setFormError(null);
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

  const saveFishType = async () => {
    setFormError(null);

    if (!formState.name.trim() || !formState.scientificName.trim()) {
      setFormError('Name and scientific name are required.');
      return;
    }

    let payload: FishTypeUpsertPayload;
    try {
      payload = toUpsertPayload(formState);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Invalid form payload.');
      return;
    }

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
                  <CardTitle className="text-sm">Meal Frequency</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {mealFrequencyResult ? `${mealFrequencyResult.mealsPerDay} meals/day` : 'Run calculator'}
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vw] w-[1200px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFishTypeId ? 'Edit Fish Type' : 'Create Fish Type'}</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Configure fish type profile, water thresholds, feeding rules, and food compatibility.
            </DialogDescription>
          </DialogHeader>

          {formError ? <p className="text-sm text-red-700">{formError}</p> : null}

          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="water">Water</TabsTrigger>
              <TabsTrigger value="feeding">Feeding</TabsTrigger>
              <TabsTrigger value="protein">Protein</TabsTrigger>
              <TabsTrigger value="food">Food</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fish-type-name">Name *</Label>
                  <Input
                    id="fish-type-name"
                    value={formState.name}
                    onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="fish-type-scientific-name">Scientific Name *</Label>
                  <Input
                    id="fish-type-scientific-name"
                    value={formState.scientificName}
                    onChange={(event) => setFormState((prev) => ({ ...prev, scientificName: event.target.value }))}
                  />
                </div>
                <div>
                  <Label>Arabic Name</Label>
                  <Input
                    value={formState.arabicName}
                    onChange={(event) => setFormState((prev) => ({ ...prev, arabicName: event.target.value }))}
                  />
                </div>
                <div>
                  <Label>Target SGR</Label>
                  <Input
                    type="number"
                    value={formState.targetSGR}
                    onChange={(event) => setFormState((prev) => ({ ...prev, targetSGR: Number(event.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={formState.description}
                  onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>
              <div>
                <Label>Critical Parameters (comma separated)</Label>
                <Input
                  value={formState.criticalParametersText}
                  onChange={(event) => setFormState((prev) => ({ ...prev, criticalParametersText: event.target.value }))}
                  placeholder="DO, NH3, pH, Temperature"
                />
              </div>
            </TabsContent>

            <TabsContent value="water" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label>Temp Min</Label>
                  <Input type="number" value={formState.tempMin} onChange={(event) => setFormState((prev) => ({ ...prev, tempMin: Number(event.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>Temp Optimal</Label>
                  <Input type="number" value={formState.tempOptimal} onChange={(event) => setFormState((prev) => ({ ...prev, tempOptimal: Number(event.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>Temp Max</Label>
                  <Input type="number" value={formState.tempMax} onChange={(event) => setFormState((prev) => ({ ...prev, tempMax: Number(event.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>DO Min</Label>
                  <Input type="number" value={formState.doMin} onChange={(event) => setFormState((prev) => ({ ...prev, doMin: Number(event.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>DO Safe</Label>
                  <Input type="number" value={formState.doSafe} onChange={(event) => setFormState((prev) => ({ ...prev, doSafe: Number(event.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>pH Min</Label>
                  <Input type="number" value={formState.phMin} onChange={(event) => setFormState((prev) => ({ ...prev, phMin: Number(event.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>pH Max</Label>
                  <Input type="number" value={formState.phMax} onChange={(event) => setFormState((prev) => ({ ...prev, phMax: Number(event.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>NH3 Safe</Label>
                  <Input type="number" value={formState.nh3Safe} onChange={(event) => setFormState((prev) => ({ ...prev, nh3Safe: Number(event.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>NH3 Critical</Label>
                  <Input type="number" value={formState.nh3Critical} onChange={(event) => setFormState((prev) => ({ ...prev, nh3Critical: Number(event.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>NO2 Max</Label>
                  <Input type="number" value={formState.no2Max} onChange={(event) => setFormState((prev) => ({ ...prev, no2Max: Number(event.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>NO3 Max</Label>
                  <Input type="number" value={formState.no3Max} onChange={(event) => setFormState((prev) => ({ ...prev, no3Max: Number(event.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>Salinity Min</Label>
                  <Input type="number" value={formState.salinityMin} onChange={(event) => setFormState((prev) => ({ ...prev, salinityMin: Number(event.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>Salinity Max</Label>
                  <Input type="number" value={formState.salinityMax} onChange={(event) => setFormState((prev) => ({ ...prev, salinityMax: Number(event.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>Alkalinity Min</Label>
                  <Input type="number" value={formState.alkalinityMin} onChange={(event) => setFormState((prev) => ({ ...prev, alkalinityMin: Number(event.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>Alkalinity Max</Label>
                  <Input type="number" value={formState.alkalinityMax} onChange={(event) => setFormState((prev) => ({ ...prev, alkalinityMax: Number(event.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>FCR Min</Label>
                  <Input type="number" value={formState.fcrMin} onChange={(event) => setFormState((prev) => ({ ...prev, fcrMin: Number(event.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>FCR Max</Label>
                  <Input type="number" value={formState.fcrMax} onChange={(event) => setFormState((prev) => ({ ...prev, fcrMax: Number(event.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>Survival Rate (%)</Label>
                  <Input type="number" value={formState.survivalRate} onChange={(event) => setFormState((prev) => ({ ...prev, survivalRate: Number(event.target.value) || 0 }))} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="feeding" className="space-y-3">
              <Label>Feeding Rate Matrix JSON</Label>
              <Textarea
                rows={12}
                value={formState.feedingRateMatrixJson}
                onChange={(event) => setFormState((prev) => ({ ...prev, feedingRateMatrixJson: event.target.value }))}
              />
            </TabsContent>

            <TabsContent value="protein" className="space-y-3">
              <Label>Meal Frequency Rules JSON</Label>
              <Textarea
                rows={8}
                value={formState.mealFrequencyRulesJson}
                onChange={(event) => setFormState((prev) => ({ ...prev, mealFrequencyRulesJson: event.target.value }))}
              />
              <Label>Protein Requirements JSON</Label>
              <Textarea
                rows={8}
                value={formState.proteinRequirementsJson}
                onChange={(event) => setFormState((prev) => ({ ...prev, proteinRequirementsJson: event.target.value }))}
              />
            </TabsContent>

            <TabsContent value="food" className="space-y-4">
              <div className="space-y-2">
                <Label>Allowed Food Types</Label>
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
                          className={`border rounded-md p-2 text-sm flex items-center justify-between ${checked ? 'bg-[#E0F4F5] border-[#088395]' : ''}`}
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
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <Label>Active Status</Label>
                    <p className="text-xs text-gray-600">Enable this fish type in operational flows</p>
                  </div>
                  <Switch checked={formState.isActive} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isActive: checked }))} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    rows={3}
                    value={formState.notes}
                    onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 pt-2 border-t">
            <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button className="flex-1 bg-[#088395] hover:bg-[#0A4D68]" onClick={() => void saveFishType()} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingFishTypeId ? 'Update Fish Type' : 'Create Fish Type'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
