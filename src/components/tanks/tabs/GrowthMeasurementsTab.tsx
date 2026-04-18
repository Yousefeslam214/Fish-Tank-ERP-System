import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Fish, TrendingUp, Activity, Target, RefreshCw } from 'lucide-react';
import GrowthHistory from '../GrowthHistory';
import { apiGet } from '../../../api';

interface GrowthMeasurementsTabProps {
  tankBatches: any[];
  selectedBatchId: string | null;
  setSelectedBatchId: (id: string) => void;
  batchGrowthAnalysis: Record<string, any>;
  selectedBatchGrowthHistory: Record<string, any[]>;
  currentTank: any;
  fetchTankDetails: () => void;
  setSelectedGrowthRecord: (record: any) => void;
  setShowGrowthDetailsModal: (show: boolean) => void;
}

export function GrowthMeasurementsTab({
  tankBatches,
  selectedBatchId,
  setSelectedBatchId,
  batchGrowthAnalysis,
  selectedBatchGrowthHistory,
  currentTank,
  fetchTankDetails,
  setSelectedGrowthRecord,
  setShowGrowthDetailsModal
}: GrowthMeasurementsTabProps) {
  const [localAnalysis, setLocalAnalysis] = React.useState<any>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = React.useState(false);

  const activeBatchId = selectedBatchId || (tankBatches[0]?.id);
  const activeBatch = tankBatches.find(b => b.id === activeBatchId);

  React.useEffect(() => {
    if (activeBatchId) {
      const fetchAnalysis = async () => {
        setIsLoadingAnalysis(true);
        try {
          const res = await apiGet<any>(`/tanks/growth/batch/${activeBatchId}/analysis`);
          console.log('Batch growth analysis response:', res);
          setLocalAnalysis(res.data ?? res);
        } catch (err) {
          console.error('Failed to fetch batch growth analysis:', err);
          setLocalAnalysis(null);
        } finally {
          setIsLoadingAnalysis(false);
        }
      };
      fetchAnalysis();
    }
  }, [activeBatchId]);

  if (tankBatches.length === 0) {
    return (
      <div className="pt-4">
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p>No active batches found. Stock a batch first to track growth.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activeBatch) return null;

  const analysis = batchGrowthAnalysis[activeBatch.id];
  const history = selectedBatchGrowthHistory[activeBatch.id] || [];
  
  React.useEffect(() => {
    if (activeBatch) {
      console.log('Active batch for growth tracking:', activeBatch.id, activeBatch);
    }
  }, [activeBatch]);

  React.useEffect(() => {
    if (history.length > 0) {
      console.log('Batch growth history measurements:', activeBatch.id, history);
    }
  }, [history, activeBatch.id]);

  const analysisData = localAnalysis || analysis;
  const metrics = analysisData?.metrics || {};
  const economics = analysisData?.economics || {};
  const recommendations = analysisData?.recommendations || [];

  const currentWeight = history.length > 0 
    ? history[history.length - 1].averageWeightGrams 
    : parseFloat(activeBatch.weights?.currentAvg || activeBatch.weights?.current || activeBatch.currentAvgWeight || activeBatch.avgWeight || activeBatch.currentAvg || activeBatch.weights?.initial || activeBatch.initialAverageWeight || '0');

  return (
    <div className="space-y-4 pt-4">
      {/* Batch Selector */}
      <Card className="bg-gradient-to-r from-blue-50 to-white border-blue-100 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Fish className="w-5 h-5" />
              </div>
              <div>
                <Label className="font-bold text-gray-900">Batch Target</Label>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">Select a batch to manage growth data</p>
                  {analysisData?.overallRating && (
                    <Badge className={`${analysisData.overallRating === 'GOOD' || analysisData.overallRating === 'EXCELLENT' ? 'bg-green-500' : 'bg-amber-500'} text-[9px] h-4 uppercase font-bold`}>
                      {analysisData.overallRating} Status
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {tankBatches.map((batch: any) => (
                <Button
                  key={batch.id}
                  variant={activeBatchId === batch.id ? "default" : "outline"}
                  className={`transition-all h-auto py-2 flex flex-col items-start ${activeBatchId === batch.id ? 'bg-[#0A4D68] hover:bg-[#088395]' : 'bg-white hover:bg-blue-50 border-blue-100'}`}
                  onClick={() => setSelectedBatchId(batch.id)}
                >
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className="font-bold">Batch {batch.batchNumber || 'N/A'}</span>
                    <Badge className={`${activeBatchId === batch.id ? 'bg-[#088395] text-white' : 'bg-blue-100 text-blue-700'} text-[10px]`}>
                      {(batch.counts?.current ?? batch.currentCount ?? batch.count ?? 0).toLocaleString()} fish
                    </Badge>
                  </div>
                  <span className="text-[10px] opacity-70 font-mono">ID: {batch.id.split('-')[0]}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-white border-blue-50 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
          <div className="h-1 bg-blue-500"></div>
          <CardContent className="p-4">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 group-hover:text-blue-500 transition-colors">Growth Rate (SGR)</p>
            <div className="flex items-center justify-between">
              {isLoadingAnalysis ? (
                <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
              ) : (
                <>
                  <h4 className="text-xl font-black text-gray-900">{metrics.sgr?.toFixed(2) || '---'}%</h4>
                  <Badge className={`${analysisData?.sgrRating === 'EXCELLENT' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'} border-none uppercase font-black text-[9px]`}>
                    {analysisData?.sgrRating || 'NORMAL'}
                  </Badge>
                </>
              )}
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Weight gain per day</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-green-50 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
          <div className="h-1 bg-green-500"></div>
          <CardContent className="p-4">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 group-hover:text-green-500 transition-colors">Feed Efficiency (FCR)</p>
            <div className="flex items-center justify-between">
              {isLoadingAnalysis ? (
                <RefreshCw className="w-5 h-5 animate-spin text-green-400" />
              ) : (
                <>
                  <h4 className="text-xl font-black text-gray-900">{metrics.fcr?.toFixed(2) || '---'}</h4>
                  <Badge className={`${analysisData?.fcrRating === 'POOR' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} border-none uppercase font-black text-[9px]`}>
                    {analysisData?.fcrRating || 'GOOD'}
                  </Badge>
                </>
              )}
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Lower is better</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-teal-50 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
          <div className="h-1 bg-teal-500"></div>
          <CardContent className="p-4">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 group-hover:text-teal-500 transition-colors">Current Weight</p>
            <h4 className="text-xl font-black text-gray-900">{currentWeight?.toFixed(1) || '0.0'}g</h4>
            <p className="text-[10px] text-gray-500 mt-1">Avg per fish</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-orange-50 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
          <div className="h-1 bg-orange-500"></div>
          <CardContent className="p-4">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 group-hover:text-orange-500 transition-colors">Biomass</p>
            <h4 className="text-xl font-black text-gray-900">{((activeBatch.counts?.current || activeBatch.currentCount || activeBatch.count || 0) * (currentWeight || 0) / 1000).toLocaleString(undefined, {maximumFractionDigits: 1})} kg</h4>
            <p className="text-[10px] text-gray-500 mt-1">Total batch weight</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-purple-50 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
          <div className="h-1 bg-purple-500"></div>
          <CardContent className="p-4">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 group-hover:text-purple-500 transition-colors">Feed Cost (To Date)</p>
            <div className="flex items-center justify-between">
              {isLoadingAnalysis ? (
                <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
              ) : (
                <>
                  <h4 className="text-xl font-black text-gray-900">${economics.feedCostToDate?.toLocaleString() || '---'}</h4>
                  <Badge className="bg-purple-100 text-purple-700 border-none uppercase font-black text-[9px]">
                    Analysis
                  </Badge>
                </>
              )}
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Cumulative cost</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recommendations */}
        <Card className="md:col-span-1 bg-white border-amber-100">
          <CardContent className="p-5">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-amber-500" />
              Growth Recommendations
            </h3>
            <div className="space-y-3">
              {isLoadingAnalysis ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                </div>
              ) : recommendations.length > 0 ? (
                recommendations.map((rec: string, i: number) => (
                  <div key={i} className="flex gap-2 text-xs text-gray-700 bg-amber-50/50 p-2 rounded-lg border border-amber-100/50">
                    <div className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 text-center py-4 italic">No specific recommendations at this time.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Growth Highlights */}
        <Card className="md:col-span-2 bg-white">
          <CardContent className="p-5">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#088395]" />
              Economic Analysis
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Weight Gain</p>
                <p className="text-lg font-black text-gray-900">{metrics.weightGainGrams?.toFixed(1) || '---'}g</p>
                <p className="text-[9px] text-[#10B981] font-bold">Total period</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ADG</p>
                <p className="text-lg font-black text-gray-900">{metrics.adg?.toFixed(2) || '---'}g</p>
                <p className="text-[9px] text-gray-500 font-bold">Avg Daily Gain</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Cost/KG Gain</p>
                <p className="text-lg font-black text-gray-900">${economics.feedCostPerKgGain?.toFixed(2) || '---'}</p>
                <p className="text-[9px] text-gray-500 font-bold">Feed cost efficiency</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Proj. Revenue</p>
                <p className="text-lg font-black text-[#10B981]">${economics.projectedRevenue?.toLocaleString(undefined, {maximumFractionDigits: 0}) || '---'}</p>
                <p className="text-[9px] text-gray-500 font-bold">Current biomass</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <GrowthHistory
        batch={{
          id: activeBatch.id,
          batchNumber: activeBatch.batchNumber || activeBatch.id.substring(0, 8),
          tankName: currentTank.name,
          fishType: activeBatch.fishType || activeBatch.species || currentTank.species,
          stockedDate: new Date(activeBatch.dates?.stockedDate || activeBatch.stockedDate || activeBatch.createdAt || Date.now()),
          initialCount: activeBatch.counts?.initial || activeBatch.initialCount || 0,
          currentCount: activeBatch.counts?.current || activeBatch.currentCount || activeBatch.count || 0,
          initialWeight: parseFloat(activeBatch.weights?.initial || activeBatch.initialAverageWeight || '0'),
          lastWeight: currentWeight,
          lastMeasurementDate: activeBatch.dates?.lastMeasurement ? new Date(activeBatch.dates.lastMeasurement) : undefined
        }}
        measurements={history.map(m => ({
          ...m,
          measuredAt: new Date(m.measuredAt || m.date || m.timestamp)
        }))}
        language="en"
        onMeasurementAdded={fetchTankDetails}
        onViewDetails={(m) => {
          setSelectedGrowthRecord(m);
          setShowGrowthDetailsModal(true);
        }}
      />
    </div>
  );
}
