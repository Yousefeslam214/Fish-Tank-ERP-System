import {
  asArray,
  asNumber,
  asRecord,
  asString,
  requestJson,
  unwrapApiData,
} from './httpClient';

export interface ProcurementSupplierRecord {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  items: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FeedPurchaseOrderItemRecord {
  id: string;
  foodTypeId?: string;
  foodTypeName?: string;
  quantityKg: number;
  unitCost: number;
  status: string;
  actualQuantityKg?: number;
}

export interface FeedPurchaseOrderRecord {
  id: string;
  orderNumber: string;
  supplierId?: string;
  supplierName: string;
  orderDate?: string;
  deliveryDate?: string;
  status: string;
  deliveryStatus?: string;
  totalCost: number;
  items: FeedPurchaseOrderItemRecord[];
}

export interface FishPurchaseOrderItemRecord {
  id: string;
  fishTypeId?: string;
  fishTypeName?: string;
  quantity: number;
  totalCost: number;
  status: string;
  actualQuantity?: number;
}

export interface FishPurchaseOrderRecord {
  id: string;
  orderNumber: string;
  supplierId?: string;
  supplierName: string;
  orderDate?: string;
  deliveryDate?: string;
  status: string;
  totalCost: number;
  items: FishPurchaseOrderItemRecord[];
}

export interface FeedOrderCreatePayload {
  supplierId: string;
  items: Array<{
    foodTypeId: string;
    quantityKg: number;
    unitCost: number;
  }>;
}

export interface FishOrderCreatePayload {
  supplierId: string;
  items: Array<{
    fishTypeId: string;
    quantity: number;
    totalCost: number;
  }>;
}

export interface SupplierCreatePayload {
  name: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  items: string[];
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

const toBackendWordStatus = (status: string): string => {
  const key = toStatusKey(status);
  switch (key) {
    case 'PENDING':
      return 'Pending';
    case 'APPROVED':
      return 'Approved';
    case 'CANCELLED':
    case 'CANCELED':
      return 'Canceled';
    case 'DELIVERED':
      return 'Delivered';
    case 'SHIPPED':
      return 'Shipped';
    case 'RETURNED':
      return 'Returned';
    default:
      return key
        .split('_')
        .filter(Boolean)
        .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
        .join(' ');
  }
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

const extractObjectPayload = (payload: unknown): Record<string, unknown> | undefined => {
  const data = unwrapApiData<unknown>(payload);
  return asRecord(data);
};

const normalizeSupplier = (value: unknown): ProcurementSupplierRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = asString(record.id);
  const name = asString(record.name);
  if (!id || !name) {
    return null;
  }

  const rawItems = asArray(record.items).length > 0 ? asArray(record.items) : asArray(record.types);
  const contactInfo = asString(record.contactInfo);
  const emailFromContact = contactInfo?.match(/Email:\s*([^,]+)/i)?.[1]?.trim();
  const phoneFromContact = contactInfo?.match(/Phone:\s*([^,]+)/i)?.[1]?.trim();
  const addressFromContact = contactInfo?.match(/Address:\s*([^,]+)/i)?.[1]?.trim();

  return {
    id,
    name,
    email: asString(record.email) || emailFromContact,
    phoneNumber: asString(record.phoneNumber) || asString(record.phone) || phoneFromContact,
    address: asString(record.address) || addressFromContact,
    items: rawItems
      .map((entry) => asString(entry))
      .filter((entry): entry is string => Boolean(entry))
      .map((entry) => toStatusKey(entry)),
    createdAt: asString(record.createdAt),
    updatedAt: asString(record.updatedAt),
  };
};

const normalizeFeedItem = (value: unknown, index: number): FeedPurchaseOrderItemRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = asString(record.id) || asString(record.itemId) || `feed-item-${index}`;
  const foodTypeRecord = asRecord(record.foodType);
  const foodTypeId = asString(record.foodTypeId) || asString(foodTypeRecord?.id);
  const foodTypeName =
    asString(record.foodTypeName) ||
    asString(record.foodType) ||
    asString(foodTypeRecord?.name) ||
    asString(record.name);

  return {
    id,
    foodTypeId,
    foodTypeName,
    quantityKg: asNumber(record.quantityKg) ?? asNumber(record.quantity) ?? 0,
    unitCost: asNumber(record.unitCost) ?? asNumber(record.pricePerKg) ?? 0,
    status: toStatusKey(record.status),
    actualQuantityKg:
      asNumber(record.actualQuantityKg) ?? asNumber(record.receivedQuantityKg) ?? asNumber(record.actualQuantity),
  };
};

const normalizeFeedOrder = (value: unknown): FeedPurchaseOrderRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = asString(record.id);
  if (!id) {
    return null;
  }

  const supplierRecord = asRecord(record.supplier);
  const rawItems = asArray(record.items).length > 0 ? asArray(record.items) : asArray(record.lineItems);
  const items = rawItems
    .map((item, index) => normalizeFeedItem(item, index))
    .filter((entry): entry is FeedPurchaseOrderItemRecord => entry !== null);

  return {
    id,
    orderNumber: asString(record.orderNumber) || asString(record.poNumber) || id,
    supplierId: asString(record.supplierId) || asString(supplierRecord?.id),
    supplierName:
      asString(record.supplierName) ||
      asString(supplierRecord?.name) ||
      asString(record.supplier) ||
      'Unknown supplier',
    orderDate: asString(record.orderDate) || asString(record.createdAt),
    deliveryDate: asString(record.deliveryDate) || asString(record.deliveredAt),
    status: toStatusKey(record.status),
    deliveryStatus: record.deliveryStatus ? toStatusKey(record.deliveryStatus) : undefined,
    totalCost:
      asNumber(record.totalCost) ??
      asNumber(record.totalAmount) ??
      items.reduce((sum, item) => sum + item.quantityKg * item.unitCost, 0),
    items,
  };
};

const normalizeFishItem = (value: unknown, index: number): FishPurchaseOrderItemRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = asString(record.id) || asString(record.itemId) || `fish-item-${index}`;
  const fishTypeRecord = asRecord(record.fishType);
  const fishTypeId = asString(record.fishTypeId) || asString(fishTypeRecord?.id);
  const fishTypeName =
    asString(record.fishTypeName) ||
    asString(record.fishType) ||
    asString(fishTypeRecord?.name) ||
    asString(record.name);

  return {
    id,
    fishTypeId,
    fishTypeName,
    quantity: asNumber(record.quantity) ?? 0,
    totalCost: asNumber(record.totalCost) ?? asNumber(record.subtotal) ?? 0,
    status: toStatusKey(record.status),
    actualQuantity: asNumber(record.actualQuantity) ?? asNumber(record.receivedQuantity),
  };
};

const normalizeFishOrder = (value: unknown): FishPurchaseOrderRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = asString(record.id);
  if (!id) {
    return null;
  }

  const supplierRecord = asRecord(record.supplier);
  const rawItems = asArray(record.items).length > 0 ? asArray(record.items) : asArray(record.lineItems);
  const items = rawItems
    .map((item, index) => normalizeFishItem(item, index))
    .filter((entry): entry is FishPurchaseOrderItemRecord => entry !== null);

  return {
    id,
    orderNumber: asString(record.orderNumber) || asString(record.poNumber) || id,
    supplierId: asString(record.supplierId) || asString(supplierRecord?.id),
    supplierName:
      asString(record.supplierName) ||
      asString(supplierRecord?.name) ||
      asString(record.supplier) ||
      'Unknown supplier',
    orderDate: asString(record.orderDate) || asString(record.createdAt),
    deliveryDate: asString(record.deliveryDate) || asString(record.deliveredAt),
    status: toStatusKey(record.status),
    totalCost:
      asNumber(record.totalCost) ??
      asNumber(record.totalAmount) ??
      items.reduce((sum, item) => sum + item.totalCost, 0),
    items,
  };
};

const toQueryString = (params?: { offset?: number; limit?: number }): string => {
  const query = new URLSearchParams();
  if (params?.offset !== undefined) {
    query.set('offset', String(params.offset));
  }
  if (params?.limit !== undefined) {
    query.set('limit', String(params.limit));
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
};

export const getProcurementSuppliers = async (): Promise<ProcurementSupplierRecord[]> => {
  const payload = await requestJson('/procurement/suppliers');
  return extractArrayPayload(payload, ['suppliers', 'items', 'rows', 'data'])
    .map(normalizeSupplier)
    .filter((entry): entry is ProcurementSupplierRecord => entry !== null);
};

export const createProcurementSupplier = async (
  payload: SupplierCreatePayload,
): Promise<ProcurementSupplierRecord | null> => {
  const response = await requestJson('/procurement/suppliers', {
    method: 'POST',
    body: {
      ...payload,
      items: payload.items.map((item) => toStatusKey(item)),
    },
  });

  const record = extractObjectPayload(response);
  return record ? normalizeSupplier(record) : null;
};

export const getFeedPurchaseOrders = async (params?: {
  offset?: number;
  limit?: number;
}): Promise<FeedPurchaseOrderRecord[]> => {
  const payload = await requestJson(`/procurement/feed-orders${toQueryString(params)}`);
  return extractArrayPayload(payload, ['orders', 'feedOrders', 'items', 'rows', 'data'])
    .map(normalizeFeedOrder)
    .filter((entry): entry is FeedPurchaseOrderRecord => entry !== null);
};

export const createFeedPurchaseOrder = async (
  payload: FeedOrderCreatePayload,
): Promise<FeedPurchaseOrderRecord | null> => {
  const response = await requestJson('/procurement/feed-orders', {
    method: 'POST',
    body: payload,
  });
  const record = extractObjectPayload(response);
  return record ? normalizeFeedOrder(record) : null;
};

export const updateFeedPurchaseOrderStatus = async (orderId: string, status: string): Promise<void> => {
  await requestJson(`/procurement/feed-orders/${orderId}/status`, {
    method: 'PATCH',
    body: {
      status: toBackendWordStatus(status),
    },
  });
};

export const updateFeedPurchaseOrderDeliveryStatus = async (
  orderId: string,
  status: string,
): Promise<void> => {
  await requestJson(`/procurement/feed-orders/${orderId}/delivery-status`, {
    method: 'PATCH',
    body: {
      status: toBackendWordStatus(status),
    },
  });
};

export const updateFeedPurchaseOrderItemStatus = async (
  orderId: string,
  itemId: string,
  status?: string,
): Promise<void> => {
  await requestJson(`/procurement/feed-orders/${orderId}/items/${itemId}/status`, {
    method: 'PATCH',
    body: status ? { status: toBackendWordStatus(status) } : {},
  });
};

export const getFishPurchaseOrders = async (params?: {
  offset?: number;
  limit?: number;
}): Promise<FishPurchaseOrderRecord[]> => {
  const payload = await requestJson(`/procurement/fish-orders${toQueryString(params)}`);
  return extractArrayPayload(payload, ['orders', 'fishOrders', 'items', 'rows', 'data'])
    .map(normalizeFishOrder)
    .filter((entry): entry is FishPurchaseOrderRecord => entry !== null);
};

export const createFishPurchaseOrder = async (
  payload: FishOrderCreatePayload,
): Promise<FishPurchaseOrderRecord | null> => {
  const response = await requestJson('/procurement/fish-orders', {
    method: 'POST',
    body: payload,
  });
  const record = extractObjectPayload(response);
  return record ? normalizeFishOrder(record) : null;
};

export const updateFishPurchaseOrderStatus = async (orderId: string, status: string): Promise<void> => {
  await requestJson(`/procurement/fish-orders/${orderId}/status`, {
    method: 'PATCH',
    body: {
      status: toBackendWordStatus(status),
    },
  });
};

export const updateFishPurchaseOrderItemStatus = async (
  orderId: string,
  itemId: string,
  status?: string,
): Promise<void> => {
  await requestJson(`/procurement/fish-orders/${orderId}/items/${itemId}/status`, {
    method: 'PATCH',
    body: status ? { status: toBackendWordStatus(status) } : {},
  });
};

export const formatProcurementStatusLabel = (status: string): string =>
  toStatusKey(status)
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');

export const normalizeProcurementStatus = (status: string): string => toStatusKey(status);
