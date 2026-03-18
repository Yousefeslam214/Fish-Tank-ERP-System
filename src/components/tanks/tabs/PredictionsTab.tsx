import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

import { Fish, TrendingUp, Calendar, Box, Activity } from 'lucide-react';
import { Badge } from '../../ui/badge';

interface PredictionsTabProps {
  predictionData: any;
  loadingDetails: boolean;
  tankBatches: any[];
  selectedBatchId: string | null;
  setSelectedBatchId: (id: string) => void;
}

export function PredictionsTab({ 
  predictionData, 
  loadingDetails,
  tankBatches,
  selectedBatchId,
  setSelectedBatchId
}: PredictionsTabProps) {
  const activeBatchId = selectedBatchId || (tankBatches[0]?.id);
  return (
    <div className="space-y-4 pt-4">
      {/* Batch Selector */}
      {tankBatches.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-white border-blue-100 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Fish className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 leading-tight">Batch Target</h4>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Select to analyze</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {tankBatches.map((batch: any) => (
                  <button
                    key={batch.id}
                    onClick={() => setSelectedBatchId(batch.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border ${
                      activeBatchId === batch.id 
                        ? 'bg-[#0A4D68] text-white border-transparent shadow-lg shadow-blue-900/20' 
                        : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    Batch {batch.batchNumber || batch.id.substring(0, 8)}
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5 leading-none">
                      {(batch.counts?.current ?? batch.currentCount ?? batch.count ?? 0).toLocaleString()}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden border-none shadow-xl bg-white">
        <div className="h-1.5 bg-gradient-to-r from-[#0A4D68] via-[#088395] to-blue-400"></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#088395]" />
            Harvest Intelligence
          </CardTitle>
          <p className="text-xs text-gray-500">Real-time projections and harvest strategy</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingDetails && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-10 h-10 border-4 border-[#088395]/20 border-t-[#088395] rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500 font-medium">Calculating yields...</p>
            </div>
          )}

          {!predictionData && !loadingDetails && (
            <p className="text-sm text-gray-500 text-center py-8">No prediction data available for current batches.</p>
          )}
          {predictionData && !loadingDetails && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-[#E0F4F5] to-white p-4 rounded-2xl border border-blue-50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-400/5 rounded-full -mr-8 -mt-8 group-hover:bg-blue-400/10 transition-colors"></div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">🎯 Predicted Revenue</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-gray-900">{(predictionData.predictedRevenue || 0).toLocaleString()}</span>
                    <span className="text-xs font-bold text-gray-500">EGP</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-white p-4 rounded-2xl border border-orange-50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-orange-400/5 rounded-full -mr-8 -mt-8 group-hover:bg-orange-400/10 transition-colors"></div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">📅 Days to Harvest</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-gray-900">{predictionData.daysToHarvest || 0}</span>
                    <span className="text-xs font-bold text-gray-500">days</span>
                  </div>
                </div>
              </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                        <Box className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-bold text-gray-600">Final Projected Weight:</span>
                    </div>
                    <span className="text-base font-black text-gray-900">{predictionData.predictedWeightKg || predictionData.predictedFinalWeight || 0} kg</span>
                  </div>
                </div>

              {predictionData.revenueByGrade && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Revenue Breakdown by Grade:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(predictionData.revenueByGrade).map(([grade, val]: [string, any]) => (
                      <div key={grade} className="bg-gray-50 p-2 rounded text-xs flex justify-between">
                        <span className="text-gray-600 capitalize">{grade.replace('_', ' ')}:</span>
                        <span className="font-semibold">{val.toLocaleString()} EGP</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={`p-4 rounded-2xl border ${
                predictionData.recommendation?.includes('STRONG') || predictionData.recommendation?.includes('HIGH')
                  ? 'bg-green-50 border-green-100 text-green-800'
                  : 'bg-amber-50 border-amber-100 text-amber-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${
                    predictionData.recommendation?.includes('STRONG') || predictionData.recommendation?.includes('HIGH')
                      ? 'bg-green-500'
                      : 'bg-amber-500'
                  } text-white border-none text-[10px] font-black uppercase px-2 py-0.5`}>
                    Recommendation
                  </Badge>
                  <p className="text-sm font-black uppercase tracking-tight">{predictionData.recommendation?.replace('_', ' ') || 'MONITOR'}</p>
                </div>
                {predictionData.actions && predictionData.actions.length > 0 && (
                  <ul className="text-xs space-y-1.5 opacity-90 font-medium">
                    {predictionData.actions.map((action: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-current mt-1.5 flex-shrink-0"></div>
                        {action}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mt-4">
            <p className="text-sm font-medium text-blue-900 mb-2">ℹ️ Prediction Information</p>
            <p className="text-sm text-blue-800">
              Predictions are based on current biomass, growth rates (SGR), and market prices for each grade.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
