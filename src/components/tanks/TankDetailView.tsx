import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { apiGet } from '../../api';
import { getHarvestPrediction } from '../../services/harvestApi';

// Tab Components
import { OverviewTab } from './tabs/OverviewTab';
import { BatchesTab } from './tabs/BatchesTab';
import { WaterQualityTab } from './tabs/WaterQualityTab';
import { FeedingHistoryTab } from './tabs/FeedingHistoryTab';
import { GrowthMeasurementsTab } from './tabs/GrowthMeasurementsTab';
import { HealthChecksTab } from './tabs/HealthChecksTab';

import { TankTasksTab } from './tabs/TankTasksTab';
import { TankAssignmentsTab } from './tabs/TankAssignmentsTab';
import { SensorTab } from './tabs/SensorTab';

// Modals
import { FeedingModal } from './modals/FeedingModal';
import { WaterQualityModal } from './modals/WaterQualityModal';
import { WaterQualityDetailsModal } from './modals/WaterQualityDetailsModal';
import { FeedingDetailsModal } from './modals/FeedingDetailsModal';
import { GrowthDetailsModal } from './modals/GrowthDetailsModal';
import { BatchHealthModal } from './modals/BatchHealthModal';
import RecordGrowthMeasurement from './RecordGrowthMeasurement';
import GrowthHistory from './GrowthHistory';
import { getTankHealthHistory, HealthCheckResponseDTO } from '../../services/healthCheckApi';

interface TankDetailViewProps {
  tank: any;
  onBack: () => void;
  user: any;
}

const toFiniteNumber = (value: any): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (value && typeof value === 'object' && 'value' in value) {
    return toFiniteNumber((value as { value?: unknown }).value);
  }
  return undefined;
};

const toValidDate = (value: any): Date => {
  const candidate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(candidate.getTime()) ? new Date() : candidate;
};

const normalizeGrowthMeasurement = (measurement: any) => ({
  ...measurement,
  measuredAt: toValidDate(
    measurement?.measuredAt ??
    measurement?.measurementDate ??
    measurement?.date ??
    measurement?.timestamp ??
    measurement?.createdAt,
  ),
  daysInCulture:
    toFiniteNumber(
      measurement?.daysInCulture ??
      measurement?.dayInCulture ??
      measurement?.day,
    ) ?? 0,
  sampleSize:
    toFiniteNumber(
      measurement?.sampleSize ??
      measurement?.sampleCount ??
      measurement?.numberOfFishSampled ??
      measurement?.count,
    ) ?? 0,
  averageWeightGrams:
    toFiniteNumber(
      measurement?.averageWeightGrams ??
      measurement?.averageWeight ??
      measurement?.avgWeight ??
      measurement?.weightGrams ??
      measurement?.weight,
    ) ?? 0,
  sgr: toFiniteNumber(measurement?.sgr),
  fcr: toFiniteNumber(measurement?.fcr),
  sgrRating: measurement?.sgrRating ?? measurement?.sgr?.rating,
  fcrRating: measurement?.fcrRating ?? measurement?.fcr?.rating,
  overallRating:
    measurement?.overallRating ??
    measurement?.rating ??
    measurement?.overall?.rating,
});

const normalizeFeedingStatus = (status: any) => {
  if (!status) return 'PENDING';
  return status;
};

const parseFeedingWeight = (value: any): number => toFiniteNumber(value) ?? 0;


const normalizeTodayFeedingEntry = (entry: any) => {
  const status = normalizeFeedingStatus(entry?.status);
  const fed = parseFeedingWeight(
    entry?.amountFed ?? entry?.weightFed ?? entry?.weightKg ?? entry?.fed ?? 0,
  );
  const recommended = parseFeedingWeight(
    entry?.recommendedAmount ?? entry?.recommended ?? entry?.targetWeight ?? 0,
  );
  const timestamp = entry?.timestamp || entry?.fedAt || entry?.date || entry?.createdAt;
  const computedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '–';

  return {
    ...entry,
    status: entry?.status || 'PENDING',
    statusLabel: entry?.statusLabel,
    time: entry?.time || computedTime,
    fed,
    recommended,
    foodName:
      typeof entry?.foodType === 'object'
        ? entry?.foodType?.name || entry?.foodType?.brand || 'Standard Feed'
        : entry?.foodType || entry?.foodTypeName || entry?.feedType || 'Standard Feed',
    operator: entry?.fedBy || entry?.recordedBy || 'Operator',
  };
};

const normalizeFeedingRecord = (record: any) => {
  const fed = parseFeedingWeight(
    record?.amountFed ?? record?.weightFed ?? record?.weightKg ?? 0,
  );
  const recommended = parseFeedingWeight(
    record?.recommendedAmount ?? record?.targetWeight ?? 0,
  );
  const status = normalizeFeedingStatus(record?.status);
  const achievement =
    record?.achievement ||
    `${recommended > 0 ? Math.round((fed / recommended) * 100) : 0}%`;

  return {
    ...record,
    status: record?.status || 'PENDING',
    statusLabel: record?.statusLabel,
    amountFed: record?.amountFed || `${fed.toFixed(1)} kg`,
    recommendedAmount: record?.recommendedAmount || `${recommended.toFixed(1)} kg`,
    achievement,
    foodType:
      typeof record?.foodType === 'object'
        ? record?.foodType
        : record?.foodType || record?.foodTypeName || record?.feedType || 'N/A',
    fedBy: record?.fedBy || record?.recordedBy || 'Operator',
  };
};

export default function TankDetailView({ tank, onBack, user }: TankDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTank, setCurrentTank] = useState(tank);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [tankBatches, setTankBatches] = useState<any[]>([]);
  const [batchesSummary, setBatchesSummary] = useState<any>(null);
  const [waterQualityRecords, setWaterQualityRecords] = useState<any[]>([]);
  const [feedingRecords, setFeedingRecords] = useState<any[]>([]);
  const [todayFeedingRecords, setTodayFeedingRecords] = useState<any[]>([]);
  const [growthMetrics, setGrowthMetrics] = useState<any[]>([]);
  const [healthCheckRecords, setHealthCheckRecords] = useState<HealthCheckResponseDTO[]>([]);
  const [isActionRequired, setIsActionRequired] = useState(false);
  const [actionReason, setActionReason] = useState<string | null>(null);
  const [tankFeedingCalculation, setTankFeedingCalculation] = useState<any>(null);
  const [predictionData, setPredictionData] = useState<any>(null);
  const [batchGrowthAnalysis, setBatchGrowthAnalysis] = useState<Record<string, any>>({});
  const [selectedBatchGrowthHistory, setSelectedBatchGrowthHistory] = useState<Record<string, any[]>>({});
  const [batchAssessments, setBatchAssessments] = useState<Record<string, any>>({});

  // Modals Visibility
  const [showFeedingModal, setShowFeedingModal] = useState(false);
  const [showWaterQualityModal, setShowWaterQualityModal] = useState(false);
  const [showWqDetailsModal, setShowWqDetailsModal] = useState(false);
  const [selectedWqRecord, setSelectedWqRecord] = useState<any>(null);
  const [editingWqRecord, setEditingWqRecord] = useState<any>(null);
  const [showFeedingDetailsModal, setShowFeedingDetailsModal] = useState(false);
  const [selectedFeedingRecord, setSelectedFeedingRecord] = useState<any>(null);
  const [showGrowthDetailsModal, setShowGrowthDetailsModal] = useState(false);
  const [selectedGrowthRecord, setSelectedGrowthRecord] = useState<any>(null);
  const [showRecordGrowthModal, setShowRecordGrowthModal] = useState(false);
  const [selectedBatchForUpdate, setSelectedBatchForUpdate] = useState<any>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Health & Quarantine states
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthModalMode, setHealthModalMode] = useState<'health' | 'quarantine'>('health');
  const [selectedBatchForHealth, setSelectedBatchForHealth] = useState<any>(null);
  const [inlineHealthCheckBatchId, setInlineHealthCheckBatchId] = useState<string | null>(null);

  // Growth History Modal (legacy)
  const [showGrowthHistoryModal, setShowGrowthHistoryModal] = useState(false);
  const [selectedBatchForHistory, setSelectedBatchForHistory] = useState<any>(null);
  const [batchGrowthHistory, setBatchGrowthHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchTankDetails = useCallback(async () => {
    setLoadingDetails(true);
    setDetailsError(null);
    try {
      const [dashRes, wqRes, fdRes, gmRes, btRes] = await Promise.allSettled([
        apiGet<any>(`/tanks/${tank.id}/dashboard`),
        apiGet<any>(`/tanks/${tank.id}/water-quality`),
        apiGet<any>(`/tanks/${tank.id}/feeding-history`),
        apiGet<any>(`/tanks/${tank.id}/growth-metrics`),
        apiGet<any>(`/tanks/${tank.id}/batches`)
      ]);

      const dashData = dashRes.status === 'fulfilled' ? (dashRes.value.data ?? dashRes.value) : null;
      const wqDataRaw = wqRes.status === 'fulfilled' ? (wqRes.value.data ?? wqRes.value ?? []) : [];
      const fdDataRaw = fdRes.status === 'fulfilled' ? (fdRes.value.data ?? fdRes.value ?? []) : [];
      const gmDataRaw = gmRes.status === 'fulfilled' ? (gmRes.value.data ?? gmRes.value ?? []) : [];
      const btResult = btRes.status === 'fulfilled' ? (btRes.value.data ?? btRes.value ?? {}) : {};
      const btData = Array.isArray(btResult) ? btResult : (btResult.batches || []);
      const btSummary = Array.isArray(btResult) ? null : (btResult.summary || null);

      setDashboardData(dashData);
      setGrowthMetrics(gmDataRaw);

      // Process Growth Metrics Mega-Route Response
      if (gmDataRaw && gmDataRaw.batches && Array.isArray(gmDataRaw.batches)) {
        console.log('[GrowthDebug] Processing batches from mega-route:', gmDataRaw.batches.length);
        gmDataRaw.batches.forEach((b: any) => {
          const batchId = b.batchId || b.id;
          if (!batchId) return;

          // 1. Map history
          if (b.history && Array.isArray(b.history)) {
            const history = b.history.map(normalizeGrowthMeasurement);
            console.log(`[GrowthDebug] Mapped history for batch ${batchId}:`, history.length);
            setSelectedBatchGrowthHistory(prev => ({ ...prev, [batchId]: history }));
          }

          // 2. Map analysis (summary + charts)
          const summary = b.summary || {};
          const analysisData = {
            summary,
            charts: b.charts || {},
            metrics: {
              sgr: parseFloat(summary.currentSGR || summary.sgr || '0'),
              fcr: parseFloat(summary.currentFCR || summary.fcr || '0'),
              averageWeight: parseFloat(summary.currentAvgWeight || summary.averageWeight || '0')
            },
            sgrRating: summary.sgrRating || 'NORMAL',
            fcrRating: summary.fcrRating || 'GOOD',
          };
          console.log(`[GrowthDebug] Mapped metrics for batch ${batchId}:`, {
            rawSummary: summary,
            parsedMetrics: analysisData.metrics
          });
          setBatchGrowthAnalysis(prev => ({ ...prev, [batchId]: analysisData }));
        });
      }

      const fdPayload =
        fdDataRaw && typeof fdDataRaw === 'object' && !Array.isArray(fdDataRaw)
          ? ((fdDataRaw as any).data ?? fdDataRaw)
          : fdDataRaw;

      const fdTodayListRaw = Array.isArray((fdPayload as any)?.todayFeedingList)
        ? (fdPayload as any).todayFeedingList
        : [];
      const fdHistoryRaw = Array.isArray(fdPayload)
        ? fdPayload
        : Array.isArray((fdPayload as any)?.history)
          ? (fdPayload as any).history
          : Array.isArray((fdPayload as any)?.records)
            ? (fdPayload as any).records
            : [];

      let wqData = Array.isArray(wqDataRaw) ? wqDataRaw : [];
      let fdData = Array.isArray(fdHistoryRaw) ? fdHistoryRaw : [];
      let healthData: HealthCheckResponseDTO[] = [];

      if (Array.isArray(btData) && btData.length > 0) {
        try {
          const batchDetailsRes = await Promise.allSettled(
            btData.map(b => Promise.allSettled([
              apiGet<any>(`/tanks/water-quality/batch/${b.id}`),
              apiGet<any>(`/tanks/feeding-records/batch/${b.id}`),
              apiGet<any>(`/tanks/water-quality/batch/${b.id}/assessment`)
            ]))
          );

          const allBatchWq: any[] = [];
          const allBatchFd: any[] = [];
          healthData = await getTankHealthHistory(btData.map((batch: any) => batch.id));

          batchDetailsRes.forEach((res, idx) => {
            if (res.status === 'fulfilled') {
              const batchId = btData[idx].id;
              const [wq, fd, assessment] = res.value;

              if (wq.status === 'fulfilled') allBatchWq.push(...(wq.value.data ?? wq.value ?? []));
              if (fd.status === 'fulfilled') allBatchFd.push(...(fd.value.data ?? fd.value ?? []));

              if (assessment.status === 'fulfilled') {
                setBatchAssessments(prev => ({ ...prev, [batchId]: assessment.value.data ?? assessment.value }));
              }
            }
          });

          // Deduplicate Water Quality
          const combinedWq = [...wqData, ...allBatchWq];
          const uniqueWqMap = new Map();
          combinedWq.forEach(r => {
            const rDate = r.measuredAt || r.createdAt;
            if (r.id) {
              const existing = uniqueWqMap.get(r.id);
              const exDate = existing ? (existing.measuredAt || existing.createdAt) : null;
              if (!existing || new Date(rDate) > new Date(exDate)) {
                uniqueWqMap.set(r.id, r);
              }
            } else {
              uniqueWqMap.set(`${rDate}_${r.temperature}`, r);
            }
          });
          wqData = Array.from(uniqueWqMap.values());

          // Deduplicate Feeding
          const combinedFd = [...fdData, ...allBatchFd];
          const uniqueFdMap = new Map();
          combinedFd.forEach(r => {
            const rDate = r.timestamp || r.fedAt || r.date || r.createdAt;
            if (r.id) {
              const existing = uniqueFdMap.get(r.id);
              const exDate = existing ? (existing.timestamp || existing.fedAt || existing.date || existing.createdAt) : null;
              if (!existing || new Date(rDate) > new Date(exDate)) {
                uniqueFdMap.set(r.id, r);
              }
            } else {
              uniqueFdMap.set(`${rDate}_${r.weightKg || r.weightFed || r.amountFed}`, r);
            }
          });
          const normalizedFeedingRecords = Array.from(uniqueFdMap.values()).map(normalizeFeedingRecord);
          setFeedingRecords(normalizedFeedingRecords);

          const normalizedTodayFeeding =
            fdTodayListRaw.length > 0
              ? fdTodayListRaw.map(normalizeTodayFeedingEntry)
              : [];
          setTodayFeedingRecords(normalizedTodayFeeding);
        } catch (err) {
          console.warn('Failed to fetch batch records:', err);
          setFeedingRecords(fdData.map(normalizeFeedingRecord));
          setTodayFeedingRecords(fdTodayListRaw.map(normalizeTodayFeedingEntry));
        }
      } else {
        const normalizedFeedingRecords = fdData.map(normalizeFeedingRecord);
        setFeedingRecords(normalizedFeedingRecords);
        setTodayFeedingRecords(fdTodayListRaw.map(normalizeTodayFeedingEntry));
      }

      // Check if action is required
      try {
        const actionRes = await apiGet<any>(`/tanks/water-quality/status/requiring-action`);
        const actionData = actionRes.data ?? actionRes;
        if (Array.isArray(actionData)) {
          const tankAction = actionData.find((a: any) => a.tankId === tank.id || a.id === tank.id);
          if (tankAction) {
            setIsActionRequired(true);
            setActionReason(tankAction.reason || tankAction.message || 'Parameters outside safe range');
          } else {
            setIsActionRequired(false);
            setActionReason(null);
          }
        }
      } catch (e) { }

      // Fetch Tank Level Feeding Calculation
      try {
        const tankCalcRes = await apiGet<any>(`/tanks/feeding-records/calculation/tank/${tank.id}`);
        setTankFeedingCalculation(tankCalcRes.data ?? tankCalcRes);
      } catch (e) { }

      setWaterQualityRecords(wqData);
      setHealthCheckRecords(healthData);
      const finalBatches = btData.length > 0 ? btData : tank.batches || [];
      setTankBatches(finalBatches);
      setBatchesSummary(btSummary);

      if (finalBatches.length > 0 && !selectedBatchId) {
        setSelectedBatchId(finalBatches[0].id);
      }

      if (dashData) {
        setCurrentTank((prev: any) => {
          const wq = dashData.waterQuality;
          return {
            ...prev,
            status: dashData.tankInfo?.status || prev.status,
            biomass: dashData.capacity?.currentLoadKg || prev.biomass,
            volume: dashData.tankInfo?.volumeCubicMeters || prev.volume,
            waterQuality: wq ? {
              overall: (wq.overallStatus || wq.overall || 'unknown').toLowerCase(),
              temp: { value: wq.temperature || wq.temp?.value || 0, status: 'unknown' },
              do: { value: wq.dissolvedOxygen || wq.do?.value || 0, status: 'unknown' },
              ph: { value: wq.ph || wq.phValue || 0, status: 'unknown' },
              nh3: { value: wq.ammonia || wq.totalAmmonia || 0, status: 'unknown' },
            } : prev.waterQuality
          };
        });
      }
    } catch (err) {
      console.error('Failed to fetch tank details:', err);
      setDetailsError((err as Error).message);
    } finally {
      setLoadingDetails(false);
    }
  }, [tank.id]);

  useEffect(() => {
    fetchTankDetails();
  }, [fetchTankDetails]);

  useEffect(() => {
    const fetchPrediction = async () => {
      if (!selectedBatchId) return;
      try {
        const data = await getHarvestPrediction(selectedBatchId);
        setPredictionData(data);
      } catch (err) {
        console.warn('Failed to fetch harvest prediction for batch:', selectedBatchId, err);
      }
    };
    fetchPrediction();
  }, [selectedBatchId]);

  const fetchBatchGrowthHistory = async (batchId: string) => {
    setLoadingHistory(true);
    try {
      const res = await apiGet<any>(`/tanks/growth/batch/${batchId}`);
      const data = res.data ?? res;
      const mappedHistory = (
        Array.isArray(data) ? data : Array.isArray(data.history) ? data.history : []
      ).map(normalizeGrowthMeasurement);
      setBatchGrowthHistory(mappedHistory);
    } catch (err) {
      console.error('Failed to fetch batch growth history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleViewGrowthHistory = (batch: any) => {
    setSelectedBatchForHistory(batch);
    setBatchGrowthHistory([]);
    fetchBatchGrowthHistory(batch.id);
    setShowGrowthHistoryModal(true);
  };

  const handleUpdateBatchData = (batch: any) => {
    setSelectedBatchForUpdate(batch);
    setShowRecordGrowthModal(true);
  };

  const handleHealthCheck = (batch: any) => {
    setActiveTab('health');
    setInlineHealthCheckBatchId(batch?.id || tankBatches[0]?.id || null);
  };

  const handleQuarantine = (batch: any) => {
    setSelectedBatchForHealth(batch);
    setHealthModalMode('quarantine');
    setShowHealthModal(true);
  };

  const waterQualityHistory = useMemo(() => {
    if (!Array.isArray(waterQualityRecords)) return [];
    return [...waterQualityRecords]
      .sort((a, b) => new Date(a.measuredAt || a.createdAt).getTime() - new Date(b.measuredAt || b.createdAt).getTime())
      .map(r => ({
        date: new Date(r.measuredAt || r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        temp: r.temperature ?? r.temp,
        do: r.dissolvedOxygen ?? r.do,
        ph: r.pH ?? r.ph,
        nh3: r.totalAmmonia ?? r.ammonia ?? r.nh3
      }));
  }, [waterQualityRecords]);

  const feedingHistory = useMemo(() => {
    if (Array.isArray(todayFeedingRecords) && todayFeedingRecords.length > 0) {
      return todayFeedingRecords.map(normalizeTodayFeedingEntry);
    }

    if (!Array.isArray(feedingRecords)) return [];
    const today = new Date().toISOString().split('T')[0];
    return feedingRecords
      .filter((r) => {
        const dateStr = r.timestamp || r.fedAt || r.date || r.createdAt || '';
        return dateStr.startsWith(today);
      })
      .map((r) => {
        const fed = parseFeedingWeight(r.amountFed ?? r.weightFed ?? r.weightKg ?? 0);
        const recommended = parseFeedingWeight(r.recommendedAmount ?? r.targetWeight ?? 0);
        const status = r.status || 'PENDING';
        return {
          time:
            r.time ||
            (r.timestamp || r.fedAt || r.createdAt
              ? new Date(r.timestamp || r.fedAt || r.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
              : '–'),
          fed,
          recommended,
          foodName:
            typeof r.foodType === 'object'
              ? r.foodType?.name || r.foodType?.brand || 'Standard Feed'
              : r.foodType || r.foodTypeName || r.feedType || 'Standard Feed',
          operator: r.fedBy || r.recordedBy || 'Operator',
          status,
          statusLabel: r.statusLabel,
        };
      });
  }, [feedingRecords, todayFeedingRecords]);


  return (
    <div className="bg-[#F9FAFB] min-h-full">
      {/* Top Navigation */}
      <div className="bg-[#0A4D68] text-white px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center justify-between flex-1">
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-xl font-semibold">{currentTank.name || tank.name}</h1>
                <span className="text-xs text-blue-200 font-mono opacity-80">ID: {(currentTank.id || tank.id).split('-')[0]}</span>
              </div>
              <p className="text-sm text-gray-300">
                {currentTank.volume || tank.volume}m³ volume · Stocking density: {Math.round((currentTank.biomass / (currentTank.volume || 50)))} kg/m³
              </p>
            </div>
            <div className="flex items-center gap-3">
              {loadingDetails && <RefreshCw className="w-4 h-4 animate-spin text-gray-300" />}
              {/* <Badge className={`${currentTank.status === 'critical' || currentTank.status === 'CRITICAL' ? 'bg-[#EF4444]' : (currentTank.status === 'warning' || currentTank.status === 'WARNING') ? 'bg-[#F59E0B]' : 'bg-[#10B981]'} text-white text-sm px-3 py-1`}>
                {(currentTank.status || 'ACTIVE').toUpperCase()}
              </Badge> */}
            </div>
          </div>
        </div>
      </div>

      <div className={`p-6 ${loadingDetails ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}`}>


        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="batches">Batches</TabsTrigger>
            <TabsTrigger value="water">Water Quality</TabsTrigger>
            <TabsTrigger value="feeding">Feeding History</TabsTrigger>
            <TabsTrigger value="growth">Growth Measurements</TabsTrigger>
            <TabsTrigger value="health">Health Checks</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="users">Assign Users</TabsTrigger>
            <TabsTrigger value="sensor">Sensor</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab
              dashboardData={dashboardData}
              tankBatches={tankBatches}
              currentTank={currentTank}
              batchGrowthAnalysis={batchGrowthAnalysis}
              batchAssessments={batchAssessments}
            />
          </TabsContent>

          <TabsContent value="batches">
            <BatchesTab
              batchesSummary={batchesSummary}
              tankBatches={tankBatches}
              currentTank={currentTank}
              handleViewGrowthHistory={handleViewGrowthHistory}
              handleUpdateBatchData={handleUpdateBatchData}
              handleHealthCheck={handleHealthCheck}
              handleQuarantine={handleQuarantine}
              batchGrowthAnalysis={batchGrowthAnalysis}
            />
          </TabsContent>

          <TabsContent value="water">
            <WaterQualityTab
              batchAssessments={batchAssessments}
              tankBatches={tankBatches}
              waterQualityHistory={waterQualityHistory}
              waterQualityRecords={waterQualityRecords}
              setShowWaterQualityModal={setShowWaterQualityModal}
              setSelectedWqRecord={setSelectedWqRecord}
              setShowWqDetailsModal={setShowWqDetailsModal}
            />
          </TabsContent>

          <TabsContent value="feeding">
            <FeedingHistoryTab
              tankFeedingCalculation={tankFeedingCalculation}
              feedingHistory={feedingHistory}
              feedingRecords={feedingRecords}
              setShowFeedingModal={setShowFeedingModal}
              setSelectedFeedingRecord={setSelectedFeedingRecord}
              setShowFeedingDetailsModal={setShowFeedingDetailsModal}
              user={user}
              tankBatches={tankBatches}
            />
          </TabsContent>

          <TabsContent value="growth">
            <GrowthMeasurementsTab
              tankBatches={tankBatches}
              selectedBatchId={selectedBatchId}
              setSelectedBatchId={setSelectedBatchId}
              batchGrowthAnalysis={batchGrowthAnalysis}
              selectedBatchGrowthHistory={selectedBatchGrowthHistory}
              currentTank={currentTank}
              fetchTankDetails={fetchTankDetails}
              setSelectedGrowthRecord={setSelectedGrowthRecord}
              setShowGrowthDetailsModal={setShowGrowthDetailsModal}
            />
          </TabsContent>

          <TabsContent value="health">
            <HealthChecksTab
              tankName={currentTank.name}
              tankBatches={tankBatches}
              healthChecks={healthCheckRecords}
              loading={loadingDetails}
              onCreate={(batch) => setInlineHealthCheckBatchId(batch?.id || tankBatches[0]?.id || null)}
              createBatchId={inlineHealthCheckBatchId}
              onDismissCreate={() => setInlineHealthCheckBatchId(null)}
              onCreateSuccess={() => {
                setInlineHealthCheckBatchId(null);
                setTimeout(fetchTankDetails, 1000);
              }}
              onRefresh={fetchTankDetails}
            />
          </TabsContent>

          <TabsContent value="predictions">
          </TabsContent>

          <TabsContent value="tasks">
            <TankTasksTab user={user} tank={currentTank} />
          </TabsContent>

          <TabsContent value="users">
            <TankAssignmentsTab user={user} tank={currentTank} />
          </TabsContent>

          <TabsContent value="sensor">
            <SensorTab tank={currentTank} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Legacy Growth History Dialog */}
      <Dialog open={showGrowthHistoryModal} onOpenChange={setShowGrowthHistoryModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch Growth History</DialogTitle>
          </DialogHeader>
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-[#088395] mb-4" />
              <p className="text-gray-600">Loading history...</p>
            </div>
          ) : selectedBatchForHistory ? (
            <GrowthHistory
              batch={{
                id: selectedBatchForHistory.id,
                batchNumber: selectedBatchForHistory.batchNumber || `Batch ${selectedBatchForHistory.id.substring(0, 8)}`,
                tankName: currentTank.name,
                fishType: selectedBatchForHistory.species || selectedBatchForHistory.fishType || currentTank.species,
                stockedDate: new Date(selectedBatchForHistory.dates?.stockedDate || selectedBatchForHistory.stockedDate || Date.now()),
                initialCount: selectedBatchForHistory.counts?.initial || selectedBatchForHistory.initialCount || 0,
                currentCount: selectedBatchForHistory.counts?.current || selectedBatchForHistory.currentCount || 0,
                initialWeight: typeof selectedBatchForHistory.weights?.initial === 'number'
                  ? selectedBatchForHistory.weights.initial
                  : parseFloat(selectedBatchForHistory.weights?.initial || selectedBatchForHistory.initialAverageWeight || '0')
              }}
              measurements={batchGrowthHistory}
              onMeasurementAdded={() => fetchBatchGrowthHistory(selectedBatchForHistory.id)}
            />
          ) : (
            <div className="py-12 text-center text-gray-500">
              No batch selected
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <FeedingModal
        open={showFeedingModal}
        onOpenChange={setShowFeedingModal}
        tank={currentTank}
        batchId={tankBatches[0]?.id}
        tankBatches={tankBatches}
        onSuccess={() => setTimeout(fetchTankDetails, 1000)}
        user={user}
      />

      <WaterQualityModal
        open={showWaterQualityModal}
        onOpenChange={(open: boolean) => {
          setShowWaterQualityModal(open);
          if (!open) setEditingWqRecord(null);
        }}
        tank={currentTank}
        user={user}
        initialRecord={editingWqRecord}
        batchId={tankBatches[0]?.id}
        tankBatches={tankBatches}
        onSuccess={() => setTimeout(fetchTankDetails, 1000)}
      />

      <WaterQualityDetailsModal
        open={showWqDetailsModal}
        onOpenChange={setShowWqDetailsModal}
        record={selectedWqRecord}
        onEdit={(record: any) => {
          setEditingWqRecord(record);
          setShowWqDetailsModal(false);
          setShowWaterQualityModal(true);
        }}
        onDeleteSuccess={() => setTimeout(fetchTankDetails, 1000)}
      />

      <FeedingDetailsModal
        open={showFeedingDetailsModal}
        onOpenChange={setShowFeedingDetailsModal}
        record={selectedFeedingRecord}
        onDeleteSuccess={() => setTimeout(fetchTankDetails, 1000)}
      />

      <GrowthDetailsModal
        open={showGrowthDetailsModal}
        onOpenChange={setShowGrowthDetailsModal}
        record={selectedGrowthRecord}
        onDeleteSuccess={() => setTimeout(fetchTankDetails, 1000)}
      />

      {selectedBatchForUpdate && (
        <RecordGrowthMeasurement
          open={showRecordGrowthModal}
          onClose={() => setShowRecordGrowthModal(false)}
          batch={{
            id: selectedBatchForUpdate.id,
            batchNumber: selectedBatchForUpdate.batchNumber || `Batch ${selectedBatchForUpdate.id.substring(0, 8)}`,
            tankName: currentTank.name,
            tankId: currentTank.id,
            fishType: selectedBatchForUpdate.species || selectedBatchForUpdate.fishType || currentTank.species,
            daysInCulture: selectedBatchForUpdate.ageInDays || selectedBatchForUpdate.age || selectedBatchForUpdate.daysInCulture || 0,
            lastWeight: typeof selectedBatchForUpdate.weights?.currentAvg === 'number'
              ? selectedBatchForUpdate.weights.currentAvg
              : parseFloat(selectedBatchForUpdate.weights?.currentAvg || selectedBatchForUpdate.currentAverageWeight || selectedBatchForUpdate.avgWeight || '0'),
            lastMeasurementDate: selectedBatchForUpdate.dates?.lastSampled ? new Date(selectedBatchForUpdate.dates.lastSampled) : undefined,
            currentCount: selectedBatchForUpdate.counts?.current || selectedBatchForUpdate.currentCount || selectedBatchForUpdate.count || 0
          }}
          onSuccess={() => {
            setShowRecordGrowthModal(false);
            setTimeout(fetchTankDetails, 1000);
          }}
          measuredBy={user.name}
        />
      )}

      <BatchHealthModal
        open={showHealthModal}
        onOpenChange={setShowHealthModal}
        batch={selectedBatchForHealth}
        mode={healthModalMode}
        onSuccess={() => setTimeout(fetchTankDetails, 1000)}
      />
    </div>
  );
}
