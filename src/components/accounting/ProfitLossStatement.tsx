import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useAccounting } from './AccountingModule';
import { Download, TrendingDown, TrendingUp } from 'lucide-react';

export function ProfitLossStatement() {
  const { t } = useAccounting();

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} EGP`;
  const formatPercent = (percent: number) => `${percent.toFixed(1)}%`;

  // P&L Data
  const data = {
    revenue: {
      fishSales: 285000,
      other: 0
    },
    cogs: 170000,
    operatingExpenses: {
      feed: 95000,
      fingerlings: 25000,
      labor: 35000,
      utilities: 12000,
      maintenance: 8000,
      harvest: 5850,
      other: 3000
    },
    otherExpenses: {
      inventoryWriteOff: 450,
      other: 0
    }
  };

  const totalRevenue = data.revenue.fishSales + data.revenue.other;
  const grossProfit = totalRevenue - data.cogs;
  const grossProfitPercent = (grossProfit / totalRevenue) * 100;
  
  const totalOperatingExpenses = Object.values(data.operatingExpenses).reduce((a, b) => a + b, 0);
  const operatingProfit = grossProfit - totalOperatingExpenses;
  const operatingProfitPercent = (operatingProfit / totalRevenue) * 100;
  
  const totalOtherExpenses = Object.values(data.otherExpenses).reduce((a, b) => a + b, 0);
  const netProfit = operatingProfit - totalOtherExpenses;
  const netProfitPercent = (netProfit / totalRevenue) * 100;

  const ExpenseLine = ({ label, amount, indent = false }: { label: string; amount: number; indent?: boolean }) => (
    <div className={`flex items-center justify-between py-2 ${indent ? 'pl-6' : ''}`}>
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">{formatCurrency(amount)}</span>
        <span className="text-xs text-gray-500 w-16 text-right">
          {formatPercent((amount / totalRevenue) * 100)}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>{t('accounting.profitLoss')} Statement</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Period: January 1 - March 6, 2026</p>
            </div>
            <Button size="sm">
              <Download className="w-4 h-4 mr-2" />
              {t('accounting.exportPdf')}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* P&L Statement */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* REVENUE */}
          <div>
            <h3 className="font-bold text-lg mb-3 uppercase">{t('accounting.totalRevenue')}</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <ExpenseLine label="Fish Sales" amount={data.revenue.fishSales} />
              <ExpenseLine label="Other Revenue" amount={data.revenue.other} />
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{t('accounting.totalRevenue')}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-bold">{formatCurrency(totalRevenue)}</span>
                    <span className="text-sm w-16 text-right">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COGS */}
          <div>
            <h3 className="font-bold text-lg mb-3 uppercase">COST OF GOODS SOLD</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <ExpenseLine label="Cost of Goods Sold" amount={data.cogs} />
            </div>
          </div>

          {/* GROSS PROFIT */}
          <div className="bg-green-50 border-l-4 border-green-600 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="font-bold text-lg">{t('accounting.grossProfitAmount')}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-lg">{formatCurrency(grossProfit)}</span>
                <span className="text-sm font-medium text-green-600">{formatPercent(grossProfitPercent)} 🟢</span>
              </div>
            </div>
          </div>

          {/* OPERATING EXPENSES */}
          <div>
            <h3 className="font-bold text-lg mb-3 uppercase">{t('accounting.operatingExpenses')}</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <ExpenseLine label="Feed Purchases" amount={data.operatingExpenses.feed} />
              <ExpenseLine label="Fingerling Purchases" amount={data.operatingExpenses.fingerlings} />
              <ExpenseLine label="Labor" amount={data.operatingExpenses.labor} />
              <ExpenseLine label="Utilities" amount={data.operatingExpenses.utilities} />
              <ExpenseLine label="Maintenance" amount={data.operatingExpenses.maintenance} />
              <ExpenseLine label="Harvest Costs" amount={data.operatingExpenses.harvest} />
              <ExpenseLine label="Other" amount={data.operatingExpenses.other} />
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{t('accounting.totalExpenses')}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-bold">{formatCurrency(totalOperatingExpenses)}</span>
                    <span className="text-sm w-16 text-right">{formatPercent((totalOperatingExpenses / totalRevenue) * 100)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* OPERATING PROFIT */}
          <div className={`${operatingProfit >= 0 ? 'bg-green-50 border-green-600' : 'bg-red-50 border-red-600'} border-l-4 rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {operatingProfit >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
                <span className="font-bold text-lg">{t('accounting.operatingProfit')}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`font-bold text-lg ${operatingProfit < 0 ? 'text-red-600' : ''}`}>
                  {formatCurrency(operatingProfit)}
                </span>
                <span className={`text-sm font-medium ${operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(operatingProfitPercent)} {operatingProfit >= 0 ? '🟢' : '🔴'}
                </span>
              </div>
            </div>
          </div>

          {/* OTHER INCOME/EXPENSE */}
          <div>
            <h3 className="font-bold text-lg mb-3 uppercase">{t('accounting.otherIncome')}</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <ExpenseLine label="Inventory Write-off" amount={-data.otherExpenses.inventoryWriteOff} />
              <ExpenseLine label="Other" amount={data.otherExpenses.other} />
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Total Other</span>
                  <span className="font-bold">{formatCurrency(-totalOtherExpenses)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* NET PROFIT */}
          <div className={`${netProfit >= 0 ? 'bg-green-100 border-green-600' : 'bg-red-100 border-red-600'} border-2 rounded-lg p-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {netProfit >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
                <span className="font-bold text-xl">{t('accounting.netProfit')}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`font-bold text-2xl ${netProfit < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(netProfit)}
                </span>
                <span className={`text-base font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(netProfitPercent)} {netProfit >= 0 ? '🟢' : '🔴'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="text-xl">💡</span>
              <div>
                <h4 className="font-medium mb-1">Notes:</h4>
                <p className="text-sm text-gray-700">
                  Operating loss due to selling only partial harvest. Remaining inventory valued at 3,750 EGP not yet sold.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
