// Mock data for accounting module

export interface Account {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  subtype: string;
  balance: number;
  isActive: boolean;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  type: 'HARVEST_COMPLETION' | 'SALES_REVENUE' | 'COGS' | 'MANUAL_ADJUSTMENT' | 'FEED_PURCHASE' | 'LABOR' | 'UTILITIES' | 'FINGERLING_PURCHASE';
  description: string;
  descriptionAr: string;
  amount: number;
  status: 'BALANCED' | 'PENDING' | 'REQUIRES_APPROVAL';
  createdBy: string;
  createdAt: string;
  lines: JournalLine[];
  relatedDocs?: {
    harvestId?: string;
    orderId?: string;
    lotNumber?: string;
    tankId?: string;
    batchId?: string;
  };
}

export interface JournalLine {
  accountCode: string;
  accountName: string;
  accountNameAr: string;
  debit: number;
  credit: number;
  metadata?: {
    lotNumber?: string;
    fishType?: string;
    grade?: string;
    weight?: number;
    tankId?: string;
    batchId?: string;
    [key: string]: any;
  };
}

// Chart of Accounts
export const mockAccounts: Account[] = [
  // ASSETS
  { id: '1100', code: '1100', name: 'HARVESTED_INVENTORY_ASSET', nameAr: 'مخزون الأسماك المحصودة', type: 'ASSET', subtype: 'Current Assets', balance: 3750, isActive: true },
  { id: '1150', code: '1150', name: 'FEED_INVENTORY', nameAr: 'مخزون العلف', type: 'ASSET', subtype: 'Current Assets', balance: 15000, isActive: true },
  { id: '1200', code: '1200', name: 'ACCOUNTS_RECEIVABLE', nameAr: 'حسابات مدينة', type: 'ASSET', subtype: 'Current Assets', balance: 12000, isActive: true },
  { id: '1300', code: '1300', name: 'CASH', nameAr: 'النقدية', type: 'ASSET', subtype: 'Current Assets', balance: 45000, isActive: true },
  { id: '1050', code: '1050', name: 'WORK_IN_PROGRESS', nameAr: 'إنتاج تحت التشغيل', type: 'ASSET', subtype: 'Current Assets', balance: 25000, isActive: true },
  { id: '1510', code: '1510', name: 'TANKS', nameAr: 'الأحواض', type: 'ASSET', subtype: 'Fixed Assets', balance: 150000, isActive: true },
  { id: '1520', code: '1520', name: 'EQUIPMENT', nameAr: 'المعدات', type: 'ASSET', subtype: 'Fixed Assets', balance: 50000, isActive: true },
  { id: '1530', code: '1530', name: 'BUILDINGS', nameAr: 'المباني', type: 'ASSET', subtype: 'Fixed Assets', balance: 200000, isActive: true },
  { id: '1590', code: '1590', name: 'ACCUMULATED_DEPRECIATION', nameAr: 'مجمع الإهلاك', type: 'ASSET', subtype: 'Fixed Assets', balance: -30000, isActive: true },

  // LIABILITIES
  { id: '2100', code: '2100', name: 'ACCOUNTS_PAYABLE', nameAr: 'حسابات دائنة', type: 'LIABILITY', subtype: 'Current Liabilities', balance: 25000, isActive: true },
  { id: '2200', code: '2200', name: 'SALARIES_PAYABLE', nameAr: 'رواتب مستحقة', type: 'LIABILITY', subtype: 'Current Liabilities', balance: 8000, isActive: true },
  { id: '2510', code: '2510', name: 'LOANS_PAYABLE', nameAr: 'قروض طويلة الأجل', type: 'LIABILITY', subtype: 'Long-term Liabilities', balance: 150000, isActive: true },

  // EQUITY
  { id: '3100', code: '3100', name: 'OWNERS_EQUITY', nameAr: 'رأس المال', type: 'EQUITY', subtype: 'Equity', balance: 200000, isActive: true },
  { id: '3200', code: '3200', name: 'RETAINED_EARNINGS', nameAr: 'أرباح محتجزة', type: 'EQUITY', subtype: 'Equity', balance: 62750, isActive: true },

  // REVENUE
  { id: '4100', code: '4100', name: 'REVENUE_FISH_SALES', nameAr: 'إيرادات مبيعات الأسماك', type: 'REVENUE', subtype: 'Revenue', balance: 285000, isActive: true },

  // EXPENSES
  { id: '5100', code: '5100', name: 'COST_OF_GOODS_SOLD', nameAr: 'تكلفة البضاعة المباعة', type: 'EXPENSE', subtype: 'Cost of Goods Sold', balance: 170000, isActive: true },
  { id: '5200', code: '5200', name: 'INVENTORY_LOSS', nameAr: 'خسائر المخزون', type: 'EXPENSE', subtype: 'Operating Expenses', balance: 450, isActive: true },
  { id: '5300', code: '5300', name: 'FEED_PURCHASES', nameAr: 'مشتريات العلف', type: 'EXPENSE', subtype: 'Operating Expenses', balance: 95000, isActive: true },
  { id: '5310', code: '5310', name: 'FINGERLING_PURCHASES', nameAr: 'مشتريات الزريعة', type: 'EXPENSE', subtype: 'Operating Expenses', balance: 25000, isActive: true },
  { id: '5400', code: '5400', name: 'LABOR', nameAr: 'أجور العمالة', type: 'EXPENSE', subtype: 'Operating Expenses', balance: 35000, isActive: true },
  { id: '5500', code: '5500', name: 'UTILITIES', nameAr: 'مرافق عامة', type: 'EXPENSE', subtype: 'Operating Expenses', balance: 12000, isActive: true },
  { id: '5600', code: '5600', name: 'MAINTENANCE', nameAr: 'صيانة', type: 'EXPENSE', subtype: 'Operating Expenses', balance: 8000, isActive: true },
  { id: '5700', code: '5700', name: 'HARVEST_COSTS', nameAr: 'تكاليف الحصاد', type: 'EXPENSE', subtype: 'Operating Expenses', balance: 5850, isActive: true },
];

// Journal Entries
export const mockJournalEntries: JournalEntry[] = [
  {
    id: 'je-249',
    entryNumber: 'JE-2026-0249',
    date: '2026-03-06T09:00:00',
    type: 'COGS',
    description: 'Cost of goods sold - SO-2026-0045',
    descriptionAr: 'تكلفة البضاعة المباعة - طلب رقم SO-2026-0045',
    amount: 720,
    status: 'BALANCED',
    createdBy: 'System',
    createdAt: '2026-03-06T09:00:05',
    lines: [
      {
        accountCode: '5100',
        accountName: 'COST_OF_GOODS_SOLD',
        accountNameAr: 'تكلفة البضاعة المباعة',
        debit: 720,
        credit: 0,
      },
      {
        accountCode: '1100',
        accountName: 'HARVESTED_INVENTORY_ASSET',
        accountNameAr: 'مخزون الأسماك المحصودة',
        debit: 0,
        credit: 720,
        metadata: {
          lotNumber: 'LOT-2026-001',
          weight: 48,
          costPerKg: 15
        }
      }
    ],
    relatedDocs: {
      orderId: 'SO-2026-0045',
      lotNumber: 'LOT-2026-001'
    }
  },
  {
    id: 'je-248',
    entryNumber: 'JE-2026-0248',
    date: '2026-03-06T09:00:00',
    type: 'SALES_REVENUE',
    description: 'Sales Order SO-2026-0045',
    descriptionAr: 'طلب بيع رقم SO-2026-0045',
    amount: 2400,
    status: 'BALANCED',
    createdBy: 'System',
    createdAt: '2026-03-06T09:00:00',
    lines: [
      {
        accountCode: '1200',
        accountName: 'ACCOUNTS_RECEIVABLE',
        accountNameAr: 'حسابات مدينة',
        debit: 2400,
        credit: 0,
        metadata: {
          customer: 'Cairo Fish Market',
          orderId: 'SO-2026-0045'
        }
      },
      {
        accountCode: '4100',
        accountName: 'REVENUE_FISH_SALES',
        accountNameAr: 'إيرادات مبيعات الأسماك',
        debit: 0,
        credit: 2400,
        metadata: {
          weight: 48,
          pricePerKg: 50,
          lotNumber: 'LOT-2026-001'
        }
      }
    ],
    relatedDocs: {
      orderId: 'SO-2026-0045',
      lotNumber: 'LOT-2026-001'
    }
  },
  {
    id: 'je-245',
    entryNumber: 'JE-2026-0245',
    date: '2026-03-05T10:00:00',
    type: 'HARVEST_COMPLETION',
    description: 'Harvest completed - Super grade from Tank A-03',
    descriptionAr: 'اكتمال الحصاد - درجة سوبر من الحوض A-03',
    amount: 1425,
    status: 'BALANCED',
    createdBy: 'System',
    createdAt: '2026-03-05T10:00:05',
    lines: [
      {
        accountCode: '1100',
        accountName: 'HARVESTED_INVENTORY_ASSET',
        accountNameAr: 'مخزون الأسماك المحصودة',
        debit: 1425,
        credit: 0,
        metadata: {
          lotNumber: 'LOT-2026-001',
          fishType: 'Nile Tilapia',
          grade: 'Super',
          weight: 95,
          tankId: 'tank-003',
          batchId: '#123'
        }
      },
      {
        accountCode: '1050',
        accountName: 'WORK_IN_PROGRESS',
        accountNameAr: 'إنتاج تحت التشغيل',
        debit: 0,
        credit: 1425,
        metadata: {
          batchId: '#123'
        }
      }
    ],
    relatedDocs: {
      harvestId: 'HRV-2026-045',
      lotNumber: 'LOT-2026-001',
      tankId: 'tank-003',
      batchId: '#123'
    }
  },
  {
    id: 'je-246',
    entryNumber: 'JE-2026-0246',
    date: '2026-03-05T14:00:00',
    type: 'MANUAL_ADJUSTMENT',
    description: 'Correction for inventory count variance',
    descriptionAr: 'تصحيح للتباين في جرد المخزون',
    amount: 450,
    status: 'REQUIRES_APPROVAL',
    createdBy: 'Ahmed Mohamed',
    createdAt: '2026-03-05T14:00:00',
    lines: [
      {
        accountCode: '5200',
        accountName: 'INVENTORY_LOSS',
        accountNameAr: 'خسائر المخزون',
        debit: 450,
        credit: 0,
        metadata: {
          reason: 'Physical count variance'
        }
      },
      {
        accountCode: '1100',
        accountName: 'HARVESTED_INVENTORY_ASSET',
        accountNameAr: 'مخزون الأسماك المحصودة',
        debit: 0,
        credit: 450,
        metadata: {
          lotNumber: 'LOT-2026-003'
        }
      }
    ]
  },
  {
    id: 'je-240',
    entryNumber: 'JE-2026-0240',
    date: '2026-03-04T08:00:00',
    type: 'FEED_PURCHASE',
    description: 'Feed purchase - Grower feed 32%',
    descriptionAr: 'شراء علف - علف النمو 32%',
    amount: 2500,
    status: 'BALANCED',
    createdBy: 'System',
    createdAt: '2026-03-04T08:00:00',
    lines: [
      {
        accountCode: '1150',
        accountName: 'FEED_INVENTORY',
        accountNameAr: 'مخزون العلف',
        debit: 2500,
        credit: 0,
        metadata: {
          quantity: 200,
          pricePerKg: 12.5
        }
      },
      {
        accountCode: '2100',
        accountName: 'ACCOUNTS_PAYABLE',
        accountNameAr: 'حسابات دائنة',
        debit: 0,
        credit: 2500,
        metadata: {
          supplier: 'Egypt Feed Co.'
        }
      }
    ]
  },
  {
    id: 'je-235',
    entryNumber: 'JE-2026-0235',
    date: '2026-02-28T10:00:00',
    type: 'HARVEST_COMPLETION',
    description: 'Harvest completed - Grade A from Tank A-01',
    descriptionAr: 'اكتمال الحصاد - درجة A من الحوض A-01',
    amount: 1295,
    status: 'BALANCED',
    createdBy: 'System',
    createdAt: '2026-02-28T10:00:00',
    lines: [
      {
        accountCode: '1100',
        accountName: 'HARVESTED_INVENTORY_ASSET',
        accountNameAr: 'مخزون الأسماك المحصودة',
        debit: 1295,
        credit: 0,
        metadata: {
          lotNumber: 'LOT-2026-002',
          fishType: 'Nile Tilapia',
          grade: 'Grade A',
          weight: 85,
          tankId: 'tank-001',
          batchId: '#118'
        }
      },
      {
        accountCode: '1050',
        accountName: 'WORK_IN_PROGRESS',
        accountNameAr: 'إنتاج تحت التشغيل',
        debit: 0,
        credit: 1295
      }
    ],
    relatedDocs: {
      harvestId: 'HRV-2026-038',
      lotNumber: 'LOT-2026-002',
      tankId: 'tank-001',
      batchId: '#118'
    }
  }
];

// Expense Categories Data
export interface ExpenseCategory {
  name: string;
  nameAr: string;
  amount: number;
  percentage: number;
  trend: number; // percentage change
  icon: string;
  subcategories?: {
    name: string;
    nameAr: string;
    amount: number;
  }[];
}

export const mockExpensesByCategory: ExpenseCategory[] = [
  {
    name: 'Feed Purchases',
    nameAr: 'مشتريات العلف',
    amount: 95000,
    percentage: 51.7,
    trend: 8.2,
    icon: 'ShoppingCart',
    subcategories: [
      { name: 'Fingerling feed', nameAr: 'علف الزريعة', amount: 12500 },
      { name: 'Grower feed', nameAr: 'علف النمو', amount: 45000 },
      { name: 'Finisher feed', nameAr: 'علف التسمين', amount: 37500 }
    ]
  },
  {
    name: 'Labor',
    nameAr: 'أجور العمالة',
    amount: 35000,
    percentage: 19.0,
    trend: 0,
    icon: 'Users',
    subcategories: [
      { name: 'Daily workers', nameAr: 'عمال يوميين', amount: 22500 },
      { name: 'Supervisors', nameAr: 'مشرفين', amount: 9000 },
      { name: 'Harvest labor', nameAr: 'عمالة الحصاد', amount: 3500 }
    ]
  },
  {
    name: 'Fingerlings',
    nameAr: 'الزريعة',
    amount: 25000,
    percentage: 13.6,
    trend: -15.3,
    icon: 'Fish',
    subcategories: [
      { name: '3 purchases', nameAr: '3 عمليات شراء', amount: 25000 }
    ]
  },
  {
    name: 'Utilities',
    nameAr: 'المرافق العامة',
    amount: 12000,
    percentage: 6.5,
    trend: 5.1,
    icon: 'Zap',
    subcategories: [
      { name: 'Electricity', nameAr: 'كهرباء', amount: 9500 },
      { name: 'Water', nameAr: 'مياه', amount: 2500 }
    ]
  },
  {
    name: 'Maintenance',
    nameAr: 'الصيانة',
    amount: 8000,
    percentage: 4.4,
    trend: 0,
    icon: 'Wrench',
    subcategories: [
      { name: 'Equipment repairs', nameAr: 'إصلاحات المعدات', amount: 4500 },
      { name: 'Tank maintenance', nameAr: 'صيانة الأحواض', amount: 2000 },
      { name: 'Building repairs', nameAr: 'إصلاحات المباني', amount: 1500 }
    ]
  },
  {
    name: 'Harvest Costs',
    nameAr: 'تكاليف الحصاد',
    amount: 5850,
    percentage: 3.2,
    trend: 25.4,
    icon: 'Package',
    subcategories: [
      { name: 'Labor', nameAr: 'عمالة', amount: 3500 },
      { name: 'Transport', nameAr: 'نقل', amount: 1400 },
      { name: 'Packaging', nameAr: 'تعبئة', amount: 750 },
      { name: 'Ice', nameAr: 'ثلج', amount: 200 }
    ]
  },
  {
    name: 'Other',
    nameAr: 'أخرى',
    amount: 3000,
    percentage: 1.6,
    trend: -8.1,
    icon: 'MoreHorizontal',
    subcategories: [
      { name: 'Office supplies', nameAr: 'مستلزمات مكتبية', amount: 1200 },
      { name: 'Transportation', nameAr: 'مواصلات', amount: 1000 },
      { name: 'Miscellaneous', nameAr: 'متنوعة', amount: 800 }
    ]
  }
];

// Tank-specific expenses
export interface TankExpense {
  tankId: string;
  tankName: string;
  batchId: string;
  totalExpenses: number;
  feedCosts: number;
  operatingCosts: number;
  stockingCosts: number;
  costPerKg: number;
  feedDetails: {
    type: string;
    typeAr: string;
    weight: number;
    price: number;
    total: number;
    period: string;
    periodAr: string;
  }[];
  operatingDetails: {
    category: string;
    categoryAr: string;
    amount: number;
    details: string;
    detailsAr: string;
  }[];
}

export const mockTankExpenses: TankExpense[] = [
  {
    tankId: 'tank-003',
    tankName: 'Tank A-03',
    batchId: '#123',
    totalExpenses: 8850,
    feedCosts: 6240,
    operatingCosts: 1610,
    stockingCosts: 1000,
    costPerKg: 30.86,
    feedDetails: [
      {
        type: 'Fingerling Feed 35%',
        typeAr: 'علف الزريعة 35%',
        weight: 85,
        price: 12,
        total: 1020,
        period: 'Days 1-14',
        periodAr: 'الأيام 1-14'
      },
      {
        type: 'Grower Feed 32%',
        typeAr: 'علف النمو 32%',
        weight: 265,
        price: 10,
        total: 2650,
        period: 'Days 15-42',
        periodAr: 'الأيام 15-42'
      },
      {
        type: 'Finisher Feed 28%',
        typeAr: 'علف التسمين 28%',
        weight: 257,
        price: 10,
        total: 2570,
        period: 'Days 43-60',
        periodAr: 'الأيام 43-60'
      }
    ],
    operatingDetails: [
      {
        category: 'Labor (Daily care)',
        categoryAr: 'عمالة (رعاية يومية)',
        amount: 800,
        details: '60 days × 13.3/day',
        detailsAr: '60 يوم × 13.3/اليوم'
      },
      {
        category: 'Utilities',
        categoryAr: 'مرافق عامة',
        amount: 320,
        details: 'Electricity, water',
        detailsAr: 'كهرباء، مياه'
      },
      {
        category: 'Water Quality Tests',
        categoryAr: 'اختبارات جودة المياه',
        amount: 150,
        details: '9 tests @ 17 EGP',
        detailsAr: '9 اختبارات @ 17 جنيه'
      },
      {
        category: 'Maintenance',
        categoryAr: 'صيانة',
        amount: 90,
        details: 'Minor repairs',
        detailsAr: 'إصلاحات بسيطة'
      },
      {
        category: 'Harvest Costs',
        categoryAr: 'تكاليف الحصاد',
        amount: 250,
        details: 'Partial harvest',
        detailsAr: 'حصاد جزئي'
      }
    ]
  }
];

// Financial metrics
export interface FinancialMetrics {
  revenue: number;
  revenueChange: number;
  grossProfit: number;
  grossProfitChange: number;
  profitMargin: number;
  profitMarginChange: number;
  accountsReceivable: number;
  accountsReceivableChange: number;
  inventoryValue: number;
  inventoryChange: number;
  lotCount: number;
  cogs: number;
  netProfit: number;
  netProfitMargin: number;
  balanceSheetBalanced: boolean;
}

export const mockFinancialMetrics: FinancialMetrics = {
  revenue: 23400,
  revenueChange: -48.2,
  grossProfit: 9360,
  grossProfitChange: -48.2,
  profitMargin: 40.0,
  profitMarginChange: 0,
  accountsReceivable: 12000,
  accountsReceivableChange: 41.2,
  inventoryValue: 3750,
  inventoryChange: -57.9,
  lotCount: 4,
  cogs: 65850,
  netProfit: -69300,
  netProfitMargin: -24.3,
  balanceSheetBalanced: true
};

// Revenue trend data
export const mockRevenueTrend = [
  { month: 'Oct', monthAr: 'أكتوبر', revenue: 45000 },
  { month: 'Nov', monthAr: 'نوفمبر', revenue: 52000 },
  { month: 'Dec', monthAr: 'ديسمبر', revenue: 48000 },
  { month: 'Jan', monthAr: 'يناير', revenue: 55000 },
  { month: 'Feb', monthAr: 'فبراير', revenue: 45000 },
  { month: 'Mar', monthAr: 'مارس', revenue: 23000 }
];

// Expense trend data
export const mockExpenseTrend = [
  { month: 'Oct', monthAr: 'أكتوبر', expenses: 142000 },
  { month: 'Nov', monthAr: 'نوفمبر', expenses: 158000 },
  { month: 'Dec', monthAr: 'ديسمبر', expenses: 165000 },
  { month: 'Jan', monthAr: 'يناير', expenses: 168000 },
  { month: 'Feb', monthAr: 'فبراير', expenses: 163000 },
  { month: 'Mar', monthAr: 'مارس', expenses: 184000 }
];
