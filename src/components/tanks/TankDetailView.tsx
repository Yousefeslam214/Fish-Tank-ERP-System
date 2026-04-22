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
import { PredictionsTab } from './tabs/PredictionsTab';
import { TankTasksTab } from './tabs/TankTasksTab';
import { TankAssignmentsTab } from './tabs/TankAssignmentsTab';

// Modals
import { FeedingModal } from './modals/FeedingModal';
import { WaterQualityModal } from './modals/WaterQualityModal';
import { WaterQualityDetailsModal } from './modals/WaterQualityDetailsModal';
import { FeedingDetailsModal } from './modals/FeedingDetailsModal';
import { GrowthDetailsModal } from './modals/GrowthDetailsModal';
import { BatchHealthModal } from './modals/BatchHealthModal';
import RecordGrowthMeasurement from './RecordGrowthMeasurement';
import GrowthHistory from './GrowthHistory';

interface TankDetailViewProps {
  tank: any;
  onBack: () => void;
  user: any;
}

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
  const [growthMetrics, setGrowthMetrics] = useState<any[]>([]);
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

      let wqData = Array.isArray(wqDataRaw) ? wqDataRaw : [];
      let fdData = Array.isArray(fdDataRaw) ? fdDataRaw : [];

      if (Array.isArray(btData) && btData.length > 0) {
        try {
          const batchDetailsRes = await Promise.allSettled(
            btData.map(b => Promise.allSettled([
              apiGet<any>(`/tanks/water-quality/batch/${b.id}`),
              apiGet<any>(`/tanks/feeding-records/batch/${b.id}`),
              apiGet<any>(`/tanks/growth/batch/${b.id}`),
              apiGet<any>(`/tanks/growth/batch/${b.id}/analysis`),
              apiGet<any>(`/tanks/water-quality/batch/${b.id}/assessment`)
            ]))
          );

          const allBatchWq: any[] = [];
          const allBatchFd: any[] = [];

          batchDetailsRes.forEach((res, idx) => {
            if (res.status === 'fulfilled') {
              const batchId = btData[idx].id;
              const [wq, fd, growth, analysis, assessment] = res.value;

              if (wq.status === 'fulfilled') allBatchWq.push(...(wq.value.data ?? wq.value ?? []));
              if (fd.status === 'fulfilled') allBatchFd.push(...(fd.value.data ?? fd.value ?? []));
              if (growth.status === 'fulfilled') {
                const growthVal = growth.value;
                const history = Array.isArray(growthVal)
                  ? growthVal
                  : (Array.isArray(growthVal.data)
                    ? growthVal.data
                    : (Array.isArray(growthVal.history)
                      ? growthVal.history
                      : (growthVal.data?.history || [])));
                setSelectedBatchGrowthHistory(prev => ({ ...prev, [batchId]: history }));
              }
              if (analysis.status === 'fulfilled') {
                setBatchGrowthAnalysis(prev => ({ ...prev, [batchId]: analysis.value.data ?? analysis.value }));
              }
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
          setFeedingRecords(Array.from(uniqueFdMap.values()));
        } catch (err) {
          console.warn('Failed to fetch batch records:', err);
        }
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
      const mappedHistory = (Array.isArray(data) ? data : (Array.isArray(data.history) ? data.history : [])).map((m: any) => ({
        id: m.id,
        measuredAt: new Date(m.measuredAt || m.date),
        daysInCulture: m.daysInCulture || 0,
        sampleSize: m.sampleSize || 0,
        averageWeightGrams: m.averageWeightGrams || m.avgWeight || 0,
        sgr: m.sgr,
        fcr: m.fcr,
        sgrRating: m.sgrRating,
        fcrRating: m.fcrRating,
        overallRating: m.overallRating
      }));
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
    setSelectedBatchForHealth(batch);
    setHealthModalMode('health');
    setShowHealthModal(true);
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
    if (!Array.isArray(feedingRecords)) return [];
    const today = new Date().toISOString().split('T')[0];
    return feedingRecords
      .filter(r => {
        const dateStr = r.timestamp || r.fedAt || r.date || r.createdAt || '';
        return dateStr.startsWith(today);
      })
      .map(r => {
        const parseWeight = (val: any) => {
          if (typeof val === 'number') return val;
          if (typeof val === 'string') return parseFloat(val.replace(/[^\d.]/g, '')) || 0;
          return 0;
        };
        const fed = parseWeight(r.amountFed ?? r.weightFed ?? r.weightKg ?? 0);
        const recommended = parseWeight(r.recommendedAmount ?? r.targetWeight ?? 0);
        return {
          time: r.time || (r.timestamp || r.fedAt || r.createdAt ? new Date(r.timestamp || r.fedAt || r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '–'),
          fed,
          recommended,
          foodName: r.foodType?.name || r.foodType || r.foodTypeName || 'Standard Feed',
          operator: r.fedBy || r.recordedBy || 'Operator',
          status: fed >= recommended ? 'on-target' : 'below'
        };
      });
  }, [feedingRecords]);


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
              <Badge className={`${currentTank.status === 'critical' || currentTank.status === 'CRITICAL' ? 'bg-[#EF4444]' : (currentTank.status === 'warning' || currentTank.status === 'WARNING') ? 'bg-[#F59E0B]' : 'bg-[#10B981]'} text-white text-sm px-3 py-1`}>
                {(currentTank.status || 'ACTIVE').toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className={`p-6 ${loadingDetails ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}`}>
        {isActionRequired && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between shadow-sm animate-pulse">
            <div className="flex items-center gap-4">
              <div className="bg-red-500 p-2 rounded-full">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-red-900 font-bold uppercase text-xs tracking-widest">Immediate Action Required</h3>
                <p className="text-red-700 text-sm font-medium">{actionReason}</p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white font-bold h-10 px-6"
              onClick={() => setActiveTab('water')}
            >
              Take Action
            </Button>
          </div>
        )}

        {detailsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-800">Failed to load tank history: {detailsError}</p>
            </div>
            <Button size="sm" variant="outline" onClick={fetchTankDetails}>Retry</Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="batches">Batches</TabsTrigger>
            <TabsTrigger value="water">Water Quality</TabsTrigger>
            <TabsTrigger value="feeding">Feeding History</TabsTrigger>
            <TabsTrigger value="growth">Growth Measurements</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="users">Assign Users</TabsTrigger>
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

          <TabsContent value="predictions">
            <PredictionsTab
              predictionData={predictionData}
              loadingDetails={loadingDetails}
              tankBatches={tankBatches}
              selectedBatchId={selectedBatchId}
              setSelectedBatchId={setSelectedBatchId}
            />
          </TabsContent>

          <TabsContent value="tasks">
            <TankTasksTab user={user} tank={currentTank} />
          </TabsContent>

          <TabsContent value="users">
            <TankAssignmentsTab user={user} tank={currentTank} />
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
