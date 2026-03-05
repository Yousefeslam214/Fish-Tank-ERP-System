import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  AlertCircle,
  Download,
  Filter,
  Calendar
} from 'lucide-react';

interface HarvestHistoryProps {
  farmId: string;
  onViewTankPerformance: (tankId: string) => void;
}

export const HarvestHistory: React.FC<HarvestHistoryProps> = ({
  farmId,
  onViewTankPerformance
}) => {
  const [timePeriod, setTimePeriod] = useState('last_3_months');
  const [fishType, setFishType] = useState('all');

  // Mock data
  const kpis = {
    totalHarvested: 2450,
    totalHarvests: 12,
    avgProfitMargin: 35.8,
    avgFCR: 1.67,
    totalRevenue: 110250,
    revenueChange: 12,
    avgSurvivalRate: 91.2,
    bestPerformer: { tankId: 'tank-b03', tankName: 'Tank B-03' }
  };

  const gradeDistributionTrends = {
    super: [25, 28, 31],
    grade1: [40, 39, 40],
    grade2: [25, 23, 20],
    sherr: [10, 10, 9]
  };

  const revenueByGrade = [
    { grade: 'Super', revenue: 34575, percentage: 31, color: '#10B981' },
    { grade: 'Grade 1', revenue: 44100, percentage: 40, color: '#3B82F6' },
    { grade: 'Grade 2', revenue: 24525, percentage: 22, color: '#F59E0B' },
    { grade: 'Sherr', revenue: 7050, percentage: 7, color: '#EF4444' }
  ];

  const recentHarvests = [
    { 
      id: 'hrv-1', 
      date: 'Mar 5', 
      tankId: 'tank-a03',
      tankName: 'A-03', 
      type: 'PARTIAL', 
      weight: 175, 
      revenue: 7855, 
      profitPercent: 31.2, 
      fcr: 1.75, 
      status: '✅' 
    },
    { 
      id: 'hrv-2', 
      date: 'Mar 2', 
      tankId: 'tank-b05',
      tankName: 'B-05', 
      type: 'FULL', 
      weight: 520, 
      revenue: 23400, 
      profitPercent: 38.5, 
      fcr: 1.58, 
      status: '⭐' 
    },
    { 
      id: 'hrv-3', 
      date: 'Feb 28', 
      tankId: 'tank-a01',
      tankName: 'A-01', 
      type: 'FULL', 
      weight: 485, 
      revenue: 21825, 
      profitPercent: 35.2, 
      fcr: 1.62, 
      status: '✅' 
    },
    { 
      id: 'hrv-4', 
      date: 'Feb 25', 
      tankId: 'tank-c05',
      tankName: 'C-05', 
      type: 'PARTIAL', 
      weight: 240, 
      revenue: 10800, 
      profitPercent: 28.1, 
      fcr: 1.71, 
      status: '⚠️' 
    },
    { 
      id: 'hrv-5', 
      date: 'Feb 20', 
      tankId: 'tank-b03',
      tankName: 'B-03', 
      type: 'FULL', 
      weight: 550, 
      revenue: 24750, 
      profitPercent: 42.3, 
      fcr: 1.52, 
      status: '⭐' 
    }
  ];

  const alerts = [
    {
      type: 'warning',
      message: 'Tank C-05 FCR trending high (1.71 → 1.78 → 1.85)',
      action: 'Review feeding schedule and water quality'
    },
    {
      type: 'success',
      message: 'Tank B-03 consistently exceeds profit targets',
      detail: 'Avg profit margin: 42.3% (target: 30%)'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Time Period:</span>
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_week">Last Week</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                  <SelectItem value="all_time">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Fish Type:</span>
              <Select value={fishType} onValueChange={setFishType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="nile-tilapia">Nile Tilapia</SelectItem>
                  <SelectItem value="catfish">Catfish</SelectItem>
                  <SelectItem value="carp">Carp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Total Harvested</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-[#0A4D68]">{kpis.totalHarvested} kg</p>
              </div>
              <p className="text-sm text-gray-600">{kpis.totalHarvests} events</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Avg Profit Margin</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-green-600">{kpis.avgProfitMargin}%</p>
                <span className="text-sm text-green-600">⭐ Excellent</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Avg FCR</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-[#0A4D68]">{kpis.avgFCR}</p>
                <span className="text-sm text-green-600">⭐ Good</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-green-600">{kpis.totalRevenue.toLocaleString()} EGP</p>
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+{kpis.revenueChange}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Avg Survival Rate</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-[#0A4D68]">{kpis.avgSurvivalRate}%</p>
                <span className="text-sm text-green-600">⭐ Good</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Best Performer</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-[#0A4D68]">{kpis.bestPerformer.tankName}</p>
              </div>
              <Button 
                variant="link" 
                className="px-0 h-auto text-[#0A4D68]" 
                size="sm"
                onClick={() => onViewTankPerformance(kpis.bestPerformer.tankId)}
              >
                View →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Distribution Trends (Last 3 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                <div className="flex-1">
                  <div className="font-medium">Super</div>
                  <div className="text-sm text-gray-600">
                    {gradeDistributionTrends.super[0]}% → {gradeDistributionTrends.super[1]}% → {gradeDistributionTrends.super[2]}%
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">+{gradeDistributionTrends.super[2] - gradeDistributionTrends.super[0]}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔵</span>
                <div className="flex-1">
                  <div className="font-medium">Grade 1</div>
                  <div className="text-sm text-gray-600">
                    {gradeDistributionTrends.grade1[0]}% → {gradeDistributionTrends.grade1[1]}% → {gradeDistributionTrends.grade1[2]}%
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-semibold">Stable →</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🟠</span>
                <div className="flex-1">
                  <div className="font-medium">Grade 2</div>
                  <div className="text-sm text-gray-600">
                    {gradeDistributionTrends.grade2[0]}% → {gradeDistributionTrends.grade2[1]}% → {gradeDistributionTrends.grade2[2]}%
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <TrendingDown className="w-5 h-5" />
                <span className="font-semibold">-{gradeDistributionTrends.grade2[0] - gradeDistributionTrends.grade2[2]}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔴</span>
                <div className="flex-1">
                  <div className="font-medium">Sherr</div>
                  <div className="text-sm text-gray-600">
                    {gradeDistributionTrends.sherr[0]}% → {gradeDistributionTrends.sherr[1]}% → {gradeDistributionTrends.sherr[2]}%
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <TrendingDown className="w-5 h-5" />
                <span className="font-semibold">-{gradeDistributionTrends.sherr[0] - gradeDistributionTrends.sherr[2]}%</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <Award className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="text-sm text-green-800">
                <span className="font-semibold">💡 Insight:</span> Super grade improving! (+{gradeDistributionTrends.super[2] - gradeDistributionTrends.super[0]}% over 3 months)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Grade */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Grade (Last 3 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {revenueByGrade.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.grade}:</span>
                  <span className="text-gray-600">
                    {item.revenue.toLocaleString()} EGP ({item.percentage}%)
                  </span>
                </div>
                <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 flex items-center justify-center text-white text-xs font-semibold"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color
                    }}
                  >
                    {item.percentage > 10 && `${item.percentage}%`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Harvests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Harvests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-600">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Tank</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Weight</th>
                  <th className="pb-2">Revenue</th>
                  <th className="pb-2">Profit%</th>
                  <th className="pb-2">FCR</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentHarvests.map((harvest) => (
                  <tr key={harvest.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 text-sm">{harvest.date}</td>
                    <td className="py-3">
                      <button 
                        onClick={() => onViewTankPerformance(harvest.tankId)}
                        className="font-semibold text-[#0A4D68] hover:underline"
                      >
                        {harvest.tankName}
                      </button>
                    </td>
                    <td className="py-3">
                      <Badge variant="outline" className="text-xs">
                        {harvest.type}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm">{harvest.weight}kg</td>
                    <td className="py-3 text-sm font-semibold text-green-600">
                      {harvest.revenue.toLocaleString()} EGP
                    </td>
                    <td className="py-3 text-sm">
                      <span className={harvest.profitPercent >= 30 ? 'text-green-600' : harvest.profitPercent >= 15 ? 'text-yellow-600' : 'text-red-600'}>
                        {harvest.profitPercent}%
                      </span>
                    </td>
                    <td className="py-3 text-sm">{harvest.fcr}</td>
                    <td className="py-3 text-lg">{harvest.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((alert, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border ${alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}
            >
              <div className="flex items-start gap-3">
                {alert.type === 'warning' ? (
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                ) : (
                  <Award className="w-5 h-5 text-green-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className={`font-semibold mb-1 ${alert.type === 'warning' ? 'text-yellow-800' : 'text-green-800'}`}>
                    {alert.type === 'warning' ? '⚠️' : '🎉'} {alert.message}
                  </div>
                  <div className={`text-sm ${alert.type === 'warning' ? 'text-yellow-700' : 'text-green-700'}`}>
                    {alert.type === 'warning' ? `Action: ${alert.action}` : alert.detail}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
