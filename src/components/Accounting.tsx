import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Download,
  ShoppingCart,
  Zap,
  Users,
  Wrench
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { User, Farm } from '../types';
import { mockExpenses, mockTanks } from '../mockData';

interface AccountingProps {
  user: User;
  selectedFarm: Farm | null;
}

export default function Accounting({ user, selectedFarm }: AccountingProps) {
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedTank, setSelectedTank] = useState<string>('all');

  const expenses = selectedFarm
    ? mockExpenses.filter(e => e.farmId === selectedFarm.id)
    : mockExpenses;

  const filteredExpenses = selectedTank === 'all'
    ? expenses
    : expenses.filter(e => e.tankId === selectedTank);

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Group by category
  const expensesByCategory = filteredExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Number(value.toFixed(2))
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  // Monthly trend
  const monthlyTrend = [
    { month: 'May', feed: 3200, medicine: 450, labor: 3500, other: 1200 },
    { month: 'Jun', feed: 3400, medicine: 380, labor: 3500, other: 1100 },
    { month: 'Jul', feed: 3600, medicine: 520, labor: 3500, other: 1350 },
    { month: 'Aug', feed: 3800, medicine: 420, labor: 3500, other: 1250 },
    { month: 'Sep', feed: 3900, medicine: 390, labor: 3500, other: 1180 },
    { month: 'Oct', feed: 4100, medicine: 460, labor: 3500, other: 1290 }
  ];

  // Tank-based revenue calculation
  const tankRevenue: Record<string, number> = {
    'tank-a05': 16000,
    'tank-b03': 7225,
    'tank-c01': 12000,
    'all': 45000
  };

  const estimatedRevenue = tankRevenue[selectedTank] || tankRevenue['all'];
  const profitMargin = ((estimatedRevenue - totalExpenses) / estimatedRevenue * 100).toFixed(1);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'feed': return ShoppingCart;
      case 'medicine': return Wrench;
      case 'labor': return Users;
      case 'electricity': return Zap;
      case 'fuel': return Zap;
      default: return DollarSign;
    }
  };

  const tanks = selectedFarm 
    ? mockTanks.filter(t => t.farmId === selectedFarm.id)
    : mockTanks;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Accounting & Finance</h1>
          <p className="text-gray-600">Track expenses and financial performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Expenses</CardTitle>
            <DollarSign className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Estimated Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${estimatedRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">
              Based on current stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Projected Profit</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${(estimatedRevenue - totalExpenses).toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">
              {profitMargin}% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Cost per KG</CardTitle>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">$2.85</div>
            <p className="text-xs text-gray-600 mt-1">
              Average production cost
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">6-Month Expense Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="feed" stackId="a" fill="#3b82f6" />
                <Bar dataKey="medicine" stackId="a" fill="#10b981" />
                <Bar dataKey="labor" stackId="a" fill="#f59e0b" />
                <Bar dataKey="other" stackId="a" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Expenses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Expense Details</CardTitle>
            <Select value={selectedTank} onValueChange={setSelectedTank}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by tank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tanks</SelectItem>
                {tanks.map(tank => (
                  <SelectItem key={tank.id} value={tank.id}>
                    {tank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredExpenses.slice(0, 10).map(expense => {
              const Icon = getCategoryIcon(expense.category);
              return (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="bg-white p-2 rounded-lg">
                      <Icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{expense.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {expense.category}
                        </Badge>
                        <span className="text-xs text-gray-600">
                          {new Date(expense.date).toLocaleDateString()}
                        </span>
                        {expense.tankId && (
                          <span className="text-xs text-gray-600">
                            • {tanks.find(t => t.id === expense.tankId)?.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">${expense.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-600">{expense.currency}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cost per Tank */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cost Allocation by Tank</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tanks.map(tank => {
              const tankExpenses = expenses.filter(e => e.tankId === tank.id);
              const tankTotal = tankExpenses.reduce((sum, e) => sum + e.amount, 0);
              const costPerFish = (tankTotal / tank.currentCount).toFixed(2);

              return (
                <div key={tank.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">{tank.name}</p>
                      <p className="text-xs text-gray-600">{tank.species}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">${tankTotal.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">${costPerFish} per fish</p>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600"
                      style={{ width: `${(tankTotal / totalExpenses) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}