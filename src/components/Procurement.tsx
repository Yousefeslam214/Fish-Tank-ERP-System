import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Fish as FishIcon,
  Wheat
} from 'lucide-react';
import { User, Farm } from '../types';
import { mockFarms } from '../mockData';

interface ProcurementProps {
  user: User;
  selectedFarm: Farm | null;
}

export default function Procurement({ user, selectedFarm }: ProcurementProps) {
  const [activeTab, setActiveTab] = useState('feed-orders');
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const currentFarm = selectedFarm || mockFarms[0];

  // Mock data for feed orders
  const feedOrders = [
    {
      id: 'PO-2026-0123',
      supplier: 'BioMar Egypt',
      orderDate: '2026-02-10',
      deliveryDate: '2026-02-12',
      status: 'DELIVERED',
      totalCost: 64500,
      items: [
        { id: '1', foodType: 'Grower 30% 3mm', quantityKg: 1000, unitCost: 42, status: 'RECEIVED', actualQuantityKg: 995 },
        { id: '2', foodType: 'Fingerling 32% 2mm', quantityKg: 500, unitCost: 45, status: 'PARTIALLY_RECEIVED', actualQuantityKg: 480 }
      ]
    },
    {
      id: 'PO-2026-0122',
      supplier: 'Al-Ahram Feed Co.',
      orderDate: '2026-02-05',
      deliveryDate: '2026-02-08',
      status: 'DELIVERED',
      totalCost: 42000,
      items: [
        { id: '1', foodType: 'Grower 28% 3mm', quantityKg: 1000, unitCost: 42, status: 'RECEIVED', actualQuantityKg: 1000 }
      ]
    },
    {
      id: 'PO-2026-0121',
      supplier: 'BioMar Egypt',
      orderDate: '2026-01-28',
      status: 'PENDING',
      totalCost: 85000,
      items: [
        { id: '1', foodType: 'Grower 30% 3mm', quantityKg: 2000, unitCost: 42.5, status: 'PENDING' }
      ]
    }
  ];

  // Mock data for fish orders
  const fishOrders = [
    {
      id: 'PO-FISH-2026-0045',
      supplier: 'Nile Tilapia Hatchery',
      orderDate: '2026-02-01',
      deliveryDate: '2026-02-05',
      status: 'DELIVERED',
      totalCost: 18000,
      items: [
        { id: '1', fishType: 'Nile Tilapia Fingerlings', quantity: 5000, totalCost: 18000, status: 'RECEIVED', actualQuantity: 4850 }
      ]
    },
    {
      id: 'PO-FISH-2026-0044',
      supplier: 'Delta Aquaculture',
      orderDate: '2026-01-15',
      status: 'PENDING',
      totalCost: 25000,
      items: [
        { id: '1', fishType: 'Mullet Fingerlings', quantity: 3000, totalCost: 25000, status: 'PENDING' }
      ]
    }
  ];

  // Mock suppliers
  const suppliers = [
    { id: '1', name: 'BioMar Egypt', email: 'sales@biomar.eg', phone: '+20 123 456 7890', items: ['FEED'] },
    { id: '2', name: 'Al-Ahram Feed Co.', email: 'info@ahramfeed.com', phone: '+20 123 456 7891', items: ['FEED'] },
    { id: '3', name: 'Nile Tilapia Hatchery', email: 'orders@nilehatchery.com', phone: '+20 123 456 7892', items: ['FINGERLINGS'] },
    { id: '4', name: 'Delta Aquaculture', email: 'sales@deltaaqua.eg', phone: '+20 123 456 7893', items: ['FINGERLINGS', 'FEED'] }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-[#10B981] text-white';
      case 'PENDING': return 'bg-[#F59E0B] text-white';
      case 'APPROVED': return 'bg-[#3B82F6] text-white';
      case 'CANCELLED': return 'bg-[#EF4444] text-white';
      case 'RECEIVED': return 'bg-[#10B981] text-white';
      case 'PARTIALLY_RECEIVED': return 'bg-[#F59E0B] text-white';
      case 'REJECTED': return 'bg-[#EF4444] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'RECEIVED':
        return <CheckCircle className="w-4 h-4" />;
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'CANCELLED':
      case 'REJECTED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Top Navigation Bar */}
      <div className="bg-[#0A4D68] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xl font-semibold">Procurement</span>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white">
            <TabsTrigger value="feed-orders">Feed Orders</TabsTrigger>
            <TabsTrigger value="fish-orders">Fish Orders</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          </TabsList>

          {/* Feed Orders Tab */}
          <TabsContent value="feed-orders" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Feed Purchase Orders</h2>
              <Button className="bg-[#088395] hover:bg-[#0A4D68]" onClick={() => setShowCreateOrder(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Feed Order
              </Button>
            </div>

            <div className="space-y-4">
              {feedOrders.map((order) => (
                <Card key={order.id} className="bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{order.id}</CardTitle>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{order.status}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Supplier: {order.supplier} · Order Date: {order.orderDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#0A4D68]">{order.totalCost.toLocaleString()} EGP</p>
                        {order.deliveryDate && (
                          <p className="text-xs text-gray-500">Delivered: {order.deliveryDate}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Items:</p>
                      {order.items.map((item) => (
                        <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.foodType}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                                <span>Ordered: {item.quantityKg} kg @ {item.unitCost} EGP/kg</span>
                                {item.actualQuantityKg && (
                                  <span className={item.actualQuantityKg < item.quantityKg ? 'text-yellow-700' : 'text-green-700'}>
                                    Actual: {item.actualQuantityKg} kg
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge className={getStatusColor(item.status) + ' text-xs'}>
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline">View Details</Button>
                      {order.status === 'PENDING' && (
                        <>
                          <Button size="sm" className="bg-[#10B981] hover:bg-[#059669]">Approve</Button>
                          <Button size="sm" variant="destructive">Cancel</Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Fish Orders Tab */}
          <TabsContent value="fish-orders" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Fish Purchase Orders</h2>
              <Button className="bg-[#088395] hover:bg-[#0A4D68]">
                <Plus className="w-4 h-4 mr-2" />
                New Fish Order
              </Button>
            </div>

            <div className="space-y-4">
              {fishOrders.map((order) => (
                <Card key={order.id} className="bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{order.id}</CardTitle>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{order.status}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Supplier: {order.supplier} · Order Date: {order.orderDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#0A4D68]">{order.totalCost.toLocaleString()} EGP</p>
                        {order.deliveryDate && (
                          <p className="text-xs text-gray-500">Delivered: {order.deliveryDate}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Items:</p>
                      {order.items.map((item) => (
                        <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.fishType}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                                <span>Ordered: {item.quantity.toLocaleString()} fish</span>
                                {item.actualQuantity && (
                                  <span className={item.actualQuantity < item.quantity ? 'text-yellow-700' : 'text-green-700'}>
                                    Actual: {item.actualQuantity.toLocaleString()} fish ({Math.round((item.actualQuantity / item.quantity) * 100)}%)
                                  </span>
                                )}
                                <span>Cost: {item.totalCost.toLocaleString()} EGP</span>
                              </div>
                            </div>
                            <Badge className={getStatusColor(item.status) + ' text-xs'}>
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline">View Details</Button>
                      {order.status === 'PENDING' && (
                        <>
                          <Button size="sm" className="bg-[#10B981] hover:bg-[#059669]">Approve</Button>
                          <Button size="sm" variant="destructive">Cancel</Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Suppliers</h2>
              <Button className="bg-[#088395] hover:bg-[#0A4D68]">
                <Plus className="w-4 h-4 mr-2" />
                Add Supplier
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((supplier) => (
                <Card key={supplier.id} className="bg-white shadow-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{supplier.name}</CardTitle>
                        <div className="flex gap-1 mt-2">
                          {supplier.items.map((item, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {item === 'FEED' ? <Wheat className="w-3 h-3 mr-1" /> : <FishIcon className="w-3 h-3 mr-1" />}
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[#E0F4F5] flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#088395]" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="font-medium">Email:</span>
                          <span>{supplier.email}</span>
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="font-medium">Phone:</span>
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">View Details</Button>
                      <Button size="sm" variant="outline">Edit</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Order Modal */}
      <Dialog open={showCreateOrder} onOpenChange={setShowCreateOrder}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Feed Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.filter(s => s.items.includes('FEED')).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Order Items</h4>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <Label className="text-xs">Food Type</Label>
                    <Select>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Grower 30% 3mm</SelectItem>
                        <SelectItem value="2">Grower 28% 3mm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Quantity (kg)</Label>
                    <Input type="number" placeholder="1000" className="h-9" />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Unit Cost (EGP)</Label>
                    <Input type="number" placeholder="42" className="h-9" />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total Cost:</span>
                <span className="text-[#0A4D68]">42,000 EGP</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateOrder(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-[#088395] hover:bg-[#0A4D68]">
                Create Purchase Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}