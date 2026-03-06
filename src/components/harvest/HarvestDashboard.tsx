import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Fish, 
  TrendingUp, 
  Target,
  Calendar,
  DollarSign,
  Activity,
  Award,
  AlertCircle,
  ArrowRight,
  Search,
  Filter
} from 'lucide-react';

interface HarvestDashboardProps {
  farmId: string;
  onStartHarvest: () => void;
  onViewHistory: () => void;
  onViewTankPerformance: (tankId: string) => void;
}

export const HarvestDashboard: React.FC<HarvestDashboardProps> = ({
  farmId,
  onStartHarvest,
  onViewHistory,
  onViewTankPerformance
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - في التطبيق الحقيقي سيتم جلبه من context
  const kpis = {
    activeHarvests: 3,
    thisMonthHarvested: 2450,
    thisMonthRevenue: 110250,
    avgFCR: 1.65,
    readyToHarvest: 5,
    avgSurvivalRate: 92.5,
    nextRecommended: {
      tankId: 'tank-a03',
      tankName: 'A-03',
      daysUntil: 5
    }
  };

  const activeHarvests = [
    {
      id: 'hrv-1',
      tankId: 'tank-a03',
      tankName: 'A-03',
      batchNumber: '#123',
      type: 'FULL',
      started: '2hr ago',
      fishCount: 850,
      avgWeight: 420,
      estimatedWeight: 357,
      gradedWeight: 232,
      progress: 65,
      status: 'GRADING'
    },
    {
      id: 'hrv-2',
      tankId: 'tank-b05',
      tankName: 'B-05',
      batchNumber: '#145',
      type: 'PARTIAL',
      started: '45min ago',
      fishCount: 1200,
      percentage: 50,
      avgWeight: 380,
      estimatedWeight: 228,
      gradedWeight: 80,
      progress: 35,
      status: 'DRAFT'
    },
    {
      id: 'hrv-3',
      tankId: 'tank-c02',
      tankName: 'C-02',
      batchNumber: '#178',
      type: 'SELECTIVE',
      started: '3hr ago',
      minWeight: 450,
      estimatedWeight: 145,
      gradedWeight: 123,
      progress: 85,
      status: 'GRADING'
    }
  ];

  const completedHarvests = [
    {
      id: 'hrv-c1',
      tankName: 'A-01',
      date: 'Feb 28',
      type: 'FULL',
      weight: 485,
      revenue: 21825,
      fcr: 1.62,
      status: '✅'
    },
    {
      id: 'hrv-c2',
      tankName: 'B-03',
      date: 'Feb 26',
      type: 'FULL',
      weight: 520,
      revenue: 23400,
      fcr: 1.58,
      status: '✅'
    },
    {
      id: 'hrv-c3',
      tankName: 'C-05',
      date: 'Feb 25',
      type: 'PARTIAL',
      weight: 240,
      revenue: 10800,
      fcr: 1.71,
      status: '⚠️'
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'FULL': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'PARTIAL': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'SELECTIVE': return 'bg-pink-100 text-pink-700 border-pink-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'FULL': return '🟣';
      case 'PARTIAL': return '🟠';
      case 'SELECTIVE': return '🩷';
      default: return '📦';
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Harvests</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-[#0A4D68]">{kpis.activeHarvests}</p>
                  <span className="text-sm text-blue-600">🔵 In Progress</span>
                </div>
              </div>
              <Activity className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">This Month Harvested</p>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-[#0A4D68]">{kpis.thisMonthHarvested} kg</p>
                  <p className="text-sm text-gray-600">
                    Value: <span className="font-semibold text-green-600">{kpis.thisMonthRevenue.toLocaleString()} EGP</span>
                  </p>
                </div>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg FCR (Last 3)</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-[#0A4D68]">{kpis.avgFCR}</p>
                  <span className="text-sm text-green-600">⭐ Excellent</span>
                </div>
              </div>
              <Target className="w-10 h-10 text-[#0A4D68] opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ready to Harvest</p>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-green-600">🟢 {kpis.readyToHarvest} Tanks</p>
                  <p className="text-sm text-gray-600">&gt;400g avg</p>
                </div>
                <Button variant="link" className="px-0 h-auto text-[#0A4D68]" size="sm">
                  View List →
                </Button>
              </div>
              <Fish className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Survival Rate</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-[#0A4D68]">{kpis.avgSurvivalRate}%</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">Last 10 harvests</p>
              </div>
              <Award className="w-10 h-10 text-[#0A4D68] opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Next Recommended</p>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-[#0A4D68]">{kpis.nextRecommended.tankName}</p>
                  <p className="text-sm text-gray-600">In {kpis.nextRecommended.daysUntil} days</p>
                </div>
                <Button variant="link" className="px-0 h-auto text-[#0A4D68]" size="sm">
                  Predict →
                </Button>
              </div>
              <Calendar className="w-10 h-10 text-[#0A4D68] opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Harvests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Harvests</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeHarvests.map((harvest) => (
              <div key={harvest.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => onViewTankPerformance(harvest.tankId)}
                      className="text-lg font-bold text-[#0A4D68] hover:underline"
                    >
                      {harvest.tankName}
                    </button>
                    <span className="text-gray-600">{harvest.batchNumber}</span>
                    <Badge className={`${getTypeColor(harvest.type)} border`}>
                      {getTypeIcon(harvest.type)} {harvest.type}
                    </Badge>
                    <span className="text-sm text-gray-500">{harvest.started}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={harvest.status === 'GRADING' ? 'default' : 'secondary'}>
                      {harvest.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      Continue →
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  {harvest.type === 'FULL' && `${harvest.fishCount} fish • ${harvest.avgWeight}g avg • Est: ${harvest.estimatedWeight}kg`}
                  {harvest.type === 'PARTIAL' && `${harvest.fishCount} fish (${harvest.percentage}%) • ${harvest.avgWeight}g avg • Est: ${harvest.estimatedWeight}kg`}
                  {harvest.type === 'SELECTIVE' && `Large fish only • >${harvest.minWeight}g • Est: ${harvest.estimatedWeight}kg`}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-[#0A4D68]">{harvest.progress}% Complete</span>
                  </div>
                  <Progress value={harvest.progress} className="h-2" />
                  <div className="text-xs text-gray-500">
                    Graded: {harvest.gradedWeight}kg of {harvest.estimatedWeight}kg estimated
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Completed Harvests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Completed Harvests (Last 7 Days)</CardTitle>
            <Button variant="link" onClick={onViewHistory}>
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {completedHarvests.map((harvest) => (
              <div key={harvest.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => onViewTankPerformance(harvest.id)}
                    className="font-semibold text-[#0A4D68] hover:underline"
                  >
                    {harvest.tankName}
                  </button>
                  <span className="text-sm text-gray-600">{harvest.date}</span>
                  <Badge variant="outline" size="sm">{harvest.type}</Badge>
                  <span className="text-sm">{harvest.weight}kg</span>
                  <span className="text-sm font-semibold text-green-600">{harvest.revenue.toLocaleString()} EGP</span>
                  <span className="text-sm text-gray-600">FCR: {harvest.fcr}</span>
                  <span className="text-lg">{harvest.status}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
