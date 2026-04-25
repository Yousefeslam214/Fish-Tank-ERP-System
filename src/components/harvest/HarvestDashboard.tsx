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
  onContinueHarvest: (harvest: any) => void;
  kpis?: {
    activeHarvests: number;
    thisMonthHarvested: number;
    thisMonthRevenue: number;
  };
  activeHarvests?: any[];
  completedHarvests?: any[];
  loading?: boolean;
}

export const HarvestDashboard: React.FC<HarvestDashboardProps> = ({
  farmId,
  onStartHarvest,
  onViewHistory,
  onViewTankPerformance,
  onContinueHarvest,
  kpis,
  activeHarvests = [],
  completedHarvests = [],
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}><CardContent className="h-24" /></Card>
          ))}
        </div>
        <Card><CardContent className="h-64" /></Card>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'FULL': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'PARTIAL': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'SELECTIVE': return 'bg-pink-100 text-pink-700 border-pink-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toUpperCase()) {
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
                  <p className="text-3xl font-bold text-[#0A4D68]">{kpis?.activeHarvests ?? 0}</p>
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
                  <p className="text-3xl font-bold text-[#0A4D68]">{kpis?.thisMonthHarvested ?? 0} kg</p>
                  <p className="text-sm text-gray-600">
                    Value: <span className="font-semibold text-green-600">{(kpis?.thisMonthRevenue ?? 0).toLocaleString()} EGP</span>
                  </p>
                </div>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500 opacity-20" />
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
            {activeHarvests
              .filter(h => 
                h.tankName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                h.batchNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                h.id?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((harvest) => (
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
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onContinueHarvest(harvest)}
                    >
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
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
