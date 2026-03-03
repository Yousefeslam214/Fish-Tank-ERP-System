import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Plus, 
  CheckCircle, 
  Clock, 
  XCircle,
  Calendar,
  User as UserIcon,
  Package,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { User, Farm, SalesOrder, SalesOrderStatus } from '../../types';

interface SalesOrderListProps {
  user: User;
  selectedFarm: Farm;
}

export default function SalesOrderList({ user, selectedFarm }: SalesOrderListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  
  // New Order Form State
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<Array<{
    inventoryId: string;
    tankId: string;
    fishName: string;
    gradeName: string;
    availableKg: number;
    pricePerKg: number;
    selectedKg: number;
  }>>([]);

  // Mock harvested inventory available for sale
  const availableInventory = [
    {
      id: 'harv-inv-001',
      tankId: 'tank-a05',
      tankName: 'Tank A05',
      fishType: 'Nile Tilapia',
      gradeName: 'Super',
      availableKg: 120,
      pricePerKg: 50,
      expiryDays: 2
    },
    {
      id: 'harv-inv-002',
      tankId: 'tank-a05',
      tankName: 'Tank A05',
      fishType: 'Nile Tilapia',
      gradeName: 'Grade 1',
      availableKg: 200,
      pricePerKg: 45,
      expiryDays: 1
    },
    {
      id: 'harv-inv-003',
      tankId: 'tank-b03',
      tankName: 'Tank B03',
      fishType: 'European Seabass',
      gradeName: 'Premium',
      availableKg: 85,
      pricePerKg: 85,
      expiryDays: 7
    },
    {
      id: 'harv-inv-004',
      tankId: 'tank-c01',
      tankName: 'Tank C01',
      fishType: 'Nile Tilapia',
      gradeName: 'Grade 2',
      availableKg: 150,
      pricePerKg: 40,
      expiryDays: 3
    }
  ];

  // Mock sales orders
  const orders: SalesOrder[] = [
    {
      id: 'so-001',
      orderNumber: 'SO-2026-0045',
      customerId: 'cust-001',
      customer: {
        id: 'cust-001',
        name: 'Cairo Fresh Fish Market',
        contactPerson: 'Ahmed Hassan',
        phone: '+20 100 123 4567',
        email: 'ahmed@cairofresh.com',
        customerType: 'WHOLESALER',
        outstandingBalance: 0,
        isActive: true,
        createdAt: new Date('2025-01-15')
      },
      orderDate: new Date('2026-02-12'),
      deliveryDate: new Date('2026-02-13'),
      status: 'PENDING',
      lineItems: [
        {
          id: 'line-001',
          harvestedInventoryId: 'harv-inv-001',
          tankId: 'tank-a05',
          quantityKg: 50,
          pricePerKg: 50,
          totalPrice: 2500
        },
        {
          id: 'line-002',
          harvestedInventoryId: 'harv-inv-002',
          tankId: 'tank-a05',
          quantityKg: 30,
          pricePerKg: 45,
          totalPrice: 1350
        }
      ],
      totalAmount: 3850,
      notes: 'Deliver to main warehouse',
      createdBy: user.id,
      createdAt: new Date('2026-02-12')
    },
    {
      id: 'so-002',
      orderNumber: 'SO-2026-0044',
      customerId: 'cust-002',
      customer: {
        id: 'cust-002',
        name: 'Mediterranean Seafood Restaurant',
        contactPerson: 'Maria Ibrahim',
        phone: '+20 100 234 5678',
        customerType: 'RESTAURANT',
        outstandingBalance: 3500,
        isActive: true,
        createdAt: new Date('2025-02-01')
      },
      orderDate: new Date('2026-02-10'),
      deliveryDate: new Date('2026-02-11'),
      status: 'FULFILLED',
      lineItems: [
        {
          id: 'line-003',
          harvestedInventoryId: 'harv-inv-003',
          tankId: 'tank-b03',
          quantityKg: 25,
          pricePerKg: 85,
          totalPrice: 2125
        }
      ],
      totalAmount: 2125,
      createdBy: user.id,
      createdAt: new Date('2026-02-10')
    },
    {
      id: 'so-003',
      orderNumber: 'SO-2026-0043',
      customerId: 'cust-003',
      customer: {
        id: 'cust-003',
        name: 'Delta Fish Retailers Co.',
        phone: '+20 100 345 6789',
        customerType: 'RETAILER',
        outstandingBalance: 0,
        isActive: true,
        createdAt: new Date('2025-01-20')
      },
      orderDate: new Date('2026-02-08'),
      status: 'CANCELLED',
      lineItems: [],
      totalAmount: 0,
      notes: 'Customer cancelled - out of business',
      createdBy: user.id,
      createdAt: new Date('2026-02-08')
    }
  ];

  const getStatusColor = (status: SalesOrderStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-[#F59E0B] text-white';
      case 'FULFILLED': return 'bg-[#10B981] text-white';
      case 'CANCELLED': return 'bg-[#EF4444] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: SalesOrderStatus) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'FULFILLED': return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTankName = (tankId: string) => {
    const tankNames: Record<string, string> = {
      'tank-a05': 'Tank A05',
      'tank-b03': 'Tank B03',
      'tank-c01': 'Tank C01'
    };
    return tankNames[tankId] || tankId;
  };

  // Add item to order
  const addItemToOrder = (inventory: typeof availableInventory[0]) => {
    const existing = selectedItems.find(item => item.inventoryId === inventory.id);
    if (existing) {
      // Update quantity
      setSelectedItems(selectedItems.map(item =>
        item.inventoryId === inventory.id
          ? { ...item, selectedKg: Math.min(item.selectedKg + 10, item.availableKg) }
          : item
      ));
    } else {
      // Add new item
      setSelectedItems([...selectedItems, {
        inventoryId: inventory.id,
        tankId: inventory.tankId,
        fishName: inventory.fishType,
        gradeName: inventory.gradeName,
        availableKg: inventory.availableKg,
        pricePerKg: inventory.pricePerKg,
        selectedKg: 10
      }]);
    }
  };

  // Update item quantity
  const updateItemQuantity = (inventoryId: string, quantity: number) => {
    setSelectedItems(selectedItems.map(item =>
      item.inventoryId === inventoryId
        ? { ...item, selectedKg: Math.min(Math.max(0, quantity), item.availableKg) }
        : item
    ).filter(item => item.selectedKg > 0));
  };

  // Remove item from order
  const removeItem = (inventoryId: string) => {
    setSelectedItems(selectedItems.filter(item => item.inventoryId !== inventoryId));
  };

  // Calculate total
  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.selectedKg * item.pricePerKg), 0);
  };

  // Create order
  const handleCreateOrder = () => {
    if (!selectedCustomer || selectedItems.length === 0) {
      alert('Please select a customer and add items to the order');
      return;
    }
    
    alert(`Order created successfully!\nCustomer: ${selectedCustomer}\nTotal Items: ${selectedItems.length}\nTotal Amount: ${calculateTotal().toLocaleString()} EGP`);
    
    // Reset form
    setSelectedCustomer('');
    setDeliveryDate('');
    setOrderNotes('');
    setSelectedItems([]);
    setShowCreateModal(false);
  };

  // Reset form when modal closes
  const handleCloseModal = (open: boolean) => {
    setShowCreateModal(open);
    if (!open) {
      setSelectedCustomer('');
      setDeliveryDate('');
      setOrderNotes('');
      setSelectedItems([]);
    }
  };

  const filteredOrders = filterStatus === 'ALL' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Sales Orders</h2>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="FULFILLED">Fulfilled</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            className="bg-[#088395] hover:bg-[#0A4D68]"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{order.status}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      <span>{order.customer?.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Order: {order.orderDate.toLocaleDateString()}</span>
                    </div>
                    {order.deliveryDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Delivery: {order.deliveryDate.toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#0A4D68]">{order.totalAmount.toLocaleString()} EGP</p>
                  <p className="text-xs text-gray-500">{order.lineItems.length} item(s)</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {order.lineItems.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-gray-700">Line Items:</p>
                  {order.lineItems.map((item) => (
                    <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="font-medium">{item.quantityKg} kg @ {item.pricePerKg} EGP/kg</span>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="outline" className="text-xs">{getTankName(item.tankId)}</Badge>
                            </div>
                          </div>
                        </div>
                        <span className="font-semibold text-[#10B981]">
                          {item.totalPrice.toLocaleString()} EGP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {order.notes && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-xs text-gray-600 font-medium">Notes:</p>
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" variant="outline">View Details</Button>
                {order.status === 'PENDING' && (
                  <>
                    <Button size="sm" className="bg-[#10B981] hover:bg-[#059669]">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Fulfill
                    </Button>
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" variant="destructive">
                      <XCircle className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </>
                )}
                {order.status === 'FULFILLED' && (
                  <Button size="sm" variant="outline">Print Invoice</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card className="bg-white shadow-sm">
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No orders found matching your filter.</p>
          </CardContent>
        </Card>
      )}

      {/* Create Order Modal - Simplified */}
      <Dialog open={showCreateModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Sales Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Select Customer *</Label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cust-001">Cairo Fresh Fish Market</SelectItem>
                      <SelectItem value="cust-002">Mediterranean Seafood Restaurant</SelectItem>
                      <SelectItem value="cust-003">Delta Fish Retailers Co.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Delivery Date</Label>
                  <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Order Items</h3>
              
              {/* Available Inventory to Add */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Available Harvested Stock:</Label>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                  {availableInventory.map((inv) => {
                    const isAdded = selectedItems.find(item => item.inventoryId === inv.id);
                    return (
                      <div key={inv.id} className="bg-white border rounded-lg p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{inv.fishType} - {inv.gradeName}</span>
                            <Badge variant="outline" className="text-xs">{inv.tankName}</Badge>
                            {inv.expiryDays <= 2 && (
                              <Badge className="bg-[#EF4444] text-white text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Urgent
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Available: {inv.availableKg} kg @ {inv.pricePerKg} EGP/kg • Expires in {inv.expiryDays}d
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          variant={isAdded ? "outline" : "default"}
                          className={!isAdded ? "bg-[#088395] hover:bg-[#0A4D68]" : ""}
                          onClick={() => addItemToOrder(inv)}
                          disabled={!!isAdded}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          {isAdded ? 'Added' : 'Add'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Items */}
              {selectedItems.length > 0 && (
                <div className="space-y-2 mt-4">
                  <Label className="text-sm font-medium">Selected Items ({selectedItems.length}):</Label>
                  <div className="space-y-2">
                    {selectedItems.map((item) => (
                      <div key={item.inventoryId} className="bg-[#E0F4F5] border border-[#088395] rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{item.fishName} - {item.gradeName}</span>
                              <Badge variant="outline" className="text-xs">{getTankName(item.tankId)}</Badge>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Available: {item.availableKg} kg @ {item.pricePerKg} EGP/kg
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
                            onClick={() => removeItem(item.inventoryId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Quantity (kg):</Label>
                          <Input
                            type="number"
                            min="1"
                            max={item.availableKg}
                            value={item.selectedKg}
                            onChange={(e) => updateItemQuantity(item.inventoryId, parseFloat(e.target.value) || 0)}
                            className="w-24 h-8 text-sm"
                          />
                          <span className="text-xs text-gray-600">/ {item.availableKg} kg</span>
                          <span className="ml-auto font-semibold text-[#10B981]">
                            {(item.selectedKg * item.pricePerKg).toLocaleString()} EGP
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedItems.length === 0 && (
                <div className="bg-gray-50 p-4 rounded-lg text-center border border-dashed border-gray-300">
                  <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No items selected. Click "Add" to select items from available stock.</p>
                </div>
              )}
            </div>

            <div>
              <Label>Order Notes</Label>
              <Textarea 
                placeholder="Delivery instructions or special requirements..."
                rows={3}
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
              />
            </div>

            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Order Total:</span>
                <span className="text-[#0A4D68]">{calculateTotal().toLocaleString()} EGP</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-[#088395] hover:bg-[#0A4D68]"
                onClick={handleCreateOrder}
              >
                Create Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}