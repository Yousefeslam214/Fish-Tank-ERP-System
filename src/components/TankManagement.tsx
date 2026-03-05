import { useState, useEffect, useCallback } from 'react';
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
  AlertTriangle,
  Plus,
  ArrowLeft,
  Thermometer,
  Activity,
  TrendingUp,
  Scale,
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
  overallStatus?: string;      // API uses 'overallStatus', not 'overall'
  temperature?: number;
  dissolvedOxygen?: number;
  ph?: number;
  ammonia?: number;
}
interface ApiTankFeeding {
  currentMeal?: number;       // meals completed so far today
  totalMeals?: number;
  weightFed?: number;         // kg fed today
  targetWeight?: number;      // recommended kg for today
  percentage?: number;
}
interface ApiTank {
  id: string;
  name: string;
  farmId?: string;
  status?: string;
  fishType?: string;          // API raw field
  species?: string;           // normalised from fishType
  biomass?: ApiTankBiomass | number;  // object from API, number after normalise
  capacity?: number;          // set from biomass.capacity during normalise
  volume?: number;            // defaulted to 50 during normalise
  waterQuality?: ApiTankWaterQuality | {
    overall?: string;
    temp?: { value: number; status: string };
    do?: { value: number; status: string };
    ph?: { value: number; status: string };
    nh3?: { value: number; status: string };
  };
  feeding?: ApiTankFeeding | {
    todayMeals?: number;
    totalMeals?: number;
    todayFed?: number;
    recommended?: number;
  };
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
      const res = await apiGet<{ success: boolean; data: ApiTank[] } | ApiTank[]>('/tanks');
      const list: ApiTank[] = Array.isArray(res)
        ? res
        : ((res as { success: boolean; data: ApiTank[] }).data ?? []);

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
          waterQuality: {
            overall: (wq?.overallStatus ?? 'unknown').toLowerCase(),
            temp: { value: parseFloat((wq?.temperature ?? 0).toFixed(1)), status: 'unknown' },
            do: { value: parseFloat((wq?.dissolvedOxygen ?? 0).toFixed(2)), status: 'unknown' },
            ph: { value: parseFloat((wq?.ph ?? 0).toFixed(2)), status: 'unknown' },
            nh3: { value: parseFloat((wq?.ammonia ?? 0).toFixed(4)), status: 'unknown' },
          },
          feeding: {
            todayMeals: fd?.currentMeal ?? 0,
            totalMeals: fd?.totalMeals ?? 4,
            todayFed: fd?.weightFed ?? 0,
            recommended: fd?.targetWeight ?? 0,
          },
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
    switch (status) {
      case 'critical': return 'bg-[#EF4444]';
      case 'warning': return 'bg-[#F59E0B]';
      case 'acceptable': return 'bg-[#3B82F6]';
      case 'optimal': return 'bg-[#10B981]';
      case 'active': return 'bg-[#10B981]';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      case 'acceptable': return '🔵';
      case 'optimal': return '🟢';
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
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Water Quality</span>
                      <span className="text-xs">{getStatusIcon((tank.waterQuality as any)?.overall ?? 'unknown')} {(tank.waterQuality as any)?.overall ?? '–'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Temp:</span>
                        <span className="ml-1 font-medium">{(tank.waterQuality as any)?.temp?.value ?? '–'}°C</span>
                      </div>
                      <div>
                        <span className="text-gray-600">DO:</span>
                        <span className="ml-1 font-medium">{(tank.waterQuality as any)?.do?.value ?? '–'} mg/L</span>
                      </div>
                      <div>
                        <span className="text-gray-600">pH:</span>
                        <span className="ml-1 font-medium">{(tank.waterQuality as any)?.ph?.value ?? '–'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">NH₃:</span>
                        <span className="ml-1 font-medium">{(tank.waterQuality as any)?.nh3?.value ?? '–'} mg/L</span>
                      </div>
                    </div>
                  </div>

                  {/* Feeding */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Today's Feeding</span>
                      <span className="text-xs">{(tank.feeding as any)?.todayMeals ?? 0}/{(tank.feeding as any)?.totalMeals ?? 4} meals</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Fed: {(tank.feeding as any)?.todayFed ?? 0} / {(tank.feeding as any)?.recommended ?? 0} kg</span>
                      {(tank.feeding as any)?.recommended > 0 && (
                        <span className={`font-medium ${(tank.feeding as any).todayFed < (tank.feeding as any).recommended
                          ? 'text-yellow-600'
                          : 'text-green-600'
                          }`}>
                          {Math.round(((tank.feeding as any).todayFed / (tank.feeding as any).recommended) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
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

  // Mock historical data
  const waterQualityHistory = [
    { date: 'Feb 1', temp: 27.5, do: 5.8, ph: 7.6, nh3: 0.03 },
    { date: 'Feb 5', temp: 28, do: 5.5, ph: 7.7, nh3: 0.04 },
    { date: 'Feb 9', temp: 28.5, do: 4.8, ph: 7.8, nh3: 0.06 },
    { date: 'Feb 13', temp: 28, do: 4.2, ph: 7.8, nh3: 0.08 },
  ];

  // Detailed water quality records
  const waterQualityRecords = [
    {
      id: 1,
      measuredAt: '2026-02-13 14:30',
      temp: 28,
      do: 4.2,
      ph: 7.8,
      nh3: 0.08,
      no2: 0.06,
      no3: 18,
      status: 'warning',
      measuredBy: 'Ahmed Mohamed',
      notes: 'DO levels dropping, increased aeration'
    },
    {
      id: 2,
      measuredAt: '2026-02-09 09:15',
      temp: 28.5,
      do: 4.8,
      ph: 7.8,
      nh3: 0.06,
      no2: 0.05,
      no3: 16,
      status: 'acceptable',
      measuredBy: 'Fatima Hassan',
      notes: ''
    },
    {
      id: 3,
      measuredAt: '2026-02-05 16:45',
      temp: 28,
      do: 5.5,
      ph: 7.7,
      nh3: 0.04,
      no2: 0.03,
      no3: 14,
      status: 'optimal',
      measuredBy: 'Ahmed Mohamed',
      notes: 'All parameters optimal'
    },
    {
      id: 4,
      measuredAt: '2026-02-01 11:20',
      temp: 27.5,
      do: 5.8,
      ph: 7.6,
      nh3: 0.03,
      no2: 0.02,
      no3: 12,
      status: 'optimal',
      measuredBy: 'Omar Ibrahim',
      notes: ''
    },
  ];

  const feedingHistory = [
    { time: '08:30', meal: 1, fed: 22, recommended: 22.5, status: 'on-target' },
    { time: '13:00', meal: 2, fed: 18, recommended: 22.5, status: 'below' },
    { time: '17:30', meal: 3, fed: 25, recommended: 22.5, status: 'on-target' },
  ];

  // Detailed feeding records
  const feedingRecords = [
    {
      id: 1,
      date: '2026-02-13',
      time: '17:30',
      meal: 3,
      fed: 25,
      recommended: 22.5,
      foodType: 'Grower 30% 3mm Floating',
      status: 'on-target',
      fedBy: 'Ahmed Mohamed',
      notes: ''
    },
    {
      id: 2,
      date: '2026-02-13',
      time: '13:00',
      meal: 2,
      fed: 18,
      recommended: 22.5,
      foodType: 'Grower 30% 3mm Floating',
      status: 'below',
      fedBy: 'Fatima Hassan',
      notes: 'Fish showing reduced appetite'
    },
    {
      id: 3,
      date: '2026-02-13',
      time: '08:30',
      meal: 1,
      fed: 22,
      recommended: 22.5,
      foodType: 'Grower 30% 3mm Floating',
      status: 'on-target',
      fedBy: 'Ahmed Mohamed',
      notes: ''
    },
    {
      id: 4,
      date: '2026-02-12',
      time: '17:30',
      meal: 4,
      fed: 23,
      recommended: 22.5,
      foodType: 'Grower 30% 3mm Floating',
      status: 'on-target',
      fedBy: 'Omar Ibrahim',
      notes: ''
    },
    {
      id: 5,
      date: '2026-02-12',
      time: '13:00',
      meal: 3,
      fed: 22,
      recommended: 22.5,
      foodType: 'Grower 30% 3mm Floating',
      status: 'on-target',
      fedBy: 'Ahmed Mohamed',
      notes: ''
    },
    {
      id: 6,
      date: '2026-02-12',
      time: '08:30',
      meal: 2,
      fed: 24,
      recommended: 22.5,
      foodType: 'Grower 30% 3mm Floating',
      status: 'on-target',
      fedBy: 'Fatima Hassan',
      notes: ''
    },
  ];

  const growthData = [
    { week: 'Week 1', weight: 180 },
    { week: 'Week 2', weight: 200 },
    { week: 'Week 3', weight: 220 },
    { week: 'Week 4', weight: 235 },
    { week: 'Week 5', weight: 250 },
  ];

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
            <Badge className={`${tank.status === 'critical' ? 'bg-[#EF4444]' : tank.status === 'warning' ? 'bg-[#F59E0B]' : 'bg-[#10B981]'} text-white text-sm px-3 py-1`}>
              {tank.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6">
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
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Fish</p>
                      <p className="text-2xl font-bold">{tank.batches.reduce((sum: number, b: any) => sum + b.count, 0)}</p>
                      <p className="text-xs text-gray-500 mt-1">{tank.batches.length} batches</p>
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
                      <p className="text-2xl font-bold capitalize">{tank.waterQuality.overall}</p>
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
                      <p className="text-2xl font-bold">{tank.feeding.todayFed} kg</p>
                      <p className="text-xs text-gray-500 mt-1">{tank.feeding.todayMeals}/{tank.feeding.totalMeals} meals</p>
                    </div>
                    <Activity className="w-8 h-8 text-[#0A4D68] opacity-20" />
                  </div>
                </CardContent>
              </Card>
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
                      <span className="font-medium">{tank.biomass} / {tank.capacity} kg</span>
                    </div>
                    <Progress value={(tank.biomass / tank.capacity) * 100} className="h-3" />
                    <p className="text-xs text-gray-600 mt-1">{Math.round((tank.biomass / tank.capacity) * 100)}% capacity used</p>
                  </div>
                  {tank.biomass > tank.capacity && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">⚠️ Overstocked by {Math.round(((tank.biomass - tank.capacity) / tank.capacity) * 100)}%</span>
                      </div>
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    <p>Volume: {tank.volume}m³</p>
                    <p>Stocking Density: {Math.round((tank.biomass / tank.volume))} kg/m³</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Batch Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tank.batches.map((batch: any) => (
                      <div key={batch.id} className="border-l-4 border-[#0A4D68] pl-3 py-2 bg-gray-50 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm">Batch {batch.id}</span>
                          <Badge className="bg-[#10B981] text-white text-xs">{batch.status}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                          <div>
                            <span className="block">Count:</span>
                            <span className="font-medium text-gray-900">{batch.count}</span>
                          </div>
                          <div>
                            <span className="block">Avg Weight:</span>
                            <span className="font-medium text-gray-900">{batch.avgWeight}g</span>
                          </div>
                          <div>
                            <span className="block">Age:</span>
                            <span className="font-medium text-gray-900">{batch.age}d</span>
                          </div>
                        </div>
                      </div>
                    ))}
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
                    <p className="text-xs text-gray-500 mt-3">Last measured: 2 hours ago</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Today's Feeding Progress</CardTitle>
                </CardHeader>
                <CardContent>
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
                    <Progress value={(tank.feeding.todayFed / tank.feeding.recommended) * 100} className="h-2" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Achievement</span>
                      <span className={`font-medium ${tank.feeding.todayFed < tank.feeding.recommended ? 'text-yellow-600' : 'text-green-600'}`}>
                        {Math.round((tank.feeding.todayFed / tank.feeding.recommended) * 100)}%
                      </span>
                    </div>
                  </div>
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
                  const totalRequired = tank.batches.reduce((sum: number, b: any) => sum + (b.dailyFeedKg || 0), 0);
                  const fedToday = Math.round(totalRequired * 0.72);
                  const remaining = totalRequired - fedToday;
                  const uniqueFeedTypes = [...new Set(tank.batches.map((b: any) => b.feedType?.split(' ')[1] || '30%'))];

                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-xs text-gray-600 mb-1">Total Daily Required</p>
                          <p className="text-2xl font-bold text-gray-900">{totalRequired} kg</p>
                          <p className="text-xs text-gray-500 mt-1">{tank.batches.length} batches combined</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-xs text-gray-600 mb-1">Fed Today</p>
                          <p className="text-2xl font-bold text-blue-600">{fedToday} kg</p>
                          <p className="text-xs text-gray-500 mt-1">{Math.round((fedToday / totalRequired) * 100)}% of requirement</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-xs text-gray-600 mb-1">Remaining Today</p>
                          <p className="text-2xl font-bold text-orange-600">{remaining} kg</p>
                          <p className="text-xs text-gray-500 mt-1">1 meal left</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-xs text-gray-600 mb-1">Feed Types Used</p>
                          <p className="text-lg font-bold text-gray-900">{uniqueFeedTypes.length} types</p>
                          <p className="text-xs text-gray-500 mt-1">{uniqueFeedTypes.join(', ')}</p>
                        </div>
                      </div>
                      <div className="mt-4 bg-white p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Overall Feeding Progress</span>
                          <span className="text-sm text-gray-600">3/4 meals completed</span>
                        </div>
                        <Progress value={(fedToday / totalRequired) * 100} className="h-2" />
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Individual Batch Details */}
            <div className="grid grid-cols-1 gap-4">
              {tank.batches.map((batch: any) => (
                <Card key={batch.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Batch {batch.id}</CardTitle>
                        <p className="text-sm text-gray-600">{batch.species}</p>
                      </div>
                      <Badge className="bg-[#10B981] text-white">{batch.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Initial Count</p>
                        <p className="text-lg font-semibold">1,200 fish</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Current Count</p>
                        <p className="text-lg font-semibold">{batch.count} fish</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Initial Weight</p>
                        <p className="text-lg font-semibold">100g</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Current Avg Weight</p>
                        <p className="text-lg font-semibold">{batch.avgWeight}g</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-[#E0F4F5] p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Age (Days in Culture)</p>
                        <p className="text-lg font-semibold">{batch.age} days</p>
                      </div>
                      <div className="bg-[#E0F4F5] p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Current Biomass</p>
                        <p className="text-lg font-semibold">{Math.round(batch.count * batch.avgWeight / 1000)}kg</p>
                      </div>
                      <div className="bg-[#E0F4F5] p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Survival Rate</p>
                        <p className="text-lg font-semibold text-green-600">92%</p>
                      </div>
                      <div className="bg-[#E0F4F5] p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Current SGR</p>
                        <p className="text-lg font-semibold">2.1%/day</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <p className="text-xs text-gray-600 mb-1">Total Feed Consumed</p>
                        <p className="text-lg font-semibold">450 kg</p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <p className="text-xs text-gray-600 mb-1">Current FCR</p>
                        <p className="text-lg font-semibold">1.52</p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <p className="text-xs text-gray-600 mb-1">Feed Cost</p>
                        <p className="text-lg font-semibold">6,750 EGP</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-xs text-gray-600 mb-1">Cost Basis (Fish Purchase)</p>
                        <p className="text-lg font-semibold">12,000 EGP</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-xs text-gray-600 mb-1">Stocked Date</p>
                        <p className="text-lg font-semibold">Dec 28, 2025</p>
                      </div>
                    </div>

                    <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Last Sampled</p>
                      <p className="text-sm font-medium">Feb 12, 2026 (30 fish sampled)</p>
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
                          <p className="font-semibold text-sm mb-1">{batch.feedType || 'Grower 30% 3mm Floating'}</p>
                          <p className="text-xs text-gray-600">Optimal for current weight range ({batch.avgWeight - 50}-{batch.avgWeight + 50}g)</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-2">Daily Feeding Amount</p>
                          <p className="font-semibold text-sm mb-1">{batch.dailyFeedKg || 45} kg/day (2.5% body weight)</p>
                          <p className="text-xs text-gray-600">Distributed over 4 meals</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="text-gray-600">Today's Fed:</span>
                          <span className="ml-1 font-medium">{Math.round((batch.dailyFeedKg || 45) * 0.72)} kg</span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="text-gray-600">This Week:</span>
                          <span className="ml-1 font-medium">{Math.round((batch.dailyFeedKg || 45) * 7)} kg</span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="text-gray-600">Last FCR:</span>
                          <span className="ml-1 font-medium">1.52</span>
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
              ))}
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
                {waterQualityRecords.map((record) => {
                  const getStatusColor = (status: string) => {
                    switch (status) {
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
                                {record.measuredAt}
                              </span>
                              <Badge className={getStatusColor(record.status)}>
                                {record.status === 'optimal' && '🟢'}
                                {record.status === 'acceptable' && '🔵'}
                                {record.status === 'warning' && '🟡'}
                                {record.status === 'critical' && '🔴'}
                                {' '}{record.status.toUpperCase()}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-gray-600">Temperature</p>
                                <p className="font-semibold">{record.temp}°C</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">DO</p>
                                <p className="font-semibold">{record.do} mg/L</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">pH</p>
                                <p className="font-semibold">{record.ph}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">NH₃</p>
                                <p className="font-semibold">{record.nh3} mg/L</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">NO₂</p>
                                <p className="font-semibold">{record.no2} mg/L</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">NO₃</p>
                                <p className="font-semibold">{record.no3} mg/L</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <span>Measured by: <span className="font-medium text-gray-900">{record.measuredBy}</span></span>
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
                })}
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
                {feedingRecords.map((record) => {
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'on-target': return 'bg-[#10B981] text-white';
                      case 'below': return 'bg-[#F59E0B] text-white';
                      case 'above': return 'bg-[#3B82F6] text-white';
                      default: return 'bg-gray-500 text-white';
                    }
                  };

                  const percentage = Math.round((record.fed / record.recommended) * 100);

                  return (
                    <Card key={record.id} className="bg-white shadow-sm border-l-4 border-l-[#10B981]">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Fish className="w-5 h-5 text-[#10B981]" />
                              <span className="font-semibold text-gray-900">
                                {record.date} at {record.time}
                              </span>
                              <Badge variant="outline">
                                Meal #{record.meal}
                              </Badge>
                              <Badge className={getStatusColor(record.status)}>
                                {record.status === 'on-target' && '✅'}
                                {record.status === 'below' && '⚠️'}
                                {' '}{record.status === 'on-target' ? 'ON TARGET' : record.status.toUpperCase()}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-gray-600">Amount Fed</p>
                                <p className="font-semibold">{record.fed} kg</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Recommended</p>
                                <p className="font-semibold">{record.recommended} kg</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Achievement</p>
                                <p className={`font-semibold ${percentage >= 90 && percentage <= 110 ? 'text-green-600' : 'text-yellow-600'}`}>
                                  {percentage}%
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Difference</p>
                                <p className={`font-semibold ${record.fed >= record.recommended ? 'text-blue-600' : 'text-orange-600'}`}>
                                  {record.fed >= record.recommended ? '+' : ''}{(record.fed - record.recommended).toFixed(1)} kg
                                </p>
                              </div>
                            </div>

                            <div className="bg-gray-50 p-2 rounded text-xs mb-2">
                              <span className="text-gray-600">Food Type:</span>{' '}
                              <span className="font-medium text-gray-900">{record.foodType}</span>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <span>Fed by: <span className="font-medium text-gray-900">{record.fedBy}</span></span>
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
                })}
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
                    {tank.batches.map((batch: any) => (
                      <Button
                        key={batch.id}
                        variant="outline"
                        className="bg-white"
                      >
                        Batch {batch.id}
                        <Badge className="ml-2 bg-[#0A4D68] text-white">{batch.count} fish</Badge>
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
            <GrowthHistory
              batch={{
                id: 'batch-001',
                batchNumber: tank.batches[0]?.id || '#123',
                tankName: tank.name,
                fishType: tank.species,
                stockedDate: new Date('2025-12-28'),
                initialCount: 1000,
                currentCount: tank.batches[0]?.count || 920,
                initialWeight: 100
              }}
              measurements={mockGrowthMeasurements.filter(m => m.tankId === tank.id)}
              language="en"
              onMeasurementAdded={() => {
                console.log('New growth measurement added');
              }}
            />
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
                      <Badge className="bg-green-600 text-white">Healthy</Badge>
                    </div>
                    <p className="text-2xl font-bold text-green-700">95%</p>
                    <p className="text-xs text-gray-600 mt-1">No active issues</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Mortality Rate</span>
                      <Badge className="bg-blue-600 text-white">Normal</Badge>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">2.1%</p>
                    <p className="text-xs text-gray-600 mt-1">Last 30 days</p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Last Inspection</span>
                      <Badge className="bg-yellow-600 text-white">Recent</Badge>
                    </div>
                    <p className="text-lg font-bold text-yellow-700">2 days ago</p>
                    <p className="text-xs text-gray-600 mt-1">Feb 11, 2026</p>
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
                <div className="bg-[#E0F4F5] p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">🎯 Target Weight:</span>
                    <span className="font-bold">500g</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">📅 Predicted Harvest:</span>
                    <span className="font-bold">March 15, 2026 (28 days)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Predictions:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Final Weight:</span>
                      <span className="font-medium">485g ±10%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Production:</span>
                      <span className="font-medium">460 kg (920 fish)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Survival Rate:</span>
                      <span className="font-medium">92%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Feed Needed:</span>
                      <span className="font-medium">224 kg</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Economics:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Revenue:</span>
                      <span className="font-medium">20,700 EGP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining Cost:</span>
                      <span className="font-medium">3,188 EGP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Predicted Profit:</span>
                      <span className="font-medium text-green-600">2,512 EGP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Margin:</span>
                      <span className="font-medium">12.1%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <p className="text-sm font-medium text-green-800">✅ MODERATE_PROFIT</p>
                  <p className="text-xs text-green-700 mt-1">"Continue current practices. Monitor SGR weekly."</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mt-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">ℹ️ Feed Stock Information</p>
                  <p className="text-sm text-blue-800">
                    Farm-wide feed consumption forecast has been moved to the main Tank Management page for better visibility across all tanks.
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