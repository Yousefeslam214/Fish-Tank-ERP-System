// ============================================
// FISH INVENTORY & BATCHES
// ============================================
export type FishInventoryStatus = 'QUARANTINE' | 'READY_TO_STOCK' | 'DEPLETED' | 'STOCKED';
export type HealthCheckStatus = 'PENDING' | 'PASSED' | 'FAILED';
export type FishBatchStatus = 'ACTIVE' | 'HARVESTED' | 'PARTIAL_HARVEST';

export interface FishType {
  id: string;
  name: string;
  scientificName?: string;
}

export interface FishInventoryBatch {
  id: string;
  farmId: string;
  purchaseOrderId: string;
  species: string;
  quantity: number;
  initialQuantity: number;
  averageWeight: number;
  status: FishInventoryStatus;
  healthCheckStatus: HealthCheckStatus;
  healthCheckDate?: string;
  deliveryDate: string;
  quarantinePeriodDays: number;
  notes?: string;
}

export interface FishBatch {
  id: string;
  tankId: string;
  farmId: string;
  inventoryBatchId: string;
  species: string;
  initialCount: number;
  currentCount: number;
  initialAverageWeight: number;
  currentAverageWeight?: number;
  remainingProportion: number;
  status: FishBatchStatus;
  stockedDate: string;
  expectedHarvestDate?: string;
  notes?: string;
}

// ============================================
// HARVEST
// ============================================
export type HarvestType = 'QUARTER' | 'HALF' | 'FULL';
export type HarvestStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
export type HarvestCondition = 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'DAMAGED';
export type StorageType = 'FRESH' | 'ICED' | 'FROZEN';

export interface FishGradePricing {
  id: string;
  fishTypeId: string;
  gradeName: string;
  minWeight: number;
  maxWeight: number;
  numOfFishInKilo: number;
  pricePerKg: number;
  isWaste: boolean;
  isActive: boolean;
}

export interface HarvestEvent {
  id: string;
  tankId: string;
  farmId: string;
  harvestType: HarvestType;
  harvestDate: string;
  status: HarvestStatus;
  estimatedWeight: number;
  actualWeight?: number;
  totalRevenue?: number;
  laborCost?: number;
  transportCost?: number;
  packagingCost?: number;
  netProfit?: number;
}

export interface HarvestGrading {
  id: string;
  harvestEventId: string;
  pricingId: string;
  gradeName: string;
  sourceBatchId: string;
  weightKg: number;
  condition: HarvestCondition;
  pricePerKg: number;
  totalValue: number;
}

export interface HarvestPrediction {
  id: string;
  batchId: string;
  tankId: string;
  targetWeight: number;
  predictedHarvestDate: string;
  predictedFinalWeight: number;
  predictedProduction: number;
  survivalRate: number;
  feedNeeded: number;
  revenue: number;
  remainingCost: number;
  profit: number;
  profitMargin: number;
  recommendation: 'HIGH_PROFIT' | 'MODERATE_PROFIT' | 'LOW_PROFIT' | 'REVIEW_NEEDED';
}

// ============================================
// HARVESTED INVENTORY (UPDATED SCHEMA)
// ============================================
export interface HarvestedInventory {
  id: string;
  fishType: FishType;
  gradePricing: FishGradePricing;
  weight: number;
  storageType: StorageType;
  expiryDate: Date;
  harvestedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SALES & CUSTOMERS
// ============================================
export type CustomerType = 'WHOLESALER' | 'RETAILER' | 'RESTAURANT' | 'INDIVIDUAL';
export type SalesOrderStatus = 'PENDING' | 'FULFILLED' | 'CANCELLED';

export interface Customer {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  customerType: CustomerType;
  creditLimit?: number;
  outstandingBalance: number;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
}

export interface SalesOrderLineItem {
  id: string;
  harvestedInventoryId: string;
  quantityKg: number;
  pricePerKg: number;
  totalPrice: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: Customer;
  orderDate: Date;
  deliveryDate?: Date;
  status: SalesOrderStatus;
  lineItems: SalesOrderLineItem[];
  totalAmount: number;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}