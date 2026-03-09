// ============================================================
// Dashboard.tsx  –  Hazem Yasser
// ============================================================
// WHY useEffect + fetch?
//   The dashboard must show live data the moment it loads. We
//   call GET /api/v1/dashboard inside a useEffect so React first
//   renders the skeleton/loading UI and then hydrates it with
//   real numbers when the API responds. This avoids a blank
//   screen AND keeps the UI responsive while waiting.
//
// WHY keep mockFarms for the farm-selector?
//   The /dashboard endpoint does not return a list of all farms
//   the user belongs to – that requires a separate /farms route
//   which is not yet part of Hazem's task scope. The farm dropdown
//   is therefore still backed by mockFarms so the rest of the app
//   (tank management, etc.) can still receive a selectedFarm prop.
// ============================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  Fish,
  Scale,
  Wheat,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { User, Farm } from '../types';
import { mockFarms } from '../mockData';
import { apiGet } from '../api';

// ── Types that mirror the actual /api/v1/dashboard response shape ──
interface DashboardFishSummary {
  totalActiveFish: string | number;  // API returns string "12,500" with comma!
  totalBiomassKg: number;
  biomassCapacityPercentage?: number;
  activeTanks?: number;
  totalTanks?: number;
}
interface DashboardFeedStock {
  totalStockKg: number;
  estimatedDaysRemaining?: number;
  feedStockRemainingLabel?: string;
}
interface DashboardPredictedRevenue {
  totalProjectedRevenue: number;
  nextHarvestRevenue?: number;
  nearestHarvestDate?: string;
  nextHarvestDateFormatted?: string;
}
interface DashboardUpcomingHarvest {
  tankName: string;
  estimatedWeight?: number;
  projectedRevenue?: number;
  earliestHarvestDate?: string;
  batches?: { fishType?: string; daysToHarvest?: number }[];
}
interface DashboardWaterAlert {
  tankName?: string;
  parameter?: string;
  value?: string | number;
  status?: string;
}
interface DashboardData {
  fishSummary?: DashboardFishSummary;
  feedStock?: DashboardFeedStock;
  predictedRevenue?: DashboardPredictedRevenue;
  upcomingHarvests?: DashboardUpcomingHarvest[];
  waterQualityAlerts?: DashboardWaterAlert[];
}

interface DashboardProps {
  user: User;
  selectedFarm: Farm | null;
}

export default function Dashboard({ user, selectedFarm }: DashboardProps) {
  const [currentFarm, setCurrentFarm] = useState<Farm>(selectedFarm || mockFarms[0]);

  // Update currentFarm if selectedFarm changes from props
  useEffect(() => {
    if (selectedFarm) {
      setCurrentFarm(selectedFarm);
    }
  }, [selectedFarm]);

  // ── API state ──
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // ── Fetch dashboard data ──
  const fetchDashboard = async (isManual = false) => {
    if (isManual) setLoading(true);
    setError(null);
    try {
      // API returns: { success: true, data: { fishSummary, feedStock, predictedRevenue, ... } }
      const res = await apiGet<{ success: boolean; data: DashboardData }>('/dashboard');
      setDashData(res.data);
      setLastRefreshed(new Date());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    // Wrapped version that respects cancellation for the useEffect
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiGet<{ success: boolean; data: DashboardData }>('/dashboard');
        if (!cancelled) {
          setDashData(res.data);
          setLastRefreshed(new Date());
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [currentFarm.id]); // re-fetch when farm changes

  // ── Resolve safe display values from the real API shape ──
  // totalActiveFish comes as a comma-formatted string e.g. "12,500"
  const rawFish = dashData?.fishSummary?.totalActiveFish ?? 0;
  const totalFish = typeof rawFish === 'string'
    ? parseInt(rawFish.replace(/,/g, ''), 10)
    : rawFish;
  const totalBiomass = dashData?.fishSummary?.totalBiomassKg ?? 0;
  const biomassCapacityPct = dashData?.fishSummary?.biomassCapacityPercentage ?? 0;
  const feedStock = dashData?.feedStock?.totalStockKg ?? 0;
  const feedDaysRemaining = dashData?.feedStock?.estimatedDaysRemaining ?? 0;
  const predictedRevenue = dashData?.predictedRevenue?.totalProjectedRevenue ?? 0;
  const nextHarvestDateFormatted = dashData?.predictedRevenue?.nextHarvestDateFormatted ?? 'TBD';

  const upcomingHarvests = dashData?.upcomingHarvests ?? [];
  const waterAlerts = dashData?.waterQualityAlerts ?? [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-[#EF4444] text-white';
      case 'warning': return 'bg-[#F59E0B] text-white';
      case 'optimal': return 'bg-[#10B981] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      case 'optimal': return '🟢';
      default: return '⚪';
    }
  };

  // ── Skeleton card used while loading ──
  const SkeletonCard = () => (
    <Card className="bg-white shadow-sm animate-pulse">
      <CardContent className="p-6">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* ── Top Navigation Bar ── */}
      <div className="bg-[#0A4D68] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fish className="w-6 h-6" />
            <span className="text-xl font-semibold">Fish Farm 360</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
              <span className="text-sm font-medium">{currentFarm.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-300 capitalize">{user.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#088395] flex items-center justify-center font-semibold">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* ── Page Title + Refresh ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* WHY show last-refreshed?
                Operators in a fish farm need to know how fresh the
                numbers are so they can judge whether to act on them. */}
            <span className="text-xs text-gray-500">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDashboard(true)}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>


        {/* ── Error banner ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Failed to load dashboard data</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── KPI Cards ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Active Fish */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Active Fish</p>
                    <p className="text-3xl font-bold text-gray-900">{totalFish.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">Across {dashData?.fishSummary?.activeTanks ?? 0} tanks</p>
                    {totalFish > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Live from API</span>
                      </div>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-[#E0F4F5] flex items-center justify-center">
                    <Fish className="w-6 h-6 text-[#088395]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Biomass */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Total Biomass</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {totalBiomass.toLocaleString()} kg
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Current farm biomass</p>
                    <div className="mt-2">
                      <Progress value={biomassCapacityPct} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        {biomassCapacityPct}% of capacity
                      </p>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-[#E0F4F5] flex items-center justify-center">
                    <Scale className="w-6 h-6 text-[#088395]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feed Stock */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Feed Stock</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {feedStock.toLocaleString()} kg
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Current inventory</p>
                    {feedStock > 0 && feedStock < 500 && (
                      <Badge className="mt-2 bg-[#F59E0B]">Low Stock</Badge>
                    )}
                    {feedDaysRemaining >= 0 && (
                      <p className="text-sm text-gray-500 mt-1">{feedDaysRemaining} days remaining</p>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                    <Wheat className="w-6 h-6 text-[#F59E0B]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Predicted Revenue */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Predicted Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {predictedRevenue.toLocaleString()} EGP
                    </p>
                    <p className="text-sm text-gray-500 mt-1">At next harvest</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{nextHarvestDateFormatted}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-[#ECFDF5] flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-[#10B981]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Second Row – Water Alerts + Tanks + Upcoming Harvests ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Water Quality Alerts */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Water Quality Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-100 rounded-lg" />
                  ))}
                </div>
              ) : waterAlerts.length === 0 ? (
                <div className="text-center py-6">
                  <span className="text-3xl">🟢</span>
                  <p className="text-sm text-gray-600 mt-2">All parameters optimal</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {waterAlerts.map((alert, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getStatusIcon((alert as any).status ?? 'unknown')}</span>
                        <div>
                          <p className="font-medium text-sm">{(alert as any).tankName ?? 'Tank'}</p>
                          <p className="text-xs text-gray-600">{(alert as any).parameter ?? 'Water Quality'}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor((alert as any).status ?? 'unknown') + ' text-xs'}>
                        {((alert as any).status ?? 'UNKNOWN').toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Tanks Summary */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Active Tanks</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 bg-gray-100 rounded" />
                  ))}
                </div>
              ) : (dashData?.fishSummary?.totalTanks ?? 0) === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No active tanks</p>
              ) : (
                <div className="text-center py-4">
                  <Fish className="w-8 h-8 text-[#088395] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{dashData?.fishSummary?.activeTanks ?? 0}</p>
                  <p className="text-sm text-gray-500">active tanks</p>
                  <p className="text-xs text-gray-400 mt-1">out of {dashData?.fishSummary?.totalTanks ?? 0} total</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Harvests */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Harvests</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-100 rounded-lg" />
                  ))}
                </div>
              ) : upcomingHarvests.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No harvest dates scheduled yet
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingHarvests.map((harvest, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="font-medium text-sm">{harvest.tankName}</p>
                          {harvest.estimatedWeight && (
                            <p className="text-xs text-gray-600">{harvest.estimatedWeight.toLocaleString()} kg est.</p>
                          )}
                        </div>
                        {harvest.batches?.[0]?.daysToHarvest != null && (
                          <Badge className="bg-[#088395] text-white text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {harvest.batches[0].daysToHarvest}d
                          </Badge>
                        )}
                      </div>
                      {harvest.batches?.map((b, bi) => (
                        <p key={bi} className="text-xs text-gray-500">{b.fishType}</p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}