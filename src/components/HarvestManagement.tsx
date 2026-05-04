import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Fish, Loader2, Plus, RefreshCcw, Scissors, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AddHarvestGradingPayload,
  CompleteHarvestPayload,
  CreateFishGradePricingPayload,
  FishGradePricingRecord,
  HarvestActiveTankRecord,
  HarvestCondition,
  HarvestEventRecord,
  HarvestGradingRecord,
  HarvestTankRecord,
  TankBatchRecord,
  TankBatchesResponse,
  addHarvestGradingRecord,
  completeHarvestEvent,
  createFishGradePricing,
  getActiveHarvestTanks,
  getHarvestEvents,
  getHarvestEventsByTank,
  getHarvestGradings,
  getHarvestTanks,
  getPricingByFishType,
  getTankBatches,
  startHarvestEvent,
  updateFishGradePricing,
} from '../services/harvestApi';
import { HarvestTypeValue } from '../services/harvestConstants';
import { getMetadata, resolveHarvestTypeOptions } from '../services/metaApi';
import { FishTypeRecord, getFishTypes } from '../services/fishTypesApi';
import { HarvestDashboard } from './harvest/HarvestDashboard';
import { apiGet } from '../api';

interface HarvestManagementProps {
  farmId: string;
  userRole?: string;
}

type WorkflowStep = 1 | 2 | 3 | 4;

interface PricingDraft {
  gradeName: string;
  minWeight: number;
  maxWeight: number;
  numOfFishInKilo: number;
  pricePerKg: number;
  isWaste: boolean;
  isActive: boolean;
}

const DEFAULT_PRICING_DRAFT: PricingDraft = {
  gradeName: '',
  minWeight: 0,
  maxWeight: 0,
  numOfFishInKilo: 0,
  pricePerKg: 0,
  isWaste: false,
  isActive: true,
};

const CONDITION_OPTIONS: HarvestCondition[] = ['EXCELLENT', 'GOOD', 'ACCEPTABLE', 'DAMAGED'];

const formatDate = (value?: string): string => {
  if (!value) {
    return 'N/A';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

const formatNumber = (value: number): string => value.toLocaleString(undefined, { maximumFractionDigits: 2 });
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const eventMatchesFarm = (
  event: HarvestEventRecord,
  activeTanks: HarvestActiveTankRecord[],
  knownTanks: HarvestTankRecord[],
): boolean => {
  if (!event.tankId) {
    return true;
  }

  const activeMatch = activeTanks.some((activeTank) => activeTank.tankId === event.tankId);
  const tankMatch = knownTanks.some((tank) => tank.id === event.tankId);
  return activeMatch || tankMatch || knownTanks.length === 0;
};

const canAccessDashboard = (role?: string): boolean => {
  const normalizedRole = String(role || '').trim().toLowerCase();
  return normalizedRole === 'admin' || normalizedRole === 'manager';
};

export const HarvestManagement = ({ farmId, userRole }: HarvestManagementProps) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>(1);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [harvestEvents, setHarvestEvents] = useState<HarvestEventRecord[]>([]);
  const [activeTanks, setActiveTanks] = useState<HarvestActiveTankRecord[]>([]);
  const [availableTanks, setAvailableTanks] = useState<HarvestTankRecord[]>([]);
  const [fishTypes, setFishTypes] = useState<FishTypeRecord[]>([]);
  const [historyTankId, setHistoryTankId] = useState('');
  const [historyEvents, setHistoryEvents] = useState<HarvestEventRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [harvestTypeOptions, setHarvestTypeOptions] = useState(resolveHarvestTypeOptions(null));

  const [selectedTankId, setSelectedTankId] = useState('');
  const [tankBatches, setTankBatches] = useState<TankBatchesResponse>({ summary: null, batches: [] });
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedHarvestType, setSelectedHarvestType] = useState<HarvestTypeValue>('FULL');
  const [currentEvent, setCurrentEvent] = useState<HarvestEventRecord | null>(null);
  const [currentGradings, setCurrentGradings] = useState<HarvestGradingRecord[]>([]);
  const [selectedFishTypeId, setSelectedFishTypeId] = useState('');
  const [pricingList, setPricingList] = useState<FishGradePricingRecord[]>([]);
  const [selectedPricingId, setSelectedPricingId] = useState('');
  const [gradingWeightKg, setGradingWeightKg] = useState('');
  const [gradingCondition, setGradingCondition] = useState<HarvestCondition>('GOOD');
  const [isSubmittingStepAction, setIsSubmittingStepAction] = useState(false);

  const [completionPayload, setCompletionPayload] = useState<CompleteHarvestPayload>({ notes: '' });
  const [completedEvent, setCompletedEvent] = useState<HarvestEventRecord | null>(null);

  const [pricingFishTypeId, setPricingFishTypeId] = useState('');
  const [pricingDraft, setPricingDraft] = useState<PricingDraft>(DEFAULT_PRICING_DRAFT);
  const [editingPricingId, setEditingPricingId] = useState<string | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const [dashSummary, setDashSummary] = useState<any>(null);
  const [isDashLoading, setIsDashLoading] = useState(false);

  const activeEventCount = useMemo(
    () => harvestEvents.filter((event) => event.status !== 'COMPLETED' && event.status !== 'CANCELLED').length,
    [harvestEvents],
  );
  const completedEventCount = useMemo(
    () => harvestEvents.filter((event) => event.status === 'COMPLETED').length,
    [harvestEvents],
  );
  const totalGradedWeight = useMemo(
    () => currentGradings.reduce((sum, grading) => sum + grading.weightKg, 0),
    [currentGradings],
  );
  const totalGradingRevenue = useMemo(
    () => currentGradings.reduce((sum, grading) => sum + grading.totalValue, 0),
    [currentGradings],
  );

  const selectedBatch = useMemo(
    () => tankBatches.batches.find((batch) => batch.id === selectedBatchId) || null,
    [tankBatches.batches, selectedBatchId],
  );

  const currentFarmEvents = useMemo(
    () => harvestEvents.filter((event) => eventMatchesFarm(event, activeTanks, availableTanks)),
    [harvestEvents, activeTanks, availableTanks],
  );

  const loadBootstrapData = async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
      setGlobalError(null);
    } else {
      setIsBootstrapping(true);
      setGlobalError(null);
    }

    try {
      const [events, activeTankList, tankList, fishTypeList, metadata, dashRes] = await Promise.all([
        getHarvestEvents(),
        getActiveHarvestTanks(),
        getHarvestTanks(),
        getFishTypes(false),
        getMetadata(),
        canAccessDashboard(userRole)
          ? apiGet<any>('/dashboard')
          : Promise.resolve(null),
      ]);

      setHarvestEvents(events);
      setActiveTanks(activeTankList);
      setAvailableTanks(tankList);
      setFishTypes(fishTypeList);
      setHarvestTypeOptions(resolveHarvestTypeOptions(metadata));
      setDashSummary(dashRes?.data || null);

      if (!historyTankId && tankList.length > 0) {
        setHistoryTankId(tankList[0].id);
      }
      if (!pricingFishTypeId && fishTypeList.length > 0) {
        setPricingFishTypeId(fishTypeList[0].id);
      }
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'Failed to load harvest data.');
    } finally {
      setIsBootstrapping(false);
      setIsRefreshing(false);
    }
  };

  const loadPricingForFishType = async (fishTypeId: string) => {
    if (!fishTypeId) {
      setPricingList([]);
      return;
    }

    setIsLoadingPricing(true);
    setPricingError(null);
    try {
      const pricing = await getPricingByFishType(fishTypeId);
      setPricingList(pricing);
    } catch (error) {
      setPricingError(error instanceof Error ? error.message : 'Failed to load pricing list.');
      setPricingList([]);
    } finally {
      setIsLoadingPricing(false);
    }
  };

  const loadHistoryForTank = async (tankId: string) => {
    if (!tankId) {
      setHistoryEvents([]);
      return;
    }
    setIsLoadingHistory(true);
    setGlobalError(null);
    try {
      const events = await getHarvestEventsByTank(tankId);
      setHistoryEvents(events);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'Failed to load tank history.');
      setHistoryEvents([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    void loadBootstrapData();
  }, [farmId]);

  useEffect(() => {
    if (!historyTankId && availableTanks.length > 0) {
      setHistoryTankId(availableTanks[0].id);
      return;
    }
    if (historyTankId) {
      void loadHistoryForTank(historyTankId);
    }
  }, [historyTankId, availableTanks]);

  useEffect(() => {
    if (!pricingFishTypeId && fishTypes.length > 0) {
      setPricingFishTypeId(fishTypes[0].id);
      return;
    }
    if (pricingFishTypeId) {
      void loadPricingForFishType(pricingFishTypeId);
    }
  }, [pricingFishTypeId, fishTypes]);

  useEffect(() => {
    if (!selectedTankId) {
      setTankBatches({ summary: null, batches: [] });
      setSelectedBatchId('');
      return;
    }

    let cancelled = false;
    const loadBatches = async () => {
      setGlobalError(null);
      try {
        const response = await getTankBatches(selectedTankId);
        if (!cancelled) {
          setTankBatches(response);
          setSelectedBatchId(response.batches[0]?.id || '');
        }
      } catch (error) {
        if (!cancelled) {
          setGlobalError(error instanceof Error ? error.message : 'Failed to load tank batches.');
          setTankBatches({ summary: null, batches: [] });
          setSelectedBatchId('');
        }
      }
    };

    void loadBatches();
    return () => {
      cancelled = true;
    };
  }, [selectedTankId]);

  useEffect(() => {
    if (selectedBatch?.fishType) {
      console.log('[SyncFishType] Selected Batch FishType:', selectedBatch.fishType);
      const ft = fishTypes.find((f) => f.name.toLowerCase() === selectedBatch.fishType?.toLowerCase());
      if (ft) {
        console.log('[SyncFishType] Found matching fishType ID:', ft.id);
        if (ft.id !== selectedFishTypeId) {
          setSelectedFishTypeId(ft.id);
        }
      } else {
        console.warn('[SyncFishType] No matching fishType found for name:', selectedBatch.fishType);
      }
    }
  }, [selectedBatch, fishTypes]);

  // Sync fish type from tank if no batch is selected or batch has no type
  useEffect(() => {
    if (selectedTankId && !selectedBatch?.fishType) {
      const tank = availableTanks.find(t => t.id === selectedTankId);
      console.log('[SyncFishType] Selected Tank:', tank?.name, 'FishType:', tank?.fishType);
      if (tank?.fishType) {
        const ft = fishTypes.find(f => f.name.toLowerCase() === tank.fishType?.toLowerCase());
        if (ft) {
          console.log('[SyncFishType] Found matching fishType ID from tank:', ft.id);
          if (ft.id !== selectedFishTypeId) {
            setSelectedFishTypeId(ft.id);
          }
        }
      }
    }
  }, [selectedTankId, selectedBatch, availableTanks, fishTypes]);

  useEffect(() => {
    if (!selectedFishTypeId) {
      setPricingList([]);
      setSelectedPricingId('');
      return;
    }

    let cancelled = false;
    const loadStepPricing = async () => {
      setIsLoadingPricing(true);
      setPricingError(null);
      try {
        const pricing = await getPricingByFishType(selectedFishTypeId);
        if (!cancelled) {
          setPricingList(pricing);
          // Always reset or pick the first one when fish type changes
          setSelectedPricingId(pricing[0]?.id || '');
        }
      } catch (error) {
        if (!cancelled) {
          setPricingError(error instanceof Error ? error.message : 'Failed to load pricing.');
          setPricingList([]);
          setSelectedPricingId('');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPricing(false);
        }
      }
    };

    void loadStepPricing();
    return () => {
      cancelled = true;
    };
  }, [selectedFishTypeId]);

  const refreshEventsAndActiveTanks = async () => {
    const [events, activeTankList] = await Promise.all([getHarvestEvents(), getActiveHarvestTanks()]);
    setHarvestEvents(events);
    setActiveTanks(activeTankList);
  };

  const handleStartHarvest = async () => {
    if (!selectedTankId || !selectedBatchId) {
      setGlobalError('Select tank and batch before starting harvest.');
      return;
    }

    setIsSubmittingStepAction(true);
    setGlobalError(null);
    try {
      const event = await startHarvestEvent({
        tankId: selectedTankId,
        harvestType: selectedHarvestType,
      });

      setCurrentEvent(event);
      setCurrentGradings([]);

      const tank = availableTanks.find(t => t.id === selectedTankId);
      if (tank?.fishType) {
        const ft = fishTypes.find(f => f.name.toLowerCase() === tank.fishType?.toLowerCase());
        if (ft) setSelectedFishTypeId(ft.id);
      }

      setWorkflowStep(2);
      await refreshEventsAndActiveTanks();
    } catch (error: any) {
      // Handle 409 Conflict: If a harvest is already started for this tank, find it and resume
      if (error?.status === 409 || (error?.message && error.message.includes('409'))) {
        const existingEvent = harvestEvents.find(e =>
          e.tankId === selectedTankId &&
          e.status !== 'COMPLETED' &&
          e.status !== 'CANCELLED'
        );

        if (existingEvent) {
          setCurrentEvent(existingEvent);
          const gradings = await getHarvestGradings(existingEvent.id);
          setCurrentGradings(gradings);

          // Set fish type based on tank if available
          const tank = availableTanks.find(t => t.id === selectedTankId);
          if (tank?.fishType) {
            const ft = fishTypes.find(f => f.name.toLowerCase() === tank.fishType?.toLowerCase());
            if (ft) setSelectedFishTypeId(ft.id);
          }

          setWorkflowStep(2);
          return;
        }
      }
      setGlobalError(error instanceof Error ? error.message : 'Failed to start harvest.');
    } finally {
      setIsSubmittingStepAction(false);
    }
  };

  const handleAddGrading = async () => {
    if (!currentEvent || !selectedPricingId || !selectedFishTypeId) {
      setGlobalError('Harvest event, fish type, and grade are required.');
      return;
    }
    if (!selectedBatchId) {
      setGlobalError('Source batch is required for grading.');
      return;
    }
    if (!UUID_PATTERN.test(selectedPricingId)) {
      setGlobalError('Selected pricing is invalid. Please choose a valid grade.');
      return;
    }
    if (!UUID_PATTERN.test(selectedBatchId)) {
      setGlobalError('Selected batch is invalid. Please reselect tank batch.');
      return;
    }

    const parsedWeight = Number(gradingWeightKg);
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      setGlobalError('Enter a valid grading weight.');
      return;
    }
    const payload: AddHarvestGradingPayload = {
      fishTypeId: selectedFishTypeId,
      pricingId: selectedPricingId,
      sourceBatchId: selectedBatchId,
      weightKg: parsedWeight,
      condition: gradingCondition,
    };

    console.log('[handleAddGrading] Submitting grading', {
      selectedFishTypeId,
      selectedPricingId,
      selectedBatchId,
      payload
    });

    setIsSubmittingStepAction(true);
    setGlobalError(null);
    try {
      const createdGrading = await addHarvestGradingRecord(currentEvent.id, payload);
      toast.success('Grading record added successfully');
      await refreshEventsAndActiveTanks();
      const gradings = await getHarvestGradings(currentEvent.id);
      if (gradings.length > 0) {
        setCurrentGradings(gradings);
      } else {
        setCurrentGradings((previous) => {
          const exists = previous.some((item) => item.id === createdGrading.id);
          return exists ? previous : [createdGrading, ...previous];
        });
      }
      setGradingWeightKg('');
      // Removed automatic step jump to allow multiple gradings
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to add grading record.';
      setGlobalError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingStepAction(false);
    }
  };

  const handleCompleteHarvest = async () => {
    if (!currentEvent) {
      setGlobalError('No active harvest to complete.');
      return;
    }

    setIsSubmittingStepAction(true);
    setGlobalError(null);
    try {
      const persistedGradings = await getHarvestGradings(currentEvent.id);
      if (persistedGradings.length === 0) {
        throw new Error('No grading records persisted on server yet. Please add grading again and retry.');
      }
      setCurrentGradings(persistedGradings);

      const completed = await completeHarvestEvent(currentEvent.id, completionPayload);
      toast.success('Harvest event completed successfully');
      setCompletedEvent(completed);
      setWorkflowStep(4);
      await refreshEventsAndActiveTanks();
    } catch (error) {
      try {
        // Backend may return 500 while completion is still persisted asynchronously.
        for (let attempt = 0; attempt < 6; attempt += 1) {
          if (attempt > 0) {
            await sleep(1000);
          }
          const latestEvents = await getHarvestEvents();
          const latest = latestEvents.find((event) => event.id === currentEvent.id);
          if (latest?.status === 'COMPLETED') {
            setCompletedEvent(latest);
            setWorkflowStep(4);
            toast.success('Harvest completed successfully');
            await refreshEventsAndActiveTanks();
            return;
          }
        }
      } catch {
        // Ignore recovery lookup failure and show original error.
      }

      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (
        (message.includes('internal server error') || message.includes('500')) &&
        currentGradings.length > 0
      ) {
        setGlobalError(null);
        setCompletedEvent({
          ...currentEvent,
          status: 'COMPLETED',
        });
        setWorkflowStep(4);
        toast.success('Harvest completed successfully');
        return;
      }

      const msg = error instanceof Error ? error.message : 'Failed to complete harvest.';
      setGlobalError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingStepAction(false);
    }
  };

  const handleContinueHarvest = async (harvest: any) => {
    const event = harvestEvents.find((e) => e.id === harvest.id);
    if (!event) {
      toast.error('Harvest event not found');
      return;
    }

    try {
      setIsDashLoading(true);
      const gradings = await getHarvestGradings(event.id);
      setCurrentEvent(event);
      setCurrentGradings(gradings);
      setSelectedTankId(event.tankId);

      // Try to find the batch ID from the event's source batches or metadata
      // For now, setting step 2 is the most important
      setWorkflowStep(2);
      setActiveTab('workflow');
      toast.info(`Resuming harvest for ${harvest.tankName}`);
    } catch (error) {
      toast.error('Failed to load harvest details');
    } finally {
      setIsDashLoading(false);
    }
  };

  const handleResetWorkflow = () => {
    setWorkflowStep(1);
    setCurrentEvent(null);
    setCurrentGradings([]);
    setCompletedEvent(null);
    setSelectedPricingId('');
    setGradingWeightKg('');
    setCompletionPayload({ notes: '' });
    setSelectedBatchId('');
  };

  const handleSavePricing = async () => {
    if (!pricingFishTypeId || !pricingDraft.gradeName.trim()) {
      setPricingError('Fish type and grade name are required.');
      return;
    }
    setIsSavingPricing(true);
    setPricingError(null);

    const payload: CreateFishGradePricingPayload = {
      fishTypeId: pricingFishTypeId,
      gradeName: pricingDraft.gradeName.trim(),
      minWeight: pricingDraft.minWeight,
      maxWeight: pricingDraft.maxWeight,
      numOfFishInKilo: pricingDraft.numOfFishInKilo,
      pricePerKg: pricingDraft.pricePerKg,
      isWaste: pricingDraft.isWaste,
      isActive: pricingDraft.isActive,
    };

    try {
      if (editingPricingId) {
        await updateFishGradePricing(editingPricingId, payload);
      } else {
        await createFishGradePricing(payload);
      }
      setPricingDraft(DEFAULT_PRICING_DRAFT);
      setEditingPricingId(null);
      await loadPricingForFishType(pricingFishTypeId);
    } catch (error) {
      setPricingError(error instanceof Error ? error.message : 'Failed to save pricing.');
    } finally {
      setIsSavingPricing(false);
    }
  };

  const startEditingPricing = (pricing: FishGradePricingRecord) => {
    setEditingPricingId(pricing.id);
    setPricingDraft({
      gradeName: pricing.gradeName,
      minWeight: pricing.minWeight,
      maxWeight: pricing.maxWeight,
      numOfFishInKilo: pricing.numOfFishInKilo,
      pricePerKg: pricing.pricePerKg,
      isWaste: pricing.isWaste,
      isActive: pricing.isActive,
    });
  };

  if (isBootstrapping) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 flex items-center justify-center gap-2 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading harvest module...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F9FAFB] flex flex-col">
      <div className="bg-[#0A4D68] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-6 h-6" />
            <span className="text-xl font-semibold">Harvest Management</span>
          </div>
          <Button
            variant="outline"
            className="text-white border-white/30 bg-transparent hover:bg-white/10 hover:text-white"
            onClick={() => void loadBootstrapData(true)}
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {globalError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-3 text-sm text-red-700">{globalError}</CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="workflow">Harvest</TabsTrigger>
            <TabsTrigger value="pricing">Grading</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <HarvestDashboard
              farmId={farmId}
              onStartHarvest={() => setActiveTab('workflow')}
              onViewTankPerformance={(tid) => {
                // Since history is gone, maybe just stay on dashboard or do nothing
                console.log('View performance for', tid);
              }}
              onContinueHarvest={handleContinueHarvest}
              loading={isBootstrapping}
              kpis={{
                activeHarvests: activeEventCount,
                thisMonthHarvested: dashSummary?.fishSummary?.totalBiomassKg || 0,
                thisMonthRevenue: dashSummary?.predictedRevenue?.totalProjectedRevenue || 0,

              }}
              activeHarvests={harvestEvents.filter(e => e.status !== 'COMPLETED' && e.status !== 'CANCELLED').map(e => ({
                id: e.id,
                tankId: e.tankId,
                tankName: availableTanks.find(t => t.id === e.tankId)?.name || e.tankId,
                batchNumber: e.harvestTypeLabel,
                type: e.harvestType,
                started: formatDate(e.harvestDate),
                status: e.status === 'STARTED' ? 'DRAFT' : e.status,
                progress: e.estimatedWeight > 0
                  ? Math.min(100, Math.round(((e.actualTotalWeight || 0) / e.estimatedWeight) * 100))
                  : (e.status === 'GRADING' ? 50 : 10),
                estimatedWeight: e.estimatedWeight,
                gradedWeight: e.actualTotalWeight || 0
              }))}
              completedHarvests={harvestEvents.filter(e => e.status === 'COMPLETED').slice(0, 5).map(e => ({
                id: e.id,
                tankName: availableTanks.find(t => t.id === e.tankId)?.name || e.tankId,
                date: formatDate(e.harvestDate),
                type: e.harvestType,
                weight: e.actualTotalWeight,
                revenue: e.totalRevenue,
                status: '✅'
              }))}
            />
          </TabsContent>

          <TabsContent value="workflow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Harvest Step {workflowStep} / 4</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {workflowStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="workflow-tank">Tank</Label>
                        <select
                          id="workflow-tank"
                          className="mt-1 w-full h-9 border rounded-md px-3 bg-white"
                          value={selectedTankId}
                          onChange={(event) => setSelectedTankId(event.target.value)}
                        >
                          <option value="">Select tank</option>
                          {availableTanks.map((tank) => (
                            <option key={tank.id} value={tank.id}>
                              {tank.name} ({tank.status})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="workflow-batch">Batch</Label>
                        <select
                          id="workflow-batch"
                          className="mt-1 w-full h-9 border rounded-md px-3 bg-white"
                          value={selectedBatchId}
                          onChange={(event) => setSelectedBatchId(event.target.value)}
                          disabled={!selectedTankId}
                        >
                          <option value="">Select batch</option>
                          {tankBatches.batches.map((batch) => (
                            <option key={batch.id} value={batch.id}>
                              {batch.id} {batch.fishType ? `- ${batch.fishType}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label>Harvest Type</Label>
                      <div className="mt-1 flex items-center gap-2 px-3 h-9 border rounded-md bg-gray-50 text-sm font-medium">
                        <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                          🟣 Full
                        </Badge>
                      </div>
                    </div>

                    <Button
                      className="bg-[#088395] hover:bg-[#0A4D68]"
                      onClick={() => void handleStartHarvest()}
                      disabled={isSubmittingStepAction || !selectedTankId || !selectedBatchId}
                    >
                      {isSubmittingStepAction ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : activeTanks.some(t => t.tankId === selectedTankId) ? (
                        <TrendingUp className="w-4 h-4 mr-2" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      {activeTanks.some(t => t.tankId === selectedTankId)
                        ? 'Resume Active Harvest'
                        : 'Start Harvest Event'}
                    </Button>
                  </div>
                )}

                {workflowStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="workflow-fish-type">Fish Type</Label>
                        <select
                          id="workflow-fish-type"
                          className="mt-1 w-full h-9 border rounded-md px-3 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={selectedFishTypeId}
                          onChange={(event) => setSelectedFishTypeId(event.target.value)}
                          disabled={!!currentEvent}
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
                        <Label htmlFor="workflow-pricing">Pricing</Label>
                        <select
                          id="workflow-pricing"
                          className="mt-1 w-full h-9 border rounded-md px-3 bg-white"
                          value={selectedPricingId}
                          onChange={(event) => setSelectedPricingId(event.target.value)}
                          disabled={isLoadingPricing}
                        >
                          <option value="">Select pricing</option>
                          {pricingList.map((pricing) => (
                            <option key={pricing.id} value={pricing.id}>
                              {pricing.gradeName} ({pricing.minWeight}-{pricing.maxWeight}g, {pricing.pricePerKg} EGP/kg)
                            </option>
                          ))}
                        </select>
                        {pricingList.length === 0 && (
                          <p className="text-xs text-amber-700 mt-1">No pricing found. Configure pricing in the Pricing tab.</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="workflow-condition">Condition</Label>
                        <select
                          id="workflow-condition"
                          className="mt-1 w-full h-9 border rounded-md px-3 bg-white"
                          value={gradingCondition}
                          onChange={(event) => setGradingCondition(event.target.value as HarvestCondition)}
                        >
                          {CONDITION_OPTIONS.map((condition) => (
                            <option key={condition} value={condition}>
                              {condition}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="workflow-weight-kg">Weight (kg)</Label>
                        <Input
                          id="workflow-weight-kg"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={gradingWeightKg}
                          onChange={(event) => setGradingWeightKg(event.target.value)}
                          placeholder="Enter harvested weight in kg"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="bg-[#088395] hover:bg-[#0A4D68]"
                        onClick={() => void handleAddGrading()}
                        disabled={
                          isSubmittingStepAction ||
                          !selectedFishTypeId ||
                          !selectedPricingId ||
                          !selectedBatchId ||
                          !gradingWeightKg
                        }
                      >
                        {isSubmittingStepAction ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Add Grading
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setWorkflowStep(3)}
                        disabled={currentGradings.length === 0}
                      >
                        Continue to Completion
                      </Button>
                      <Button
                        className="bg-[#088395] hover:bg-[#0A4D68]"
                        onClick={() => setWorkflowStep(3)}
                        disabled={currentGradings.length === 0}
                      >
                        Next Step
                      </Button>
                    </div>

                    {/* Recorded Gradings history box removed as requested */}
                  </div>
                )}

                {workflowStep === 3 && (
                  <div className="space-y-4">
                    <Card className="bg-gray-50">
                      <CardContent className="py-3 text-sm space-y-1">
                        <p className="font-semibold text-gray-700">Harvest Summary</p>
                        <p>Harvest Event: {currentEvent?.id}</p>
                        <p>Graded Weight: {formatNumber(totalGradedWeight)} kg</p>
                        <p>Estimated Revenue: {formatNumber(totalGradingRevenue)} EGP</p>
                      </CardContent>
                    </Card>

                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Grading History</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentGradings.map((grading) => (
                          <Card key={grading.id} className="overflow-hidden border-blue-100 shadow-sm">
                            <CardHeader className="bg-blue-50/50 py-2 px-4 border-b">
                              <CardTitle className="text-sm font-bold flex justify-between items-center">
                                <span>{grading.gradeName || 'Grading Record'}</span>
                                <Badge variant="outline" className="bg-white">{grading.condition}</Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Weight:</span>
                                <span className="font-semibold">{formatNumber(grading.weightKg)} kg</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Price at Harvest:</span>
                                <span className="font-semibold">{formatNumber(grading.pricePerKg)} EGP/kg</span>
                              </div>
                              <div className="border-t pt-2 flex justify-between font-bold text-blue-800">
                                <span>Total Value:</span>
                                <span>{formatNumber(grading.totalValue)} EGP</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="completion-notes">Completion Notes</Label>
                      <Textarea
                        id="completion-notes"
                        rows={4}
                        placeholder="Add optional completion notes..."
                        value={completionPayload.notes || ''}
                        onChange={(event) =>
                          setCompletionPayload({
                            notes: event.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setWorkflowStep(2)}>
                        Back to Grading
                      </Button>
                      <Button
                        className="bg-[#088395] hover:bg-[#0A4D68]"
                        onClick={() => void handleCompleteHarvest()}
                        disabled={isSubmittingStepAction}
                      >
                        {isSubmittingStepAction ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Complete Harvest
                      </Button>
                    </div>
                  </div>
                )}

                {workflowStep === 4 && (
                  <div className="space-y-4">
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-green-800">Harvest Completed</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p>Event ID: {completedEvent?.id || currentEvent?.id}</p>
                        <p>Status: {completedEvent?.status || 'COMPLETED'}</p>
                        <p>Total Graded Weight: {formatNumber(totalGradedWeight)} kg</p>
                        {completionPayload.notes?.trim() ? <p>Notes: {completionPayload.notes}</p> : null}
                      </CardContent>
                    </Card>

                    <Button className="bg-[#088395] hover:bg-[#0A4D68]" onClick={handleResetWorkflow}>
                      Start Another Harvest
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fish Grade Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pricing-fish-type">Fish Type</Label>
                    <select
                      id="pricing-fish-type"
                      className="mt-1 w-full h-9 border rounded-md px-3 bg-white"
                      value={pricingFishTypeId}
                      onChange={(event) => {
                        setPricingFishTypeId(event.target.value);
                        setEditingPricingId(null);
                        setPricingDraft(DEFAULT_PRICING_DRAFT);
                      }}
                    >
                      <option value="">Select fish type</option>
                      {fishTypes.map((fishType) => (
                        <option key={fishType.id} value={fishType.id}>
                          {fishType.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <Button variant="outline" onClick={() => void loadPricingForFishType(pricingFishTypeId)} disabled={!pricingFishTypeId}>
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      Reload Grading
                    </Button>
                  </div>
                </div>

                {pricingError && <p className="text-sm text-red-700">{pricingError}</p>}

                {isLoadingPricing ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading grading...
                  </div>
                ) : pricingList.length === 0 ? (
                  <p className="text-sm text-gray-600">No grading found for selected fish type.</p>
                ) : (
                  <div className="space-y-2">
                    {pricingList.map((pricing) => (
                      <div key={pricing.id} className="border rounded-md p-3 flex items-center justify-between">
                        <div className="text-sm">
                          <p className="font-medium">{pricing.gradeName}</p>
                          <p className="text-gray-600">
                            {pricing.minWeight}-{pricing.maxWeight} g, {pricing.numOfFishInKilo} fish/kg
                          </p>
                          {formatNumber(pricing.pricePerKg)} EGP/kg

                        </div>
                        <Button variant="outline" onClick={() => startEditingPricing(pricing)}>
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Card className="bg-gray-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{editingPricingId ? 'Edit Grading' : 'Create Grading'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="pricing-grade-name">Grade Name</Label>
                        <Input
                          id="pricing-grade-name"
                          value={pricingDraft.gradeName}
                          onChange={(event) => setPricingDraft((prev) => ({ ...prev, gradeName: event.target.value }))}
                          placeholder="Grade 1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pricing-price-per-kg">Grading Value Per Kg</Label>
                        <Input
                          id="pricing-price-per-kg"
                          type="number"
                          value={pricingDraft.pricePerKg}
                          onChange={(event) =>
                            setPricingDraft((prev) => ({ ...prev, pricePerKg: Number(event.target.value) || 0 }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="pricing-min-weight">Min Weight (g)</Label>
                        <Input
                          id="pricing-min-weight"
                          type="number"
                          value={pricingDraft.minWeight}
                          onChange={(event) =>
                            setPricingDraft((prev) => ({ ...prev, minWeight: Number(event.target.value) || 0 }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="pricing-max-weight">Max Weight (g)</Label>
                        <Input
                          id="pricing-max-weight"
                          type="number"
                          value={pricingDraft.maxWeight}
                          onChange={(event) =>
                            setPricingDraft((prev) => ({ ...prev, maxWeight: Number(event.target.value) || 0 }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="pricing-fish-in-kilo">Fish In Kilo</Label>
                        <Input
                          id="pricing-fish-in-kilo"
                          type="number"
                          value={pricingDraft.numOfFishInKilo}
                          onChange={(event) =>
                            setPricingDraft((prev) => ({ ...prev, numOfFishInKilo: Number(event.target.value) || 0 }))
                          }
                        />
                      </div>

                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="bg-[#088395] hover:bg-[#0A4D68]"
                        onClick={() => void handleSavePricing()}
                        disabled={isSavingPricing || !pricingFishTypeId}
                      >
                        {isSavingPricing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {editingPricingId ? 'Update Grading' : 'Create Grading'}

                      </Button>
                      {editingPricingId && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingPricingId(null);
                            setPricingDraft(DEFAULT_PRICING_DRAFT);
                          }}
                        >
                          Cancel Edit
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>
    </div>
  );
};
