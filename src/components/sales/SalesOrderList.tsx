import { useCallback, useEffect, useMemo, useState } from 'react';
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
  AlertTriangle,
  Loader2,
  Truck,
} from 'lucide-react';
import { User, Farm } from '../../types';
import {
  approveSalesOrder,
  AvailableSalesInventoryRecord,
  cancelSalesOrder,
  createSalesOrder,
  getAvailableSalesInventory,
  getFarmUsers,
  getSalesCustomers,
  getSalesOrderById,
  getSalesOrders,
  getSalesStockDashboard,
  SalesCustomerRecord,
  SalesFarmUserRecord,
  SalesOrderRecord,
  formatSalesStatusLabel,
  normalizeSalesStatus,
} from '../../services/salesApi';

interface SalesOrderListProps {
  user: User;
  selectedFarm: Farm;
  onOrdersChanged?: () => void;
}

interface SelectedOrderItem {
  inventoryId: string;
  tankName?: string;
  fishName: string;
  gradeName: string;
  availableKg: number;
  pricePerKg: number;
  selectedKg: number;
  expiryDays: number;
}

const normalizeErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    const normalized = error.message.replace(/\s+/g, ' ').trim();
    if (/^\s*select\s+/i.test(normalized) || /column\s+.+\s+does not exist/i.test(normalized)) {
      return 'Backend sales schema mismatch. Please apply backend migrations for sales/customers tables.';
    }
    return normalized;
  }
  return 'Unable to process sales request.';
};

const matchesRole = (user: SalesFarmUserRecord, roleCode: number, roleLabel: string): boolean => {
  if (user.roleCode === roleCode) {
    return true;
  }

  const normalizedRole = user.role.trim().toUpperCase();
  if (/^\d+$/.test(normalizedRole) && Number(normalizedRole) === roleCode) {
    return true;
  }

  return normalizedRole === roleLabel;
};

export default function SalesOrderList({ onOrdersChanged, selectedFarm, user }: SalesOrderListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [orders, setOrders] = useState<SalesOrderRecord[]>([]);
  const [customers, setCustomers] = useState<SalesCustomerRecord[]>([]);
  const [availableInventory, setAvailableInventory] = useState<AvailableSalesInventoryRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedOrderItem[]>([]);

  const [detailOrder, setDetailOrder] = useState<SalesOrderRecord | null>(null);
  const [approveOrderId, setApproveOrderId] = useState<string | null>(null);
  const [farmUsers, setFarmUsers] = useState<SalesFarmUserRecord[]>([]);
  const [loadingFarmUsers, setLoadingFarmUsers] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [selectedDeliveryUserId, setSelectedDeliveryUserId] = useState('');

  const farmId = selectedFarm.id || user.farmId || '';

  const workerUsers = useMemo(
    () => farmUsers.filter((farmUser) => matchesRole(farmUser, 6, 'WORKER')),
    [farmUsers],
  );
  const deliveryUsers = useMemo(
    () => farmUsers.filter((farmUser) => matchesRole(farmUser, 5, 'DELIVERY')),
    [farmUsers],
  );

  const customerLookup = useMemo(
    () => customers.reduce<Record<string, SalesCustomerRecord>>((acc, customer) => ({ ...acc, [customer.id]: customer }), {}),
    [customers],
  );

  const loadOrdersData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [ordersResult, customersResult, inventoryResult] = await Promise.allSettled([
        getSalesOrders({ status: filterStatus, limit: 100 }),
        getSalesCustomers({ limit: 200 }),
        getAvailableSalesInventory(),
      ]);

      const errors: string[] = [];

      if (ordersResult.status === 'fulfilled') {
        setOrders(ordersResult.value);
      } else {
        setOrders([]);
        errors.push(`Orders: ${normalizeErrorMessage(ordersResult.reason)}`);
      }

      if (customersResult.status === 'fulfilled') {
        setCustomers(customersResult.value);
      } else {
        setCustomers([]);
        errors.push(`Customers: ${normalizeErrorMessage(customersResult.reason)}`);
      }

      if (inventoryResult.status === 'fulfilled') {
        setAvailableInventory(inventoryResult.value);
      } else {
        try {
          const fallback = await getSalesStockDashboard();
          setAvailableInventory(
            fallback.stockItems.map((item) => ({
              id: item.id,
              harvestedInventoryId: item.id,
              fishType: item.fishType,
              grade: item.grade,
              availableKg: item.availableKg || item.weight,
              unitPrice: item.price,
              lotNumber: item.lotNumber,
              tankId: item.tankId,
              tankName: item.tankName,
              expiryDate: item.expiryDate,
              expiryCountdown: item.expiryCountdown,
            })),
          );
        } catch {
          setAvailableInventory([]);
          errors.push(`Inventory: ${normalizeErrorMessage(inventoryResult.reason)}`);
        }
      }

      if (errors.length > 0) {
        setErrorMessage(errors.join(' | '));
      }
    } catch (error) {
      setErrorMessage(normalizeErrorMessage(error));
      setOrders([]);
      setCustomers([]);
      setAvailableInventory([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    void loadOrdersData();
  }, [loadOrdersData]);

  const getStatusColor = (status: string) => {
    switch (normalizeSalesStatus(status)) {
      case 'PENDING':
        return 'bg-[#F59E0B] text-white';
      case 'APPROVED':
        return 'bg-[#0EA5E9] text-white';
      case 'FULFILLED':
        return 'bg-[#10B981] text-white';
      case 'DELIVERED':
        return 'bg-[#14B8A6] text-white';
      case 'CANCELLED':
        return 'bg-[#EF4444] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (normalizeSalesStatus(status)) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4" />;
      case 'FULFILLED':
        return <Package className="w-4 h-4" />;
      case 'DELIVERED':
        return <Truck className="w-4 h-4" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const addItemToOrder = (inventory: AvailableSalesInventoryRecord) => {
    const existing = selectedItems.find((item) => item.inventoryId === inventory.harvestedInventoryId);
    if (existing) {
      setSelectedItems((previous) =>
        previous.map((item) =>
          item.inventoryId === inventory.harvestedInventoryId
            ? { ...item, selectedKg: Math.min(item.selectedKg + 5, item.availableKg) }
            : item,
        ),
      );
      return;
    }

    setSelectedItems((previous) => [
      ...previous,
      {
        inventoryId: inventory.harvestedInventoryId,
        tankName: inventory.tankName || inventory.tankId,
        fishName: inventory.fishType,
        gradeName: inventory.grade,
        availableKg: inventory.availableKg,
        pricePerKg: inventory.unitPrice,
        selectedKg: Math.min(10, inventory.availableKg),
        expiryDays: inventory.expiryCountdown,
      },
    ]);
  };

  const updateItemQuantity = (inventoryId: string, quantity: number) => {
    setSelectedItems((previous) =>
      previous
        .map((item) =>
          item.inventoryId === inventoryId
            ? { ...item, selectedKg: Math.max(0, Math.min(quantity, item.availableKg)) }
            : item,
        )
        .filter((item) => item.selectedKg > 0),
    );
  };

  const removeItem = (inventoryId: string) => {
    setSelectedItems((previous) => previous.filter((item) => item.inventoryId !== inventoryId));
  };

  const calculateTotal = () =>
    selectedItems.reduce((sum, item) => sum + item.selectedKg * item.pricePerKg, 0);

  const resetForm = () => {
    setSelectedCustomer('');
    setDeliveryDate('');
    setOrderNotes('');
    setSelectedItems([]);
  };

  const resetApprovalForm = () => {
    setApproveOrderId(null);
    setSelectedWorkerId('');
    setSelectedDeliveryUserId('');
    setFarmUsers([]);
  };

  const handleCreateOrder = async () => {
    if (!selectedCustomer || selectedItems.length === 0) {
      window.alert('Please select a customer and add at least one line item.');
      return;
    }

    try {
      setSubmitting(true);
      await createSalesOrder({
        customerId: selectedCustomer,
        deliveryDate: deliveryDate || undefined,
        notes: orderNotes.trim() || undefined,
        lineItems: selectedItems.map((item) => ({
          harvestedInventoryId: item.inventoryId,
          quantity: item.selectedKg,
          unitPrice: item.pricePerKg,
        })),
      });

      setShowCreateModal(false);
      resetForm();
      await loadOrdersData();
      onOrdersChanged?.();
      window.alert('Sales order created successfully.');
    } catch (error) {
      window.alert(normalizeErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const openApproveModal = async (orderId: string) => {
    if (!farmId) {
      window.alert('Farm context is required to load workers and delivery users.');
      return;
    }

    setApproveOrderId(orderId);
    setSelectedWorkerId('');
    setSelectedDeliveryUserId('');
    setLoadingFarmUsers(true);

    try {
      const usersByFarm = await getFarmUsers(farmId);
      setFarmUsers(usersByFarm);
    } catch (error) {
      setFarmUsers([]);
      window.alert(normalizeErrorMessage(error));
    } finally {
      setLoadingFarmUsers(false);
    }
  };

  const handleApprove = async () => {
    if (!approveOrderId) {
      return;
    }
    if (!selectedWorkerId || !selectedDeliveryUserId) {
      window.alert('Select both worker and delivery user before approval.');
      return;
    }

    try {
      setSubmitting(true);
      await approveSalesOrder(approveOrderId, {
        assignedWorkerId: selectedWorkerId,
        assignedDeliveryUserId: selectedDeliveryUserId,
      });
      resetApprovalForm();
      await loadOrdersData();
      onOrdersChanged?.();
      window.alert('Sales order approved successfully.');
    } catch (error) {
      window.alert(normalizeErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (orderId: string) => {
    try {
      setSubmitting(true);
      await cancelSalesOrder(orderId);
      await loadOrdersData();
      onOrdersChanged?.();
      window.alert('Sales order canceled.');
    } catch (error) {
      window.alert(normalizeErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (orderId: string) => {
    try {
      setSubmitting(true);
      const detail = await getSalesOrderById(orderId);
      const fallback = orders.find((order) => order.id === orderId) || null;
      setDetailOrder(detail || fallback);
    } catch (error) {
      window.alert(normalizeErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Sales Orders</h2>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="FULFILLED">Fulfilled</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Button
            className="bg-[#088395] hover:bg-[#0A4D68]"
            onClick={() => setShowCreateModal(true)}
            disabled={submitting}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {errorMessage && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-sm text-red-700 flex items-center justify-between">
            <span>{errorMessage}</span>
            <Button variant="outline" size="sm" onClick={() => void loadOrdersData()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card className="bg-white shadow-sm">
          <CardContent className="p-8 text-center text-gray-600 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading sales orders...</span>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="bg-white shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{formatSalesStatusLabel(order.status)}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 flex-wrap">
                      <div className="flex items-center gap-1">
                        <UserIcon className="w-4 h-4" />
                        <span>
                          {order.customerName || customerLookup[order.customerId]?.name || 'Unknown customer'}
                        </span>
                      </div>
                      {order.orderDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Order: {new Date(order.orderDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {order.deliveryDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Delivery: {new Date(order.deliveryDate).toLocaleDateString()}</span>
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
                              <span className="font-medium">
                                {item.quantity} kg @ {item.unitPrice} EGP/kg
                              </span>
                              <div className="flex items-center gap-1 mt-1">
                                {item.lotNumber && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.lotNumber}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {formatSalesStatusLabel(item.status)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <span className="font-semibold text-[#10B981]">{item.subtotal.toLocaleString()} EGP</span>
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

                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => void handleViewDetails(order.id)}>
                    View Details
                  </Button>

                  {normalizeSalesStatus(order.status) === 'PENDING' && (
                    <>
                      <Button
                        size="sm"
                        className="bg-[#10B981] hover:bg-[#059669]"
                        onClick={() => void openApproveModal(order.id)}
                        disabled={submitting}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void handleCancel(order.id)}
                        disabled={submitting}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {orders.length === 0 && (
            <Card className="bg-white shadow-sm">
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No orders found matching your filter.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={Boolean(detailOrder)} onOpenChange={(open) => (!open ? setDetailOrder(null) : undefined)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sales Order Details</DialogTitle>
          </DialogHeader>

          {detailOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded border bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Order Number</p>
                  <p className="font-medium">{detailOrder.orderNumber}</p>
                </div>
                <div className="rounded border bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="font-medium">
                    {detailOrder.customerName || customerLookup[detailOrder.customerId]?.name || 'Unknown customer'}
                  </p>
                </div>
                <div className="rounded border bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-medium">{formatSalesStatusLabel(detailOrder.status)}</p>
                </div>
                <div className="rounded border bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="font-medium">{detailOrder.totalAmount.toLocaleString()} EGP</p>
                </div>
              </div>

              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left px-3 py-2">Inventory ID (Lot Number)</th>
                      <th className="text-left px-3 py-2">Quantity (kg)</th>
                      <th className="text-left px-3 py-2">Unit Price</th>
                      <th className="text-left px-3 py-2">Subtotal</th>
                      <th className="text-left px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailOrder.lineItems.map((lineItem) => (
                      <tr key={lineItem.id} className="border-t">
                        <td className="px-3 py-2">{lineItem.lotNumber || lineItem.harvestedInventoryId || '-'}</td>
                        <td className="px-3 py-2">{lineItem.quantity}</td>
                        <td className="px-3 py-2">{lineItem.unitPrice.toLocaleString()} EGP</td>
                        <td className="px-3 py-2">{lineItem.subtotal.toLocaleString()} EGP</td>
                        <td className="px-3 py-2">{formatSalesStatusLabel(lineItem.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(approveOrderId)}
        onOpenChange={(open) => {
          if (!open) {
            resetApprovalForm();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Approve Sales Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {loadingFarmUsers ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading farm users...
              </div>
            ) : (
              <>
                <div>
                  <Label>Assign Worker *</Label>
                  <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select worker (role 6)" />
                    </SelectTrigger>
                    <SelectContent>
                      {workerUsers.map((farmUser) => (
                        <SelectItem key={farmUser.id} value={farmUser.id}>
                          {farmUser.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {workerUsers.length === 0 && (
                    <p className="text-xs text-amber-700 mt-1">No worker users found for this farm.</p>
                  )}
                </div>

                <div>
                  <Label>Assign Delivery User *</Label>
                  <Select value={selectedDeliveryUserId} onValueChange={setSelectedDeliveryUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select delivery user (role 5)" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryUsers.map((farmUser) => (
                        <SelectItem key={farmUser.id} value={farmUser.id}>
                          {farmUser.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {deliveryUsers.length === 0 && (
                    <p className="text-xs text-amber-700 mt-1">No delivery users found for this farm.</p>
                  )}
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={resetApprovalForm} disabled={submitting}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#088395] hover:bg-[#0A4D68]"
                onClick={() => void handleApprove()}
                disabled={submitting || loadingFarmUsers || !selectedWorkerId || !selectedDeliveryUserId}
              >
                {submitting ? 'Approving...' : 'Approve Order'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) {
            resetForm();
          }
        }}
      >
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
                      {customers
                        .filter((customer) => customer.isActive)
                        .map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Delivery Date</Label>
                  <Input type="date" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Order Items</h3>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Available Harvested Stock:</Label>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                  {availableInventory.map((inventory) => {
                    const isAdded = selectedItems.some((item) => item.inventoryId === inventory.harvestedInventoryId);
                    return (
                      <div
                        key={inventory.harvestedInventoryId}
                        className="bg-white border rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {inventory.fishType} - {inventory.grade}
                            </span>
                            {inventory.tankName && (
                              <Badge variant="outline" className="text-xs">
                                {inventory.tankName}
                              </Badge>
                            )}
                            {inventory.expiryCountdown <= 2 && (
                              <Badge className="bg-[#EF4444] text-white text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Urgent
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Available: {inventory.availableKg} kg @ {inventory.unitPrice} EGP/kg
                            {inventory.expiryDate ? ` • Expires in ${inventory.expiryCountdown}d` : ''}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isAdded ? 'outline' : 'default'}
                          className={!isAdded ? 'bg-[#088395] hover:bg-[#0A4D68]' : ''}
                          onClick={() => addItemToOrder(inventory)}
                          disabled={isAdded || inventory.availableKg <= 0}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          {isAdded ? 'Added' : 'Add'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedItems.length > 0 && (
                <div className="space-y-2 mt-4">
                  <Label className="text-sm font-medium">Selected Items ({selectedItems.length}):</Label>
                  <div className="space-y-2">
                    {selectedItems.map((item) => (
                      <div key={item.inventoryId} className="bg-[#E0F4F5] border border-[#088395] rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {item.fishName} - {item.gradeName}
                              </span>
                              {item.tankName && (
                                <Badge variant="outline" className="text-xs">
                                  {item.tankName}
                                </Badge>
                              )}
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
                            onChange={(event) =>
                              updateItemQuantity(item.inventoryId, Number(event.target.value) || 0)
                            }
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
                  <p className="text-sm text-gray-600">No items selected. Click "Add" to select inventory.</p>
                </div>
              )}
            </div>

            <div>
              <Label>Order Notes</Label>
              <Textarea
                placeholder="Delivery instructions or special requirements..."
                rows={3}
                value={orderNotes}
                onChange={(event) => setOrderNotes(event.target.value)}
              />
            </div>

            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Order Total:</span>
                <span className="text-[#0A4D68]">{calculateTotal().toLocaleString()} EGP</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#088395] hover:bg-[#0A4D68]"
                onClick={() => void handleCreateOrder()}
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Order'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
