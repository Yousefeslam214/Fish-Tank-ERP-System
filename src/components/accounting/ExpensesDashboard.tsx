import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { useAccounting } from './AccountingModule';
import { 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart,
  Users,
  Zap,
  Wrench,
  Package,
  MoreHorizontal,
  Plus,
  Download,
  Minus,
  Fish
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  mockExpensesByCategory,
  mockExpenseTrend,
  mockTankExpenses 
} from '../../mockData/accountingData';
import { ResponsiveCardGrid } from '../ResponsivePageLayout';

export function ExpensesDashboard() {
  const { t, language } = useAccounting();
  const [period, setPeriod] = useState('month');
  const [view, setView] = useState<'farm' | 'tank'>('farm');
  const [selectedTank, setSelectedTank] = useState('tank-003');

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} EGP`;

  const formatTrend = (value: number) => {
    const isPositive = value > 0;
    const isNegative = value < 0;
    const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
    const color = isPositive ? 'text-red-600' : isNegative ? 'text-green-600' : 'text-gray-600';
    
    return (
      <div className={`flex items-center gap-1 text-xs ${color}`}>
        <Icon className="w-3 h-3" />
        <span>{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      ShoppingCart,
      Users,
      Fish,
      Zap,
      Wrench,
      Package,
      MoreHorizontal
    };
    const IconComponent = icons[iconName] || Receipt;
    return <IconComponent className="w-4 h-4" />;
  };

  const totalExpenses = mockExpensesByCategory.reduce((sum, cat) => sum + cat.amount, 0);

  const COLORS = ['#0A4D68', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  // Tank expenses data
  const tankExpense = mockTankExpenses.find(te => te.tankId === selectedTank);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with Period & View Selector */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <RadioGroup value={view} onValueChange={(v) => setView(v as 'farm' | 'tank')}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="farm" id="farm" />
              <Label htmlFor="farm" className="cursor-pointer">{t('accounting.farmWide')}</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="tank" id="tank" />
              <Label htmlFor="tank" className="cursor-pointer">{t('accounting.byTank')}</Label>
            </div>
          </div>
        </RadioGroup>

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

      {view === 'farm' ? (
        <>
          {/* Farm-wide Expenses Cards */}
          <ResponsiveCardGrid cols={4}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{t('accounting.totalExpensesLabel')}</CardTitle>
                  <Receipt className="w-4 h-4 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
                {formatTrend(12.5)}
                <p className="text-xs text-gray-600 mt-1">{t('accounting.vsLastMonth')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{t('accounting.feedCosts')}</CardTitle>
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">
                  {formatCurrency(mockExpensesByCategory[0].amount)}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {mockExpensesByCategory[0].percentage.toFixed(1)}% {t('accounting.share')}
                </p>
                {formatTrend(mockExpensesByCategory[0].trend)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{t('accounting.laborCosts')}</CardTitle>
                  <Users className="w-4 h-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">
                  {formatCurrency(mockExpensesByCategory[1].amount)}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {mockExpensesByCategory[1].percentage.toFixed(1)}% {t('accounting.share')}
                </p>
                {formatTrend(mockExpensesByCategory[1].trend)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Utilities</CardTitle>
                  <Zap className="w-4 h-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">
                  {formatCurrency(mockExpensesByCategory[3].amount)}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {mockExpensesByCategory[3].percentage.toFixed(1)}% {t('accounting.share')}
                </p>
                {formatTrend(mockExpensesByCategory[3].trend)}
              </CardContent>
            </Card>
          </ResponsiveCardGrid>

          {/* Second Row of Cards */}
          <ResponsiveCardGrid cols={4}>
            {mockExpensesByCategory.slice(2, 2).concat(mockExpensesByCategory.slice(4, 7)).map((category) => (
              <Card key={category.name}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {language === 'ar' ? category.nameAr : category.name}
                    </CardTitle>
                    {getIcon(category.icon)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold">{formatCurrency(category.amount)}</div>
                  <p className="text-xs text-gray-600 mt-1">
                    {category.percentage.toFixed(1)}% {t('accounting.share')}
                  </p>
                  {formatTrend(category.trend)}
                </CardContent>
              </Card>
            ))}
          </ResponsiveCardGrid>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Expense Breakdown Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm md:text-base">Expense Breakdown by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] md:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockExpensesByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => 
                          `${name.split(' ')[0]} ${percentage.toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {mockExpensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expense Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm md:text-base">Expense Trend (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] md:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockExpenseTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey={language === 'ar' ? 'monthAr' : 'month'}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                      <Bar dataKey="expenses" fill="#0A4D68" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm md:text-base">Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockExpensesByCategory.map((category) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getIcon(category.icon)}
                        <div>
                          <div className="font-medium text-sm">
                            {language === 'ar' ? category.nameAr : category.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {category.percentage.toFixed(1)}% of total
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">{formatCurrency(category.amount)}</div>
                        {formatTrend(category.trend)}
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                    {category.subcategories && category.subcategories.length > 0 && (
                      <div className="pl-6 space-y-1">
                        {category.subcategories.map((sub) => (
                          <div key={sub.name} className="flex items-center justify-between text-xs text-gray-600">
                            <span>• {language === 'ar' ? sub.nameAr : sub.name}</span>
                            <span>{formatCurrency(sub.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Budget Alert */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 bg-orange-50 border-l-4 border-orange-600 rounded-lg p-4">
                <span className="text-2xl">💡</span>
                <div>
                  <h4 className="font-medium mb-1">{t('accounting.budgetAlert')}</h4>
                  <p className="text-sm text-gray-700">
                    Feed costs are 12% above budget for March. Consider reviewing feeding schedules or negotiating supplier prices.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Tank View */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-base">Tank Expenses Analysis</CardTitle>
                <Select value={selectedTank} onValueChange={setSelectedTank}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mockTankExpenses.map((te) => (
                      <SelectItem key={te.tankId} value={te.tankId}>
                        {te.tankName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
          </Card>

          {tankExpense && (
            <>
              {/* Tank Overview */}
              <Card>
                <CardContent className="pt-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">{tankExpense.tankName} Overview</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Batch:</span>
                        <span className="ml-2 font-medium">{tankExpense.batchId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Expenses:</span>
                        <span className="ml-2 font-medium">{formatCurrency(tankExpense.totalExpenses)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">FCR:</span>
                        <span className="ml-2 font-medium">1.75 ✓</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Cost/kg:</span>
                        <span className="ml-2 font-medium">{tankExpense.costPerKg.toFixed(2)} EGP</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tank Expense Cards */}
              <ResponsiveCardGrid cols={4}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{t('accounting.batchCosts')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(tankExpense.totalExpenses)}</div>
                    <p className="text-xs text-gray-600 mt-1">For Batch {tankExpense.batchId}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Feed {t('accounting.consumed')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(tankExpense.feedCosts)}</div>
                    <p className="text-xs text-gray-600 mt-1">
                      {((tankExpense.feedCosts / tankExpense.totalExpenses) * 100).toFixed(1)}% {t('accounting.share')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Operating Costs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(tankExpense.operatingCosts)}</div>
                    <p className="text-xs text-gray-600 mt-1">
                      {((tankExpense.operatingCosts / tankExpense.totalExpenses) * 100).toFixed(1)}% {t('accounting.share')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{t('accounting.costPerKg')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tankExpense.costPerKg.toFixed(2)}</div>
                    <p className="text-xs text-gray-600 mt-1">EGP/kg</p>
                  </CardContent>
                </Card>
              </ResponsiveCardGrid>

              {/* Feed Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Feed Costs Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 text-sm">Food Type</th>
                          <th className="text-right p-2 text-sm">Weight</th>
                          <th className="text-right p-2 text-sm">Price</th>
                          <th className="text-right p-2 text-sm">Total</th>
                          <th className="text-left p-2 text-sm">Period</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tankExpense.feedDetails.map((feed, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="p-2 text-sm">{language === 'ar' ? feed.typeAr : feed.type}</td>
                            <td className="p-2 text-sm text-right">{feed.weight} kg</td>
                            <td className="p-2 text-sm text-right">{feed.price} EGP</td>
                            <td className="p-2 text-sm text-right font-medium">{formatCurrency(feed.total)}</td>
                            <td className="p-2 text-sm">{language === 'ar' ? feed.periodAr : feed.period}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold">
                          <td className="p-2 text-sm">Total</td>
                          <td className="p-2 text-sm text-right">
                            {tankExpense.feedDetails.reduce((sum, f) => sum + f.weight, 0)} kg
                          </td>
                          <td className="p-2 text-sm"></td>
                          <td className="p-2 text-sm text-right">{formatCurrency(tankExpense.feedCosts)}</td>
                          <td className="p-2 text-sm"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Operating Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Operating Costs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tankExpense.operatingDetails.map((op, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">
                            {language === 'ar' ? op.categoryAr : op.category}
                          </div>
                          <div className="text-xs text-gray-600">
                            {language === 'ar' ? op.detailsAr : op.details}
                          </div>
                        </div>
                        <div className="font-bold text-sm">{formatCurrency(op.amount)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
