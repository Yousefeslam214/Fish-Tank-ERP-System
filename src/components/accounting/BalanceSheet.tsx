import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAccounting } from './AccountingModule';
import { Download, CheckCircle } from 'lucide-react';

export function BalanceSheet() {
  const { t } = useAccounting();

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} EGP`;

  // Balance Sheet Data
  const assets = {
    current: {
      cash: 45000,
      accountsReceivable: 12000,
      inventory: 3750,
      feed: 15000
    },
    fixed: {
      tanks: 150000,
      equipment: 50000,
      buildings: 200000,
      depreciation: -30000
    }
  };

  const liabilities = {
    current: {
      accountsPayable: 25000,
      salariesPayable: 8000
    },
    longTerm: {
      loansPayable: 150000
    }
  };

  const equity = {
    ownersEquity: 200000,
    retainedEarnings: 62750
  };

  const totalCurrentAssets = Object.values(assets.current).reduce((a, b) => a + b, 0);
  const totalFixedAssets = Object.values(assets.fixed).reduce((a, b) => a + b, 0);
  const totalAssets = totalCurrentAssets + totalFixedAssets;

  const totalCurrentLiabilities = Object.values(liabilities.current).reduce((a, b) => a + b, 0);
  const totalLongTermLiabilities = Object.values(liabilities.longTerm).reduce((a, b) => a + b, 0);
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

  const totalEquity = Object.values(equity).reduce((a, b) => a + b, 0);
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  // Financial Ratios
  const currentRatio = totalCurrentAssets / totalCurrentLiabilities;
  const debtToEquity = totalLiabilities / totalEquity;
  const workingCapital = totalCurrentAssets - totalCurrentLiabilities;

  const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>{t('accounting.balanceSheet')}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">As of: March 6, 2026</p>
            </div>
            <Button size="sm">
              <Download className="w-4 h-4 mr-2" />
              {t('accounting.exportPdf')}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Balance Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ASSETS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('accounting.assets')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Assets */}
            <div>
              <h4 className="font-medium text-sm mb-2 text-gray-700">{t('accounting.currentAssets')}:</h4>
              <div className="space-y-2 pl-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Cash</span>
                  <span className="font-medium">{formatCurrency(assets.current.cash)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>A/R</span>
                  <span className="font-medium">{formatCurrency(assets.current.accountsReceivable)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Inventory</span>
                  <span className="font-medium">{formatCurrency(assets.current.inventory)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Feed</span>
                  <span className="font-medium">{formatCurrency(assets.current.feed)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2 font-medium">
                  <span>Total Current</span>
                  <span>{formatCurrency(totalCurrentAssets)}</span>
                </div>
              </div>
            </div>

            {/* Fixed Assets */}
            <div>
              <h4 className="font-medium text-sm mb-2 text-gray-700">{t('accounting.fixedAssets')}:</h4>
              <div className="space-y-2 pl-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Tanks</span>
                  <span className="font-medium">{formatCurrency(assets.fixed.tanks)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Equipment</span>
                  <span className="font-medium">{formatCurrency(assets.fixed.equipment)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Buildings</span>
                  <span className="font-medium">{formatCurrency(assets.fixed.buildings)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Depreciation</span>
                  <span className="font-medium text-red-600">{formatCurrency(assets.fixed.depreciation)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2 font-medium">
                  <span>Total Fixed</span>
                  <span>{formatCurrency(totalFixedAssets)}</span>
                </div>
              </div>
            </div>

            {/* Total Assets */}
            <div className="bg-blue-50 border-2 border-blue-600 rounded-lg p-3">
              <div className="flex items-center justify-between font-bold text-lg">
                <span>{t('accounting.totalAssets')}</span>
                <span>{formatCurrency(totalAssets)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LIABILITIES & EQUITY */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('accounting.liabilities')} & {t('accounting.equity')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Liabilities */}
            <div>
              <h4 className="font-medium text-sm mb-2 text-gray-700">{t('accounting.currentLiabilities')}:</h4>
              <div className="space-y-2 pl-4">
                <div className="flex items-center justify-between text-sm">
                  <span>A/P</span>
                  <span className="font-medium">{formatCurrency(liabilities.current.accountsPayable)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Salaries</span>
                  <span className="font-medium">{formatCurrency(liabilities.current.salariesPayable)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2 font-medium">
                  <span>Total Current</span>
                  <span>{formatCurrency(totalCurrentLiabilities)}</span>
                </div>
              </div>
            </div>

            {/* Long-term Liabilities */}
            <div>
              <h4 className="font-medium text-sm mb-2 text-gray-700">{t('accounting.longTermLiabilities')}:</h4>
              <div className="space-y-2 pl-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Loans</span>
                  <span className="font-medium">{formatCurrency(liabilities.longTerm.loansPayable)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2 font-medium">
                  <span>Total Liab.</span>
                  <span>{formatCurrency(totalLiabilities)}</span>
                </div>
              </div>
            </div>

            {/* Equity */}
            <div>
              <h4 className="font-medium text-sm mb-2 text-gray-700">{t('accounting.equity')}:</h4>
              <div className="space-y-2 pl-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Owner's</span>
                  <span className="font-medium">{formatCurrency(equity.ownersEquity)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Retained</span>
                  <span className="font-medium">{formatCurrency(equity.retainedEarnings)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2 font-medium">
                  <span>Total Equity</span>
                  <span>{formatCurrency(totalEquity)}</span>
                </div>
              </div>
            </div>

            {/* Total L&E */}
            <div className="bg-blue-50 border-2 border-blue-600 rounded-lg p-3">
              <div className="flex items-center justify-between font-bold text-lg">
                <span>{t('accounting.totalLE')}</span>
                <span>{formatCurrency(totalLiabilitiesAndEquity)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Balance Status */}
      <Card>
        <CardContent className="pt-6">
          {isBalanced ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">✅ Balance Sheet is Balanced</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <span className="font-medium">❌ Balance Sheet is NOT Balanced</span>
            </div>
          )}
          <p className="text-sm text-gray-600 mt-1">
            Total Assets = Total Liabilities & Equity
          </p>
        </CardContent>
      </Card>

      {/* Key Ratios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Key Ratios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">{t('accounting.currentRatio')}:</div>
              <div className="text-2xl font-bold">{currentRatio.toFixed(2)}</div>
              <div className="text-xs text-gray-600 mt-1">
                ({formatCurrency(totalCurrentAssets)} / {formatCurrency(totalCurrentLiabilities)})
              </div>
              <Badge variant="outline" className="mt-2 border-green-600 text-green-600">
                ✅ {t('accounting.healthy')}
              </Badge>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">{t('accounting.debtToEquity')}:</div>
              <div className="text-2xl font-bold">{debtToEquity.toFixed(2)}</div>
              <div className="text-xs text-gray-600 mt-1">
                ({(totalLiabilities / 1000).toFixed(0)}K / {(totalEquity / 1000).toFixed(2)}K)
              </div>
              <Badge variant="outline" className="mt-2 border-green-600 text-green-600">
                ✅ Good
              </Badge>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">{t('accounting.workingCapital')}:</div>
              <div className="text-2xl font-bold">{formatCurrency(workingCapital)}</div>
              <div className="text-xs text-gray-600 mt-1">
                Current Assets - Current Liabilities
              </div>
              <Badge variant="outline" className="mt-2 border-green-600 text-green-600">
                ✅ {t('accounting.positive')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
