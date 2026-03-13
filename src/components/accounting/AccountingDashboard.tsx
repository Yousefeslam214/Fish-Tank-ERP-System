import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAccounting } from './AccountingModule';
import { ResponsiveCardGrid } from '../ResponsivePageLayout';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Scale,
  BarChart3,
  Search,
  Package,
  Download,
  Minus
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  mockFinancialMetrics, 
  mockRevenueTrend, 
  mockJournalEntries 
} from '../../mockData/accountingData';

export function AccountingDashboard() {
  const { t, language } = useAccounting();
  const [period, setPeriod] = useState('month');
  
  const metrics = mockFinancialMetrics;
  const revenueTrend = mockRevenueTrend;
  const recentEntries = mockJournalEntries.slice(0, 3);

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} EGP`;
  };

  const formatTrend = (value: number) => {
    const isPositive = value > 0;
    const isNegative = value < 0;
    const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
    const color = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600';
    
    return (
      <div className={`flex items-center gap-1 text-xs ${color}`}>
        <Icon className="w-3 h-3" />
        <span>{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Period Selector */}
      <div className="flex justify-end">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36 md:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">{t('accounting.thisMonth')}</SelectItem>
            <SelectItem value="quarter">{t('accounting.thisQuarter')}</SelectItem>
            <SelectItem value="year">{t('accounting.thisYear')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Financial Metrics Cards - First Row */}
      <ResponsiveCardGrid cols={4}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t('accounting.revenue')}</CardTitle>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{formatCurrency(metrics.revenue)}</div>
            {formatTrend(metrics.revenueChange)}
            <p className="text-xs text-gray-600 mt-1">{t('accounting.vsLastMonth')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t('accounting.grossProfit')}</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{formatCurrency(metrics.grossProfit)}</div>
            {formatTrend(metrics.grossProfitChange)}
            <p className="text-xs text-gray-600 mt-1">{t('accounting.vsLastMonth')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t('accounting.profitMargin')}</CardTitle>
              <BarChart3 className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{metrics.profitMargin.toFixed(1)}%</div>
            <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
              <Minus className="w-3 h-3" />
              <span>{t('accounting.stable')}</span>
            </div>
            <p className="text-xs text-gray-600">{t('accounting.vsLastMonth')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t('accounting.accountsReceivable')}</CardTitle>
              <FileText className="w-4 h-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{formatCurrency(metrics.accountsReceivable)}</div>
            {formatTrend(metrics.accountsReceivableChange)}
          </CardContent>
        </Card>
      </ResponsiveCardGrid>

      {/* Financial Metrics Cards - Second Row */}
      <ResponsiveCardGrid cols={4}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t('accounting.inventoryValue')}</CardTitle>
              <Package className="w-4 h-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{formatCurrency(metrics.inventoryValue)}</div>
            {formatTrend(metrics.inventoryChange)}
            <p className="text-xs text-gray-600 mt-1">{metrics.lotCount} {t('accounting.lots')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t('accounting.cogs')}</CardTitle>
              <DollarSign className="w-4 h-4 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{formatCurrency(metrics.cogs)}</div>
            <p className="text-xs text-gray-600 mt-1">{t('accounting.ytd')}</p>
            <p className="text-xs text-gray-600">{t('accounting.avg')}: {metrics.profitMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t('accounting.netProfit')}</CardTitle>
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-red-600">{formatCurrency(metrics.netProfit)}</div>
            <Badge variant="destructive" className="mt-1">🔴 {t('accounting.loss')}</Badge>
            <p className="text-xs text-gray-600 mt-1">{metrics.netProfitMargin.toFixed(1)}% {t('accounting.margin')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t('accounting.balanceSheetStatus')}</CardTitle>
              <Scale className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="border-green-600 text-green-600">
                ✅ {t('accounting.balanced')}
              </Badge>
            </div>
            <p className="text-xs text-gray-600 mt-2">{t('accounting.balanced')}</p>
          </CardContent>
        </Card>
      </ResponsiveCardGrid>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm md:text-base">Revenue Trend (Last 6 Months)</CardTitle>
            <Button variant="ghost" size="sm">
              {t('accounting.viewAll')} →
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] md:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={language === 'ar' ? 'monthAr' : 'month'} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0A4D68" 
                  strokeWidth={2}
                  dot={{ fill: '#0A4D68', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm md:text-base">{t('accounting.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            <Button variant="outline" className="w-full" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              <span className="text-xs">{t('accounting.viewJournal')}</span>
            </Button>
            <Button variant="outline" className="w-full" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              <span className="text-xs">{t('accounting.viewPL')}</span>
            </Button>
            <Button variant="outline" className="w-full" size="sm">
              <Scale className="w-4 h-4 mr-2" />
              <span className="text-xs">{t('accounting.viewBalanceSheet')}</span>
            </Button>
            <Button variant="outline" className="w-full" size="sm">
              <Search className="w-4 h-4 mr-2" />
              <span className="text-xs">{t('accounting.traceability')}</span>
            </Button>
            <Button variant="outline" className="w-full" size="sm">
              <Package className="w-4 h-4 mr-2" />
              <span className="text-xs">{t('accounting.inventoryValuation')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Journal Entries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm md:text-base">{t('accounting.recentEntries')}</CardTitle>
            <Button variant="ghost" size="sm">
              {t('accounting.viewAll')} →
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEntries.map((entry) => (
              <div key={entry.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{entry.entryNumber}</span>
                    <span className="text-xs text-gray-600">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {language === 'ar' ? entry.descriptionAr : entry.description}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {language === 'ar' ? entry.descriptionAr : entry.description}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-medium text-sm">{formatCurrency(entry.amount)}</div>
                  </div>
                  {entry.status === 'BALANCED' && (
                    <Badge variant="outline" className="border-green-600 text-green-600">
                      ✅
                    </Badge>
                  )}
                  {entry.status === 'REQUIRES_APPROVAL' && (
                    <Badge variant="outline" className="border-orange-600 text-orange-600">
                      ⚠️
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm md:text-base">{t('accounting.topPerformers')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-2xl">🏆</span>
              <span className="font-medium">{t('accounting.bestHarvest')}:</span>
              <span>HRV-043 (Tank B-05) - 38.5% margin</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-2xl">🥇</span>
              <span className="font-medium">{t('accounting.bestCustomer')}:</span>
              <span>Cairo Fish Market - 75,400 EGP YTD</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
