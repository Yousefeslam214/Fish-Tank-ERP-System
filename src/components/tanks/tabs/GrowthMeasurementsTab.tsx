import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Fish } from 'lucide-react';
import GrowthHistory from '../GrowthHistory';

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

  const activeBatchId = selectedBatchId || (tankBatches[0]?.id);
  const activeBatch = tankBatches.find(b => b.id === activeBatchId);

  if (!activeBatch) return null;

  const analysis = batchGrowthAnalysis[activeBatch.id];
  const history = selectedBatchGrowthHistory[activeBatch.id] || [];
  
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
                <p className="text-xs text-gray-500">Select a batch to manage growth data</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {tankBatches.map((batch: any) => (
                <Button
                  key={batch.id}
                  variant={activeBatchId === batch.id ? "default" : "outline"}
                  className={`transition-all ${activeBatchId === batch.id ? 'bg-[#0A4D68] hover:bg-[#088395]' : 'bg-white hover:bg-blue-50 border-blue-100'}`}
                  onClick={() => setSelectedBatchId(batch.id)}
                >
                  Batch {batch.batchNumber || batch.id.substring(0, 8)}
                  <Badge className={`ml-2 ${activeBatchId === batch.id ? 'bg-[#088395] text-white' : 'bg-blue-100 text-blue-700'}`}>
                    {(batch.counts?.current ?? batch.currentCount ?? batch.count ?? 0).toLocaleString()} fish
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-blue-50 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
          <div className="h-1 bg-blue-500"></div>
          <CardContent className="p-4">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 group-hover:text-blue-500 transition-colors">Growth Rate (SGR)</p>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-gray-900">{analysis?.sgr?.value?.toFixed(2) || '---'}%</h4>
              <Badge className={`${analysis?.sgr?.rating === 'EXCELLENT' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'} border-none uppercase font-black text-[9px]`}>
                {analysis?.sgr?.rating || 'NORMAL'}
              </Badge>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Weight gain per day</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-green-50 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
          <div className="h-1 bg-green-500"></div>
          <CardContent className="p-4">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 group-hover:text-green-500 transition-colors">Feed Efficiency (FCR)</p>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-gray-900">{analysis?.fcr?.value?.toFixed(2) || '---'}</h4>
              <Badge className="bg-green-100 text-green-700 border-none uppercase font-black text-[9px]">
                {analysis?.fcr?.rating || 'GOOD'}
              </Badge>
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
