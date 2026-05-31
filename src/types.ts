// ============================================
// FISH INVENTORY & BATCHES
// ============================================
export type FishInventoryStatus =
  | "QUARANTINE"
  | "READY_TO_STOCK"
  | "DEPLETED"
  | "STOCKED";
export type HealthCheckStatus = "PENDING" | "PASSED" | "FAILED";
export type FishBatchStatus = "ACTIVE" | "HARVESTED" | "PARTIAL_HARVEST";

export interface FishType {
  id: string;
  name: string;
  scientificName?: string;
  arabicName?: string;
  tempMin: number;
  tempMax: number;
  doMin: number;
  doMax: number;
  phMin: number;
  phMax: number;
  nh3Min: number;
  nh3Max: number;
  no2Min: number;
  no2Max: number;
  turbidityMin: number;
  turbidityMax: number;
  fcrMin: number;
  fcrMax: number;
  survivalRate: number;
  isActive: boolean;
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
export type HarvestType = "QUARTER" | "HALF" | "FULL";
export const HARVEST_TYPE_LABELS: Record<HarvestType, string> = {
  QUARTER: "Selective",
  HALF: "Partial",
  FULL: "Full",
};
export type HarvestStatus =
  | "DRAFT"
  | "GRADING"
  | "REVIEW"
  | "COMPLETED"
  | "CANCELLED";
export type HarvestCondition = "EXCELLENT" | "GOOD" | "ACCEPTABLE" | "DAMAGED";
export type StorageType = "FRESH" | "ICED" | "FROZEN";
export type GradeType = "SUPER" | "GRADE_1" | "GRADE_2" | "SHERR" | "WASTE";

export interface FishGradePricing {
  id: string;
  fishTypeId: string;
  gradeName: string;
  gradeType: GradeType;
  minWeight: number;
  maxWeight: number;
  numOfFishInKilo: number;
  pricePerKg: number;
  isWaste: boolean;
  isActive: boolean;
  color: string;
  icon?: string;
}

export interface HarvestCosts {
  laborCost: number;
  transportCost: number;
  packagingCost: number;
  iceCost: number;
  otherCost: number;
}

export interface HarvestEvent {
  id: string;
  harvestNumber: string;
  tankId: string;
  tankName?: string;
  batchId: string;
  farmId: string;
  fishType: string;
  harvestType: HarvestType;
  harvestDate: string;
  harvestTime?: string;
  status: HarvestStatus;
  estimatedWeight: number;
  actualWeight?: number;
  totalRevenue?: number;
  productionCosts?: number;
  feedCost?: number;
  operatingCost?: number;
  fingerllingCost?: number;
  costs?: HarvestCosts;
  totalCosts?: number;
  netProfit?: number;
  profitMargin?: number;
  fcr?: number;
  survivalRate?: number;
  partialPercentage?: number;
  selectiveMinWeight?: number;
  weatherConditions?: string;
  temperature?: number;
  notes?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface HarvestGrading {
  id: string;
  harvestEventId: string;
  pricingId: string;
  gradeName: string;
  gradeType: GradeType;
  sourceBatchId: string;
  weightKg: number;
  condition: HarvestCondition;
  pricePerKg: number;
  totalValue: number;
  timestamp?: string;
  notes?: string;
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
  recommendation:
    | "HIGH_PROFIT"
    | "MODERATE_PROFIT"
    | "LOW_PROFIT"
    | "REVIEW_NEEDED";
}

// ============================================
// HARVESTED INVENTORY (UPDATED SCHEMA)
// ============================================
export interface HarvestedInventory {
  id: string;
  tankId: string;
  farmId: string;
  harvestEventId: string;
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
export type CustomerType = "WHOLESALE" | "RETAIL" | "RESTAURANT" | "EXPORT";
export type SalesOrderStatus =
  | "DRAFT"
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "FULFILLED"
  | "CANCELLED";
export type PaymentStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  email?: string;
  phone: string;
  address: string;
  taxId?: string;
  paymentTerms: number;
  creditLimit: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: Date;
}

export interface SalesOrderLineItem {
  id: string;
  harvestedInventoryId: string;
  tankId: string; // Track which tank this harvest came from
  quantityKg: number;
  pricePerKg: number;
  totalPrice: number;
}

export interface SalesOrder {
  id: string;
  orderNumber?: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    contactPerson?: string;
    phone: string;
    email?: string;
    customerType: CustomerType;
    outstandingBalance: number;
    isActive: boolean;
    createdAt: Date;
  };
  orderDate: Date;
  deliveryDate?: Date;
  status: SalesOrderStatus;
  paymentStatus?: PaymentStatus;
  lineItems: SalesOrderLineItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  totalAmount?: number;
  paidAmount?: number;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
}

// ============================================
// USER & FARM
// ============================================
export type UserRole =
  | "admin"
  | "manager"
  | "worker"
  | "technician"
  | "technican"
  | "accountant"
  | "sales"
  | "delivery"
  | "warehouse";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  farmId?: string;
  modules?: string[];
}

export interface Farm {
  id: string;
  name: string;
  location: string;
  type: "freshwater" | "saltwater" | "brackish";
  totalTanks: number;
  activeSpecies: string[];
  isActive: boolean;
  coordinates?: { lat: number; lng: number };
}

// ============================================
// TANKS & WATER QUALITY
// ============================================
export interface Tank {
  id: string;
  farmId: string;
  name: string;
  capacity: number;
  currentCount: number;
  species: string;
  avgWeight: number;
  biomass: number;
  lastFed: string;
  waterQuality: {
    temperature: number;
    ph: number;
    dissolvedOxygen: number;
    ammonia: number;
    lastChecked: string;
  };
}

export interface WaterQuality {
  id: string;
  tankId: string;
  farmId: string;
  temperature: number;
  ph: number;
  dissolvedOxygen: number;
  ammonia: number;
  nitrite: number;
  nitrate: number;
  salinity?: number;
  turbidity?: number;
  timestamp: string;
  recordedBy: string;
}

// ============================================
// EXPENSES & ACCOUNTING
// ============================================
export type ExpenseCategory =
  | "feed"
  | "medicine"
  | "labor"
  | "electricity"
  | "maintenance"
  | "fuel"
  | "equipment"
  | "other";

export interface Expense {
  id: string;
  farmId: string;
  tankId?: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  description: string;
  date: string;
  vendor?: string;
  receiptUrl?: string;
}

// ============================================
// HEALTH & DISEASE
// ============================================
export type DiseaseSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type DiseaseStatus = "ACTIVE" | "TREATED" | "RESOLVED";

export interface Disease {
  id: string;
  name: string;
  arabicName: string;
  description: string;
  symptoms: string[];
  treatment: string[];
  preventiveMeasures: string[];
  affectedSpecies: string[];
  severity: DiseaseSeverity;
  imageUrl?: string;
}

export interface HealthRecord {
  id: string;
  tankId: string;
  farmId: string;
  diseaseId?: string;
  symptoms: string[];
  diagnosis: string;
  treatment: string;
  status: DiseaseStatus;
  dateReported: string;
  dateResolved?: string;
  affectedCount: number;
  mortalityCount: number;
  notes?: string;
}

// ============================================
// NOTIFICATIONS
// ============================================
export type NotificationType = "alert" | "warning" | "info" | "success";
export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface Notification {
  id: string;
  farmId: string;
  tankId?: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  requiresAction?: "not responded" | "true" | "false" | boolean;
  actionType?: string;
}

// ============================================
// PROCUREMENT & SUPPLIERS
// ============================================
export type PurchaseOrderStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "ORDERED"
  | "RECEIVED"
  | "CANCELLED";
export type SupplierItemType =
  | "FEED"
  | "FINGERLINGS"
  | "EQUIPMENT"
  | "MEDICINE"
  | "OTHER";

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  items: SupplierItemType[];
  rating?: number;
  isActive: boolean;
}

export interface PurchaseOrderItem {
  id: string;
  itemType: SupplierItemType;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specifications?: string;
}

export interface PurchaseOrder {
  id: string;
  farmId: string;
  supplierId: string;
  orderNumber: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdBy: string;
}

// ============================================
// FEED & FEEDING
// ============================================

// Food-type physical properties (used by FoodTypeManagement)
export type BuoyancyType =
  | "FLOATING"
  | "SINKING"
  | "SLOW_SINKING"
  | "SEMI_FLOATING";
export type ManufacturingProcess =
  | "EXTRUDED"
  | "PELLETED"
  | "MILLED"
  | "CRUMBLED";
export type GrowthStage =
  | "FRY_1"
  | "FRY_2"
  | "FINGERLING_1"
  | "FINGERLING_2"
  | "JUVENILE_1"
  | "JUVENILE_2"
  | "JUVENILE_3"
  | "ADULT_1"
  | "ADULT_2"
  | "ADULT_3"
  | "FINISHING_1"
  | "FINISHING_2"
  | "FINISHING_3"
  | "PRE_HARVEST";

export type FeedType = "STARTER" | "GROWER" | "FINISHER" | "BROODSTOCK";

export interface FeedItem {
  id: string;
  name: string;
  type: FeedType;
  proteinContent: number;
  fatContent: number;
  fiberContent: number;
  manufacturer?: string;
  costPerKg: number;
  stockQuantity: number;
  minStockLevel: number;
  expiryDate?: string;
}

export interface FeedingSchedule {
  id: string;
  tankId: string;
  feedId: string;
  timesPerDay: number;
  amountPerFeeding: number;
  lastFed?: string;
  isActive: boolean;
}

// ============================================
// GROWTH TRACKING
// ============================================
export interface GrowthMeasurement {
  id: string;
  tankId: string;
  batchId: string;
  farmId: string;
  measurementDate: string;
  sampleSize: number;
  averageWeight: number;
  minWeight: number;
  maxWeight: number;
  averageLength?: number;
  weightGain?: number;
  sgr?: number;
  fcr?: number;
  feedGiven?: number;
  mortality?: number;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}
