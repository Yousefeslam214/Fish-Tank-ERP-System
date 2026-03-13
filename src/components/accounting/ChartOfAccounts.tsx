import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useAccounting } from './AccountingModule';
import { Search, Plus, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { mockAccounts } from '../../mockData/accountingData';

export function ChartOfAccounts() {
  const { t, language } = useAccounting();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({
    ASSET: true,
    LIABILITY: false,
    EQUITY: false,
    REVENUE: false,
    EXPENSE: false
  });

  const toggleType = (type: string) => {
    setExpandedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} EGP`;
  };

  const filteredAccounts = mockAccounts.filter(account =>
    account.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.nameAr.includes(searchQuery)
  );

  const accountsByType = {
    ASSET: filteredAccounts.filter(a => a.type === 'ASSET'),
    LIABILITY: filteredAccounts.filter(a => a.type === 'LIABILITY'),
    EQUITY: filteredAccounts.filter(a => a.type === 'EQUITY'),
    REVENUE: filteredAccounts.filter(a => a.type === 'REVENUE'),
    EXPENSE: filteredAccounts.filter(a => a.type === 'EXPENSE')
  };

  const getTypeTotal = (type: string) => {
    return accountsByType[type as keyof typeof accountsByType]
      .reduce((sum, acc) => sum + acc.balance, 0);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ASSET: t('accounting.assets'),
      LIABILITY: t('accounting.liabilities'),
      EQUITY: t('accounting.equity'),
      REVENUE: 'REVENUE',
      EXPENSE: t('accounting.expense')
    };
    return labels[type] || type;
  };

  const renderAccountGroup = (type: string) => {
    const accounts = accountsByType[type as keyof typeof accountsByType];
    const isExpanded = expandedTypes[type];
    const total = getTypeTotal(type);

    // Group by subtype
    const accountsBySubtype = accounts.reduce((acc, account) => {
      if (!acc[account.subtype]) {
        acc[account.subtype] = [];
      }
      acc[account.subtype].push(account);
      return acc;
    }, {} as Record<string, typeof accounts>);

    return (
      <Card key={type} className="mb-4">
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleType(type)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
              <CardTitle className="text-base md:text-lg">{getTypeLabel(type)}</CardTitle>
              <Badge variant="secondary">{accounts.length} accounts</Badge>
            </div>
            <div className="text-right">
              <div className="font-bold">{formatCurrency(total)}</div>
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent>
            {Object.entries(accountsBySubtype).map(([subtype, subtypeAccounts]) => (
              <div key={subtype} className="mb-4">
                <div className="flex items-center justify-between mb-2 pb-2 border-b">
                  <h4 className="font-medium text-sm text-gray-700">{subtype}</h4>
                  <span className="text-sm font-medium">
                    {formatCurrency(subtypeAccounts.reduce((sum, acc) => sum + acc.balance, 0))}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {subtypeAccounts.map((account) => (
                    <div 
                      key={account.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-2"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-gray-600">{account.code}</span>
                          <span className="font-medium text-sm">
                            {language === 'ar' ? account.nameAr : account.name}
                          </span>
                          {account.isActive && (
                            <Badge variant="outline" className="text-xs border-green-600 text-green-600">
                              ✅
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-medium text-sm ${account.balance < 0 ? 'text-red-600' : ''}`}>
                          {formatCurrency(account.balance)}
                        </span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <span className="text-xs">{t('accounting.viewLedger')}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {t('accounting.chartOfAccounts')}
            </CardTitle>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {t('accounting.addAccount')}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={`${t('accounting.search')} accounts...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Groups */}
      <div>
        {(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const).map(type => 
          renderAccountGroup(type)
        )}
      </div>
    </div>
  );
}
