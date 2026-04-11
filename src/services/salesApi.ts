import {
  ApiClientError,
  asArray,
  asBoolean,
  asNumber,
  asRecord,
  asString,
  requestJson,
  unwrapApiData,
} from './httpClient';

export type SalesOrderStatusKey = 'PENDING' | 'FULFILLED' | 'CANCELLED' | 'UNKNOWN';

export interface SalesOrderItemRecord {
  id: string;
  harvestedInventoryId: string;
  lotNumber?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  status: string;
  tankId?: string;
  tankName?: string;
}

export interface SalesOrderRecord {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  totalAmount: number;
  status: string;
  lineItems: SalesOrderItemRecord[];
  notes?: string;
  orderDate?: string;
  deliveryDate?: string;
  deliveredAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesCustomerRecord {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  customerType: string;
  currentBalance: number;
  isActive: boolean;
  contactPerson?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesDashboardMetricsRecord {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  availableStock: number;
}

export interface HarvestedStockItemRecord {
  id: string;
  fishType: string;
  grade: string;
  weight: number;
  availableKg: number;
  price: number;
  totalValue: number;
  storageType: string;
  harvestedAt?: string;
  expiryDate?: string;
  expiryCountdown: number;
  isExpired: boolean;
  isUrgent: boolean;
  lotNumber?: string;
  tankId?: string;
  tankName?: string;
}

export interface HarvestedStockDashboardRecord {
  totalStock: number;
  totalValue: number;
  urgentItems: number;
  stockItems: HarvestedStockItemRecord[];
}

export interface AvailableSalesInventoryRecord {
  id: string;
  harvestedInventoryId: string;
  fishType: string;
  grade: string;
  availableKg: number;
  unitPrice: number;
  lotNumber?: string;
  tankId?: string;
  tankName?: string;
  expiryDate?: string;
  expiryCountdown: number;
}

export interface CreateSalesOrderPayload {
  customerId: string;
  deliveryDate?: string;
  notes?: string;
  lineItems: Array<{
    harvestedInventoryId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface SalesCustomerCreatePayload {
  name: string;
  email?: string;
  phone: string;
  address?: string;
  customerType: 'WHOLESALER' | 'RETAILER' | 'RESTAURANT' | 'INDIVIDUAL';
  contactPerson?: string;
  notes?: string;
  isActive: boolean;
}

const toStatusKey = (value: unknown): string => {
  const normalized = asString(value);
  if (!normalized) {
    return 'UNKNOWN';
  }
  return normalized
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
};

const extractArrayPayload = (payload: unknown, keys: string[]): unknown[] => {
  const data = unwrapApiData<unknown>(payload);
  if (Array.isArray(data)) {
    return data;
  }

  const record = asRecord(data);
  if (!record) {
    return [];
  }

  for (const key of keys) {
    if (Array.isArray(record[key])) {
      return asArray(record[key]);
    }
  }

  return [];
};

const extractObjectPayload = (payload: unknown): Record<string, unknown> => {
  const data = unwrapApiData<unknown>(payload);
  return asRecord(data) ?? {};
};

const parseIsoDate = (value: unknown): string | undefined => {
  const date = asString(value);
  if (!date) {
    return undefined;
  }
  return date;
};

const readRecordId = (record: Record<string, unknown>, key = 'id'): string | undefined => {
  const direct = asString(record[key]);
  if (direct) {
    return direct;
  }

  const nested = asRecord(record[key]);
  return asString(nested?.value) || asString(nested?.id);
};

const calculateExpiryCountdown = (date?: string): number => {
  if (!date) {
    return 0;
  }
  const expiry = new Date(date);
  if (Number.isNaN(expiry.getTime())) {
    return 0;
  }
  return Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

const normalizeCustomer = (value: unknown): SalesCustomerRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = readRecordId(record);
  const name = asString(record.name);
  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    email: asString(record.email),
    phone: asString(record.phone) || '',
    address: asString(record.address),
    customerType: toStatusKey(record.customerType),
    currentBalance:
      asNumber(record.currentBalance) ??
      asNumber(record.outstandingBalance) ??
      asNumber(record.balance) ??
      0,
    isActive: asBoolean(record.isActive) ?? true,
    contactPerson: asString(record.contactPerson),
    notes: asString(record.notes),
    createdAt: parseIsoDate(record.createdAt),
    updatedAt: parseIsoDate(record.updatedAt),
  };
};

const normalizeOrderItem = (value: unknown, index: number): SalesOrderItemRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = readRecordId(record) || asString(record.itemId) || `sales-item-${index}`;
  const harvestedInventoryId = asString(record.harvestedInventoryId) || asString(record.inventoryId) || '';

  return {
    id,
    harvestedInventoryId,
    lotNumber: asString(record.lotNumber),
    quantity: asNumber(record.quantity) ?? asNumber(record.quantityKg) ?? 0,
    unitPrice: asNumber(record.unitPrice) ?? asNumber(record.pricePerKg) ?? 0,
    subtotal:
      asNumber(record.subtotal) ??
      asNumber(record.totalPrice) ??
      (asNumber(record.quantity) ?? asNumber(record.quantityKg) ?? 0) *
        (asNumber(record.unitPrice) ?? asNumber(record.pricePerKg) ?? 0),
    status: toStatusKey(record.status),
    tankId: asString(record.tankId),
    tankName: asString(record.tankName),
  };
};

const normalizeSalesOrder = (value: unknown): SalesOrderRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = readRecordId(record);
  if (!id) {
    return null;
  }

  const customerRecord = asRecord(record.customer);
  const customerId = asString(record.customerId) || asString(customerRecord?.id) || '';
  const items = asArray(record.lineItems)
    .map((item, index) => normalizeOrderItem(item, index))
    .filter((entry): entry is SalesOrderItemRecord => entry !== null);

  return {
    id,
    orderNumber: asString(record.orderNumber) || id,
    customerId,
    customerName: asString(record.customerName) || asString(customerRecord?.name),
    totalAmount: asNumber(record.totalAmount) ?? asNumber(record.total) ?? items.reduce((sum, item) => sum + item.subtotal, 0),
    status: toStatusKey(record.status),
    lineItems: items,
    notes: asString(record.notes),
    orderDate: parseIsoDate(record.orderDate),
    deliveryDate: parseIsoDate(record.deliveryDate),
    deliveredAt: parseIsoDate(record.deliveredAt),
    createdAt: parseIsoDate(record.createdAt),
    updatedAt: parseIsoDate(record.updatedAt),
  };
};

const normalizeDashboardMetrics = (value: unknown): SalesDashboardMetricsRecord => {
  const record = asRecord(value) ?? {};
  return {
    totalOrders: asNumber(record.totalOrders) ?? 0,
    pendingOrders: asNumber(record.pendingOrders) ?? 0,
    totalRevenue: asNumber(record.totalRevenue) ?? 0,
    availableStock: asNumber(record.availableStock) ?? 0,
  };
};

const normalizeHarvestedStockItem = (value: unknown, index: number): HarvestedStockItemRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const fishTypeRecord = asRecord(record.fishType);
  const gradeRecord = asRecord(record.gradePricing);
  const id =
    readRecordId(record) ||
    asString(record.harvestedInventoryId) ||
    asString(record.inventoryId) ||
    `stock-${index}`;

  const fishType =
    asString(record.fishType) ||
    asString(record.fishTypeName) ||
    asString(fishTypeRecord?.name) ||
    'Unknown Fish';
  const grade = asString(record.grade) || asString(record.gradeName) || asString(gradeRecord?.gradeName) || 'N/A';
  const weight = asNumber(record.weight) ?? asNumber(record.availableKg) ?? asNumber(record.quantity) ?? 0;
  const price = asNumber(record.price) ?? asNumber(record.unitPrice) ?? asNumber(gradeRecord?.pricePerKg) ?? 0;
  const expiryDate = parseIsoDate(record.expiryDate);
  const expiryCountdown = asNumber(record.expiryCountdown) ?? calculateExpiryCountdown(expiryDate);
  const isExpired = asBoolean(record.isExpired) ?? expiryCountdown < 0;
  const isUrgent = asBoolean(record.isUrgent) ?? (!isExpired && expiryCountdown <= 2);

  return {
    id,
    fishType,
    grade,
    weight,
    availableKg: asNumber(record.availableKg) ?? weight,
    price,
    totalValue: asNumber(record.totalValue) ?? weight * price,
    storageType: toStatusKey(record.storageType),
    harvestedAt: parseIsoDate(record.harvestedAt) || parseIsoDate(record.createdAt),
    expiryDate,
    expiryCountdown,
    isExpired,
    isUrgent,
    lotNumber: asString(record.lotNumber),
    tankId: asString(record.tankId),
    tankName: asString(record.tankName),
  };
};

const normalizeHarvestedStockDashboard = (value: unknown): HarvestedStockDashboardRecord => {
  const record = asRecord(value) ?? {};
  const stockItems = extractArrayPayload(record.stockItems ?? record.items ?? [], ['stockItems', 'items'])
    .map((item, index) => normalizeHarvestedStockItem(item, index))
    .filter((entry): entry is HarvestedStockItemRecord => entry !== null);

  return {
    totalStock:
      asNumber(record.totalStock) ??
      asNumber(record.totalWeight) ??
      stockItems.reduce((sum, item) => sum + item.weight, 0),
    totalValue:
      asNumber(record.totalValue) ??
      asNumber(record.inventoryValue) ??
      stockItems.reduce((sum, item) => sum + item.totalValue, 0),
    urgentItems:
      asNumber(record.urgentItems) ??
      asNumber(record.expiringSoon) ??
      stockItems.filter((item) => item.isUrgent).length,
    stockItems,
  };
};

const normalizeAvailableInventory = (value: unknown, index: number): AvailableSalesInventoryRecord | null => {
  const stock = normalizeHarvestedStockItem(value, index);
  if (!stock) {
    return null;
  }

  return {
    id: stock.id,
    harvestedInventoryId: stock.id,
    fishType: stock.fishType,
    grade: stock.grade,
    availableKg: stock.availableKg,
    unitPrice: stock.price,
    lotNumber: stock.lotNumber,
    tankId: stock.tankId,
    tankName: stock.tankName,
    expiryDate: stock.expiryDate,
    expiryCountdown: stock.expiryCountdown,
  };
};

const formatQuery = (params: Record<string, string | number | boolean | undefined>): string => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    query.set(key, String(value));
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
};

const callStatusTransition = async (path: string): Promise<void> => {
  try {
    await requestJson(path, { method: 'PATCH' });
    return;
  } catch (error) {
    if (!(error instanceof ApiClientError) || (error.status !== 404 && error.status !== 405)) {
      throw error;
    }
  }

  await requestJson(path, { method: 'POST' });
};

export const getSalesOrders = async (filters?: {
  status?: string;
  customerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<SalesOrderRecord[]> => {
  const payload = await requestJson(
    `/sales/orders${
      formatQuery({
        status: filters?.status && toStatusKey(filters.status) !== 'ALL' ? toStatusKey(filters.status) : undefined,
        customerId: filters?.customerId,
        search: filters?.search,
        page: filters?.page,
        limit: filters?.limit,
      })
    }`,
  );

  return extractArrayPayload(payload, ['orders', 'items', 'rows', 'data'])
    .map(normalizeSalesOrder)
    .filter((entry): entry is SalesOrderRecord => entry !== null);
};

export const createSalesOrder = async (payload: CreateSalesOrderPayload): Promise<SalesOrderRecord | null> => {
  const response = await requestJson('/sales/orders', {
    method: 'POST',
    body: payload,
  });

  const record = extractObjectPayload(response);
  const normalized = normalizeSalesOrder(record);
  return normalized;
};

export const getSalesOrderById = async (orderId: string): Promise<SalesOrderRecord | null> => {
  const payload = await requestJson(`/sales/orders/${orderId}`);
  const record = extractObjectPayload(payload);
  return normalizeSalesOrder(record);
};

export const fulfillSalesOrder = async (orderId: string): Promise<void> => {
  await callStatusTransition(`/sales/orders/${orderId}/fulfill`);
};

export const cancelSalesOrder = async (orderId: string): Promise<void> => {
  await callStatusTransition(`/sales/orders/${orderId}/cancel`);
};

export const getSalesCustomers = async (filters?: {
  search?: string;
  customerType?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<SalesCustomerRecord[]> => {
  const payload = await requestJson(
    `/sales/customers${
      formatQuery({
        search: filters?.search,
        customerType: filters?.customerType,
        isActive: filters?.isActive,
        page: filters?.page,
        limit: filters?.limit,
      })
    }`,
  );

  return extractArrayPayload(payload, ['customers', 'items', 'rows', 'data'])
    .map(normalizeCustomer)
    .filter((entry): entry is SalesCustomerRecord => entry !== null);
};

export const createSalesCustomer = async (
  payload: SalesCustomerCreatePayload,
): Promise<SalesCustomerRecord | null> => {
  const response = await requestJson('/sales/customers', {
    method: 'POST',
    body: payload,
  });

  const record = extractObjectPayload(response);
  return normalizeCustomer(record);
};

export const updateSalesCustomer = async (
  customerId: string,
  payload: Partial<SalesCustomerCreatePayload>,
): Promise<SalesCustomerRecord | null> => {
  const response = await requestJson(`/sales/customers/${customerId}`, {
    method: 'PATCH',
    body: payload,
  });

  const record = extractObjectPayload(response);
  return normalizeCustomer(record);
};

export const deleteSalesCustomer = async (customerId: string): Promise<void> => {
  await requestJson(`/sales/customers/${customerId}`, {
    method: 'DELETE',
  });
};

export const getSalesDashboardMetrics = async (): Promise<SalesDashboardMetricsRecord> => {
  const payload = await requestJson('/sales/analytics/dashboard');
  const record = extractObjectPayload(payload);
  return normalizeDashboardMetrics(record);
};

export const getSalesStockDashboard = async (): Promise<HarvestedStockDashboardRecord> => {
  const payload = await requestJson('/sales/analytics/stock-dashboard');
  const record = extractObjectPayload(payload);

  const stockItems = asArray(record.stockItems)
    .map((item, index) => normalizeHarvestedStockItem(item, index))
    .filter((entry): entry is HarvestedStockItemRecord => entry !== null);

  return {
    totalStock:
      asNumber(record.totalStock) ??
      asNumber(record.totalWeight) ??
      stockItems.reduce((sum, item) => sum + item.weight, 0),
    totalValue:
      asNumber(record.totalValue) ??
      stockItems.reduce((sum, item) => sum + item.totalValue, 0),
    urgentItems:
      asNumber(record.urgentItems) ?? stockItems.filter((item) => item.isUrgent).length,
    stockItems,
  };
};

export const getAvailableSalesInventory = async (): Promise<AvailableSalesInventoryRecord[]> => {
  const payload = await requestJson('/sales/orders/available-inventory');
  return extractArrayPayload(payload, ['availableInventory', 'inventory', 'stockItems', 'items', 'rows', 'data'])
    .map((item, index) => normalizeAvailableInventory(item, index))
    .filter((entry): entry is AvailableSalesInventoryRecord => entry !== null);
};

export const findHarvestedInventory = async (filters?: {
  fishTypeId?: string;
  storageType?: string;
  tankId?: string;
  batchId?: string;
  lotNumber?: string;
}): Promise<HarvestedStockItemRecord[]> => {
  const payload = await requestJson(
    `/harvested-inventory/find${
      formatQuery({
        fishTypeId: filters?.fishTypeId,
        storageType: filters?.storageType,
        tankId: filters?.tankId,
        batchId: filters?.batchId,
        lotNumber: filters?.lotNumber,
      })
    }`,
  );

  return extractArrayPayload(payload, ['inventory', 'stockItems', 'items', 'rows', 'data'])
    .map((item, index) => normalizeHarvestedStockItem(item, index))
    .filter((entry): entry is HarvestedStockItemRecord => entry !== null);
};

export const getHarvestedInventorySummary = async (): Promise<HarvestedStockDashboardRecord> => {
  const payload = await requestJson('/harvested-inventory/summary');
  const unwrapped = unwrapApiData<unknown>(payload);

  if (Array.isArray(unwrapped)) {
    const aggregate = unwrapped.reduce(
      (acc, entry) => {
        const row = asRecord(entry) ?? {};
        return {
          totalStock: acc.totalStock + (asNumber(row.totalWeight) ?? asNumber(row.weight) ?? 0),
          totalValue: acc.totalValue + (asNumber(row.totalValue) ?? 0),
        };
      },
      { totalStock: 0, totalValue: 0 },
    );

    return {
      totalStock: aggregate.totalStock,
      totalValue: aggregate.totalValue,
      urgentItems: 0,
      stockItems: [],
    };
  }

  const record = asRecord(unwrapped) ?? {};
  const stockItems = asArray(record.stockItems ?? record.items ?? record.data ?? [])
    .map((item, index) => normalizeHarvestedStockItem(item, index))
    .filter((entry): entry is HarvestedStockItemRecord => entry !== null);

  return {
    totalStock:
      asNumber(record.totalStock) ??
      asNumber(record.totalWeight) ??
      asNumber(record.totalQuantity) ??
      stockItems.reduce((sum, item) => sum + item.weight, 0),
    totalValue:
      asNumber(record.totalValue) ??
      asNumber(record.inventoryValue) ??
      stockItems.reduce((sum, item) => sum + item.totalValue, 0),
    urgentItems:
      asNumber(record.urgentItems) ??
      asNumber(record.expiringSoon) ??
      stockItems.filter((item) => item.isUrgent).length,
    stockItems,
  };
};

export const formatSalesStatusLabel = (status: string): string =>
  toStatusKey(status)
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');

export const normalizeSalesStatus = (status: string): SalesOrderStatusKey => {
  const normalized = toStatusKey(status);
  if (normalized === 'PENDING' || normalized === 'FULFILLED' || normalized === 'CANCELLED') {
    return normalized;
  }
  return 'UNKNOWN';
};
