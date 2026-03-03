import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ShoppingBag, 
  Users, 
  Package, 
  ClipboardList,
  TrendingUp
} from 'lucide-react';
import { User, Farm } from '../types';
import { mockFarms } from '../mockData';
import CustomerManagement from './sales/CustomerManagement';
import HarvestedInventoryView from './sales/HarvestedInventoryView';
import SalesOrderList from './sales/SalesOrderList';

interface SalesModuleProps {
  user: User;
  selectedFarm: Farm | null;
}

export default function SalesModule({ user, selectedFarm }: SalesModuleProps) {
  const currentFarm = selectedFarm || mockFarms[0];
  const [activeTab, setActiveTab] = useState('orders');

  // Mock statistics
  const stats = {
    totalOrders: 45,
    pendingOrders: 8,
    totalRevenue: 156750,
    availableStock: 2450
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Top Navigation Bar */}
      <div className="bg-[#0A4D68] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" />
            <span className="text-xl font-semibold">Sales Management</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">{currentFarm.name}</span>
            <div className="w-10 h-10 rounded-full bg-[#088395] flex items-center justify-center font-semibold">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
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
                  <p className="text-2xl font-bold text-[#F59E0B]">{stats.pendingOrders}</p>
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
                  <p className="text-2xl font-bold text-[#10B981]">{stats.totalRevenue.toLocaleString()} EGP</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.availableStock} kg</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center">
                  <Package className="w-6 h-6 text-[#EF4444]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white">
            <TabsTrigger value="orders">Sales Orders</TabsTrigger>
            <TabsTrigger value="inventory">Harvested Stock</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <SalesOrderList user={user} selectedFarm={currentFarm} />
          </TabsContent>

          <TabsContent value="inventory">
            <HarvestedInventoryView user={user} selectedFarm={currentFarm} />
          </TabsContent>

          <TabsContent value="customers">
            <CustomerManagement user={user} selectedFarm={currentFarm} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
