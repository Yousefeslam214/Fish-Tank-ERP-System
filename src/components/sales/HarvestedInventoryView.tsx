import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Package, Fish as FishIcon, Calendar, Loader2 } from 'lucide-react';
import { User, Farm } from '../../types';
import {
  findHarvestedInventory,
  getHarvestedInventorySummary,
  getSalesStockDashboard,
  HarvestedStockDashboardRecord,
  HarvestedStockItemRecord,
} from '../../services/salesApi';

interface HarvestedInventoryViewProps {
  user?: User;
  selectedFarm?: Farm | null;
  refreshKey?: number;
}

const normalizeErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Unable to load harvested inventory.';
};

const safeDate = (value?: string): Date | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function HarvestedInventoryView({ refreshKey = 0 }: HarvestedInventoryViewProps) {
  const [filterStorage, setFilterStorage] = useState<string>('ALL');
  const [filterExpiry, setFilterExpiry] = useState<string>('ALL');
  const [filterTank, setFilterTank] = useState<string>('ALL');

  const [inventory, setInventory] = useState<HarvestedStockItemRecord[]>([]);
  const [summary, setSummary] = useState<HarvestedStockDashboardRecord>({
    totalStock: 0,
    totalValue: 0,
    urgentItems: 0,
    stockItems: [],
  });

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getDaysUntilExpiry = (item: HarvestedStockItemRecord) => {
    if (typeof item.expiryCountdown === 'number') {
      return item.expiryCountdown;
    }

    const expiry = safeDate(item.expiryDate);
    if (!expiry) {
      return 0;
    }

    return Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const loadInventoryData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [findResponse, summaryResponse, stockDashboard] = await Promise.all([
        findHarvestedInventory({
          storageType: filterStorage !== 'ALL' ? filterStorage : undefined,
          tankId: filterTank !== 'ALL' ? filterTank : undefined,
        }),
        getHarvestedInventorySummary(),
        getSalesStockDashboard(),
      ]);

      setInventory(findResponse);

      const mergedStockItems =
        summaryResponse.stockItems.length > 0
          ? summaryResponse.stockItems
          : stockDashboard.stockItems.length > 0
          ? stockDashboard.stockItems
          : findResponse;

      setSummary({
        totalStock:
          summaryResponse.totalStock ||
          stockDashboard.totalStock ||
          mergedStockItems.reduce((sum, item) => sum + item.weight, 0),
        totalValue:
          summaryResponse.totalValue ||
          stockDashboard.totalValue ||
          mergedStockItems.reduce((sum, item) => sum + item.totalValue, 0),
        urgentItems:
          summaryResponse.urgentItems ||
          stockDashboard.urgentItems ||
          mergedStockItems.filter((item) => getDaysUntilExpiry(item) <= 2).length,
        stockItems: mergedStockItems,
      });
    } catch (error) {
      setErrorMessage(normalizeErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [filterStorage, filterTank]);

  useEffect(() => {
    void loadInventoryData();
  }, [loadInventoryData, refreshKey]);

  const tankOptions = useMemo(() => {
    const source = inventory.length > 0 ? inventory : summary.stockItems;
    const unique = new Map<string, string>();

    source.forEach((item) => {
      if (item.tankId) {
        unique.set(item.tankId, item.tankName || item.tankId);
      }
    });

    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [inventory, summary.stockItems]);

  const filteredInventory = useMemo(
    () =>
      inventory.filter((item) => {
        const expiryDays = getDaysUntilExpiry(item);

        if (filterExpiry === 'URGENT' && expiryDays > 2) {
          return false;
        }
        if (filterExpiry === 'SOON' && (expiryDays <= 2 || expiryDays > 7)) {
          return false;
        }
        if (filterExpiry === 'GOOD' && expiryDays <= 7) {
          return false;
        }
        return true;
      }),
    [filterExpiry, inventory],
  );

  const getStorageBadge = (storage: string) => {
    const colors: Record<string, string> = {
      FRESH: 'bg-[#10B981]',
      ICED: 'bg-[#3B82F6]',
      FROZEN: 'bg-[#8B5CF6]',
    };
    return <Badge className={`${colors[storage] || 'bg-gray-500'} text-white text-xs`}>{storage}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Harvested Stock</h2>
        <div className="flex gap-2">
          <Select value={filterStorage} onValueChange={setFilterStorage}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Storage</SelectItem>
              <SelectItem value="FRESH">Fresh</SelectItem>
              <SelectItem value="ICED">Iced</SelectItem>
              <SelectItem value="FROZEN">Frozen</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterExpiry} onValueChange={setFilterExpiry}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Expiry</SelectItem>
              <SelectItem value="URGENT">Urgent (&lt;= 2d)</SelectItem>
              <SelectItem value="SOON">Soon (2-7d)</SelectItem>
              <SelectItem value="GOOD">Good (&gt; 7d)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterTank} onValueChange={setFilterTank}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Tanks</SelectItem>
              {tankOptions.map((tank) => (
                <SelectItem key={tank.id} value={tank.id}>
                  {tank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {errorMessage && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-sm text-red-700 flex items-center justify-between">
            <span>{errorMessage}</span>
            <Button variant="outline" size="sm" onClick={() => void loadInventoryData()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `${summary.totalStock} kg`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-[#10B981]">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `${summary.totalValue.toLocaleString()} EGP`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : inventory.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card className="bg-white shadow-sm">
          <CardContent className="p-8 text-center text-gray-600 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading harvested inventory...</span>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInventory.map((item) => (
              <Card key={item.id} className="bg-white shadow-sm border-l-4 border-l-[#088395]">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{item.fishType}</h3>
                        {item.tankName && (
                          <Badge variant="outline" className="text-xs">
                            {item.tankName}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{item.grade}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#E0F4F5] flex items-center justify-center">
                      <FishIcon className="w-5 h-5 text-[#088395]" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Weight:</span>
                      <span className="font-semibold text-lg">{item.weight} kg</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Price:</span>
                      <span className="font-semibold text-[#10B981]">{item.price} EGP/kg</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Value:</span>
                      <span className="font-semibold text-[#10B981]">{item.totalValue.toLocaleString()} EGP</span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {getStorageBadge(item.storageType)}
                  </div>

                  <div className="space-y-1 text-xs text-gray-600">
                    {item.harvestedAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Harvested: {new Date(item.harvestedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>

          {filteredInventory.length === 0 && (
            <Card className="bg-white shadow-sm">
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No harvested inventory found matching your filters.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
