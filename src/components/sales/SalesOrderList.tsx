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
  Package
} from 'lucide-react';
import { User, Farm, SalesOrder, SalesOrderStatus } from '../../types';

interface SalesOrderListProps {
  user: User;
  selectedFarm: Farm;
}

export default function SalesOrderList({ user, selectedFarm }: SalesOrderListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

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
          quantityKg: 50,
          pricePerKg: 50,
          totalPrice: 2500
        },
        {
          id: 'line-002',
          harvestedInventoryId: 'harv-inv-002',
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
                          <span className="font-medium">{item.quantityKg} kg @ {item.pricePerKg} EGP/kg</span>
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
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
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
                  <Select>
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
                  <Input type="date" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Order Items</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Select items from Harvested Stock tab</p>
                <Button size="sm" className="mt-2" variant="outline">
                  Browse Inventory
                </Button>
              </div>
            </div>

            <div>
              <Label>Order Notes</Label>
              <Textarea 
                placeholder="Delivery instructions or special requirements..."
                rows={3}
              />
            </div>

            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Order Total:</span>
                <span className="text-[#0A4D68]">0 EGP</span>
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
