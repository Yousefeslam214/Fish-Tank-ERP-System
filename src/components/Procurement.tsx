import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Users,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Fish as FishIcon,
  Wheat,
  Loader2,
  Truck,
} from 'lucide-react';
import { User, Farm } from '../types';
import { mockFarms } from '../mockData';
import { getFishTypes } from '../services/fishTypesApi';
import { getFoodTypes } from '../services/foodTypesApi';
import {
  createFeedPurchaseOrder,
  createFishPurchaseOrder,
  createProcurementSupplier,
  FeedPurchaseOrderRecord,
  FishPurchaseOrderRecord,
  formatProcurementStatusLabel,
  getFeedPurchaseOrders,
  getFishPurchaseOrders,
  getProcurementSuppliers,
  normalizeProcurementStatus,
  ProcurementSupplierRecord,
  updateFeedPurchaseOrderDeliveryStatus,
  updateFeedPurchaseOrderItemStatus,
  updateFeedPurchaseOrderStatus,
  updateFishPurchaseOrderItemStatus,
  updateFishPurchaseOrderStatus,
} from '../services/procurementApi';

interface ProcurementProps {
  user: User;
  selectedFarm: Farm | null;
}

interface FeedOrderFormItem {
  foodTypeId: string;
  quantityKg: number;
  unitCost: number;
}

interface FishOrderFormItem {
  fishTypeId: string;
  quantity: number;
  unitCost: number;
}

const createFeedOrderItem = (): FeedOrderFormItem => ({
  foodTypeId: '',
  quantityKg: 0,
  unitCost: 0,
});

const createFishOrderItem = (): FishOrderFormItem => ({
  fishTypeId: '',
  quantity: 0,
  unitCost: 0,
});

const normalizeErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Unexpected error while processing procurement request.';
};

const formatCurrency = (value: number): string => `${value.toLocaleString()} EGP`;

export default function Procurement({ user, selectedFarm }: ProcurementProps) {
  const currentFarm = selectedFarm || mockFarms[0];

  const [activeTab, setActiveTab] = useState('feed-orders');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [feedOrders, setFeedOrders] = useState<FeedPurchaseOrderRecord[]>([]);
  const [fishOrders, setFishOrders] = useState<FishPurchaseOrderRecord[]>([]);
  const [suppliers, setSuppliers] = useState<ProcurementSupplierRecord[]>([]);

  const [foodTypes, setFoodTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [fishTypes, setFishTypes] = useState<Array<{ id: string; name: string }>>([]);

  const [showCreateFeedOrder, setShowCreateFeedOrder] = useState(false);
  const [showCreateFishOrder, setShowCreateFishOrder] = useState(false);
  const [showCreateSupplier, setShowCreateSupplier] = useState(false);

  const [feedOrderSupplierId, setFeedOrderSupplierId] = useState('');
  const [feedOrderItems, setFeedOrderItems] = useState<FeedOrderFormItem[]>([createFeedOrderItem()]);

  const [fishOrderSupplierId, setFishOrderSupplierId] = useState('');
  const [fishOrderItems, setFishOrderItems] = useState<FishOrderFormItem[]>([createFishOrderItem()]);

  const [supplierName, setSupplierName] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierItemType, setSupplierItemType] = useState('FOOD');

  const feedOrderTotal = useMemo(
    () => feedOrderItems.reduce((sum, item) => sum + item.quantityKg * item.unitCost, 0),
    [feedOrderItems],
  );

  const fishOrderTotal = useMemo(
    () => fishOrderItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
    [fishOrderItems],
  );

  const feedSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplier.items.includes('FOOD') || supplier.items.includes('FEED')),
    [suppliers],
  );

  const fishSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplier.items.includes('FISH') || supplier.items.includes('FINGERLINGS')),
    [suppliers],
  );

  const loadProcurementData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [feedOrdersData, fishOrdersData, suppliersData, foodTypesData, fishTypesData] = await Promise.all([
        getFeedPurchaseOrders({ offset: 0, limit: 100 }),
        getFishPurchaseOrders({ offset: 0, limit: 100 }),
        getProcurementSuppliers(),
        getFoodTypes(),
        getFishTypes(false),
      ]);

      setFeedOrders(feedOrdersData);
      setFishOrders(fishOrdersData);
      setSuppliers(suppliersData);
      setFoodTypes(foodTypesData.map((foodType) => ({ id: foodType.id, name: foodType.name })));
      setFishTypes(fishTypesData.map((fishType) => ({ id: fishType.id, name: fishType.name })));
    } catch (error) {
      setErrorMessage(normalizeErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProcurementData();
  }, [loadProcurementData]);

  const getStatusColor = (status: string) => {
    switch (normalizeProcurementStatus(status)) {
      case 'DELIVERED':
      case 'RECEIVED':
      case 'APPROVED':
        return 'bg-[#10B981] text-white';
      case 'PENDING':
      case 'SHIPPED':
      case 'PARTIALLY_RECEIVED':
        return 'bg-[#F59E0B] text-white';
      case 'CANCELLED':
      case 'CANCELED':
      case 'REJECTED':
      case 'RETURNED':
        return 'bg-[#EF4444] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (normalizeProcurementStatus(status)) {
      case 'DELIVERED':
      case 'RECEIVED':
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4" />;
      case 'PENDING':
      case 'SHIPPED':
      case 'PARTIALLY_RECEIVED':
        return <Clock className="w-4 h-4" />;
      case 'CANCELLED':
      case 'CANCELED':
      case 'REJECTED':
      case 'RETURNED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleOrderAction = async (action: () => Promise<void>, successMessage: string) => {
    try {
      setSubmitting(true);
      await action();
      await loadProcurementData();
      window.alert(successMessage);
    } catch (error) {
      window.alert(normalizeErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const resetFeedOrderForm = () => {
    setFeedOrderSupplierId('');
    setFeedOrderItems([createFeedOrderItem()]);
  };

  const resetFishOrderForm = () => {
    setFishOrderSupplierId('');
    setFishOrderItems([createFishOrderItem()]);
  };

  const resetSupplierForm = () => {
    setSupplierName('');
    setSupplierEmail('');
    setSupplierPhone('');
    setSupplierAddress('');
    setSupplierItemType('FOOD');
  };

  const handleCreateFeedOrder = async () => {
    if (!feedOrderSupplierId) {
      window.alert('Please select a supplier.');
      return;
    }

    const validItems = feedOrderItems.filter(
      (item) => item.foodTypeId && item.quantityKg > 0 && item.unitCost > 0,
    );

    if (validItems.length === 0) {
      window.alert('Please add at least one valid feed item.');
      return;
    }

    try {
      setSubmitting(true);
      await createFeedPurchaseOrder({
        supplierId: feedOrderSupplierId,
        items: validItems.map((item) => ({
          foodTypeId: item.foodTypeId,
          quantityKg: item.quantityKg,
          unitCost: item.unitCost,
        })),
      });

      setShowCreateFeedOrder(false);
      resetFeedOrderForm();
      await loadProcurementData();
      window.alert('Feed purchase order created successfully.');
    } catch (error) {
      window.alert(normalizeErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateFishOrder = async () => {
    if (!fishOrderSupplierId) {
      window.alert('Please select a supplier.');
      return;
    }

    const validItems = fishOrderItems.filter(
      (item) => item.fishTypeId && item.quantity > 0 && item.unitCost > 0,
    );

    if (validItems.length === 0) {
      window.alert('Please add at least one valid fish item.');
      return;
    }

    try {
      setSubmitting(true);
      await createFishPurchaseOrder({
        supplierId: fishOrderSupplierId,
        items: validItems.map((item) => ({
          fishTypeId: item.fishTypeId,
          quantity: item.quantity,
          totalCost: item.quantity * item.unitCost,
        })),
      });

      setShowCreateFishOrder(false);
      resetFishOrderForm();
      await loadProcurementData();
      window.alert('Fish purchase order created successfully.');
    } catch (error) {
      window.alert(normalizeErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSupplier = async () => {
    if (!supplierName.trim()) {
      window.alert('Supplier name is required.');
      return;
    }

    try {
      setSubmitting(true);
      await createProcurementSupplier({
        name: supplierName.trim(),
        email: supplierEmail.trim() || undefined,
        phoneNumber: supplierPhone.trim() || undefined,
        address: supplierAddress.trim() || undefined,
        items: [supplierItemType],
      });

      setShowCreateSupplier(false);
      resetSupplierForm();
      await loadProcurementData();
      window.alert('Supplier created successfully.');
    } catch (error) {
      window.alert(normalizeErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-700">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading procurement data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="bg-[#0A4D68] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xl font-semibold">Procurement</span>
          </div>
          <div className="flex items-center gap-4">
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
        {errorMessage && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 text-sm text-red-700 flex items-center justify-between gap-2">
              <span>{errorMessage}</span>
              <Button variant="outline" size="sm" onClick={() => void loadProcurementData()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white">
            <TabsTrigger value="feed-orders">Feed Orders</TabsTrigger>
            <TabsTrigger value="fish-orders">Fish Orders</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          </TabsList>

          <TabsContent value="feed-orders" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Feed Purchase Orders</h2>
              <Button
                className="bg-[#088395] hover:bg-[#0A4D68]"
                onClick={() => setShowCreateFeedOrder(true)}
                disabled={submitting}
              >
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
                          <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{formatProcurementStatusLabel(order.status)}</span>
                          </Badge>
                          {order.deliveryStatus && (
                            <Badge className={getStatusColor(order.deliveryStatus)}>
                              <Truck className="w-3 h-3 mr-1" />
                              {formatProcurementStatusLabel(order.deliveryStatus)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Supplier: {order.supplierName} · Order Date: {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#0A4D68]">{formatCurrency(order.totalCost)}</p>
                        {order.deliveryDate && (
                          <p className="text-xs text-gray-500">Delivery: {new Date(order.deliveryDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Items:</p>
                      {order.items.map((item) => (
                        <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.foodTypeName || item.foodTypeId || 'Unknown food type'}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                                <span>
                                  Ordered: {item.quantityKg} kg @ {item.unitCost} EGP/kg
                                </span>
                                {item.actualQuantityKg !== undefined && (
                                  <span
                                    className={
                                      item.actualQuantityKg < item.quantityKg ? 'text-yellow-700' : 'text-green-700'
                                    }
                                  >
                                    Actual: {item.actualQuantityKg} kg
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge className={`${getStatusColor(item.status)} text-xs`}>
                              {formatProcurementStatusLabel(item.status)}
                            </Badge>
                          </div>

                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void handleOrderAction(
                                  () => updateFeedPurchaseOrderItemStatus(order.id, item.id, 'RECEIVED'),
                                  'Feed item status updated.',
                                )
                              }
                              disabled={submitting}
                            >
                              Mark Received
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void handleOrderAction(
                                  () => updateFeedPurchaseOrderItemStatus(order.id, item.id, 'REJECTED'),
                                  'Feed item status updated.',
                                )
                              }
                              disabled={submitting}
                            >
                              Mark Rejected
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-4 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.alert(JSON.stringify(order, null, 2))
                        }
                      >
                        View Details
                      </Button>

                      {normalizeProcurementStatus(order.status) === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-[#10B981] hover:bg-[#059669]"
                            onClick={() =>
                              void handleOrderAction(
                                () => updateFeedPurchaseOrderStatus(order.id, 'APPROVED'),
                                'Feed order approved.',
                              )
                            }
                            disabled={submitting}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              void handleOrderAction(
                                () => updateFeedPurchaseOrderStatus(order.id, 'CANCELED'),
                                'Feed order canceled.',
                              )
                            }
                            disabled={submitting}
                          >
                            Cancel
                          </Button>
                        </>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void handleOrderAction(
                            () => updateFeedPurchaseOrderDeliveryStatus(order.id, 'SHIPPED'),
                            'Delivery status updated to shipped.',
                          )
                        }
                        disabled={submitting}
                      >
                        Mark Shipped
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void handleOrderAction(
                            () => updateFeedPurchaseOrderDeliveryStatus(order.id, 'DELIVERED'),
                            'Delivery status updated to delivered.',
                          )
                        }
                        disabled={submitting}
                      >
                        Mark Delivered
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {feedOrders.length === 0 && (
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-8 text-center text-gray-600">No feed purchase orders found.</CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="fish-orders" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Fish Purchase Orders</h2>
              <Button
                className="bg-[#088395] hover:bg-[#0A4D68]"
                onClick={() => setShowCreateFishOrder(true)}
                disabled={submitting}
              >
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
                          <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{formatProcurementStatusLabel(order.status)}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Supplier: {order.supplierName} · Order Date: {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#0A4D68]">{formatCurrency(order.totalCost)}</p>
                        {order.deliveryDate && (
                          <p className="text-xs text-gray-500">Delivery: {new Date(order.deliveryDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Items:</p>
                      {order.items.map((item) => (
                        <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.fishTypeName || item.fishTypeId || 'Unknown fish type'}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                                <span>Ordered: {item.quantity.toLocaleString()} fish</span>
                                {item.actualQuantity !== undefined && (
                                  <span
                                    className={item.actualQuantity < item.quantity ? 'text-yellow-700' : 'text-green-700'}
                                  >
                                    Actual: {item.actualQuantity.toLocaleString()} fish
                                  </span>
                                )}
                                <span>Cost: {formatCurrency(item.totalCost)}</span>
                              </div>
                            </div>
                            <Badge className={`${getStatusColor(item.status)} text-xs`}>
                              {formatProcurementStatusLabel(item.status)}
                            </Badge>
                          </div>

                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void handleOrderAction(
                                  () => updateFishPurchaseOrderItemStatus(order.id, item.id, 'RECEIVED'),
                                  'Fish item status updated.',
                                )
                              }
                              disabled={submitting}
                            >
                              Mark Received
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void handleOrderAction(
                                  () => updateFishPurchaseOrderItemStatus(order.id, item.id, 'REJECTED'),
                                  'Fish item status updated.',
                                )
                              }
                              disabled={submitting}
                            >
                              Mark Rejected
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.alert(JSON.stringify(order, null, 2))}
                      >
                        View Details
                      </Button>

                      {normalizeProcurementStatus(order.status) === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-[#10B981] hover:bg-[#059669]"
                            onClick={() =>
                              void handleOrderAction(
                                () => updateFishPurchaseOrderStatus(order.id, 'APPROVED'),
                                'Fish order approved.',
                              )
                            }
                            disabled={submitting}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              void handleOrderAction(
                                () => updateFishPurchaseOrderStatus(order.id, 'CANCELED'),
                                'Fish order canceled.',
                              )
                            }
                            disabled={submitting}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {fishOrders.length === 0 && (
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-8 text-center text-gray-600">No fish purchase orders found.</CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Suppliers</h2>
              <Button
                className="bg-[#088395] hover:bg-[#0A4D68]"
                onClick={() => setShowCreateSupplier(true)}
                disabled={submitting}
              >
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
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {supplier.items.map((item) => (
                            <Badge key={`${supplier.id}-${item}`} variant="outline" className="text-xs">
                              {item === 'FOOD' || item === 'FEED' ? (
                                <Wheat className="w-3 h-3 mr-1" />
                              ) : (
                                <FishIcon className="w-3 h-3 mr-1" />
                              )}
                              {formatProcurementStatusLabel(item)}
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
                      {supplier.phoneNumber && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="font-medium">Phone:</span>
                          <span>{supplier.phoneNumber}</span>
                        </div>
                      )}
                      {supplier.address && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="font-medium">Address:</span>
                          <span>{supplier.address}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {suppliers.length === 0 && (
                <Card className="bg-white shadow-sm md:col-span-2 lg:col-span-3">
                  <CardContent className="p-8 text-center text-gray-600">No suppliers found.</CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={showCreateFeedOrder}
        onOpenChange={(open) => {
          setShowCreateFeedOrder(open);
          if (!open) {
            resetFeedOrderForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Feed Purchase Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select value={feedOrderSupplierId} onValueChange={setFeedOrderSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {feedSuppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Order Items</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFeedOrderItems((previous) => [...previous, createFeedOrderItem()])}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {feedOrderItems.map((item, index) => (
                  <div key={`feed-item-form-${index}`} className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <Label className="text-xs">Food Type</Label>
                      <Select
                        value={item.foodTypeId}
                        onValueChange={(value) =>
                          setFeedOrderItems((previous) =>
                            previous.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, foodTypeId: value } : entry,
                            ),
                          )
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {foodTypes.map((foodType) => (
                            <SelectItem key={foodType.id} value={foodType.id}>
                              {foodType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-3">
                      <Label className="text-xs">Quantity (kg)</Label>
                      <Input
                        type="number"
                        min="0"
                        className="h-9"
                        value={item.quantityKg || ''}
                        onChange={(event) =>
                          setFeedOrderItems((previous) =>
                            previous.map((entry, entryIndex) =>
                              entryIndex === index
                                ? { ...entry, quantityKg: Number(event.target.value) || 0 }
                                : entry,
                            ),
                          )
                        }
                      />
                    </div>

                    <div className="col-span-3">
                      <Label className="text-xs">Unit Cost (EGP)</Label>
                      <Input
                        type="number"
                        min="0"
                        className="h-9"
                        value={item.unitCost || ''}
                        onChange={(event) =>
                          setFeedOrderItems((previous) =>
                            previous.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, unitCost: Number(event.target.value) || 0 } : entry,
                            ),
                          )
                        }
                      />
                    </div>

                    <div className="col-span-1 flex items-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0"
                        onClick={() =>
                          setFeedOrderItems((previous) =>
                            previous.length === 1
                              ? previous
                              : previous.filter((_, entryIndex) => entryIndex !== index),
                          )
                        }
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total Cost:</span>
                <span className="text-[#0A4D68]">{formatCurrency(feedOrderTotal)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateFeedOrder(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#088395] hover:bg-[#0A4D68]"
                onClick={() => void handleCreateFeedOrder()}
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Purchase Order'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showCreateFishOrder}
        onOpenChange={(open) => {
          setShowCreateFishOrder(open);
          if (!open) {
            resetFishOrderForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Fish Purchase Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select value={fishOrderSupplierId} onValueChange={setFishOrderSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {fishSuppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Order Items</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFishOrderItems((previous) => [...previous, createFishOrderItem()])}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {fishOrderItems.map((item, index) => (
                  <div key={`fish-item-form-${index}`} className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <Label className="text-xs">Fish Type</Label>
                      <Select
                        value={item.fishTypeId}
                        onValueChange={(value) =>
                          setFishOrderItems((previous) =>
                            previous.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, fishTypeId: value } : entry,
                            ),
                          )
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {fishTypes.map((fishType) => (
                            <SelectItem key={fishType.id} value={fishType.id}>
                              {fishType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-3">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        min="0"
                        className="h-9"
                        value={item.quantity || ''}
                        onChange={(event) =>
                          setFishOrderItems((previous) =>
                            previous.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, quantity: Number(event.target.value) || 0 } : entry,
                            ),
                          )
                        }
                      />
                    </div>

                    <div className="col-span-3">
                      <Label className="text-xs">Unit Cost (EGP)</Label>
                      <Input
                        type="number"
                        min="0"
                        className="h-9"
                        value={item.unitCost || ''}
                        onChange={(event) =>
                          setFishOrderItems((previous) =>
                            previous.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, unitCost: Number(event.target.value) || 0 } : entry,
                            ),
                          )
                        }
                      />
                    </div>

                    <div className="col-span-1 flex items-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0"
                        onClick={() =>
                          setFishOrderItems((previous) =>
                            previous.length === 1
                              ? previous
                              : previous.filter((_, entryIndex) => entryIndex !== index),
                          )
                        }
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total Cost:</span>
                <span className="text-[#0A4D68]">{formatCurrency(fishOrderTotal)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateFishOrder(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#088395] hover:bg-[#0A4D68]"
                onClick={() => void handleCreateFishOrder()}
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Purchase Order'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showCreateSupplier}
        onOpenChange={(open) => {
          setShowCreateSupplier(open);
          if (!open) {
            resetSupplierForm();
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={supplierName} onChange={(event) => setSupplierName(event.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={supplierEmail}
                  onChange={(event) => setSupplierEmail(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={supplierPhone} onChange={(event) => setSupplierPhone(event.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={supplierAddress} onChange={(event) => setSupplierAddress(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Supplied Item Type *</Label>
              <Select value={supplierItemType} onValueChange={setSupplierItemType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOOD">Food</SelectItem>
                  <SelectItem value="FISH">Fish</SelectItem>
                  <SelectItem value="MEDICINE">Medicine</SelectItem>
                  <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateSupplier(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#088395] hover:bg-[#0A4D68]"
                onClick={() => void handleCreateSupplier()}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Create Supplier'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
