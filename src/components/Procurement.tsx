import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { CreateMedicineOrderDialog, MedicineOrderFormItem } from './procurement/CreateMedicineOrderDialog';
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
  Search,
  PackageCheck,
} from 'lucide-react';
import { User, Farm } from '../types';
import { mockFarms } from '../mockData';
import { getFishTypes } from '../services/fishTypesApi';
import { getFoodTypes } from '../services/foodTypesApi';
import {
  createFeedPurchaseOrder,
  createFishPurchaseOrder,
  createMedicinePurchaseOrder,
  createProcurementSupplier,
  FeedPurchaseOrderRecord,
  FishPurchaseOrderRecord,
  formatProcurementStatusLabel,
  getFeedPurchaseOrders,
  getFishPurchaseOrders,
  getMedicinePurchaseOrderById,
  getMedicinePurchaseOrders,
  getProcurementSuppliers,
  MedicinePurchaseOrderRecord,
  normalizeProcurementStatus,
  ProcurementSupplierRecord,
  updateFeedPurchaseOrderDeliveryStatus,
  updateFeedPurchaseOrderItemStatus,
  updateFeedPurchaseOrderStatus,
  updateFishPurchaseOrderItemStatus,
  updateFishPurchaseOrderStatus,
  updateMedicinePurchaseOrderDeliveryStatus,
  updateMedicinePurchaseOrderItemStatus,
  updateMedicinePurchaseOrderStatus,
} from '../services/procurementApi';
import {
  canReceiveByDeliveryStatus,
  formatCurrencyEgp,
  formatFishCount,
  formatKg,
  formatNameWithId,
  getProcurementStatusColorClass,
  normalizeProcurementUiStatus,
  toShortId,
} from '../services/procurementUi';

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

interface ReceiveDialogItem {
  id: string;
  label: string;
  typeId?: string;
  orderedQuantity: number;
  actualQuantity: number;
  unit: 'kg' | 'fish';
}

interface ReceiveDialogState {
  kind: 'feed' | 'fish';
  orderId: string;
  orderNumber: string;
  supplierName: string;
  location: string;
  items: ReceiveDialogItem[];
}

interface ConfirmationDialogState {
  open: boolean;
  title: string;
  description: string;
  successMessage: string;
  action: null | (() => Promise<void>);
}

interface DetailsDialogState {
  kind: 'feed' | 'fish' | 'medicine';
  order: FeedPurchaseOrderRecord | FishPurchaseOrderRecord | MedicinePurchaseOrderRecord;
}

const PAGE_SIZE = 5;
const DEFAULT_RECEIVING_LOCATION = 'RECEIVING_AREA';

const SUPPLIER_ITEM_TYPE_OPTIONS = ['FOOD', 'FEED', 'FISH', 'FINGERLINGS', 'MEDICINE', 'EQUIPMENT'];
const ORDER_STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'PARTIALLY_RECEIVED', label: 'Partially Received' },
  { value: 'CANCELED', label: 'Canceled' },
  { value: 'REJECTED', label: 'Rejected' },
];
const LINE_ITEM_STATUS_OPTIONS = ORDER_STATUS_FILTER_OPTIONS.filter((option) => option.value !== 'ALL');

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

const createMedicineOrderItem = (): MedicineOrderFormItem => ({
  medicine: '',
  company: '',
  fishTypeIds: [],
  quantity: 0,
  unitCost: 0,
});

const normalizeErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Unexpected error while processing procurement request.';
};

const normalizeStatusFilterValue = (status: string): string => {
  const normalized = normalizeProcurementUiStatus(status);
  if (normalized === 'CANCELLED') {
    return 'CANCELED';
  }
  return normalized;
};

const matchesStatusFilter = (statusFilter: string, ...statuses: Array<string | undefined>): boolean => {
  if (statusFilter === 'ALL') {
    return true;
  }

  const candidates = statuses
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeStatusFilterValue(value));

  if (statusFilter === 'CANCELED') {
    return candidates.includes('CANCELED') || candidates.includes('CANCELLED');
  }

  return candidates.includes(statusFilter);
};

const looksLikeEntityId = (value: string): boolean => /^[0-9a-f]{8}(?:-[0-9a-f]{4}){0,4}$/i.test(value.trim());

const getUserInitials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

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

export default function Procurement({ user, selectedFarm }: ProcurementProps) {
  const currentFarm = selectedFarm || mockFarms[0];

  const [activeTab, setActiveTab] = useState('feed-orders');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inventoryFeedback, setInventoryFeedback] = useState<string | null>(null);

  const [feedOrders, setFeedOrders] = useState<FeedPurchaseOrderRecord[]>([]);
  const [fishOrders, setFishOrders] = useState<FishPurchaseOrderRecord[]>([]);
  const [medicineOrders, setMedicineOrders] = useState<MedicinePurchaseOrderRecord[]>([]);
  const [suppliers, setSuppliers] = useState<ProcurementSupplierRecord[]>([]);

  const [foodTypes, setFoodTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [fishTypes, setFishTypes] = useState<Array<{ id: string; name: string }>>([]);

  const [showCreateFeedOrder, setShowCreateFeedOrder] = useState(false);
  const [showCreateFishOrder, setShowCreateFishOrder] = useState(false);
  const [showCreateMedicineOrder, setShowCreateMedicineOrder] = useState(false);
  const [showCreateSupplier, setShowCreateSupplier] = useState(false);

  const [feedStatusFilter, setFeedStatusFilter] = useState('ALL');
  const [fishStatusFilter, setFishStatusFilter] = useState('ALL');
  const [medicineStatusFilter, setMedicineStatusFilter] = useState('ALL');
  const [medicineSupplierSearchTerm, setMedicineSupplierSearchTerm] = useState('');
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [feedPage, setFeedPage] = useState(1);
  const [fishPage, setFishPage] = useState(1);
  const [medicinePage, setMedicinePage] = useState(1);

  const [feedOrderSupplierId, setFeedOrderSupplierId] = useState('');
  const [feedOrderItems, setFeedOrderItems] = useState<FeedOrderFormItem[]>([createFeedOrderItem()]);

  const [fishOrderSupplierId, setFishOrderSupplierId] = useState('');
  const [fishOrderItems, setFishOrderItems] = useState<FishOrderFormItem[]>([createFishOrderItem()]);

  const [medicineOrderSupplierId, setMedicineOrderSupplierId] = useState('');
  const [medicineOrderItems, setMedicineOrderItems] = useState<MedicineOrderFormItem[]>([createMedicineOrderItem()]);

  const [supplierName, setSupplierName] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierItemTypes, setSupplierItemTypes] = useState<string[]>(['FOOD']);

  const [detailsDialog, setDetailsDialog] = useState<DetailsDialogState | null>(null);
  const [lineItemStatusDrafts, setLineItemStatusDrafts] = useState<Record<string, string>>({});
  const [updatingLineItemId, setUpdatingLineItemId] = useState<string | null>(null);
  const [receiveDialog, setReceiveDialog] = useState<ReceiveDialogState | null>(null);
  const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialogState>({
    open: false,
    title: '',
    description: '',
    successMessage: '',
    action: null,
  });

  const feedOrderTotal = useMemo(
    () => feedOrderItems.reduce((sum, item) => sum + item.quantityKg * item.unitCost, 0),
    [feedOrderItems],
  );

  const fishOrderTotal = useMemo(
    () => fishOrderItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
    [fishOrderItems],
  );

  const medicineOrderTotal = useMemo(
    () => medicineOrderItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
    [medicineOrderItems],
  );

  const feedSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplier.items.includes('FOOD') || supplier.items.includes('FEED')),
    [suppliers],
  );

  const fishSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplier.items.includes('FISH') || supplier.items.includes('FINGERLINGS')),
    [suppliers],
  );

  const medicineSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplier.items.includes('MEDICINE')),
    [suppliers],
  );

  const filteredSuppliers = useMemo(() => {
    const query = supplierSearchTerm.trim().toLowerCase();
    if (!query) {
      return suppliers;
    }

    return suppliers.filter((supplier) => {
      const haystack = [
        supplier.name,
        supplier.id,
        supplier.email,
        supplier.phoneNumber,
        supplier.address,
        supplier.items.join(' '),
      ]
        .filter((value): value is string => Boolean(value))
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [supplierSearchTerm, suppliers]);

  const filteredFeedOrders = useMemo(
    () =>
      feedOrders.filter((order) => matchesStatusFilter(feedStatusFilter, order.status, order.deliveryStatus)),
    [feedOrders, feedStatusFilter],
  );

  const filteredFishOrders = useMemo(
    () => fishOrders.filter((order) => matchesStatusFilter(fishStatusFilter, order.status)),
    [fishOrders, fishStatusFilter],
  );

  const filteredMedicineOrders = useMemo(() => {
    const supplierQuery = medicineSupplierSearchTerm.trim().toLowerCase();
    return medicineOrders.filter((order) => {
      const matchesStatus = matchesStatusFilter(
        medicineStatusFilter,
        order.status,
        order.deliveryStatus,
      );
      if (!matchesStatus) {
        return false;
      }

      if (!supplierQuery) {
        return true;
      }

      return order.supplierName.toLowerCase().includes(supplierQuery);
    });
  }, [medicineOrders, medicineStatusFilter, medicineSupplierSearchTerm]);

  const feedPageCount = Math.max(1, Math.ceil(filteredFeedOrders.length / PAGE_SIZE));
  const fishPageCount = Math.max(1, Math.ceil(filteredFishOrders.length / PAGE_SIZE));
  const medicinePageCount = Math.max(1, Math.ceil(filteredMedicineOrders.length / PAGE_SIZE));

  const paginatedFeedOrders = useMemo(() => {
    const start = (feedPage - 1) * PAGE_SIZE;
    return filteredFeedOrders.slice(start, start + PAGE_SIZE);
  }, [feedPage, filteredFeedOrders]);

  const paginatedFishOrders = useMemo(() => {
    const start = (fishPage - 1) * PAGE_SIZE;
    return filteredFishOrders.slice(start, start + PAGE_SIZE);
  }, [fishPage, filteredFishOrders]);

  const paginatedMedicineOrders = useMemo(() => {
    const start = (medicinePage - 1) * PAGE_SIZE;
    return filteredMedicineOrders.slice(start, start + PAGE_SIZE);
  }, [medicinePage, filteredMedicineOrders]);

  useEffect(() => {
    setFeedPage(1);
  }, [feedStatusFilter]);

  useEffect(() => {
    setFishPage(1);
  }, [fishStatusFilter]);

  useEffect(() => {
    setMedicinePage(1);
  }, [medicineStatusFilter, medicineSupplierSearchTerm]);

  useEffect(() => {
    if (feedPage > feedPageCount) {
      setFeedPage(feedPageCount);
    }
  }, [feedPage, feedPageCount]);

  useEffect(() => {
    if (fishPage > fishPageCount) {
      setFishPage(fishPageCount);
    }
  }, [fishPage, fishPageCount]);

  useEffect(() => {
    if (medicinePage > medicinePageCount) {
      setMedicinePage(medicinePageCount);
    }
  }, [medicinePage, medicinePageCount]);

  const loadProcurementData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [feedOrdersData, fishOrdersData, medicineOrdersData, suppliersData, foodTypesData, fishTypesData] = await Promise.all([
        getFeedPurchaseOrders({ offset: 0, limit: 200 }),
        getFishPurchaseOrders({ offset: 0, limit: 200 }),
        getMedicinePurchaseOrders({ offset: 0, limit: 200 }),
        getProcurementSuppliers(),
        getFoodTypes(),
        getFishTypes(false),
      ]);

      const supplierNamesById = new Map(suppliersData.map((supplier) => [supplier.id, supplier.name]));
      const resolveOrderSupplierNames = <T extends { supplierId?: string; supplierName: string }>(orders: T[]): T[] =>
        orders.map((order) => {
          const fallbackName = order.supplierId ? supplierNamesById.get(order.supplierId) : undefined;
          const normalizedSupplierName = order.supplierName.trim().toLowerCase();
          const shouldFallback =
            normalizedSupplierName === 'unknown supplier' || looksLikeEntityId(order.supplierName);

          if (!fallbackName || !shouldFallback) {
            return order;
          }

          return {
            ...order,
            supplierName: fallbackName,
          };
        });

      setFeedOrders(resolveOrderSupplierNames(feedOrdersData));
      setFishOrders(resolveOrderSupplierNames(fishOrdersData));
      setMedicineOrders(resolveOrderSupplierNames(medicineOrdersData));
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

  useEffect(() => {
    if (!detailsDialog) {
      setLineItemStatusDrafts({});
      return;
    }

    const items =
      detailsDialog.kind === 'feed'
        ? (detailsDialog.order as FeedPurchaseOrderRecord).items
        : detailsDialog.kind === 'fish'
          ? (detailsDialog.order as FishPurchaseOrderRecord).items
          : (detailsDialog.order as MedicinePurchaseOrderRecord).items;

    const nextDrafts = items.reduce<Record<string, string>>((accumulator, item) => {
      accumulator[item.id] = normalizeProcurementUiStatus(item.status);
      return accumulator;
    }, {});

    setLineItemStatusDrafts(nextDrafts);
  }, [detailsDialog]);

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

  const updateLineItemStatusDraft = (itemId: string, status: string) => {
    setLineItemStatusDrafts((previous) => ({
      ...previous,
      [itemId]: normalizeProcurementUiStatus(status),
    }));
  };

  const submitLineItemStatus = async (
    itemId: string,
    currentStatus: string,
    kind: 'feed' | 'fish' | 'medicine',
    orderId: string,
  ) => {
    const nextStatus = normalizeProcurementUiStatus(lineItemStatusDrafts[itemId] || currentStatus);
    if (nextStatus === normalizeProcurementUiStatus(currentStatus)) {
      return;
    }

    try {
      setSubmitting(true);
      setUpdatingLineItemId(itemId);

      if (kind === 'feed') {
        await updateFeedPurchaseOrderItemStatus(orderId, itemId, nextStatus);
      } else if (kind === 'fish') {
        await updateFishPurchaseOrderItemStatus(orderId, itemId, nextStatus);
      } else {
        await updateMedicinePurchaseOrderItemStatus(orderId, itemId, nextStatus);
      }

      setDetailsDialog(null);
      await loadProcurementData();
      window.alert('Line item status updated successfully.');
    } catch (error) {
      window.alert(normalizeErrorMessage(error));
    } finally {
      setUpdatingLineItemId(null);
      setSubmitting(false);
    }
  };

  const openConfirmationDialog = (
    title: string,
    description: string,
    successMessage: string,
    action: () => Promise<void>,
  ) => {
    setConfirmationDialog({
      open: true,
      title,
      description,
      successMessage,
      action,
    });
  };

  const runConfirmationAction = async () => {
    if (!confirmationDialog.action) {
      return;
    }

    try {
      setSubmitting(true);
      await confirmationDialog.action();
      await loadProcurementData();
      setConfirmationDialog({
        open: false,
        title: '',
        description: '',
        successMessage: '',
        action: null,
      });
      window.alert(confirmationDialog.successMessage);
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

  const resetMedicineOrderForm = () => {
    setMedicineOrderSupplierId('');
    setMedicineOrderItems([createMedicineOrderItem()]);
  };

  const resetSupplierForm = () => {
    setSupplierName('');
    setSupplierEmail('');
    setSupplierPhone('');
    setSupplierAddress('');
    setSupplierItemTypes(['FOOD']);
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

  const handleCreateMedicineOrder = async () => {
    if (!medicineOrderSupplierId) {
      window.alert('Please select a supplier.');
      return;
    }

    const validItems = medicineOrderItems.filter(
      (item) =>
        item.medicine.trim() &&
        item.company.trim() &&
        item.fishTypeIds.length > 0 &&
        item.quantity > 0 &&
        item.unitCost > 0,
    );

    if (validItems.length === 0) {
      window.alert('Please add at least one valid medicine item.');
      return;
    }

    if (validItems.length !== medicineOrderItems.length) {
      window.alert('All medicine line items must include medicine, company, fish types, quantity, and unit cost.');
      return;
    }

    try {
      setSubmitting(true);
      await createMedicinePurchaseOrder({
        supplierId: medicineOrderSupplierId,
        items: validItems.map((item) => ({
          medicine: item.medicine.trim(),
          company: item.company.trim(),
          fishTypeIds: item.fishTypeIds,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      });

      setShowCreateMedicineOrder(false);
      resetMedicineOrderForm();
      await loadProcurementData();
      window.alert('Medicine purchase order created successfully.');
    } catch (error) {
      window.alert(normalizeErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSupplierItemType = (value: string) => {
    setSupplierItemTypes((previous) =>
      previous.includes(value) ? previous.filter((entry) => entry !== value) : [...previous, value],
    );
  };

  const handleCreateSupplier = async () => {
    if (!supplierName.trim()) {
      window.alert('Supplier name is required.');
      return;
    }

    if (supplierItemTypes.length === 0) {
      window.alert('Please select at least one supplied item type.');
      return;
    }

    try {
      setSubmitting(true);
      await createProcurementSupplier({
        name: supplierName.trim(),
        email: supplierEmail.trim() || undefined,
        phoneNumber: supplierPhone.trim() || undefined,
        address: supplierAddress.trim() || undefined,
        items: supplierItemTypes,
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

  const isFeedOrderDeliverable = (order: FeedPurchaseOrderRecord): boolean =>
    canReceiveByDeliveryStatus(order.deliveryStatus || order.status);

  const isFishOrderDeliverable = (order: FishPurchaseOrderRecord): boolean =>
    canReceiveByDeliveryStatus(order.status);

  const openReceiveDialogForFeedOrder = (order: FeedPurchaseOrderRecord) => {
    setReceiveDialog({
      kind: 'feed',
      orderId: order.id,
      orderNumber: order.orderNumber,
      supplierName: order.supplierName,
      location: DEFAULT_RECEIVING_LOCATION,
      items: order.items.map((item) => ({
        id: item.id,
        label: item.foodTypeName || 'Unknown food type',
        typeId: item.foodTypeId,
        orderedQuantity: item.quantityKg,
        actualQuantity: item.actualQuantityKg ?? item.quantityKg,
        unit: 'kg',
      })),
    });
  };

  const openReceiveDialogForFishOrder = (order: FishPurchaseOrderRecord) => {
    setReceiveDialog({
      kind: 'fish',
      orderId: order.id,
      orderNumber: order.orderNumber,
      supplierName: order.supplierName,
      location: DEFAULT_RECEIVING_LOCATION,
      items: order.items.map((item) => ({
        id: item.id,
        label: item.fishTypeName || 'Unknown fish type',
        typeId: item.fishTypeId,
        orderedQuantity: item.quantity,
        actualQuantity: item.actualQuantity ?? item.quantity,
        unit: 'fish',
      })),
    });
  };

  const openMedicineOrderDetails = async (order: MedicinePurchaseOrderRecord) => {
    try {
      setSubmitting(true);
      const latestOrder = await getMedicinePurchaseOrderById(order.id);
      const resolvedLatestOrder = latestOrder
        ? {
            ...latestOrder,
            supplierName:
              latestOrder.supplierName.trim().toLowerCase() === 'unknown supplier' ||
              looksLikeEntityId(latestOrder.supplierName)
                ? order.supplierName
                : latestOrder.supplierName,
          }
        : order;
      setDetailsDialog({
        kind: 'medicine',
        order: resolvedLatestOrder,
      });
    } catch (error) {
      window.alert(normalizeErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const updateReceiveDialogItem = (itemId: string, actualQuantity: number) => {
    setReceiveDialog((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        items: previous.items.map((item) =>
          item.id === itemId ? { ...item, actualQuantity: Math.max(0, actualQuantity) } : item,
        ),
      };
    });
  };

  const submitReceiving = async () => {
    if (!receiveDialog) {
      return;
    }

    const itemsToSubmit = receiveDialog.items.filter((item) => item.orderedQuantity > 0);
    if (itemsToSubmit.length === 0) {
      window.alert('No receivable items found for this order.');
      return;
    }

    try {
      setSubmitting(true);

      const requests = itemsToSubmit.map((item) => {
        let nextStatus = 'REJECTED';
        if (item.actualQuantity >= item.orderedQuantity) {
          nextStatus = 'RECEIVED';
        } else if (item.actualQuantity > 0 && item.actualQuantity < item.orderedQuantity) {
          nextStatus = 'PARTIALLY_RECEIVED';
        }

        if (receiveDialog.kind === 'feed') {
          return updateFeedPurchaseOrderItemStatus(receiveDialog.orderId, item.id, nextStatus, {
            actualQuantityKg: item.actualQuantity,
            receiptLocation: receiveDialog.location,
          });
        }

        return updateFishPurchaseOrderItemStatus(receiveDialog.orderId, item.id, nextStatus, {
          actualQuantity: item.actualQuantity,
          receiptLocation: receiveDialog.location,
        });
      });

      await Promise.all(requests);
      const totalReceived = itemsToSubmit.reduce((sum, item) => sum + item.actualQuantity, 0);
      const quantityUnit = receiveDialog.kind === 'feed' ? 'kg' : 'fish';

      setReceiveDialog(null);
      setInventoryFeedback(
        `Receipt posted: ${totalReceived.toLocaleString()} ${quantityUnit} moved to ${receiveDialog.location}.`,
      );
      await loadProcurementData();
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
              {getUserInitials(user.name)}
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

        {inventoryFeedback && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-sm text-green-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-4 h-4" />
                <span>{inventoryFeedback}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setInventoryFeedback(null)}>
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white">
            <TabsTrigger value="feed-orders">Feed Orders</TabsTrigger>
            <TabsTrigger value="fish-orders">Fish Orders</TabsTrigger>
            <TabsTrigger value="medicine-orders">Medicine Orders</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          </TabsList>

          <TabsContent value="feed-orders" className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Feed Purchase Orders</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {filteredFeedOrders.length} order(s), page {feedPage} of {feedPageCount}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="space-y-1">
                  <Label htmlFor="feed-status-filter" className="text-xs text-gray-600">
                    Feed order status filter
                  </Label>
                  <select
                    id="feed-status-filter"
                    className="h-10 rounded-md border border-gray-300 px-3 text-sm bg-white"
                    value={feedStatusFilter}
                    onChange={(event) => setFeedStatusFilter(event.target.value)}
                  >
                    {ORDER_STATUS_FILTER_OPTIONS.map((option) => (
                      <option key={`feed-filter-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  className="bg-[#088395] hover:bg-[#0A4D68]"
                  onClick={() => setShowCreateFeedOrder(true)}
                  disabled={submitting}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Feed Order
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {paginatedFeedOrders.map((order) => (
                <Card key={order.id} className="bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                          <Badge variant="outline" className="text-xs">ID: {toShortId(order.id)}</Badge>
                          <Badge className={getProcurementStatusColorClass(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{formatProcurementStatusLabel(order.status)}</span>
                          </Badge>
                          {order.deliveryStatus && (
                            <Badge className={getProcurementStatusColorClass(order.deliveryStatus)}>
                              <Truck className="w-3 h-3 mr-1" />
                              {formatProcurementStatusLabel(order.deliveryStatus)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Supplier: {formatNameWithId(order.supplierName, order.supplierId)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Order Date: {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#0A4D68]">{formatCurrencyEgp(order.totalCost)}</p>
                        {order.deliveryDate && (
                          <p className="text-xs text-gray-500">
                            Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
                          </p>
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
                              <p className="font-medium text-sm">
                                {formatNameWithId(item.foodTypeName || 'Unknown food type', item.foodTypeId)}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-600 mt-1 flex-wrap">
                                <span>
                                  Ordered: {formatKg(item.quantityKg)} @ {formatCurrencyEgp(item.unitCost)}/kg
                                </span>
                                <span>Line ID: {toShortId(item.id)}</span>
                                {item.actualQuantityKg !== undefined && (
                                  <span
                                    className={
                                      item.actualQuantityKg < item.quantityKg ? 'text-yellow-700' : 'text-green-700'
                                    }
                                  >
                                    Actual: {formatKg(item.actualQuantityKg)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge className={`${getProcurementStatusColorClass(item.status)} text-xs`}>
                              {formatProcurementStatusLabel(item.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-4 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => setDetailsDialog({ kind: 'feed', order })}>
                        View Details
                      </Button>

                      {normalizeProcurementStatus(order.status) === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-[#10B981] hover:bg-[#059669]"
                            onClick={() =>
                              openConfirmationDialog(
                                'Approve Feed Order',
                                `Approve ${order.orderNumber} for ${order.supplierName}?`,
                                'Feed order approved.',
                                () => updateFeedPurchaseOrderStatus(order.id, 'APPROVED'),
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
                              openConfirmationDialog(
                                'Cancel Feed Order',
                                `Cancel ${order.orderNumber} for ${order.supplierName}?`,
                                'Feed order canceled.',
                                () => updateFeedPurchaseOrderStatus(order.id, 'CANCELED'),
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

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!isFeedOrderDeliverable(order) || submitting}
                        onClick={() => openReceiveDialogForFeedOrder(order)}
                      >
                        Receive Items
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredFeedOrders.length === 0 && (
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-8 text-center text-gray-600">No feed purchase orders found.</CardContent>
                </Card>
              )}

              {filteredFeedOrders.length > 0 && (
                <div className="flex items-center justify-between rounded-lg border bg-white p-3">
                  <p className="text-sm text-gray-600">
                    Page {feedPage} of {feedPageCount}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={feedPage <= 1}
                      aria-label="Previous feed page"
                      onClick={() => setFeedPage((previous) => Math.max(1, previous - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={feedPage >= feedPageCount}
                      aria-label="Next feed page"
                      onClick={() => setFeedPage((previous) => Math.min(feedPageCount, previous + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="fish-orders" className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Fish Purchase Orders</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {filteredFishOrders.length} order(s), page {fishPage} of {fishPageCount}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="space-y-1">
                  <Label htmlFor="fish-status-filter" className="text-xs text-gray-600">
                    Fish order status filter
                  </Label>
                  <select
                    id="fish-status-filter"
                    className="h-10 rounded-md border border-gray-300 px-3 text-sm bg-white"
                    value={fishStatusFilter}
                    onChange={(event) => setFishStatusFilter(event.target.value)}
                  >
                    {ORDER_STATUS_FILTER_OPTIONS.map((option) => (
                      <option key={`fish-filter-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  className="bg-[#088395] hover:bg-[#0A4D68]"
                  onClick={() => setShowCreateFishOrder(true)}
                  disabled={submitting}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Fish Order
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {paginatedFishOrders.map((order) => (
                <Card key={order.id} className="bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                          <Badge variant="outline" className="text-xs">ID: {toShortId(order.id)}</Badge>
                          <Badge className={getProcurementStatusColorClass(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{formatProcurementStatusLabel(order.status)}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Supplier: {formatNameWithId(order.supplierName, order.supplierId)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Order Date: {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#0A4D68]">{formatCurrencyEgp(order.totalCost)}</p>
                        {order.deliveryDate && (
                          <p className="text-xs text-gray-500">
                            Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
                          </p>
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
                              <p className="font-medium text-sm">
                                {formatNameWithId(item.fishTypeName || 'Unknown fish type', item.fishTypeId)}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-600 mt-1 flex-wrap">
                                <span>Ordered: {formatFishCount(item.quantity)}</span>
                                <span>Line ID: {toShortId(item.id)}</span>
                                {item.actualQuantity !== undefined && (
                                  <span
                                    className={item.actualQuantity < item.quantity ? 'text-yellow-700' : 'text-green-700'}
                                  >
                                    Actual: {formatFishCount(item.actualQuantity)}
                                  </span>
                                )}
                                <span>Cost: {formatCurrencyEgp(item.totalCost)}</span>
                              </div>
                            </div>
                            <Badge className={`${getProcurementStatusColorClass(item.status)} text-xs`}>
                              {formatProcurementStatusLabel(item.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-4 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => setDetailsDialog({ kind: 'fish', order })}>
                        View Details
                      </Button>

                      {normalizeProcurementStatus(order.status) === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-[#10B981] hover:bg-[#059669]"
                            onClick={() =>
                              openConfirmationDialog(
                                'Approve Fish Order',
                                `Approve ${order.orderNumber} for ${order.supplierName}?`,
                                'Fish order approved.',
                                () => updateFishPurchaseOrderStatus(order.id, 'APPROVED'),
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
                              openConfirmationDialog(
                                'Cancel Fish Order',
                                `Cancel ${order.orderNumber} for ${order.supplierName}?`,
                                'Fish order canceled.',
                                () => updateFishPurchaseOrderStatus(order.id, 'CANCELED'),
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
                        disabled={!isFishOrderDeliverable(order) || submitting}
                        onClick={() => openReceiveDialogForFishOrder(order)}
                      >
                        Receive Items
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredFishOrders.length === 0 && (
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-8 text-center text-gray-600">No fish purchase orders found.</CardContent>
                </Card>
              )}

              {filteredFishOrders.length > 0 && (
                <div className="flex items-center justify-between rounded-lg border bg-white p-3">
                  <p className="text-sm text-gray-600">
                    Page {fishPage} of {fishPageCount}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={fishPage <= 1}
                      aria-label="Previous fish page"
                      onClick={() => setFishPage((previous) => Math.max(1, previous - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={fishPage >= fishPageCount}
                      aria-label="Next fish page"
                      onClick={() => setFishPage((previous) => Math.min(fishPageCount, previous + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="medicine-orders" className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Medicine Purchase Orders</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {filteredMedicineOrders.length} order(s), page {medicinePage} of {medicinePageCount}
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3">
                <div className="space-y-1">
                  <Label htmlFor="medicine-supplier-search" className="text-xs text-gray-600">
                    Search supplier
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="medicine-supplier-search"
                      aria-label="Search medicine suppliers"
                      value={medicineSupplierSearchTerm}
                      onChange={(event) => setMedicineSupplierSearchTerm(event.target.value)}
                      placeholder="Search by supplier name"
                      className="pl-8 w-full md:w-64"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="medicine-status-filter" className="text-xs text-gray-600">
                    Status filter
                  </Label>
                  <select
                    id="medicine-status-filter"
                    className="h-10 rounded-md border border-gray-300 px-3 text-sm bg-white"
                    value={medicineStatusFilter}
                    onChange={(event) => setMedicineStatusFilter(event.target.value)}
                  >
                    {ORDER_STATUS_FILTER_OPTIONS.map((option) => (
                      <option key={`medicine-filter-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  className="bg-[#088395] hover:bg-[#0A4D68]"
                  onClick={() => setShowCreateMedicineOrder(true)}
                  disabled={submitting}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Medicine Order
                </Button>
              </div>
            </div>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Delivery Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMedicineOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="font-medium">{order.orderNumber}</div>
                          <div className="text-xs text-gray-500">ID: {toShortId(order.id)}</div>
                        </TableCell>
                        <TableCell>{formatNameWithId(order.supplierName, order.supplierId)}</TableCell>
                        <TableCell>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>{formatCurrencyEgp(order.totalCost)}</TableCell>
                        <TableCell>
                          <Badge className={getProcurementStatusColorClass(order.status)}>
                            {formatProcurementStatusLabel(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getProcurementStatusColorClass(order.deliveryStatus || order.status)}>
                            {formatProcurementStatusLabel(order.deliveryStatus || 'N/A')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void openMedicineOrderDetails(order)}
                            >
                              Details
                            </Button>
                            {normalizeProcurementStatus(order.status) === 'PENDING' && (
                              <Button
                                size="sm"
                                className="bg-[#10B981] hover:bg-[#059669]"
                                disabled={submitting}
                                onClick={() =>
                                  openConfirmationDialog(
                                    'Approve Medicine Order',
                                    `Approve ${order.orderNumber} for ${order.supplierName}?`,
                                    'Medicine order approved and marked delivered.',
                                    () => updateMedicinePurchaseOrderStatus(order.id, 'DELIVERED'),
                                  )
                                }
                              >
                                Approve
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={submitting}
                              onClick={() =>
                                void handleOrderAction(
                                  () => updateMedicinePurchaseOrderDeliveryStatus(order.id, 'SHIPPED'),
                                  'Medicine delivery status updated to shipped.',
                                )
                              }
                            >
                              Mark Shipped
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={submitting}
                              onClick={() =>
                                void handleOrderAction(
                                  () => updateMedicinePurchaseOrderDeliveryStatus(order.id, 'DELIVERED'),
                                  'Medicine delivery status updated to delivered.',
                                )
                              }
                            >
                              Mark Delivered
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {filteredMedicineOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-gray-600">
                          No medicine purchase orders found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {filteredMedicineOrders.length > 0 && (
              <div className="flex items-center justify-between rounded-lg border bg-white p-3">
                <p className="text-sm text-gray-600">
                  Page {medicinePage} of {medicinePageCount}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={medicinePage <= 1}
                    aria-label="Previous medicine page"
                    onClick={() => setMedicinePage((previous) => Math.max(1, previous - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={medicinePage >= medicinePageCount}
                    aria-label="Next medicine page"
                    onClick={() => setMedicinePage((previous) => Math.min(medicinePageCount, previous + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Suppliers</h2>
                <p className="text-sm text-gray-600 mt-1">Manage fish/feed providers with searchable contact details.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="space-y-1">
                  <Label htmlFor="supplier-search" className="text-xs text-gray-600">
                    Search suppliers
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="supplier-search"
                      aria-label="Search suppliers"
                      value={supplierSearchTerm}
                      onChange={(event) => setSupplierSearchTerm(event.target.value)}
                      placeholder="Search by name, id, email, phone"
                      className="pl-8 w-full sm:w-80"
                    />
                  </div>
                </div>

                <Button
                  className="bg-[#088395] hover:bg-[#0A4D68]"
                  onClick={() => setShowCreateSupplier(true)}
                  disabled={submitting}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Supplier
                </Button>
              </div>
            </div>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Primary Contact</TableHead>
                      <TableHead>Item Types</TableHead>
                      <TableHead>Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-xs text-gray-500">ID: {toShortId(supplier.id)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-700">{supplier.email || supplier.phoneNumber || 'N/A'}</div>
                          {supplier.email && supplier.phoneNumber && (
                            <div className="text-xs text-gray-500">{supplier.phoneNumber}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
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
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-700">{supplier.address || 'N/A'}</span>
                        </TableCell>
                      </TableRow>
                    ))}

                    {filteredSuppliers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-gray-600">
                          No suppliers match your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Feed Purchase Order</DialogTitle>
            <DialogDescription>
              Build a feed order with dynamic line items and automatic totals.
            </DialogDescription>
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
                      {formatNameWithId(supplier.name, supplier.id)}
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
                  <div key={`feed-item-form-${index}`} className="border rounded-md p-3 space-y-2">
                    <div className="grid grid-cols-12 gap-2">
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
                                {formatNameWithId(foodType.name, foodType.id)}
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

                    <p className="text-xs text-gray-600">
                      Line Total: {formatCurrencyEgp(item.quantityKg * item.unitCost)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Grand Total:</span>
                <span className="text-[#0A4D68]">{formatCurrencyEgp(feedOrderTotal)}</span>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Fish Purchase Order</DialogTitle>
            <DialogDescription>
              Build a fish order with dynamic line items and automatic totals.
            </DialogDescription>
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
                      {formatNameWithId(supplier.name, supplier.id)}
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
                  <div key={`fish-item-form-${index}`} className="border rounded-md p-3 space-y-2">
                    <div className="grid grid-cols-12 gap-2">
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
                                {formatNameWithId(fishType.name, fishType.id)}
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

                    <p className="text-xs text-gray-600">
                      Line Total: {formatCurrencyEgp(item.quantity * item.unitCost)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Grand Total:</span>
                <span className="text-[#0A4D68]">{formatCurrencyEgp(fishOrderTotal)}</span>
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

      <CreateMedicineOrderDialog
        open={showCreateMedicineOrder}
        onOpenChange={(open) => {
          setShowCreateMedicineOrder(open);
          if (!open) {
            resetMedicineOrderForm();
          }
        }}
        submitting={submitting}
        supplierId={medicineOrderSupplierId}
        suppliers={medicineSuppliers}
        items={medicineOrderItems}
        fishTypes={fishTypes}
        totalCost={medicineOrderTotal}
        onSupplierChange={setMedicineOrderSupplierId}
        onItemsChange={setMedicineOrderItems}
        onAddItem={() => setMedicineOrderItems((previous) => [...previous, createMedicineOrderItem()])}
        onCreate={handleCreateMedicineOrder}
      />

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
            <DialogDescription>
              Provide supplier details and one or more supplied item types.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={supplierName} onChange={(event) => setSupplierName(event.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <Label>Supplied Item Types *</Label>
              <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                {SUPPLIER_ITEM_TYPE_OPTIONS.map((itemType) => (
                  <label key={itemType} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={supplierItemTypes.includes(itemType)}
                      onChange={() => toggleSupplierItemType(itemType)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span>{formatProcurementStatusLabel(itemType)}</span>
                  </label>
                ))}
              </div>
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

      <Dialog open={Boolean(detailsDialog)} onOpenChange={(open) => !open && setDetailsDialog(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {detailsDialog
                ? `${detailsDialog.kind === 'feed' ? 'Feed' : detailsDialog.kind === 'fish' ? 'Fish' : 'Medicine'} Order ${detailsDialog.order.orderNumber}`
                : 'Order Details'}
            </DialogTitle>
            <DialogDescription>
              {detailsDialog
                ? `Order ID: ${toShortId(detailsDialog.order.id)} · Supplier: ${formatNameWithId(
                    detailsDialog.order.supplierName,
                    detailsDialog.order.supplierId,
                  )}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {detailsDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <Card className="bg-gray-50">
                  <CardContent className="p-3">
                    <p className="text-gray-500 text-xs">Status</p>
                    <Badge className={`${getProcurementStatusColorClass(detailsDialog.order.status)} mt-1`}>
                      {formatProcurementStatusLabel(detailsDialog.order.status)}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50">
                  <CardContent className="p-3">
                    <p className="text-gray-500 text-xs">Order Date</p>
                    <p className="font-medium mt-1">
                      {detailsDialog.order.orderDate
                        ? new Date(detailsDialog.order.orderDate).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50">
                  <CardContent className="p-3">
                    <p className="text-gray-500 text-xs">Total Cost</p>
                    <p className="font-medium mt-1 text-[#0A4D68]">{formatCurrencyEgp(detailsDialog.order.totalCost)}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Ordered</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Line ID</TableHead>
                      <TableHead>Update Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailsDialog.kind === 'feed'
                      ? (detailsDialog.order as FeedPurchaseOrderRecord).items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {formatNameWithId(item.foodTypeName || 'Unknown food type', item.foodTypeId)}
                            </TableCell>
                            <TableCell>{formatKg(item.quantityKg)}</TableCell>
                            <TableCell>{item.actualQuantityKg !== undefined ? formatKg(item.actualQuantityKg) : '-'}</TableCell>
                            <TableCell>
                              <Badge className={`${getProcurementStatusColorClass(item.status)} text-xs`}>
                                {formatProcurementStatusLabel(item.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>{toShortId(item.id)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <select
                                  aria-label={`Line item status ${item.id}`}
                                  className="h-8 rounded-md border border-gray-300 px-2 text-xs bg-white"
                                  value={lineItemStatusDrafts[item.id] || normalizeProcurementUiStatus(item.status)}
                                  onChange={(event) => updateLineItemStatusDraft(item.id, event.target.value)}
                                  disabled={submitting}
                                >
                                  {LINE_ITEM_STATUS_OPTIONS.map((option) => (
                                    <option key={`${item.id}-feed-status-${option.value}`} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={
                                    submitting ||
                                    updatingLineItemId === item.id ||
                                    normalizeProcurementUiStatus(lineItemStatusDrafts[item.id] || item.status) ===
                                      normalizeProcurementUiStatus(item.status)
                                  }
                                  onClick={() =>
                                    void submitLineItemStatus(item.id, item.status, 'feed', detailsDialog.order.id)
                                  }
                                >
                                  {updatingLineItemId === item.id ? 'Updating...' : 'Update'}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      : detailsDialog.kind === 'fish'
                        ? (detailsDialog.order as FishPurchaseOrderRecord).items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                {formatNameWithId(item.fishTypeName || 'Unknown fish type', item.fishTypeId)}
                              </TableCell>
                              <TableCell>{formatFishCount(item.quantity)}</TableCell>
                              <TableCell>
                                {item.actualQuantity !== undefined ? formatFishCount(item.actualQuantity) : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge className={`${getProcurementStatusColorClass(item.status)} text-xs`}>
                                  {formatProcurementStatusLabel(item.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>{toShortId(item.id)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <select
                                    aria-label={`Line item status ${item.id}`}
                                    className="h-8 rounded-md border border-gray-300 px-2 text-xs bg-white"
                                    value={lineItemStatusDrafts[item.id] || normalizeProcurementUiStatus(item.status)}
                                    onChange={(event) => updateLineItemStatusDraft(item.id, event.target.value)}
                                    disabled={submitting}
                                  >
                                    {LINE_ITEM_STATUS_OPTIONS.map((option) => (
                                      <option key={`${item.id}-fish-status-${option.value}`} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={
                                      submitting ||
                                      updatingLineItemId === item.id ||
                                      normalizeProcurementUiStatus(lineItemStatusDrafts[item.id] || item.status) ===
                                        normalizeProcurementUiStatus(item.status)
                                    }
                                    onClick={() =>
                                      void submitLineItemStatus(item.id, item.status, 'fish', detailsDialog.order.id)
                                    }
                                  >
                                    {updatingLineItemId === item.id ? 'Updating...' : 'Update'}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        : (detailsDialog.order as MedicinePurchaseOrderRecord).items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="font-medium">{item.medicine}</div>
                                <div className="text-xs text-gray-500">Company: {item.company}</div>
                                <div className="text-xs text-gray-500">
                                  Fish Types:{' '}
                                  {item.fishTypeNames.length > 0
                                    ? item.fishTypeNames.join(', ')
                                    : item.fishTypeIds.map((fishTypeId) => toShortId(fishTypeId)).join(', ') || 'N/A'}
                                </div>
                              </TableCell>
                              <TableCell>{item.quantity.toLocaleString()}</TableCell>
                              <TableCell>{item.actualQuantity !== undefined ? item.actualQuantity.toLocaleString() : '-'}</TableCell>
                              <TableCell>
                                <Badge className={`${getProcurementStatusColorClass(item.status)} text-xs`}>
                                  {formatProcurementStatusLabel(item.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>{toShortId(item.id)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <select
                                    aria-label={`Line item status ${item.id}`}
                                    className="h-8 rounded-md border border-gray-300 px-2 text-xs bg-white"
                                    value={lineItemStatusDrafts[item.id] || normalizeProcurementUiStatus(item.status)}
                                    onChange={(event) => updateLineItemStatusDraft(item.id, event.target.value)}
                                    disabled={submitting}
                                  >
                                    {LINE_ITEM_STATUS_OPTIONS.map((option) => (
                                      <option key={`${item.id}-medicine-status-${option.value}`} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={
                                      submitting ||
                                      updatingLineItemId === item.id ||
                                      normalizeProcurementUiStatus(lineItemStatusDrafts[item.id] || item.status) ===
                                        normalizeProcurementUiStatus(item.status)
                                    }
                                    onClick={() =>
                                      void submitLineItemStatus(item.id, item.status, 'medicine', detailsDialog.order.id)
                                    }
                                  >
                                    {updatingLineItemId === item.id ? 'Updating...' : 'Update'}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(receiveDialog)} onOpenChange={(open) => !open && setReceiveDialog(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Receive Items - {receiveDialog?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              {receiveDialog
                ? `Supplier: ${receiveDialog.supplierName} (${toShortId(receiveDialog.orderId)})`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {receiveDialog && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receipt-location">Receipt Location</Label>
                <Input
                  id="receipt-location"
                  value={receiveDialog.location}
                  onChange={(event) =>
                    setReceiveDialog((previous) =>
                      previous ? { ...previous, location: event.target.value || DEFAULT_RECEIVING_LOCATION } : previous,
                    )
                  }
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Line Item</TableHead>
                      <TableHead>Ordered</TableHead>
                      <TableHead>Actual Receipt</TableHead>
                      <TableHead>Next Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receiveDialog.items.map((item) => {
                      let nextStatus = 'Rejected';
                      if (item.actualQuantity >= item.orderedQuantity) {
                        nextStatus = 'Received';
                      } else if (item.actualQuantity > 0 && item.actualQuantity < item.orderedQuantity) {
                        nextStatus = 'Partially Received';
                      }

                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-medium">{formatNameWithId(item.label, item.typeId)}</div>
                            <div className="text-xs text-gray-500">Line ID: {toShortId(item.id)}</div>
                          </TableCell>
                          <TableCell>{item.unit === 'kg' ? formatKg(item.orderedQuantity) : formatFishCount(item.orderedQuantity)}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={item.actualQuantity}
                              onChange={(event) =>
                                updateReceiveDialogItem(item.id, Number(event.target.value) || 0)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getProcurementStatusColorClass(nextStatus)} text-xs`}>
                              {nextStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setReceiveDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={() => void submitReceiving()} disabled={submitting}>
                  {submitting ? 'Posting Receipt...' : 'Submit Receipt'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmationDialog.open}
        onOpenChange={(open) =>
          setConfirmationDialog((previous) => ({
            ...previous,
            open,
            action: open ? previous.action : null,
          }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmationDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmationDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void runConfirmationAction()} disabled={submitting}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
