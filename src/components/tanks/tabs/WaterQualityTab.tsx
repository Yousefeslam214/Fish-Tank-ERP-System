import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Activity, Droplet, Search } from 'lucide-react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ReferenceLine } from 'recharts';

interface WaterQualityTabProps {
  batchAssessments: Record<string, any>;
  tankBatches: any[];
  waterQualityHistory: any[];
  waterQualityRecords: any[];
  setShowWaterQualityModal: (show: boolean) => void;
  setSelectedWqRecord: (record: any) => void;
  setShowWqDetailsModal: (show: boolean) => void;
}

export function WaterQualityTab({
  batchAssessments,
  tankBatches,
  waterQualityHistory,
  waterQualityRecords,
  setShowWaterQualityModal,
  setSelectedWqRecord,
  setShowWqDetailsModal
}: WaterQualityTabProps) {
  const getStatusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case 'optimal': return 'bg-[#10B981] text-white';
      case 'acceptable': return 'bg-[#3B82F6] text-white';
      case 'warning': return 'bg-[#F59E0B] text-white';
      case 'critical': return 'bg-[#EF4444] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Assessment Section */}
      {Object.keys(batchAssessments).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {tankBatches.map(batch => {
            const assessment = batchAssessments[batch.id];
            if (!assessment) return null;
            return (
              <Card key={batch.id} className={`border-l-4 ${assessment.overallStatus === 'CRITICAL' ? 'border-l-red-500' : assessment.overallStatus === 'WARNING' ? 'border-l-yellow-500' : 'border-l-green-500'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity className={`w-4 h-4 ${assessment.overallStatus === 'CRITICAL' ? 'text-red-500' : assessment.overallStatus === 'WARNING' ? 'text-yellow-500' : 'text-green-500'}`} />
                      <div>
                        <span className="font-bold text-gray-900 block">Batch {batch.batchNumber || 'N/A'}</span>
                        <span className="text-[10px] text-gray-400 font-mono">ID: {batch.id.split('-')[0]}</span>
                      </div>
                    </div>
                    <Badge className={assessment.overallStatus === 'CRITICAL' ? 'bg-red-500' : assessment.overallStatus === 'WARNING' ? 'bg-yellow-500' : 'bg-green-500'}>
                      {assessment.overallStatus}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-3 font-medium">{assessment.recommendation || assessment.message || 'Water quality is within optimal range for this batch.'}</p>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-gray-500 block">Growth Impact</span>
                      <span className="font-bold text-gray-900">{assessment.growthImpact || 'Optimal'}</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-gray-500 block">Next Check Due</span>
                      <span className="font-bold text-gray-900">{assessment.nextCheckDue || 'Scheduled'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Water Quality Trends - Last 30 Days</CardTitle>
          <Button
            size="sm"
            className="bg-[#088395] hover:bg-[#0A4D68]"
            onClick={() => setShowWaterQualityModal(true)}
          >
            <Droplet className="w-4 h-4 mr-2" />
            Record New Reading
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={waterQualityHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" style={{ fontSize: '12px' }} />
              <YAxis yAxisId="left" style={{ fontSize: '12px' }} />
              <YAxis yAxisId="right" orientation="right" style={{ fontSize: '12px' }} />
              <Tooltip />
              <ReferenceLine yAxisId="left" y={3} label={{ position: 'right', value: 'Danger (DO)', fill: '#EF4444', fontSize: 10 }} stroke="#EF4444" strokeDasharray="3 3" />
              <ReferenceLine yAxisId="left" y={5} label={{ position: 'right', value: 'Warning (DO)', fill: '#F59E0B', fontSize: 10 }} stroke="#F59E0B" strokeDasharray="3 3" />
              <Line yAxisId="left" type="monotone" dataKey="temp" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Temp (°C)" />
              <Line yAxisId="left" type="monotone" dataKey="do" stroke="#088395" strokeWidth={3} dot={{ r: 4, fill: '#088395', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="DO (mg/L)" />
              <Line yAxisId="right" type="monotone" dataKey="ph" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="pH" />
              <Line yAxisId="right" type="monotone" dataKey="nh3" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="NH₃ (mg/L)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* History Records */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Measurement History</h3>

        <div className="space-y-3">
          {waterQualityRecords.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No water quality records found.</p>
          ) : (
            [...waterQualityRecords]
              .sort((a, b) => new Date(b.measuredAt || b.createdAt).getTime() - new Date(a.measuredAt || a.createdAt).getTime())
              .map((record) => {
                const status = record.overallStatus || record.status || 'unknown';
                return (
                  <Card key={record.id} className="bg-white shadow-sm hover:shadow-md transition-all group overflow-hidden border-gray-100">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                              <Droplet className="w-5 h-5 text-[#088395]" />
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-900 text-lg tracking-tight">
                                {new Date(record.measuredAt || record.createdAt).toLocaleString(undefined, {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <Badge className={`${getStatusColor(status)} font-bold px-3 py-1 uppercase text-[10px] tracking-widest border-none shadow-sm`}>
                                {status.toUpperCase()}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 pt-2">
                            <div className="space-y-1">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Temperature</p>
                              <p className="font-bold text-gray-900">{record.temperature ?? record.temp ?? '–'}°C</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">DO</p>
                              <p className="font-bold text-gray-900">{record.dissolvedOxygen ?? record.do ?? '–'} mg/L</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">pH</p>
                              <p className="font-bold text-gray-900">{record.pH ?? record.ph ?? '–'}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ammonia</p>
                              <p className={`font-bold ${(record.totalAmmonia ?? record.ammonia ?? 0) > 0.5 ? 'text-red-600' : 'text-gray-900'}`}>
                                {record.totalAmmonia ?? record.ammonia ?? record.nh3 ?? '–'} mg/L
                              </p>
                            </div>
                            {record.nitrite !== undefined && (
                              <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nitrite</p>
                                <p className="font-bold text-gray-900">{record.nitrite} mg/L</p>
                              </div>
                            )}
                            {record.nitrate !== undefined && (
                              <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nitrate</p>
                                <p className="font-bold text-gray-900">{record.nitrate} mg/L</p>
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
                              setSelectedWqRecord(record);
                              setShowWqDetailsModal(true);
                            }}
                          >
                            <Search className="w-4 h-4 mr-2" />
                            View Full Analysis
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
