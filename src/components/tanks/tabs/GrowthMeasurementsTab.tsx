import React from "react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Fish, RefreshCw } from "lucide-react";
import GrowthHistory from "../GrowthHistory";
import { apiGet } from "../../../api";

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
  setShowGrowthDetailsModal,
}: GrowthMeasurementsTabProps) {
  console.log('[GrowthDebug] GrowthMeasurementsTab received props:', {
    selectedBatchId,
    analysis: batchGrowthAnalysis[selectedBatchId || ''],
    history: selectedBatchGrowthHistory[selectedBatchId || '']
  });

  const activeBatchId = selectedBatchId || tankBatches[0]?.id;
  const activeBatch = tankBatches.find((b) => b.id === activeBatchId);

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
  const metrics = analysis?.metrics || {};

  const currentWeight =
    history.length > 0
      ? history[0].averageWeightGrams
      : parseFloat(
        activeBatch.weights?.currentAvg ||
        activeBatch.weights?.current ||
        activeBatch.currentAvgWeight ||
        activeBatch.avgWeight ||
        activeBatch.currentAvg ||
        activeBatch.weights?.initial ||
        activeBatch.initialAverageWeight ||
        "0",
      );

  return (
    <div className="space-y-4 pt-4">
      {/* Batch Selector */}
      

      {/* Analysis Summary Cards */}
      {/* Horizontal Analysis Metrics Indicators - Forced Row */}
      <div className="flex flex-row gap-3 w-full overflow-x-auto pb-2 no-scrollbar">
        <Card className="flex-1 bg-white border-blue-100 shadow-sm hover:shadow-md transition-all group border-l-4 border-l-blue-500">
          <CardContent className="p-3">
            <div className="mb-1">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-blue-500">
                Growth Rate (SGR)
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <h4 className="text-lg font-black text-gray-900">
                {metrics.sgr?.toFixed(2) || "---"}%
              </h4>
              <span className="text-[9px] text-gray-500">/day</span>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 bg-white border-green-100 shadow-sm hover:shadow-md transition-all group border-l-4 border-l-green-500">
          <CardContent className="p-3">
            <div className="mb-1">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-green-500">
                Efficiency (FCR)
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <h4 className="text-lg font-black text-gray-900">
                {metrics.fcr?.toFixed(2) || "---"}
              </h4>
              <span className="text-[9px] text-gray-500">FCR</span>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 bg-white border-teal-100 shadow-sm hover:shadow-md transition-all group border-l-4 border-l-teal-500">
          <CardContent className="p-3">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1 group-hover:text-teal-500">
              Current Weight
            </p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-lg font-black text-gray-900">
                {currentWeight?.toFixed(1) || "0.0"}g
              </h4>
              <span className="text-[9px] text-gray-500">avg</span>
            </div>
          </CardContent>
        </Card>

      </div>

      <GrowthHistory
        batch={{
          id: activeBatch.id,
          batchNumber:
            activeBatch.batchNumber || activeBatch.id.substring(0, 8),
          tankName: currentTank.name,
          tankId: currentTank.id,
          fishType:
            activeBatch.fishType || activeBatch.species || currentTank.species,
          stockedDate: new Date(
            activeBatch.dates?.stockedDate ||
            activeBatch.stockedDate ||
            activeBatch.createdAt ||
            Date.now(),
          ),
          initialCount:
            activeBatch.counts?.initial || activeBatch.initialCount || 0,
          currentCount:
            activeBatch.counts?.current ||
            activeBatch.currentCount ||
            activeBatch.count ||
            0,
          initialWeight: parseFloat(
            activeBatch.weights?.initial ||
            activeBatch.initialAverageWeight ||
            "0",
          ),
          lastWeight: currentWeight,
          lastMeasurementDate: activeBatch.dates?.lastMeasurement
            ? new Date(activeBatch.dates.lastMeasurement)
            : undefined,
        }}
        measurements={history.map((m) => ({
          ...m,
          measuredAt: new Date(m.measuredAt || m.date || m.timestamp),
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
