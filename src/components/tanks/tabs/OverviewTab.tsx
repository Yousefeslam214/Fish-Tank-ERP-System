import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { Fish, Scale, Droplet, Activity, AlertTriangle } from 'lucide-react';
import { WaterParameter } from '../WaterParameter';

interface OverviewTabProps {
  dashboardData: any;
  tankBatches: any[];
  currentTank: any;
}

export function OverviewTab({ dashboardData, tankBatches, currentTank }: OverviewTabProps) {
  return (
    <div className="space-y-4 pt-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {dashboardData?.summary ? (
          dashboardData.summary.map((item: any, idx: number) => {
            const Icon = idx === 0 ? Fish : idx === 1 ? Scale : idx === 2 ? Droplet : Activity;
            return (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{item.label}</p>
                      <p className="text-2xl font-bold">{item.value}</p>
                      {item.subValue && <p className="text-xs text-gray-500 mt-1">{item.subValue}</p>}
                    </div>
                    <Icon className="w-8 h-8 text-[#0A4D68] opacity-20" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Fish</p>
                    <p className="text-2xl font-bold">{tankBatches.reduce((sum: number, b: any) => sum + (b.count || b.currentCount || 0), 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{tankBatches.length} batches</p>
                  </div>
                  <Fish className="w-8 h-8 text-[#0A4D68] opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Biomass</p>
                    <p className="text-2xl font-bold">{currentTank.biomass} kg</p>
                    <p className="text-xs text-gray-500 mt-1">{Math.round((currentTank.biomass / currentTank.capacity) * 100)}% capacity</p>
                  </div>
                  <Scale className="w-8 h-8 text-[#0A4D68] opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Water Quality</p>
                    <p className="text-2xl font-bold capitalize">{currentTank.waterQuality?.overall || 'Unknown'}</p>
                    <p className="text-xs text-gray-500 mt-1">Last: {dashboardData?.waterQuality?.lastUpdated || 'Recently'}</p>
                  </div>
                  <Droplet className="w-8 h-8 text-[#0A4D68] opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Feed Today</p>
                    <p className="text-2xl font-bold">{currentTank.feeding?.todayFed || 0} kg</p>
                    <p className="text-xs text-gray-500 mt-1">{currentTank.feeding?.todayMeals || 0}/{currentTank.feeding?.totalMeals || 4} meals</p>
                  </div>
                  <Activity className="w-8 h-8 text-[#0A4D68] opacity-20" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tank Capacity & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tank Capacity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Current Load</span>
                <span className="font-medium">
                  {dashboardData?.capacity?.currentLoadKg ?? currentTank.biomass} / {dashboardData?.capacity?.capacityKg ?? currentTank.capacity} kg
                </span>
              </div>
              <Progress value={dashboardData?.capacity?.percentageUsed ?? (currentTank.biomass / currentTank.capacity) * 100} className="h-3" />
              <p className="text-xs text-gray-600 mt-1">
                {Math.round(dashboardData?.capacity?.percentageUsed ?? (currentTank.biomass / currentTank.capacity) * 100)}% capacity used
              </p>
            </div>
            {(dashboardData?.capacity?.percentageUsed > 100 || currentTank.biomass > currentTank.capacity) && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    ⚠️ Overstocked by {Math.round(dashboardData?.capacity?.overstockPercentage?.value || ((currentTank.biomass - currentTank.capacity) / currentTank.capacity) * 100)}%
                  </span>
                </div>
              </div>
            )}
            <div className="text-sm text-gray-600">
              <p>Volume: {dashboardData?.tankInfo?.volume ?? currentTank.volume}m³</p>
              <p>Stocking Density: {Math.round(dashboardData?.capacity?.stockingDensity ?? (currentTank.biomass / (currentTank.volume || 50)))} kg/m³</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Batch Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tankBatches.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No active batches in this tank</p>
              ) : (
                tankBatches.map((batch: any) => (
                  <div key={batch.id} className="border-l-4 border-[#0A4D68] pl-3 py-2 bg-gray-50 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">Batch {batch.batchNumber || batch.id}</span>
                      <Badge className="bg-[#10B981] text-white">{batch.status || 'ACTIVE'}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="block">Count:</span>
                        <span className="font-medium text-gray-900">{(batch.counts?.current ?? batch.currentCount ?? batch.count ?? 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="block">Avg Weight:</span>
                        <span className="font-medium text-gray-900">{batch.weights?.currentAvg ?? batch.currentAverageWeight ?? batch.avgWeight ?? '0g'}</span>
                      </div>
                      <div>
                        <span className="block">Age:</span>
                        <span className="font-medium text-gray-900">{batch.age ?? '0d'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latest Readings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Latest Water Quality</CardTitle>
          </CardHeader>
          <CardContent>
            {currentTank.waterQuality ? (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">Overall Status</span>
                  <Badge className={`${currentTank.waterQuality.overall === 'optimal' || currentTank.waterQuality.overall === 'OPTIMAL' ? 'bg-[#10B981]' : (currentTank.waterQuality.overall === 'critical' || currentTank.waterQuality.overall === 'CRITICAL') ? 'bg-red-500' : 'bg-[#F59E0B]'} text-white`}>
                    {currentTank.waterQuality.overall.toUpperCase()}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <WaterParameter name="Temperature" value={currentTank.waterQuality.temp.value + '°C'} status={currentTank.waterQuality.temp.status} />
                  <WaterParameter name="DO" value={currentTank.waterQuality.do.value + ' mg/L'} status={currentTank.waterQuality.do.status} />
                  <WaterParameter name="pH" value={currentTank.waterQuality.ph?.value || currentTank.waterQuality.phValue || '–'} status={currentTank.waterQuality.ph?.status} />
                  <WaterParameter name="NH₃" value={(currentTank.waterQuality.nh3?.value || currentTank.waterQuality.ammonia || 0) + ' mg/L'} status={currentTank.waterQuality.nh3?.status} />
                </div>
                <p className="text-xs text-gray-500 mt-3">Last measured: {dashboardData?.waterQuality?.lastUpdated || 'Recently'}</p>
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-lg text-center border border-dashed flex flex-col items-center justify-center">
                <Droplet className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 italic">No recent water quality readings for this tank</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Feeding Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {currentTank.feeding ? (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Meals Completed</span>
                  <span className="font-medium">{currentTank.feeding.todayMeals}/{currentTank.feeding.totalMeals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Fed Today</span>
                  <span className="font-medium">{currentTank.feeding.todayFed} kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Recommended</span>
                  <span className="font-medium">{currentTank.feeding.recommended} kg</span>
                </div>
                <Progress value={currentTank.feeding.recommended > 0 ? (currentTank.feeding.todayFed / currentTank.feeding.recommended) * 100 : 0} className="h-2" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Achievement</span>
                  <span className={`font-medium ${currentTank.feeding.todayFed < currentTank.feeding.recommended ? 'text-yellow-600' : 'text-green-600'}`}>
                    {currentTank.feeding.recommended > 0 ? Math.round((currentTank.feeding.todayFed / currentTank.feeding.recommended) * 100) : 0}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-lg text-center border border-dashed flex flex-col items-center justify-center">
                <Activity className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 italic">No feeding plan active for this tank</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
