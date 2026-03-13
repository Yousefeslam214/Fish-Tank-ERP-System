import { useState, useContext, createContext } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { User, Farm } from '../../types';
import { AccountingDashboard } from './AccountingDashboard';
import { JournalEntriesList } from './JournalEntriesList';
import { ChartOfAccounts } from './ChartOfAccounts';
import { ProfitLossStatement } from './ProfitLossStatement';
import { BalanceSheet } from './BalanceSheet';
import { ExpensesDashboard } from './ExpensesDashboard';
import { ResponsivePageLayout } from '../ResponsivePageLayout';
import { ResponsivePageHeader } from '../ResponsivePageHeader';
import { translations, Language } from '../../i18n/translations';
import { 
  DollarSign, 
  FileText, 
  BookOpen, 
  TrendingUp, 
  Scale,
  Receipt
} from 'lucide-react';

interface AccountingModuleProps {
  user: User;
  selectedFarm: Farm | null;
  language?: Language;
}

interface AccountingContextType {
  user: User;
  selectedFarm: Farm | null;
  language: Language;
  t: (key: string) => string;
}

const AccountingContext = createContext<AccountingContextType | null>(null);

export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) throw new Error('useAccounting must be used within AccountingProvider');
  return context;
};

export default function AccountingModule({ user, selectedFarm, language = 'en' }: AccountingModuleProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const contextValue: AccountingContextType = {
    user,
    selectedFarm,
    language,
    t
  };

  return (
    <AccountingContext.Provider value={contextValue}>
      <ResponsivePageLayout>
        <ResponsivePageHeader
          icon={<DollarSign className="w-6 h-6 md:w-8 md:h-8" />}
          title={t('accounting.title')}
          subtitle={t('accounting.subtitle')}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex min-w-full md:min-w-0">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">{t('accounting.dashboard')}</span>
                <span className="sm:hidden">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="journal" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">{t('accounting.journalEntries')}</span>
                <span className="sm:hidden">Journal</span>
              </TabsTrigger>
              <TabsTrigger value="accounts" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">{t('accounting.chartOfAccounts')}</span>
                <span className="sm:hidden">Accounts</span>
              </TabsTrigger>
              <TabsTrigger value="pl" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">{t('accounting.profitLoss')}</span>
                <span className="sm:hidden">P&L</span>
              </TabsTrigger>
              <TabsTrigger value="balance" className="flex items-center gap-2">
                <Scale className="w-4 h-4" />
                <span className="hidden sm:inline">{t('accounting.balanceSheet')}</span>
                <span className="sm:hidden">Balance</span>
              </TabsTrigger>
              <TabsTrigger value="expenses" className="flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                <span className="hidden sm:inline">{t('accounting.expenses')}</span>
                <span className="sm:hidden">Expenses</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard">
            <AccountingDashboard />
          </TabsContent>

          <TabsContent value="journal">
            <JournalEntriesList />
          </TabsContent>

          <TabsContent value="accounts">
            <ChartOfAccounts />
          </TabsContent>

          <TabsContent value="pl">
            <ProfitLossStatement />
          </TabsContent>

          <TabsContent value="balance">
            <BalanceSheet />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpensesDashboard />
          </TabsContent>
        </Tabs>
      </ResponsivePageLayout>
    </AccountingContext.Provider>
  );
}

export { AccountingContext };
