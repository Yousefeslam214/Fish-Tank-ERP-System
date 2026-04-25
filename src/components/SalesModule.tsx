import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  ShoppingBag,
  Package,
  ClipboardList,
  TrendingUp,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { User, Farm } from '../types';
import { mockFarms } from '../mockData';
import CustomerManagement from './sales/CustomerManagement';
import SalesOrderList from './sales/SalesOrderList';
import { getSalesDashboardMetrics } from '../services/salesApi';
import { Button } from './ui/button';

interface SalesModuleProps {
  user: User;
  selectedFarm: Farm | null;
  allowedPages?: string[];
  onNavigateToPage?: (page: string) => void;
}

const normalizeErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Failed to load sales dashboard data.';
};

export default function SalesModule({ user, selectedFarm, allowedPages = [], onNavigateToPage }: SalesModuleProps) {
  const currentFarm = selectedFarm || mockFarms[0];
  const canOpenHarvest = allowedPages.includes('harvest');
  const [activeTab, setActiveTab] = useState('orders');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    availableStock: 0,
  });

  const refreshStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError(null);

    try {
      const response = await getSalesDashboardMetrics();
      setStats(response);
    } catch (error) {
      setStatsError(normalizeErrorMessage(error));
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats, refreshKey]);

  const handleDataChanged = () => {
    setRefreshKey((previous) => previous + 1);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="bg-[#0A4D68] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" />
            <span className="text-xl font-semibold">Sales Management</span>
          </div>
          <div className="flex items-center gap-4">
            {canOpenHarvest && (
              <Button
                type="button"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                onClick={() => onNavigateToPage?.('harvest')}
              >
                Go to Harvest
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            <span className="text-sm">{currentFarm.name}</span>
            <div className="w-10 h-10 rounded-full bg-[#088395] flex items-center justify-center font-semibold">
              {user.name
                .split(' ')
                .map((namePart) => namePart[0])
                .join('')
                .toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {statsError && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 text-sm text-red-700">{statsError}</CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.totalOrders}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#E0F4F5] flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-[#088395]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-[#F59E0B]">
                    {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.pendingOrders}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-[#F59E0B]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-[#10B981]">
                    {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : `${stats.totalRevenue.toLocaleString()} EGP`}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#D1FAE5] flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#10B981]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available Stock</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : `${stats.availableStock} kg`}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center">
                  <Package className="w-6 h-6 text-[#EF4444]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white">
            <TabsTrigger value="orders">Sales Orders</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <SalesOrderList
              user={user}
              selectedFarm={currentFarm}
              onOrdersChanged={handleDataChanged}
            />
          </TabsContent>

          <TabsContent value="customers">
            <CustomerManagement
              user={user}
              selectedFarm={currentFarm}
              onCustomersChanged={handleDataChanged}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
