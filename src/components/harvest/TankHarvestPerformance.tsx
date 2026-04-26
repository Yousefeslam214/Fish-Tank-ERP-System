import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  TrendingUp,
  TrendingDown,
  Award,
  Download,
  ArrowLeft
} from 'lucide-react';

interface TankHarvestPerformanceProps {
  tankId: string;
  farmId: string;
}

export const TankHarvestPerformance: React.FC<TankHarvestPerformanceProps> = ({
  tankId,
  farmId
}) => {
  // Mock data
  const tankInfo = {
    name: 'Tank A-03',
    volume: 50,
    totalHarvests: 8,
    lifetimeWeight: 3920,
    lifetimeRevenue: 176400,
    avgProfitMargin: 34.2
  };

  const performanceMetrics = {
    avgFCR: 1.64,
    avgSurvival: 90.8,
    avgCycleDays: 58,
    targetCycleDays: 60
  };

  const harvestTimeline = [
    { month: 'Jan', weight: 485, harvestNumber: 'HRV-042', fcr: 1.62, profit: 31 },
    { month: 'Feb', weight: 520, harvestNumber: 'HRV-043', fcr: 1.58, profit: 38 },
    { month: 'Mar', weight: 175, harvestNumber: 'HRV-045', fcr: 1.75, profit: 31 }
  ];

  const gradeComparison = [
    {
      grade: 'Super',
      jan: { weight: 120, percentage: 25 },
      feb: { weight: 145, percentage: 28 },
      mar: { weight: 58, percentage: 33 },
      trend: 'up'
    },
    {
      grade: 'Grade 1',
      jan: { weight: 194, percentage: 40 },
      feb: { weight: 208, percentage: 40 },
      mar: { weight: 70, percentage: 40 },
      trend: 'stable'
    },
    {
      grade: 'Grade 2',
      jan: { weight: 121, percentage: 25 },
      feb: { weight: 114, percentage: 22 },
      mar: { weight: 39, percentage: 22 },
      trend: 'down'
    },
    {
      grade: 'Sherr',
      jan: { weight: 50, percentage: 10 },
      feb: { weight: 53, percentage: 10 },
      mar: { weight: 8, percentage: 5 },
      trend: 'down'
    }
  ];

  const fullHarvestHistory = [
    { date: 'Mar 5, 2026', event: 'HRV-045', type: 'PARTIAL', weight: 175, revenue: 7855, cost: 5400, profit: 2455 },
    { date: 'Feb 2, 2026', event: 'HRV-043', type: 'FULL', weight: 520, revenue: 23400, cost: 14430, profit: 8970 },
    { date: 'Jan 15, 2026', event: 'HRV-042', type: 'FULL', weight: 485, revenue: 21825, cost: 15067, profit: 6758 },
    { date: 'Dec 20, 2025', event: 'HRV-038', type: 'FULL', weight: 490, revenue: 22050, cost: 15435, profit: 6615 },
    { date: 'Nov 28, 2025', event: 'HRV-035', type: 'PARTIAL', weight: 220, revenue: 9900, cost: 6864, profit: 3036 },
    { date: 'Nov 5, 2025', event: 'HRV-032', type: 'FULL', weight: 510, revenue: 22950, cost: 15810, profit: 7140 },
    { date: 'Oct 12, 2025', event: 'HRV-028', type: 'FULL', weight: 495, revenue: 22275, cost: 16092, profit: 6183 },
    { date: 'Sep 18, 2025', event: 'HRV-024', type: 'FULL', weight: 505, revenue: 22725, cost: 16641, profit: 6084 }
  ];

  const insights = [
    'Super grade percentage increasing (+8% over 3 harvests)',
    'Sherr percentage decreasing (excellent!)',
    'Consistent Grade 1 performance (target maintained)',
    'Recommendation: Current practices are working well'
  ];

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <span className="text-gray-600">→</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-[#0A4D68] to-[#0A4D68]/80 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">{tankInfo.name} - Harvest Performance History</h2>
                <p className="text-sm opacity-90">Complete performance analytics and trends</p>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div>
              <div className="text-sm opacity-90">Volume</div>
              <div className="text-2xl font-bold">{tankInfo.volume} m³</div>
            </div>
            <div>
              <div className="text-sm opacity-90">Total Harvests</div>
              <div className="text-2xl font-bold">{tankInfo.totalHarvests}</div>
            </div>
            <div>
              <div className="text-sm opacity-90">Lifetime Production</div>
              <div className="text-2xl font-bold">{tankInfo.lifetimeWeight.toLocaleString()} kg</div>
            </div>
            <div>
              <div className="text-sm opacity-90">Lifetime Revenue</div>
              <div className="text-2xl font-bold">{tankInfo.lifetimeRevenue.toLocaleString()} EGP</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Avg Survival</p>
              <p className="text-4xl font-bold text-[#0A4D68] mb-1">{performanceMetrics.avgSurvival}%</p>
              <Badge className="bg-green-100 text-green-700 border-green-300">
                ⭐ Excellent
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Avg Cycle</p>
              <p className="text-4xl font-bold text-[#0A4D68] mb-1">{performanceMetrics.avgCycleDays}</p>
              <p className="text-sm text-gray-600">days (Target: {performanceMetrics.targetCycleDays})</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Harvest Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Harvest Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              {/* Timeline visualization */}
              <div className="flex items-center justify-between mb-8">
                {harvestTimeline.map((harvest, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="relative">
                      <div className="w-4 h-4 bg-[#0A4D68] rounded-full"></div>
                      {index < harvestTimeline.length - 1 && (
                        <div className="absolute top-2 left-4 w-32 h-0.5 bg-[#0A4D68]"></div>
                      )}
                    </div>
                    <div className="mt-4 text-center space-y-1">
                      <div className="font-semibold text-gray-900">{harvest.month}</div>
                      <div className="text-2xl font-bold text-[#0A4D68]">{harvest.weight}kg</div>
                      <div className="text-sm text-gray-600">{harvest.harvestNumber}</div>

                      <div className="text-xs text-green-600 font-semibold">{harvest.profit}% profit</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Distribution Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Distribution Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 pr-4">Grade</th>
                  <th className="pb-3 px-4">Jan (HRV-042)</th>
                  <th className="pb-3 px-4">Feb (HRV-043)</th>
                  <th className="pb-3 px-4">Mar (HRV-045)</th>
                  <th className="pb-3 pl-4">Trend</th>
                </tr>
              </thead>
              <tbody>
                {gradeComparison.map((row, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {row.grade === 'Super' && '⭐'}
                          {row.grade === 'Grade 1' && '🔵'}
                          {row.grade === 'Grade 2' && '🟠'}
                          {row.grade === 'Sherr' && '🔴'}
                        </span>
                        <span className="font-medium">{row.grade}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{row.jan.weight}kg</div>
                      <div className="text-sm text-gray-600">({row.jan.percentage}%)</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{row.feb.weight}kg</div>
                      <div className="text-sm text-gray-600">({row.feb.percentage}%)</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{row.mar.weight}kg</div>
                      <div className="text-sm text-gray-600">({row.mar.percentage}%)</div>
                    </td>
                    <td className="py-3 pl-4">
                      <div className="flex items-center gap-1">
                        {getTrendIcon(row.trend)}
                        {row.trend === 'up' && row.grade === 'Super' && <span className="text-sm text-green-600">Great!</span>}
                        {row.trend === 'down' && row.grade === 'Sherr' && <span className="text-sm text-green-600">Great!</span>}
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-3 pr-4">Total</td>
                  <td className="py-3 px-4">485kg</td>
                  <td className="py-3 px-4">520kg</td>
                  <td className="py-3 px-4">175kg</td>
                  <td className="py-3 pl-4"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2 text-blue-800">
                <span className="text-blue-600 mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Full Harvest History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Full Harvest History</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-600">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Event</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Weight</th>
                  <th className="pb-2">Revenue</th>
                  <th className="pb-2">Cost</th>
                  <th className="pb-2">Profit</th>
                </tr>
              </thead>
              <tbody>
                {fullHarvestHistory.map((harvest, index) => (
                  <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 text-sm">{harvest.date}</td>
                    <td className="py-3 text-sm font-mono">{harvest.event}</td>
                    <td className="py-3">
                      <Badge variant="outline" className="text-xs">
                        {harvest.type}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm">{harvest.weight}kg</td>
                    <td className="py-3 text-sm text-green-600 font-semibold">
                      {harvest.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 text-sm">{harvest.cost.toLocaleString()}</td>
                    <td className="py-3 text-sm font-semibold text-[#0A4D68]">
                      {harvest.profit.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline">
          View Batch Details
        </Button>
        <Button variant="outline">
          Compare with Other Tanks
        </Button>
      </div>
    </div>
  );
};
