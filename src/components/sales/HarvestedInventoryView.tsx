import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Package, Fish as FishIcon, Calendar, AlertTriangle, Plus } from 'lucide-react';
import { User, Farm, HarvestedInventory, StorageType } from '../../types';

interface HarvestedInventoryViewProps {
  user: User;
  selectedFarm: Farm;
}

export default function HarvestedInventoryView({ user, selectedFarm }: HarvestedInventoryViewProps) {
  const [filterStorage, setFilterStorage] = useState<string>('ALL');
  const [filterExpiry, setFilterExpiry] = useState<string>('ALL');

  // Mock harvested inventory with updated schema
  const inventory: HarvestedInventory[] = [
    {
      id: 'harv-inv-001',
      fishType: {
        id: 'tilapia-001',
        name: 'Nile Tilapia',
        scientificName: 'Oreochromis niloticus',
        arabicName: 'البلطي النيلي',
        tempMin: 20,
        tempOptimal: 28,
        tempMax: 32,
        doMin: 3,
        doSafe: 5,
        phMin: 6.5,
        phMax: 8.5,
        nh3Safe: 0.02,
        nh3Critical: 0.05,
        no2Max: 0.2,
        fcrMin: 1.2,
        fcrMax: 1.8,
        survivalRate: 85,
        isActive: true
      },
      gradePricing: {
        id: 'grade-super-001',
        fishTypeId: 'tilapia-001',
        gradeName: 'Super',
        minWeight: 300,
        maxWeight: 500,
        numOfFishInKilo: 2.5,
        pricePerKg: 50,
        isWaste: false,
        isActive: true
      },
      weight: 120,
      storageType: 'FRESH',
      expiryDate: new Date('2026-02-17'),
      harvestedAt: new Date('2026-02-15'),
      createdAt: new Date('2026-02-15'),
      updatedAt: new Date('2026-02-15')
    },
    {
      id: 'harv-inv-002',
      fishType: {
        id: 'tilapia-001',
        name: 'Nile Tilapia',
        scientificName: 'Oreochromis niloticus',
        arabicName: 'البلطي النيلي',
        tempMin: 20,
        tempOptimal: 28,
        tempMax: 32,
        doMin: 3,
        doSafe: 5,
        phMin: 6.5,
        phMax: 8.5,
        nh3Safe: 0.02,
        nh3Critical: 0.05,
        no2Max: 0.2,
        fcrMin: 1.2,
        fcrMax: 1.8,
        survivalRate: 85,
        isActive: true
      },
      gradePricing: {
        id: 'grade-1-001',
        fishTypeId: 'tilapia-001',
        gradeName: 'Grade 1',
        minWeight: 200,
        maxWeight: 300,
        numOfFishInKilo: 3.5,
        pricePerKg: 45,
        isWaste: false,
        isActive: true
      },
      weight: 200,
      storageType: 'FRESH',
      expiryDate: new Date('2026-02-16'),
      harvestedAt: new Date('2026-02-14'),
      createdAt: new Date('2026-02-14'),
      updatedAt: new Date('2026-02-14')
    },
    {
      id: 'harv-inv-003',
      fishType: {
        id: 'seabass-001',
        name: 'European Seabass',
        scientificName: 'Dicentrarchus labrax',
        arabicName: 'القاروص الأوروبي',
        tempMin: 15,
        tempOptimal: 22,
        tempMax: 28,
        doMin: 5,
        doSafe: 6,
        phMin: 7.5,
        phMax: 8.5,
        nh3Safe: 0.01,
        nh3Critical: 0.03,
        no2Max: 0.1,
        fcrMin: 1.0,
        fcrMax: 1.5,
        survivalRate: 90,
        isActive: true
      },
      gradePricing: {
        id: 'grade-premium-001',
        fishTypeId: 'seabass-001',
        gradeName: 'Premium',
        minWeight: 400,
        maxWeight: 600,
        numOfFishInKilo: 2,
        pricePerKg: 85,
        isWaste: false,
        isActive: true
      },
      weight: 85,
      storageType: 'ICED',
      expiryDate: new Date('2026-02-20'),
      harvestedAt: new Date('2026-02-13'),
      createdAt: new Date('2026-02-13'),
      updatedAt: new Date('2026-02-13')
    }
  ];

  const getDaysUntilExpiry = (expiryDate: Date) => {
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getExpiryBadge = (expiryDate: Date) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) {
      return <Badge className="bg-[#EF4444] text-white text-xs">Expired</Badge>;
    } else if (days <= 2) {
      return <Badge className="bg-[#EF4444] text-white text-xs">Urgent ({days}d)</Badge>;
    } else if (days <= 7) {
      return <Badge className="bg-[#F59E0B] text-white text-xs">Soon ({days}d)</Badge>;
    } else {
      return <Badge className="bg-[#10B981] text-white text-xs">Good ({days}d)</Badge>;
    }
  };

  const getStorageBadge = (storage: StorageType) => {
    const colors = {
      FRESH: 'bg-[#10B981]',
      ICED: 'bg-[#3B82F6]',
      FROZEN: 'bg-[#8B5CF6]'
    };
    return <Badge className={`${colors[storage]} text-white text-xs`}>{storage}</Badge>;
  };

  const filteredInventory = inventory.filter((item) => {
    if (filterStorage !== 'ALL' && item.storageType !== filterStorage) return false;
    if (filterExpiry !== 'ALL') {
      const days = getDaysUntilExpiry(item.expiryDate);
      if (filterExpiry === 'URGENT' && days > 2) return false;
      if (filterExpiry === 'SOON' && (days <= 2 || days > 7)) return false;
      if (filterExpiry === 'GOOD' && days <= 7) return false;
    }
    return true;
  });

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
              <SelectItem value="URGENT">Urgent (&lt; 2d)</SelectItem>
              <SelectItem value="SOON">Soon (2-7d)</SelectItem>
              <SelectItem value="GOOD">Good (&gt; 7d)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {inventory.reduce((sum, item) => sum + item.weight, 0)} kg
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-[#10B981]">
                {inventory.reduce((sum, item) => sum + (item.weight * item.gradePricing.pricePerKg), 0).toLocaleString()} EGP
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Urgent Items</p>
              <p className="text-2xl font-bold text-[#EF4444]">
                {inventory.filter(item => getDaysUntilExpiry(item.expiryDate) <= 2).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInventory.map((item) => (
          <Card key={item.id} className="bg-white shadow-sm border-l-4 border-l-[#088395]">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.fishType.name}</h3>
                  <p className="text-sm text-gray-600">{item.gradePricing.gradeName} ({item.gradePricing.minWeight}-{item.gradePricing.maxWeight}g)</p>
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
                  <span className="font-semibold text-[#10B981]">{item.gradePricing.pricePerKg} EGP/kg</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Value:</span>
                  <span className="font-semibold text-[#10B981]">
                    {(item.weight * item.gradePricing.pricePerKg).toLocaleString()} EGP
                  </span>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {getStorageBadge(item.storageType)}
                {getExpiryBadge(item.expiryDate)}
              </div>

              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Harvested: {item.harvestedAt.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Expires: {item.expiryDate.toLocaleDateString()}</span>
                </div>
              </div>

              {getDaysUntilExpiry(item.expiryDate) <= 2 && (
                <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-lg p-2 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#F59E0B] mt-0.5" />
                  <p className="text-xs text-[#92400E]">
                    Urgent! Expires in {getDaysUntilExpiry(item.expiryDate)} day(s). Consider selling soon.
                  </p>
                </div>
              )}

              <Button 
                className="w-full bg-[#088395] hover:bg-[#0A4D68]"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add to Order
              </Button>
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
    </div>
  );
}
