const toStatusKey = (value: string): string =>
  value
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();

export const normalizeProcurementUiStatus = (status: string): string => {
  if (!status.trim()) {
    return 'UNKNOWN';
  }
  return toStatusKey(status);
};

export const getProcurementStatusColorClass = (status: string): string => {
  switch (normalizeProcurementUiStatus(status)) {
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

export const formatKg = (value: number): string => `${value.toLocaleString()} kg`;

export const formatFishCount = (value: number): string => `${value.toLocaleString()} fish`;

export const formatCurrencyEgp = (value: number): string => `${value.toLocaleString()} EGP`;

export const toShortId = (id?: string): string => {
  if (!id) {
    return 'N/A';
  }
  return id.split('-')[0] || id;
};

export const formatNameWithId = (name: string, id?: string): string => `${name} (${toShortId(id)})`;

export const canReceiveByDeliveryStatus = (status: string): boolean =>
  normalizeProcurementUiStatus(status) === 'DELIVERED';
