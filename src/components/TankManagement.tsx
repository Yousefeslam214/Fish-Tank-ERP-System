import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import {
  Fish,
  Droplet,
  Scale,
  Activity,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  History,
  TrendingUp,
  Settings,
  MoreVertical,
  Plus,
  Thermometer,
  Calendar
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { User, Farm } from '../types';
import { mockFarms, mockGrowthMeasurements } from '../mockData';
import { apiGet } from '../api';
import RecordGrowthMeasurement from './tanks/RecordGrowthMeasurement';
import GrowthHistory from './tanks/GrowthHistory';

interface TankManagementProps {
  user: User;
  selectedFarm: Farm | null;
}

// ── API response shape for a single tank (matches actual /api/v1/tanks response) ──
interface ApiTankBiomass {
  actual?: number;
  capacity?: number;
  unit?: string;
  overstockPercentage?: number | null;
}
interface ApiTankWaterQuality {
  overallStatus?: string;
  temperature?: number;
  dissolvedOxygen?: number;
  ph?: number;
  ammonia?: number;
}
interface ApiTankFeeding {
  currentMeal?: number;
  totalMeals?: number;
  weightFed?: number;
  targetWeight?: number;
  percentage?: number;
}
interface RawApiTank {
  id: string;
  name: string;
  status: string;
  fishType?: string;
  biomass?: ApiTankBiomass;
  waterQuality: ApiTankWaterQuality | null;
  feeding: ApiTankFeeding | null;
  batches?: any[];
}
interface ApiTank {
  id: string;
  name: string;
  farmId?: string;
  status: string;
  fishType?: string;
  species: string;
  biomass: number;
  capacity: number;
  volume: number;
  waterQuality: {
    overall: string;
    temp: { value: number; status: string };
    do: { value: number; status: string };
    ph: { value: number; status: string };
    nh3: { value: number; status: string };
  } | null;
  feeding: {
    todayMeals: number;
    totalMeals: number;
    todayFed: number;
    recommended: number;
  } | null;
  batches?: any[];
}

export default function TankManagement({ user, selectedFarm }: TankManagementProps) {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedTank, setSelectedTank] = useState<any>(null);
  const [showFeedingModal, setShowFeedingModal] = useState(false);
  const [showWaterQualityModal, setShowWaterQualityModal] = useState(false);

  // ── API state ──
  const [tanks, setTanks] = useState<ApiTank[]>([]);
  const [tanksLoading, setTanksLoading] = useState(true);
  const [tanksError, setTanksError] = useState<string | null>(null);

  const currentFarm = selectedFarm || mockFarms[0];

  // ── Fetch tanks from API ──
  // WHY fetch here and not inside TankDetailView?
  // The tank LIST is Hazem's responsibility (GET /api/v1/tanks).
  // Fetching once at this level means the grid is always populated
  // and we can pass the full tank object into TankDetailView so it
  // can immediately show data without an extra round-trip.
  const fetchTanks = useCallback(async () => {
    setTanksLoading(true);
    setTanksError(null);
    try {
      // API returns: { success: true, data: [...] }
      const res = await apiGet<{ success: boolean; data: RawApiTank[] } | RawApiTank[]>('/tanks');
      const list: RawApiTank[] = Array.isArray(res)
        ? res
        : ((res as { success: boolean; data: RawApiTank[] }).data ?? []);

      // Normalise: map the REAL API fields to the shape TankDetailView expects
      // - biomass is an OBJECT { actual, capacity } in the real API
      // - waterQuality uses 'overallStatus' (not 'overall')
      // - feeding uses 'weightFed'/'targetWeight'/'currentMeal'
      // - fishType instead of species
      const normalised = list.map(t => {
        const bioObj = t.biomass as unknown as ApiTankBiomass | undefined;
        const biomassKg = bioObj?.actual ?? 0;
        const capacityKg = bioObj?.capacity ?? 25000;
        const wq = t.waterQuality as ApiTankWaterQuality | undefined;
        const fd = t.feeding as ApiTankFeeding | undefined;

        return {
          ...t,
          species: t.fishType ?? 'Unknown',   // rename fishType → species
          biomass: biomassKg,
          capacity: capacityKg,
          volume: 50,                          // not returned by API, default
          batches: t.batches ?? [],
          waterQuality: wq ? {
            overall: (wq?.overallStatus ?? 'unknown').toLowerCase(),
            temp: { value: parseFloat((wq?.temperature ?? 0).toFixed(1)), status: 'unknown' },
            do: { value: parseFloat((wq?.dissolvedOxygen ?? 0).toFixed(2)), status: 'unknown' },
            ph: { value: parseFloat((wq?.ph ?? 0).toFixed(2)), status: 'unknown' },
            nh3: { value: parseFloat((wq?.ammonia ?? 0).toFixed(4)), status: 'unknown' },
          } : null,
          feeding: fd ? {
            todayMeals: fd?.currentMeal ?? 0,
            totalMeals: fd?.totalMeals ?? 4,
            todayFed: fd?.weightFed ?? 0,
            recommended: fd?.targetWeight ?? 0,
          } : null,
        };
      });

      setTanks(normalised as any[]);
    } catch (err) {
      setTanksError((err as Error).message);
    } finally {
      setTanksLoading(false);
    }
  }, [currentFarm.id]);

  useEffect(() => {
    fetchTanks();
  }, [fetchTanks]);

  // tanks, tanksLoading, tanksError are managed by useEffect above

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'critical': return 'bg-[#EF4444]';
      case 'warning': return 'bg-[#F59E0B]';
      case 'acceptable': return 'bg-[#3B82F6]';
      case 'optimal': return 'bg-[#10B981]';
      case 'active': return 'bg-[#10B981]';
      case 'maintenance': return 'bg-purple-500';
      case 'empty': return 'bg-gray-400';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      case 'acceptable': return '🔵';
      case 'optimal': return '🟢';
      case 'maintenance': return '🔧';
      case 'empty': return '⚪';
      default: return '⚪';
    }
  };

  if (viewMode === 'detail' && selectedTank) {
    return <TankDetailView tank={selectedTank} onBack={() => setViewMode('list')} />;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Top Navigation Bar */}
      <div className="bg-[#0A4D68] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplet className="w-6 h-6" />
            <span className="text-xl font-semibold">Tank Management</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">{currentFarm.name}</span>
            <div className="w-10 h-10 rounded-full bg-[#088395] flex items-center justify-center font-semibold">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-gray-900">All Tanks</h1>
          <Button className="bg-[#088395] hover:bg-[#0A4D68]">
            <Plus className="w-4 h-4 mr-2" />
            Add New Tank
          </Button>
        </div>

        {/* Error banner */}
        {tanksError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Failed to load tanks</p>
              <p className="text-xs text-red-600 mt-0.5">{tanksError}</p>
            </div>
            <Button size="sm" variant="outline" onClick={fetchTanks}>Retry</Button>
          </div>
        )}

        {/* Tank Grid */}
        {tanksLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="bg-white shadow-sm animate-pulse">
                <CardContent className="p-6 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-2 bg-gray-200 rounded w-full" />
                  <div className="h-12 bg-gray-100 rounded" />
                  <div className="h-10 bg-gray-100 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tanks.length === 0 && !tanksError ? (
          <div className="text-center py-16">
            <Fish className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No tanks found for this farm</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tanks.map((tank) => (
              <Card
                key={tank.id}
                className="bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedTank(tank);
                  setViewMode('detail');
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{tank.name}</CardTitle>
                    <Badge className={`${getStatusColor(tank.status ?? '')} text-white`}>
                      {(tank.status ?? 'unknown').toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{tank.species}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Biomass */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Biomass</span>
                      <span className="font-medium">{tank.biomass as number} / {tank.capacity} kg</span>
                    </div>
                    <Progress value={Math.min(((tank.biomass as number) / (tank.capacity as number)) * 100, 100)} className="h-2" />
                    {(tank.biomass as number) > (tank.capacity as number) && (
                      <p className="text-xs text-red-600 mt-1">
                        ⚠️ Overstocked by {Math.round((((tank.biomass as number) - (tank.capacity as number)) / (tank.capacity as number)) * 100)}%
                      </p>
                    )}
                  </div>

                  {/* Water Quality */}
                  {tank.waterQuality ? (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Water Quality</span>
                        <span className="text-xs">{getStatusIcon(tank.waterQuality.overall)} {tank.waterQuality.overall}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Temp:</span>
                          <span className="ml-1 font-medium">{tank.waterQuality.temp.value}°C</span>
                        </div>
                        <div>
                          <span className="text-gray-600">DO:</span>
                          <span className="ml-1 font-medium">{tank.waterQuality.do.value} mg/L</span>
                        </div>
                        <div>
                          <span className="text-gray-600">pH:</span>
                          <span className="ml-1 font-medium">{tank.waterQuality.ph.value}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">NH₃:</span>
                          <span className="ml-1 font-medium">{tank.waterQuality.nh3.value} mg/L</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-lg text-center py-4 border border-dashed border-gray-200">
                      <p className="text-xs text-gray-400 italic">No water quality data</p>
                    </div>
                  )}

                  {/* Feeding */}
                  {tank.feeding ? (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Today's Feeding</span>
                        <span className="text-xs">{tank.feeding.todayMeals}/{tank.feeding.totalMeals} meals</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Fed: {tank.feeding.todayFed} / {tank.feeding.recommended} kg</span>
                        {tank.feeding.recommended > 0 && (
                          <span className={`font-medium ${tank.feeding.todayFed < tank.feeding.recommended
                            ? 'text-yellow-600'
                            : 'text-green-600'
                            }`}>
                            {Math.round((tank.feeding.todayFed / tank.feeding.recommended) * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-lg text-center py-4 border border-dashed border-gray-200">
                      <p className="text-xs text-gray-400 italic">No feeding plan</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Tank Detail View Component
function TankDetailView({ tank, onBack }: { tank: any; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showFeedingModal, setShowFeedingModal] = useState(false);
  const [showWaterQualityModal, setShowWaterQualityModal] = useState(false);

  // ── API state for detailed records ──
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [predictionData, setPredictionData] = useState<any>(null);
  const [waterQualityRecords, setWaterQualityRecords] = useState<any[]>([]);
  const [feedingRecords, setFeedingRecords] = useState<any[]>([]);
  const [growthMetrics, setGrowthMetrics] = useState<any[]>([]);
  const [tankBatches, setTankBatches] = useState<any[]>(tank.batches || []);
  const [batchesSummary, setBatchesSummary] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const fetchTankDetails = useCallback(async () => {
    setLoadingDetails(true);
    setDetailsError(null);
    try {
      // First fetch basic details and dashboard
      const [dashRes, wqRes, fdRes, gmRes, btRes] = await Promise.all([
        apiGet<any>(`/tanks/${tank.id}/dashboard`),
        apiGet<any>(`/tanks/${tank.id}/water-quality`),
        apiGet<any>(`/tanks/${tank.id}/feeding-history`),
        apiGet<any>(`/tanks/${tank.id}/growth-metrics`),
        apiGet<any>(`/tanks/${tank.id}/batches`)
      ]);

      const dashData = dashRes.data ?? dashRes;
      setDashboardData(dashData);

      const wqData = Array.isArray(wqRes.data) ? wqRes.data : (Array.isArray(wqRes) ? wqRes : []);
      const fdData = Array.isArray(fdRes.data) ? fdRes.data : (Array.isArray(fdRes) ? fdRes : []);
      const gmData = Array.isArray(gmRes.data) ? gmRes.data : (Array.isArray(gmRes) ? gmRes : []);
      
      // Handle batches based on the provided JSON structure
      let btData = [];
      let btSummary = null;
      if (btRes) {
        if (btRes.data && Array.isArray(btRes.data.batches)) {
          btData = btRes.data.batches;
          btSummary = btRes.data.summary;
        } else if (Array.isArray(btRes.data)) {
          btData = btRes.data;
        } else if (Array.isArray(btRes.batches)) {
          btData = btRes.batches;
        } else if (Array.isArray(btRes)) {
          btData = btRes;
        }
      }

      setWaterQualityRecords(wqData);
      setFeedingRecords(fdData);
      setGrowthMetrics(gmData);
      const finalBatches = btData.length > 0 ? btData : tank.batches || [];
      setTankBatches(finalBatches);
      setBatchesSummary(btSummary);

      // If there are batches, fetch prediction for the first one
      if (finalBatches.length > 0) {
        try {
          const predRes = await apiGet<any>(`/harvest/events/prediction/batch/${finalBatches[0].id}`);
          setPredictionData(predRes.data ?? predRes);
        } catch (err) {
          console.warn('Failed to fetch harvest prediction:', err);
        }
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

  // Map API records to the shape expected by charts and tables
  const waterQualityHistory = useMemo(() => {
    if (!Array.isArray(waterQualityRecords)) return [];
    return [...waterQualityRecords]
      .sort((a, b) => new Date(a.measuredAt || a.createdAt).getTime() - new Date(b.measuredAt || b.createdAt).getTime())
      .map(r => ({
        date: new Date(r.measuredAt || r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        temp: r.temperature,
        do: r.dissolvedOxygen,
        ph: r.ph,
        nh3: r.ammonia
      }));
  }, [waterQualityRecords]);

  const feedingHistory = useMemo(() => {
    if (!Array.isArray(feedingRecords)) return [];
    // Only show today's feedings in the "Today's Schedule" summary
    const today = new Date().toISOString().split('T')[0];
    return feedingRecords
      .filter(r => (r.date || r.createdAt)?.startsWith(today))
      .map(r => ({
        time: r.time || (r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '–'),
        meal: r.mealNumber ?? 0,
        fed: r.weightFed ?? 0,
        recommended: r.targetWeight ?? 0,
        status: (r.weightFed ?? 0) >= (r.targetWeight ?? 0) ? 'on-target' : 'below'
      }));
  }, [feedingRecords]);

  const growthData = useMemo(() => {
    if (!Array.isArray(growthMetrics)) return [];
    return growthMetrics.map(m => ({
      week: `Day ${m.daysInCulture ?? m.dayCount}`,
      weight: m.averageWeightGrams ?? m.avgWeight
    }));
  }, [growthMetrics]);

  return (
    <div className="flex-1 overflow-auto bg-[#F9FAFB]">
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
              <h1 className="text-xl font-semibold">{tank.name}</h1>
              <p className="text-sm text-gray-300">{tank.volume}m³ volume · Stocking density: {Math.round((tank.biomass / tank.volume))} kg/m³</p>
            </div>
            <div className="flex items-center gap-3">
              {loadingDetails && <RefreshCw className="w-4 h-4 animate-spin text-gray-300" />}
              <Badge className={`${tank.status === 'critical' ? 'bg-[#EF4444]' : tank.status === 'warning' ? 'bg-[#F59E0B]' : 'bg-[#10B981]'} text-white text-sm px-3 py-1`}>
                {tank.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className={`p-6 ${loadingDetails ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}`}>
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
            <TabsTrigger value="health">Health Management</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
          </TabsList>

          {/* Overview Tab - Analytics Only */}
          <TabsContent value="overview" className="space-y-4">
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
                          <p className="text-2xl font-bold">{tank.biomass} kg</p>
                          <p className="text-xs text-gray-500 mt-1">{Math.round((tank.biomass / tank.capacity) * 100)}% capacity</p>
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
                          <p className="text-2xl font-bold capitalize">{tank.waterQuality?.overall || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 mt-1">Last: 2 hours ago</p>
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
                          <p className="text-2xl font-bold">{tank.feeding?.todayFed || 0} kg</p>
                          <p className="text-xs text-gray-500 mt-1">{tank.feeding?.todayMeals || 0}/{tank.feeding?.totalMeals || 0} meals</p>
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
                        {dashboardData?.capacity?.currentLoadKg ?? tank.biomass} / {dashboardData?.capacity?.capacityKg ?? tank.capacity} kg
                      </span>
                    </div>
                    <Progress value={dashboardData?.capacity?.percentageUsed ?? (tank.biomass / tank.capacity) * 100} className="h-3" />
                    <p className="text-xs text-gray-600 mt-1">
                      {Math.round(dashboardData?.capacity?.percentageUsed ?? (tank.biomass / tank.capacity) * 100)}% capacity used
                    </p>
                  </div>
                  {(dashboardData?.capacity?.percentageUsed > 100 || tank.biomass > tank.capacity) && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          ⚠️ Overstocked by {Math.round(dashboardData?.capacity?.overstockPercentage?.value || ((tank.biomass - tank.capacity) / tank.capacity) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    <p>Volume: {dashboardData?.tankInfo?.volume ?? tank.volume}m³</p>
                    <p>Stocking Density: {Math.round(dashboardData?.capacity?.stockingDensity ?? (tank.biomass / tank.volume))} kg/m³</p>
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
                  {tank.waterQuality ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">Overall Status</span>
                        <Badge className={`${tank.waterQuality.overall === 'optimal' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'} text-white`}>
                          {tank.waterQuality.overall.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <WaterParameter name="Temperature" value={tank.waterQuality.temp.value + '°C'} status={tank.waterQuality.temp.status} />
                        <WaterParameter name="DO" value={tank.waterQuality.do.value + ' mg/L'} status={tank.waterQuality.do.status} />
                        <WaterParameter name="pH" value={tank.waterQuality.ph.value} status={tank.waterQuality.ph.status} />
                        <WaterParameter name="NH₃" value={tank.waterQuality.nh3.value + ' mg/L'} status={tank.waterQuality.nh3.status} />
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
                  {tank.feeding ? (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Meals Completed</span>
                        <span className="font-medium">{tank.feeding.todayMeals}/{tank.feeding.totalMeals}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Fed Today</span>
                        <span className="font-medium">{tank.feeding.todayFed} kg</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Recommended</span>
                        <span className="font-medium">{tank.feeding.recommended} kg</span>
                      </div>
                      <Progress value={tank.feeding.recommended > 0 ? (tank.feeding.todayFed / tank.feeding.recommended) * 100 : 0} className="h-2" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Achievement</span>
                        <span className={`font-medium ${tank.feeding.todayFed < tank.feeding.recommended ? 'text-yellow-600' : 'text-green-600'}`}>
                          {tank.feeding.recommended > 0 ? Math.round((tank.feeding.todayFed / tank.feeding.recommended) * 100) : 0}%
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
          </TabsContent>

          {/* Batches Tab */}
          <TabsContent value="batches" className="space-y-4">
            {/* Total Feeding Summary for All Batches */}
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Total Tank Feeding Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  if (batchesSummary) {
                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-white p-3 rounded-lg border">
                            <p className="text-xs text-gray-600 mb-1">Total Daily Required</p>
                            <p className="text-2xl font-bold text-gray-900">{batchesSummary.totalDailyRequired}</p>
                            <p className="text-xs text-gray-500 mt-1">{batchesSummary.batchesCombined}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border">
                            <p className="text-xs text-gray-600 mb-1">Fed Today</p>
                            <p className="text-2xl font-bold text-blue-600">{batchesSummary.fedToday}</p>
                            <p className="text-xs text-gray-500 mt-1">{batchesSummary.achievementPercentage}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border">
                            <p className="text-xs text-gray-600 mb-1">Remaining Today</p>
                            <p className="text-2xl font-bold text-orange-600">{batchesSummary.remainingToday}</p>
                            <p className="text-xs text-gray-500 mt-1">{batchesSummary.mealsLeft}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border">
                            <p className="text-xs text-gray-600 mb-1">Feed Types Used</p>
                            <p className="text-lg font-bold text-gray-900">{batchesSummary.feedTypesUsed}</p>
                            <p className="text-xs text-gray-500 mt-1 truncate" title={batchesSummary.feedTypeList}>{batchesSummary.feedTypeList}</p>
                          </div>
                        </div>
                        <div className="mt-4 bg-white p-3 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Overall Feeding Progress</span>
                            <span className="text-sm text-gray-600">{batchesSummary.overallProgress}</span>
                          </div>
                          {(() => {
                            const achievementStr = batchesSummary.achievementPercentage || '0%';
                            const achievementValue = parseFloat(achievementStr.replace(/[^0-9.]/g, '')) || 0;
                            return <Progress value={achievementValue} className="h-2" />;
                          })()}
                        </div>
                      </>
                    );
                  }

                  // Fallback to existing calculations if batchesSummary is null
                  const totalRequired = tankBatches.reduce((sum: number, b: any) => {
                    const daily = parseFloat(b.feedingPlan?.dailyFeedingAmount || b.dailyFeedKg || '0');
                    return sum + (isNaN(daily) ? 0 : daily);
                  }, 0);
                  const fedToday = tank.feeding?.todayFed || 0;
                  const remaining = Math.max(0, totalRequired - fedToday);
                  const uniqueFeedTypes = [...new Set(tankBatches.map((b: any) => b.feedingPlan?.assignedFeedType || b.feedType || 'Unknown'))];

                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-xs text-gray-600 mb-1">Total Daily Required</p>
                          <p className="text-2xl font-bold text-gray-900">{totalRequired} kg</p>
                          <p className="text-xs text-gray-500 mt-1">{tankBatches.length} batches combined</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-xs text-gray-600 mb-1">Fed Today</p>
                          <p className="text-2xl font-bold text-blue-600">{fedToday} kg</p>
                          <p className="text-xs text-gray-500 mt-1">{totalRequired > 0 ? Math.round((fedToday / totalRequired) * 100) : 0}% of requirement</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-xs text-gray-600 mb-1">Remaining Today</p>
                          <p className="text-2xl font-bold text-orange-600">{remaining} kg</p>
                          <p className="text-xs text-gray-500 mt-1">{totalRequired > 0 ? `${Math.max(0, 4 - (tank.feeding?.todayMeals || 0))} meals left` : 'No feeding plan'}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-xs text-gray-600 mb-1">Feed Types Used</p>
                          <p className="text-lg font-bold text-gray-900">{uniqueFeedTypes.length} types</p>
                          <p className="text-xs text-gray-500 mt-1">{uniqueFeedTypes.join(', ') || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="mt-4 bg-white p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Overall Feeding Progress</span>
                          <span className="text-sm text-gray-600">{tank.feeding?.todayMeals || 0}/{tank.feeding?.totalMeals || 4} meals completed</span>
                        </div>
                        <Progress value={totalRequired > 0 ? (fedToday / totalRequired) * 100 : 0} className="h-2" />
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Individual Batch Details */}
            <div className="grid grid-cols-1 gap-4">
              {tankBatches.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    <p>No batches found for this tank.</p>
                  </CardContent>
                </Card>
              ) : (
                tankBatches.map((batch: any) => (
                  <Card key={batch.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Batch {batch.batchNumber || batch.id}</CardTitle>
                          <p className="text-sm text-gray-600">{batch.species || batch.fishType || tank.species}</p>
                        </div>
                        <Badge className="bg-[#10B981] text-white">{batch.status || 'ACTIVE'}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Initial Count</p>
                          <p className="text-lg font-semibold">{(batch.counts?.initial ?? batch.initialCount ?? 0).toLocaleString()} fish</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Current Count</p>
                          <p className="text-lg font-semibold">{(batch.counts?.current ?? batch.currentCount ?? batch.count ?? 0).toLocaleString()} fish</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Initial Weight</p>
                          <p className="text-lg font-semibold">{batch.weights?.initial ?? batch.initialAverageWeight ?? '0g'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Current Avg Weight</p>
                          <p className="text-lg font-semibold">{batch.weights?.currentAvg ?? batch.currentAverageWeight ?? batch.avgWeight ?? '0g'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-[#E0F4F5] p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Age (Days in Culture)</p>
                          <p className="text-lg font-semibold">{batch.age ?? '0 days'}</p>
                        </div>
                        <div className="bg-[#E0F4F5] p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Current Biomass</p>
                          <p className="text-lg font-semibold">{batch.biomass ?? '0kg'}</p>
                        </div>
                        <div className="bg-[#E0F4F5] p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Survival Rate</p>
                          <p className="text-lg font-semibold text-green-600">{batch.survivalRate ?? '92%'}</p>
                        </div>
                        <div className="bg-[#E0F4F5] p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Current SGR</p>
                          <p className="text-lg font-semibold">{batch.sgr ?? '2.1%/day'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <p className="text-xs text-gray-600 mb-1">Total Feed Consumed</p>
                          <p className="text-lg font-semibold">{batch.totalFeedConsumed ?? '450 kg'}</p>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <p className="text-xs text-gray-600 mb-1">Current FCR</p>
                          <p className="text-lg font-semibold">{batch.fcr ?? '1.52'}</p>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <p className="text-xs text-gray-600 mb-1">Feed Cost</p>
                          <p className="text-lg font-semibold">{batch.costs?.feedCost ?? '6,750 EGP'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <p className="text-xs text-gray-600 mb-1">Cost Basis (Fish Purchase)</p>
                          <p className="text-lg font-semibold">{batch.costs?.costBasis ?? '12,000 EGP'}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <p className="text-xs text-gray-600 mb-1">Stocked Date</p>
                          <p className="text-lg font-semibold">{batch.dates?.stockedDate ?? 'Dec 28, 2025'}</p>
                        </div>
                      </div>

                      <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Last Sampled</p>
                        <p className="text-sm font-medium">{batch.dates?.lastSampled ?? 'Never'}</p>
                      </div>

                      {/* Feeding Plan for this Batch */}
                      <div className="mt-4 border-t pt-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Fish className="w-4 h-4" />
                          Feeding Plan for Batch {batch.id}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                            <p className="text-xs text-gray-600 mb-2">Assigned Feed Type</p>
                            <p className="font-semibold text-sm mb-1">{batch.feedingPlan?.assignedFeedType || 'Grower 30% 3mm Floating'}</p>
                            <p className="text-xs text-gray-600">{batch.feedingPlan?.optimalLabel || 'Optimal for current weight range'}</p>
                          </div>
                          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                            <p className="text-xs text-gray-600 mb-2">Daily Feeding Amount</p>
                            <p className="font-semibold text-sm mb-1">{batch.feedingPlan?.dailyFeedingAmount || '45 kg/day (2.5% body weight)'}</p>
                            <p className="text-xs text-gray-600">Distributed over {batch.feedingPlan?.mealsPerDay || 4} meals</p>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                          <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-600">Today's Fed:</span>
                            <span className="ml-1 font-medium">{batch.feedingPlan?.todayFed ?? 0} kg</span>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-600">This Week:</span>
                            <span className="ml-1 font-medium">{batch.feedingPlan?.thisWeekFed ?? 0} kg</span>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-600">Last FCR:</span>
                            <span className="ml-1 font-medium">{batch.feedingPlan?.lastFCR || '1.52'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" className="flex-1">
                          <Scale className="w-4 h-4 mr-2" />
                          View Growth History
                        </Button>
                        <Button className="flex-1 bg-[#088395] hover:bg-[#0A4D68]">
                          Update Batch Data
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Water Quality Tab */}
          <TabsContent value="water" className="space-y-4">
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
                    <Line yAxisId="left" type="monotone" dataKey="temp" stroke="#F59E0B" strokeWidth={2} name="Temp (°C)" />
                    <Line yAxisId="left" type="monotone" dataKey="do" stroke="#088395" strokeWidth={2} name="DO (mg/L)" />
                    <Line yAxisId="right" type="monotone" dataKey="ph" stroke="#10B981" strokeWidth={2} name="pH" />
                    <Line yAxisId="right" type="monotone" dataKey="nh3" stroke="#EF4444" strokeWidth={2} name="NH₃ (mg/L)" />
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
                  waterQualityRecords.map((record) => {
                    const status = record.overallStatus || record.status || 'unknown';
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
                      <Card key={record.id} className="bg-white shadow-sm border-l-4 border-l-[#088395]">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <Droplet className="w-5 h-5 text-[#088395]" />
                                <span className="font-semibold text-gray-900">
                                  {new Date(record.measuredAt || record.createdAt).toLocaleString()}
                                </span>
                                <Badge className={getStatusColor(status)}>
                                  {status.toLowerCase() === 'optimal' && '🟢'}
                                  {status.toLowerCase() === 'acceptable' && '🔵'}
                                  {status.toLowerCase() === 'warning' && '🟡'}
                                  {status.toLowerCase() === 'critical' && '🔴'}
                                  {' '}{status.toUpperCase()}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-3">
                                <div>
                                  <p className="text-xs text-gray-600">Temperature</p>
                                  <p className="font-semibold">{record.temperature ?? record.temp ?? '–'}°C</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">DO</p>
                                  <p className="font-semibold">{record.dissolvedOxygen ?? record.do ?? '–'} mg/L</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">pH</p>
                                  <p className="font-semibold">{record.ph ?? '–'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">NH₃</p>
                                  <p className="font-semibold">{record.ammonia ?? record.nh3 ?? '–'} mg/L</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">NO₂</p>
                                  <p className="font-semibold">{record.nitrite ?? record.no2 ?? '–'} mg/L</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">NO₃</p>
                                  <p className="font-semibold">{record.nitrate ?? record.no3 ?? '–'} mg/L</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-xs text-gray-600">
                                {record.measuredBy && (
                                  <span>Measured by: <span className="font-medium text-gray-900">{record.measuredBy}</span></span>
                                )}
                                {record.notes && (
                                  <span className="text-[#088395]">Note: {record.notes}</span>
                                )}
                              </div>
                            </div>

                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </TabsContent>

          {/* Feeding History Tab */}
          <TabsContent value="feeding" className="space-y-4">
            {/* Today's Schedule */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Today's Feeding Schedule - Feb 13, 2026</CardTitle>
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
                <div className="space-y-3">
                  {feedingHistory.map((feeding, idx) => (
                    <div key={idx} className="border-l-4 border-[#088395] pl-4 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{feeding.time} - Meal #{feeding.meal}</span>
                        <Badge className={feeding.status === 'on-target' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}>
                          {feeding.status === 'on-target' ? '✅ On target' : '⚠️ Below recommendation'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Amount: {feeding.fed} kg (Recommended: {feeding.recommended} kg)</p>
                        <p>Food: Grower 30% 3mm Floating</p>
                        <p>Fed by: Ahmed Mohamed</p>
                      </div>
                    </div>
                  ))}
                  <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600">
                    <p className="text-sm">Next feeding due: 17:30</p>
                  </div>
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
                  feedingRecords.map((record) => {
                    const status = record.status || ((record.weightFed ?? 0) >= (record.targetWeight ?? 0) ? 'on-target' : 'below');
                    const getStatusColor = (s: string) => {
                      switch (s.toLowerCase()) {
                        case 'on-target': return 'bg-[#10B981] text-white';
                        case 'below': return 'bg-[#F59E0B] text-white';
                        case 'above': return 'bg-[#3B82F6] text-white';
                        default: return 'bg-gray-500 text-white';
                      }
                    };

                    const percentage = record.targetWeight > 0 ? Math.round((record.weightFed / record.targetWeight) * 100) : 0;

                    return (
                      <Card key={record.id} className="bg-white shadow-sm border-l-4 border-l-[#10B981]">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <Fish className="w-5 h-5 text-[#10B981]" />
                                <span className="font-semibold text-gray-900">
                                  {new Date(record.date || record.createdAt).toLocaleDateString()} at {record.time || (record.createdAt ? new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '–')}
                                </span>
                                <Badge variant="outline">
                                  Meal #{record.mealNumber || record.meal}
                                </Badge>
                                <Badge className={getStatusColor(status)}>
                                  {status.toLowerCase() === 'on-target' && '✅'}
                                  {status.toLowerCase() === 'below' && '⚠️'}
                                  {' '}{status.toUpperCase()}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                <div>
                                  <p className="text-xs text-gray-600">Amount Fed</p>
                                  <p className="font-semibold">{record.weightFed ?? record.fed ?? 0} kg</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Recommended</p>
                                  <p className="font-semibold">{record.targetWeight ?? record.recommended ?? 0} kg</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Achievement</p>
                                  <p className={`font-semibold ${percentage >= 90 && percentage <= 110 ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {percentage}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Difference</p>
                                  <p className={`font-semibold ${(record.weightFed ?? 0) >= (record.targetWeight ?? 0) ? 'text-blue-600' : 'text-orange-600'}`}>
                                    {(record.weightFed ?? 0) >= (record.targetWeight ?? 0) ? '+' : ''}{((record.weightFed ?? 0) - (record.targetWeight ?? 0)).toFixed(1)} kg
                                  </p>
                                </div>
                              </div>

                              <div className="bg-gray-50 p-2 rounded text-xs mb-2">
                                <span className="text-gray-600">Food Type:</span>{' '}
                                <span className="font-medium text-gray-900">{record.foodType || record.feedType || 'N/A'}</span>
                              </div>

                              <div className="flex items-center gap-4 text-xs text-gray-600">
                                {record.fedBy && (
                                  <span>Fed by: <span className="font-medium text-gray-900">{record.fedBy}</span></span>
                                )}
                                {record.notes && (
                                  <span className="text-yellow-700 font-medium">Note: {record.notes}</span>
                                )}
                              </div>
                            </div>

                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </TabsContent>

          {/* Growth Measurements Tab */}
          <TabsContent value="growth" className="space-y-4">
            {/* Batch Selector */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Label className="font-semibold">Select Batch to View Growth:</Label>
                  <div className="flex gap-2">
                    {tankBatches.map((batch: any) => (
                      <Button
                        key={batch.id}
                        variant="outline"
                        className="bg-white"
                      >
                        Batch {batch.batchNumber || batch.id}
                        <Badge className="ml-2 bg-[#0A4D68] text-white">{(batch.counts?.current ?? batch.currentCount ?? batch.count ?? 0).toLocaleString()} fish</Badge>
                      </Button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Growth measurements are tracked individually for each batch
                </p>
              </CardContent>
            </Card>

            {/* Growth History for Selected Batch */}
            {tankBatches.length > 0 && (
              <GrowthHistory
                batch={{
                   id: tankBatches[0].id,
                   batchNumber: tankBatches[0].batchNumber || tankBatches[0].id.substring(0, 8),
                   tankName: tank.name,
                   fishType: tankBatches[0].fishType || tankBatches[0].species || tank.species,
                   stockedDate: new Date(tankBatches[0].dates?.stockedDate || tankBatches[0].stockedDate || tankBatches[0].createdAt || Date.now()),
                   initialCount: tankBatches[0].counts?.initial || tankBatches[0].initialCount || 0,
                   currentCount: tankBatches[0].counts?.current || tankBatches[0].currentCount || tankBatches[0].count || 0,
                   initialWeight: parseFloat(tankBatches[0].weights?.initial || tankBatches[0].initialAverageWeight || '0')
                }}
                measurements={growthMetrics}
                language="en"
                onMeasurementAdded={fetchTankDetails}
              />
            )}
            {tankBatches.length === 0 && !loadingDetails && (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <p>No batches found to display growth history.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Health Management Tab */}
          <TabsContent value="health" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tank Health Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Overall Health</span>
                      <Badge className="bg-green-600 text-white">
                        {dashboardData?.summary?.find((s: any) => s.label.toLowerCase().includes('health'))?.value || 'Healthy'}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                      {dashboardData?.summary?.find((s: any) => s.label.toLowerCase().includes('health'))?.subValue || '95%'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Status from dashboard</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Mortality Rate</span>
                      <Badge className="bg-blue-600 text-white">Normal</Badge>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">
                      {dashboardData?.summary?.find((s: any) => s.label.toLowerCase().includes('mortality'))?.value || '2.1%'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Last 30 days</p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Last Inspection</span>
                      <Badge className="bg-yellow-600 text-white">Recent</Badge>
                    </div>
                    <p className="text-lg font-bold text-yellow-700">
                      {dashboardData?.summary?.find((s: any) => s.label.toLowerCase().includes('inspected'))?.value || '2 days ago'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Data from dashboard</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Health History & Observations</h3>

                  {/* Health Record 1 */}
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold">Feb 11, 2026 - Routine Inspection</span>
                            <Badge className="bg-green-100 text-green-800">✅ Healthy</Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Inspector:</strong> Dr. Fatima Hassan</p>
                            <p><strong>Fish Sampled:</strong> 50 fish from all batches</p>
                            <p><strong>Observations:</strong> All fish showing normal behavior, good appetite, no visible signs of disease or parasites</p>
                            <p><strong>Actions Taken:</strong> None required</p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs bg-gray-50 p-3 rounded">
                        <div>
                          <span className="text-gray-600">Body Condition:</span>
                          <span className="ml-1 font-medium">Excellent</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Appetite:</span>
                          <span className="ml-1 font-medium">Normal</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Activity:</span>
                          <span className="ml-1 font-medium">Active</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Health Record 2 */}
                  <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold">Feb 5, 2026 - Minor Issue Detected</span>
                            <Badge className="bg-yellow-100 text-yellow-800">⚠️ Treated</Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Inspector:</strong> Dr. Omar Ibrahim</p>
                            <p><strong>Fish Affected:</strong> ~3% of Batch #123 (approx. 36 fish)</p>
                            <p><strong>Symptoms:</strong> Some fish showing reduced appetite and lethargy</p>
                            <p><strong>Diagnosis:</strong> Mild stress response to water quality fluctuation</p>
                            <p><strong>Treatment:</strong> Increased aeration, vitamin C supplement in feed for 5 days</p>
                            <p><strong>Outcome:</strong> Full recovery observed within 4 days</p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs bg-yellow-50 p-3 rounded">
                        <div>
                          <span className="text-gray-600">Treatment Cost:</span>
                          <span className="ml-1 font-medium">450 EGP</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Recovery Rate:</span>
                          <span className="ml-1 font-medium">100%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Follow-up:</span>
                          <span className="ml-1 font-medium">Completed</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Health Record 3 */}
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold">Jan 28, 2026 - Preventive Treatment</span>
                            <Badge className="bg-green-100 text-green-800">✅ Completed</Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Performed by:</strong> Dr. Fatima Hassan</p>
                            <p><strong>Treatment:</strong> Preventive parasite treatment (Praziquantel)</p>
                            <p><strong>Reason:</strong> Routine quarterly prevention</p>
                            <p><strong>Duration:</strong> 3-day bath treatment</p>
                            <p><strong>Results:</strong> No adverse reactions, all fish healthy</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded text-xs">
                        <span className="text-gray-600">Next Scheduled Treatment:</span>
                        <span className="ml-1 font-medium">April 28, 2026</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">📋 Recommended Actions</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Continue routine bi-weekly health inspections</li>
                    <li>• Monitor water quality closely during warm weather</li>
                    <li>• Next parasite prevention treatment due in 73 days</li>
                    <li>• Maintain current feeding protocol</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Harvest Prediction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!predictionData && !loadingDetails && (
                  <p className="text-sm text-gray-500 text-center py-8">No prediction data available for current batches.</p>
                )}
                {predictionData && (
                  <>
                    <div className="bg-[#E0F4F5] p-4 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">🎯 Predicted Revenue:</span>
                        <span className="font-bold">{(predictionData.predictedRevenue || 0).toLocaleString()} EGP</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">📅 Days to Harvest:</span>
                        <span className="font-bold">{predictionData.daysToHarvest || 0} days</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Predictions:</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Final Projected Weight:</span>
                          <span className="font-medium">{predictionData.predictedWeightKg || predictionData.predictedFinalWeight || 0} kg</span>
                        </div>
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

                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                      <p className="text-sm font-medium text-green-800">✅ {predictionData.recommendation || 'MONITOR'}</p>
                      {predictionData.actions && predictionData.actions.length > 0 && (
                        <ul className="text-xs text-green-700 mt-2 list-disc ml-4">
                          {predictionData.actions.map((action: string, i: number) => (
                            <li key={i}>{action}</li>
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Feeding Modal */}
      <FeedingModal
        open={showFeedingModal}
        onOpenChange={setShowFeedingModal}
        tank={tank}
      />

      {/* Water Quality Modal */}
      <WaterQualityModal
        open={showWaterQualityModal}
        onOpenChange={setShowWaterQualityModal}
        tank={tank}
      />
    </div>
  );
}

// Helper Component
function WaterParameter({ name, value, status }: { name: string; value: string | number; status: string }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-green-600';
      case 'acceptable': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal': return '✅';
      case 'acceptable': return '🔵';
      case 'warning': return '🟡';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="bg-white p-3 rounded border">
      <p className="text-xs text-gray-500 mb-1">{name}</p>
      <p className="font-bold text-lg">{value}</p>
      <p className={`text-xs ${getStatusColor(status)} mt-1`}>
        {getStatusIcon(status)} {status.toUpperCase()}
      </p>
    </div>
  );
}

// Feeding Modal Component
function FeedingModal({ open, onOpenChange, tank }: { open: boolean; onOpenChange: (open: boolean) => void; tank: any }) {
  const [meals, setMeals] = useState(2.5);
  const [weightFed, setWeightFed] = useState(45);

  const dailyRecommended = 90;
  const perMeal = dailyRecommended / 4;
  const progress = {
    meals: meals / 4,
    weight: weightFed / dailyRecommended
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Feeding - {tank?.name}</DialogTitle>
          <p className="text-sm text-gray-600">Batch #123 - Nile Tilapia</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recommendation */}
          <div className="bg-[#E0F4F5] p-4 rounded-lg">
            <p className="font-medium mb-2">🎯 Recommendation</p>
            <div className="text-sm space-y-1">
              <p>Daily: {dailyRecommended} kg / 4 meals</p>
              <p>Per Meal: {perMeal} kg</p>
              <p>Food: Grower 30% 3mm Floating</p>
            </div>
          </div>

          {/* Food Type */}
          <div className="space-y-2">
            <Label>Food Type *</Label>
            <select className="w-full border rounded-md p-2">
              <option>✓ Grower 30% 3mm (Recommended)</option>
              <option>○ Grower 28% 3mm (Alternative)</option>
              <option>○ Grower 32% 2mm</option>
            </select>
          </div>

          {/* Number of Meals */}
          <div className="space-y-2">
            <Label>Number of Meals: *</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[meals]}
                onValueChange={(value: number[]) => setMeals(value[0])}
                min={0.5}
                max={4}
                step={0.5}
                className="flex-1"
              />
              <Input
                type="number"
                value={meals}
                onChange={(e) => setMeals(parseFloat(e.target.value))}
                className="w-20"
                step={0.5}
              />
            </div>
          </div>

          {/* Weight Fed */}
          <div className="space-y-2">
            <Label>Weight Fed (kg): *</Label>
            <Input
              type="number"
              value={weightFed}
              onChange={(e) => setWeightFed(parseFloat(e.target.value))}
            />
          </div>

          {/* Progress */}
          <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
            <p className="font-medium">Today's Progress:</p>
            <p>Meals: {meals} / 4 ({Math.round(progress.meals * 100)}%)</p>
            <p>Weight: {weightFed} / {dailyRecommended} kg ({Math.round(progress.weight * 100)}%)</p>
            <p>Remaining: {4 - meals} meals, {dailyRecommended - weightFed} kg</p>
          </div>

          {/* Warning */}
          {weightFed < dailyRecommended * 0.8 && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm">
              ⚠️ Warnings:
              <ul className="list-disc ml-4 mt-1">
                <li>Fed {Math.round(progress.weight * 100)}% of daily recommendation</li>
              </ul>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional):</Label>
            <Textarea placeholder="Cloudy weather, reduced appetite..." />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1 bg-[#088395] hover:bg-[#0A4D68]">
              Record Feeding
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Water Quality Modal Component
function WaterQualityModal({ open, onOpenChange, tank }: { open: boolean; onOpenChange: (open: boolean) => void; tank: any }) {
  const [temp, setTemp] = useState(28.5);
  const [doValue, setDoValue] = useState(4.2);
  const [phValue, setPhValue] = useState(7.8);
  const [totalAmmonia, setTotalAmmonia] = useState(0.15);
  const [nitrite, setNitrite] = useState(0.08);
  const [nitrate, setNitrate] = useState(20);

  // Optional parameters
  const [salinity, setSalinity] = useState('');
  const [alkalinity, setAlkalinity] = useState('');
  const [hardness, setHardness] = useState('');
  const [turbidity, setTurbidity] = useState('');
  const [co2, setCo2] = useState('');

  const getStatus = (param: string, value: number) => {
    if (param === 'temp') {
      if (value >= 26 && value <= 30) return { status: 'optimal', color: 'bg-green-100 text-green-800' };
      return { status: 'warning', color: 'bg-yellow-100 text-yellow-800' };
    }
    if (param === 'do') {
      if (value >= 5) return { status: 'optimal', color: 'bg-green-100 text-green-800' };
      if (value >= 4) return { status: 'acceptable', color: 'bg-yellow-100 text-yellow-800' };
      return { status: 'critical', color: 'bg-red-100 text-red-800' };
    }
    if (param === 'ph') {
      if (value >= 7 && value <= 8.5) return { status: 'optimal', color: 'bg-green-100 text-green-800' };
      return { status: 'warning', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { status: 'good', color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Water Quality - {tank?.name}</DialogTitle>
          <p className="text-sm text-gray-600">Last Reading: 4 hours ago</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Required Parameters */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-900">Required Measurements *</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="border-2 border-blue-200 rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">Temperature *</Label>
                <Input
                  type="number"
                  value={temp}
                  onChange={(e) => setTemp(parseFloat(e.target.value))}
                  step={0.1}
                />
                <p className="text-xs text-gray-600">°C</p>
                <div className={`text-xs px-2 py-1 rounded ${getStatus('temp', temp).color}`}>
                  {temp >= 26 && temp <= 30 ? '✅' : '🟡'} {getStatus('temp', temp).status.toUpperCase()}
                </div>
              </div>

              <div className="border-2 border-blue-200 rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">Dissolved Oxygen *</Label>
                <Input
                  type="number"
                  value={doValue}
                  onChange={(e) => setDoValue(parseFloat(e.target.value))}
                  step={0.1}
                />
                <p className="text-xs text-gray-600">mg/L</p>
                <div className={`text-xs px-2 py-1 rounded ${getStatus('do', doValue).color}`}>
                  {doValue >= 5 ? '✅' : doValue >= 4 ? '🟡' : '🔴'} {getStatus('do', doValue).status.toUpperCase()}
                </div>
              </div>

              <div className="border-2 border-blue-200 rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">pH *</Label>
                <Input
                  type="number"
                  value={phValue}
                  onChange={(e) => setPhValue(parseFloat(e.target.value))}
                  step={0.1}
                />
                <p className="text-xs text-gray-600">-</p>
                <div className={`text-xs px-2 py-1 rounded ${getStatus('ph', phValue).color}`}>
                  {phValue >= 7 && phValue <= 8.5 ? '✅' : '🟡'} {getStatus('ph', phValue).status.toUpperCase()}
                </div>
              </div>

              <div className="border-2 border-blue-200 rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">Total Ammonia (TAN) *</Label>
                <Input
                  type="number"
                  value={totalAmmonia}
                  onChange={(e) => setTotalAmmonia(parseFloat(e.target.value))}
                  step={0.01}
                />
                <p className="text-xs text-gray-600">mg/L</p>
                <div className={`text-xs px-2 py-1 rounded ${totalAmmonia < 0.5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {totalAmmonia < 0.5 ? '✅ SAFE' : '🔴 HIGH'}
                </div>
              </div>

              <div className="border-2 border-blue-200 rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">Nitrite (NO₂) *</Label>
                <Input
                  type="number"
                  value={nitrite}
                  onChange={(e) => setNitrite(parseFloat(e.target.value))}
                  step={0.01}
                />
                <p className="text-xs text-gray-600">mg/L</p>
                <div className={`text-xs px-2 py-1 rounded ${nitrite < 0.2 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {nitrite < 0.2 ? '✅ SAFE' : '🟡 ELEVATED'}
                </div>
              </div>

              <div className="border-2 border-blue-200 rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">Nitrate (NO₃) *</Label>
                <Input
                  type="number"
                  value={nitrate}
                  onChange={(e) => setNitrate(parseFloat(e.target.value))}
                  step={0.1}
                />
                <p className="text-xs text-gray-600">mg/L</p>
                <div className={`text-xs px-2 py-1 rounded ${nitrate < 50 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {nitrate < 50 ? '✅ SAFE' : '🟡 HIGH'}
                </div>
              </div>
            </div>

            <div className="mt-3 bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs">
              <p><strong>Note:</strong> Toxic Ammonia (NH₃), DO Saturation %, and CO₂ Content will be calculated automatically by the system based on temperature, pH, and TAN values.</p>
            </div>
          </div>

          {/* Optional Parameters */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-900">Optional Measurements</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="border rounded-lg p-3 space-y-2">
                <Label className="text-sm">Salinity</Label>
                <Input
                  type="number"
                  placeholder="Optional"
                  value={salinity}
                  onChange={(e) => setSalinity(e.target.value)}
                  step={0.1}
                />
                <p className="text-xs text-gray-600">ppt</p>
              </div>

              <div className="border rounded-lg p-3 space-y-2">
                <Label className="text-sm">Alkalinity</Label>
                <Input
                  type="number"
                  placeholder="Optional"
                  value={alkalinity}
                  onChange={(e) => setAlkalinity(e.target.value)}
                  step={1}
                />
                <p className="text-xs text-gray-600">mg/L CaCO₃</p>
              </div>

              <div className="border rounded-lg p-3 space-y-2">
                <Label className="text-sm">Hardness</Label>
                <Input
                  type="number"
                  placeholder="Optional"
                  value={hardness}
                  onChange={(e) => setHardness(e.target.value)}
                  step={1}
                />
                <p className="text-xs text-gray-600">mg/L CaCO₃</p>
              </div>

              <div className="border rounded-lg p-3 space-y-2">
                <Label className="text-sm">Turbidity</Label>
                <Input
                  type="number"
                  placeholder="Optional"
                  value={turbidity}
                  onChange={(e) => setTurbidity(e.target.value)}
                  step={0.1}
                />
                <p className="text-xs text-gray-600">NTU</p>
              </div>

              <div className="border rounded-lg p-3 space-y-2">
                <Label className="text-sm">CO₂ (Direct)</Label>
                <Input
                  type="number"
                  placeholder="Optional"
                  value={co2}
                  onChange={(e) => setCo2(e.target.value)}
                  step={0.1}
                />
                <p className="text-xs text-gray-600">mg/L</p>
              </div>
            </div>
          </div>

          {/* Overall Status */}
          <div className="bg-gray-50 p-4 rounded-lg border-2">
            <p className="font-semibold mb-2">Overall Assessment:
              <span className={doValue < 5 || totalAmmonia > 0.5 ? ' text-yellow-600' : ' text-green-600'}>
                {doValue < 5 || totalAmmonia > 0.5 ? ' 🟡 WARNING' : ' 🟢 OPTIMAL'}
              </span>
            </p>
            {doValue < 5 && <p className="text-sm text-gray-700">• DO below optimal level</p>}
            {totalAmmonia > 0.5 && <p className="text-sm text-gray-700">• Total Ammonia elevated</p>}
            {nitrite > 0.2 && <p className="text-sm text-gray-700">• Nitrite levels elevated</p>}
          </div>

          {/* Recommendations */}
          {(doValue < 5 || totalAmmonia > 0.5) && (
            <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-lg">
              <p className="font-semibold mb-2 text-amber-900">⚠️ Actions Recommended:</p>
              <ul className="list-disc ml-5 space-y-1 text-sm text-amber-900">
                {doValue < 5 && (
                  <>
                    <li>Increase aeration immediately</li>
                    <li>Reduce feeding by 20-30%</li>
                  </>
                )}
                {totalAmmonia > 0.5 && (
                  <>
                    <li>Perform 30% water exchange</li>
                    <li>Check biofilter functionality</li>
                    <li>Reduce stocking density if needed</li>
                  </>
                )}
              </ul>
            </div>
          )}

          {/* Action Notes */}
          <div>
            <Label>Action Notes (optional)</Label>
            <Textarea
              placeholder="Did you take any corrective action? Enter details here..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1 bg-[#088395] hover:bg-[#0A4D68]">
              💾 Save Water Quality Reading
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}