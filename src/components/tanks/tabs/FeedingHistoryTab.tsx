import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Fish, Search } from 'lucide-react';

interface FeedingHistoryTabProps {
  tankFeedingCalculation: any;
  feedingHistory: any[];
  feedingRecords: any[];
  setShowFeedingModal: (show: boolean) => void;
  setSelectedFeedingRecord: (record: any) => void;
  setShowFeedingDetailsModal: (show: boolean) => void;
  user: any;
  tankBatches: any[];
}

export function FeedingHistoryTab({
  tankFeedingCalculation,
  feedingHistory,
  feedingRecords,
  setShowFeedingModal,
  setSelectedFeedingRecord,
  setShowFeedingDetailsModal,
  user,
  tankBatches
}: FeedingHistoryTabProps) {
  const getStatusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case 'on-target': return 'bg-[#10B981] text-white';
      case 'below': return 'bg-[#F59E0B] text-white';
      case 'critical': return 'bg-[#EF4444] text-white';
      case 'above': return 'bg-[#3B82F6] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const parseVal = (val: any) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val.replace(/[^\d.]/g, '')) || 0;
    return 0;
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Today's Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today's Feeding Schedule - {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</CardTitle>
          <Button
            size="sm"
            className="bg-[#088395] hover:bg-[#0A4D68]"
            onClick={() => setShowFeedingModal(true)}
          >
            <Fish className="w-4 h-4 mr-2" />
            Record Feeding
          </Button>
        </CardHeader>
        <CardContent>
          {tankFeedingCalculation && (
            <div className="bg-[#0A4D68] text-white p-4 rounded-xl mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-[#088395] mb-1">Recommended for Tank</p>
                <h4 className="text-xl font-black">{tankFeedingCalculation.recommendedAmount || tankFeedingCalculation.totalRecommended || '0'} kg/day</h4>
              </div>
              <div className="text-right">
                 <p className="text-[10px] uppercase font-bold tracking-widest text-[#088395] mb-1">FCR Estimate</p>
                 <p className="font-bold">{tankFeedingCalculation.currentFcr || '1.52'}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {feedingHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No feedings recorded yet today.</p>
            ) : (
              feedingHistory.map((feeding, idx) => (
                <div key={idx} className="border-l-4 border-[#088395] pl-4 py-2 bg-gray-50/50 rounded-r-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{feeding.time} - Meal #{feeding.meal}</span>
                    <Badge className={feeding.status === 'on-target' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}>
                      {feeding.status === 'on-target' ? '✅ On target' : '⚠️ Below recommendation'}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Amount: {feeding.fed} kg (Recommended: {feeding.recommended} kg)</p>
                    <p>Food: {feeding.foodName || 'Standard Feed'}</p>
                    <p>Fed by: {feeding.operator || user.name}</p>
                  </div>
                </div>
              ))
            )}
            <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600 border border-dashed">
              <p className="text-sm">
                Next feeding due: {
                  feedingHistory.length > 0
                    ? new Date(new Date().setHours(new Date().getHours() + 4)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Check schedule'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Batch Feeding Breakdown (Task 4.2) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Per-Batch Feeding Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3">Daily Feed (kg)</th>
                  <th className="px-4 py-3">Per Meal (kg)</th>
                  <th className="px-4 py-3">Fed Today</th>
                  <th className="px-4 py-3">Remaining</th>
                  <th className="px-4 py-3 text-right">Safety Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tankBatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 italic">No active batches to calculate feeding for.</td>
                  </tr>
                ) : (
                  tankBatches.map((batch) => {
                    const daily = parseVal(batch.feedingPlan?.dailyFeedingAmount || batch.dailyFeedKg || '0');
                    const meals = batch.feedingPlan?.mealsPerDay || 4;
                    const perMeal = daily / (meals || 1);
                    const fed = batch.feedingPlan?.todayFed || 0;
                    const remaining = Math.max(0, daily - fed);
                    const status = fed >= daily ? 'OK' : fed > 0 ? 'WARNING' : 'STOPPED';

                    return (
                      <tr key={batch.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-bold text-gray-900">Batch {batch.batchNumber || 'N/A'}</div>
                          <div className="text-[10px] text-gray-400 font-mono">ID: {batch.id.split('-')[0]}</div>
                        </td>
                        <td className="px-4 py-4 font-medium">{daily} kg</td>
                        <td className="px-4 py-4 text-gray-600">{perMeal.toFixed(2)} kg <span className="text-[10px]">({meals} meals)</span></td>
                        <td className="px-4 py-4 font-bold text-blue-600">{fed} kg</td>
                        <td className="px-4 py-4 font-bold text-orange-600">{remaining.toFixed(1)} kg</td>
                        <td className="px-4 py-4 text-right">
                          <Badge className={`${status === 'OK' ? 'bg-green-100 text-green-700' : status === 'WARNING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'} border-none font-black text-[9px] uppercase tracking-tighter`}>
                             {status === 'OK' ? '● Optimal' : status === 'WARNING' ? '● Partial' : '● No Feed'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Feeding History Records */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Feeding History Records</h3>

        <div className="space-y-3">
          {feedingRecords.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No feeding records found.</p>
          ) : (
            [...feedingRecords]
              .sort((a, b) => {
                const dateA = new Date(a.timestamp || a.fedAt || a.date || a.createdAt || 0).getTime();
                const dateB = new Date(b.timestamp || b.fedAt || b.date || b.createdAt || 0).getTime();
                return dateB - dateA;
              })
              .map((record) => {
                const fed = parseVal(record.amountFed ?? record.weightFed ?? record.weightKg ?? 0);
                const recommended = parseVal(record.recommendedAmount ?? record.targetWeight ?? 0);
                const status = record.status || (fed >= (recommended || 0.1) ? 'on-target' : 'below');
                const achievementVal = record.achievement ? parseInt(record.achievement.replace(/[^\d]/g, '')) : (recommended > 0 ? Math.round((fed / recommended) * 100) : 0);

                return (
                  <Card key={record.id} className="bg-white shadow-sm hover:shadow-md transition-all group overflow-hidden border-l-4 border-l-[#10B981]">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                              <Fish className="w-5 h-5 text-[#10B981]" />
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-900 text-lg tracking-tight">
                                {record.formattedDate || `${new Date(record.timestamp || record.fedAt || record.createdAt).toLocaleDateString()} at ${record.time || new Date(record.timestamp || record.fedAt || record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                              </span>
                              <Badge variant="outline" className="border-gray-200 text-gray-600 font-bold px-2 py-0.5 uppercase text-[10px]">
                                {record.mealLabel || `Meal #${record.mealNumber || record.numMeals || 'N/A'}`}
                              </Badge>
                              <Badge className={`${getStatusColor(status)} font-bold px-3 py-1 uppercase text-[10px] tracking-widest border-none shadow-sm`}>
                                {status.toUpperCase()}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2">
                            <div className="space-y-1">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Amount Fed</p>
                              <p className="font-bold text-gray-900">{record.amountFed || `${fed} kg`}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Recommended</p>
                              <p className="font-bold text-gray-900">{record.recommendedAmount || `${recommended} kg`}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Achievement</p>
                              <p className={`font-bold ${achievementVal >= 90 && achievementVal <= 110 ? 'text-green-600' : 'text-yellow-600'}`}>
                                {record.achievement || `${achievementVal}%`}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Food Type</p>
                              <p className="font-bold text-gray-900 truncate max-w-[150px]" title={typeof record.foodType === 'object' ? (record.foodType?.name || record.foodType?.brand) : (record.foodType || record.feedType)}>
                                {typeof record.foodType === 'object' ? (record.foodType?.name || record.foodType?.brand || 'Standard Feed') : (record.foodType || record.feedType || 'N/A')}
                              </p>
                            </div>
                            {record.taskId && (
                              <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Linked Task</p>
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer font-mono text-[10px]">
                                  {record.taskId.split('-')[0]}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex sm:flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-11 px-4 bg-gray-50 border-gray-200 hover:border-[#088395] hover:bg-white hover:text-[#088395] transition-all font-bold uppercase text-[10px] tracking-widest rounded-xl"
                            onClick={() => {
                              setSelectedFeedingRecord(record);
                              setShowFeedingDetailsModal(true);
                            }}
                          >
                            <Search className="w-4 h-4 mr-2" />
                            View Record
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
