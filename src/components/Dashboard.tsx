import { useState } from 'react';
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
  TrendingDown,
  AlertCircle,
  Clock,
  Calendar
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { User, Farm } from '../types';
import { mockFarms } from '../mockData';

interface DashboardProps {
  user: User;
  onFarmSelect: (farm: Farm) => void;
  selectedFarm: Farm | null;
}

export default function Dashboard({ user, onFarmSelect, selectedFarm }: DashboardProps) {
  const [currentFarm, setCurrentFarm] = useState<Farm>(selectedFarm || mockFarms[0]);

  const handleFarmChange = (farmId: string) => {
    const farm = mockFarms.find(f => f.id === farmId);
    if (farm) {
      setCurrentFarm(farm);
      onFarmSelect(farm);
    }
  };

  // Mock data for KPIs
  const kpiData = {
    totalFish: 125000,
    fishTrend: 2.5,
    totalBiomass: 5420,
    biomassCapacity: 6000,
    feedStock: 2850,
    feedDaysRemaining: 28,
    predictedRevenue: 285000,
    harvestDate: 'Mar 15, 2026'
  };

  // Water quality alerts
  const waterQualityAlerts = [
    { tank: 'Tank A-03', status: 'critical', parameter: 'DO', value: '2.8 mg/L' },
    { tank: 'Tank B-12', status: 'warning', parameter: 'NH₃', value: '0.08 mg/L' },
    { tank: 'Tank C-05', status: 'optimal', parameter: 'All parameters', value: 'optimal' },
  ];

  // Feeding status
  const feedingStatus = {
    tanksAssigned: 15,
    tanksFed: 12,
    nextFeedingTime: '14:30',
    hoursUntilNext: 2,
    behindSchedule: 3
  };

  // Upcoming harvests
  const upcomingHarvests = [
    { 
      tankName: 'Tank A-05', 
      estimatedWeight: 250,
      batches: [
        {
          fishType: 'Nile Tilapia',
          daysToHarvest: 12
        }
      ]
    },
    { 
      tankName: 'Tank B-03', 
      estimatedWeight: 380,
      batches: [
        {
          fishType: 'Nile Tilapia',
          daysToHarvest: 28
        },
        {
          fishType: 'Catfish',
          daysToHarvest: 35
        }
      ]
    },
    { 
      tankName: 'Tank C-01', 
      estimatedWeight: 420,
      batches: [
        {
          fishType: 'Nile Tilapia',
          daysToHarvest: 45
        }
      ]
    },
  ];

  // Growth trends data (last 30 days)
  const growthData = [
    { date: 'Feb 1', weight: 220, sgr: 2.4, fcr: 1.45 },
    { date: 'Feb 5', weight: 230, sgr: 2.5, fcr: 1.42 },
    { date: 'Feb 9', weight: 238, sgr: 2.6, fcr: 1.40 },
    { date: 'Feb 13', weight: 245, sgr: 2.5, fcr: 1.38 },
    { date: 'Feb 17', weight: 252, sgr: 2.4, fcr: 1.36 },
    { date: 'Feb 21', weight: 260, sgr: 2.6, fcr: 1.35 },
    { date: 'Feb 25', weight: 268, sgr: 2.5, fcr: 1.33 },
    { date: 'Mar 1', weight: 275, sgr: 2.5, fcr: 1.32 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-[#EF4444] text-white';
      case 'warning': return 'bg-[#F59E0B] text-white';
      case 'optimal': return 'bg-[#10B981] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      case 'optimal': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Top Navigation Bar */}
      <div className="bg-[#0A4D68] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Fish className="w-6 h-6" />
              <span className="text-xl font-semibold">Fish Farm 360</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={currentFarm.id} onValueChange={handleFarmChange}>
              <SelectTrigger className="w-64 bg-white text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockFarms.map(farm => (
                  <SelectItem key={farm.id} value={farm.id}>
                    {farm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
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
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user.name}</p>
        </div>

        {/* Top Row - KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Active Fish */}
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Active Fish</p>
                  <p className="text-3xl font-bold text-gray-900">{kpiData.totalFish.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">Across 15 tanks</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">+{kpiData.fishTrend}% vs last week</span>
                  </div>
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
                  <p className="text-3xl font-bold text-gray-900">{kpiData.totalBiomass.toLocaleString()} kg</p>
                  <p className="text-sm text-gray-500 mt-1">Current farm biomass</p>
                  <div className="mt-2">
                    <Progress value={(kpiData.totalBiomass / kpiData.biomassCapacity) * 100} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">{Math.round((kpiData.totalBiomass / kpiData.biomassCapacity) * 100)}% of capacity</p>
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
                  <p className="text-3xl font-bold text-gray-900">{kpiData.feedStock.toLocaleString()} kg</p>
                  <p className="text-sm text-gray-500 mt-1">{kpiData.feedDaysRemaining} days remaining</p>
                  {kpiData.feedDaysRemaining < 14 && (
                    <Badge className="mt-2 bg-[#F59E0B]">Low Stock</Badge>
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
                  <p className="text-3xl font-bold text-gray-900">{kpiData.predictedRevenue.toLocaleString()} EGP</p>
                  <p className="text-sm text-gray-500 mt-1">At next harvest</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{kpiData.harvestDate}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#ECFDF5] flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-[#10B981]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row - Alert Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Water Quality Alerts */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Water Quality Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {waterQualityAlerts.map((alert, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getStatusIcon(alert.status)}</span>
                      <div>
                        <p className="font-medium text-sm">{alert.tank}</p>
                        <p className="text-xs text-gray-600">{alert.parameter}: {alert.value}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(alert.status) + ' text-xs'}>
                      {alert.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-2">View All</Button>
              </div>
            </CardContent>
          </Card>

          {/* Feeding Status */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Feeding Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="relative inline-block">
                    <svg className="w-32 h-32">
                      <circle cx="64" cy="64" r="56" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                      <circle 
                        cx="64" 
                        cy="64" 
                        r="56" 
                        fill="none" 
                        stroke="#088395" 
                        strokeWidth="8"
                        strokeDasharray={`${(feedingStatus.tanksFed / feedingStatus.tanksAssigned) * 352} 352`}
                        strokeLinecap="round"
                        transform="rotate(-90 64 64)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-2xl font-bold text-gray-900">{feedingStatus.tanksFed}/{feedingStatus.tanksAssigned}</p>
                      <p className="text-xs text-gray-600">tanks fed</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Next feeding</span>
                    <span className="font-medium">{feedingStatus.nextFeedingTime} ({feedingStatus.hoursUntilNext}h)</span>
                  </div>
                  {feedingStatus.behindSchedule > 0 && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                      <AlertCircle className="w-4 h-4" />
                      <span>{feedingStatus.behindSchedule} tanks behind schedule</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Harvests */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Harvests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingHarvests.map((harvest, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{harvest.tankName}</p>
                        <p className="text-xs text-gray-600">{harvest.estimatedWeight}kg estimated</p>
                      </div>
                      <Badge className="bg-[#088395] text-white">
                        {harvest.batches.length} batch{harvest.batches.length > 1 ? 'es' : ''}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {harvest.batches.map((batch, bIdx) => (
                        <div key={bIdx} className="flex items-center justify-between bg-white p-2 rounded text-xs border">
                          <div className="flex items-center gap-2">
                            <Fish className="w-3 h-3 text-[#088395]" />
                            <span className="font-medium">{batch.fishType}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#088395]">
                            <Clock className="w-3 h-3" />
                            <span className="font-bold">{batch.daysToHarvest}d</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>


      </div>
    </div>
  );
}