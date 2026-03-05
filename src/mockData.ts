import { Farm, User, Tank, Expense, Disease, HealthRecord, Notification, FishInventoryBatch, FishBatch } from './types';

export const mockFarms: Farm[] = [
  {
    id: '1',
    name: 'Delta Aqua Farm',
    location: 'Kafr El Sheikh, Egypt',
    type: 'freshwater',
    totalTanks: 12,
    activeSpecies: ['Nile Tilapia', 'African Catfish'],
    isActive: true,
    coordinates: { lat: 31.1107, lng: 30.9388 }
  },
  {
    id: '2',
    name: 'Mediterranean Coast Farm',
    location: 'Alexandria, Egypt',
    type: 'saltwater',
    totalTanks: 8,
    activeSpecies: ['European Seabass', 'Gilthead Bream'],
    isActive: true,
    coordinates: { lat: 31.2001, lng: 29.9187 }
  },
  {
    id: '3',
    name: 'Nile Valley Fishery',
    location: 'Aswan, Egypt',
    type: 'freshwater',
    totalTanks: 15,
    activeSpecies: ['Nile Tilapia', 'Mullet'],
    isActive: true,
    coordinates: { lat: 24.0889, lng: 32.8998 }
  }
];

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Ahmed Mohamed',
    email: 'ahmed@fishfarm360.com',
    phone: '+20 100 123 4567',
    role: 'admin',
    farmId: '1'
  },
  {
    id: '2',
    name: 'Fatima Hassan',
    email: 'fatima@fishfarm360.com',
    phone: '+20 100 234 5678',
    role: 'manager',
    farmId: '1'
  },
  {
    id: '3',
    name: 'Omar Ibrahim',
    email: 'omar@fishfarm360.com',
    phone: '+20 100 345 6789',
    role: 'technician',
    farmId: '2'
  }
];

export const mockTanks: Tank[] = [
  {
    id: 'tank-001',
    farmId: '1',
    name: 'Tank A-01',
    location: 'Section A',
    volumeCubicMeters: 500,
    status: 'ACTIVE',
    currentBiomass: 3200,
    capacity: 5000
  },
  {
    id: 'tank-002',
    farmId: '1',
    name: 'Tank A-02',
    location: 'Section A',
    volumeCubicMeters: 500,
    status: 'ACTIVE',
    currentBiomass: 2800,
    capacity: 5000
  },
  {
    id: 'tank-003',
    farmId: '1',
    name: 'Tank B-01',
    location: 'Section B',
    volumeCubicMeters: 750,
    status: 'WARNING',
    currentBiomass: 4500,
    capacity: 7500
  },
  {
    id: 'tank-004',
    farmId: '1',
    name: 'Tank C-01',
    location: 'Section C',
    volumeCubicMeters: 400,
    status: 'MAINTENANCE',
    currentBiomass: 0,
    capacity: 4000
  }
];

export const mockExpenses: Expense[] = [
  {
    id: 'exp-001',
    farmId: '1',
    tankId: 'tank-001',
    date: '2026-02-01',
    category: 'feed',
    description: 'High Protein Feed 32%',
    amount: 15000,
    currency: 'EGP'
  },
  {
    id: 'exp-002',
    farmId: '1',
    date: '2026-02-03',
    category: 'electricity',
    description: 'Monthly electricity bill',
    amount: 8500,
    currency: 'EGP'
  },
  {
    id: 'exp-003',
    farmId: '1',
    tankId: 'tank-002',
    date: '2026-02-05',
    category: 'medicine',
    description: 'Antibiotics for bacterial infection',
    amount: 2200,
    currency: 'EGP'
  },
  {
    id: 'exp-004',
    farmId: '1',
    date: '2026-02-07',
    category: 'labor',
    description: 'Staff salaries',
    amount: 25000,
    currency: 'EGP'
  },
  {
    id: 'exp-005',
    farmId: '1',
    date: '2026-02-10',
    category: 'fingerlings',
    description: 'Tilapia fingerlings - 5000 pcs',
    amount: 18000,
    currency: 'EGP'
  },
  {
    id: 'exp-006',
    farmId: '1',
    tankId: 'tank-003',
    date: '2026-02-12',
    category: 'maintenance',
    description: 'Tank cleaning and repair',
    amount: 3500,
    currency: 'EGP'
  },
  {
    id: 'exp-007',
    farmId: '1',
    date: '2026-02-14',
    category: 'fuel',
    description: 'Diesel for generators',
    amount: 4200,
    currency: 'EGP'
  }
];

export const mockDiseases: Disease[] = [
  {
    id: 'disease-001',
    name: 'Bacterial Gill Disease',
    symptoms: [
      'Rapid gill movement',
      'Lethargy and loss of appetite',
      'Increased mucus on gills',
      'Fish gasping at water surface'
    ],
    treatment: 'Antibiotic treatment (Oxytetracycline 50-75 mg/kg feed for 10 days). Improve water quality and increase aeration.',
    preventiveMeasures: [
      'Maintain optimal water quality',
      'Avoid overcrowding',
      'Regular water quality monitoring',
      'Proper biosecurity measures'
    ],
    severity: 'high'
  },
  {
    id: 'disease-002',
    name: 'Ichthyophthirius (White Spot)',
    symptoms: [
      'White spots on skin and fins',
      'Flashing behavior (rubbing against surfaces)',
      'Loss of appetite',
      'Labored breathing'
    ],
    treatment: 'Salt bath treatment (3-5 ppt for 3-5 days). Raise water temperature to 30°C. Use formalin or malachite green as directed.',
    preventiveMeasures: [
      'Quarantine new fish',
      'Maintain stable water temperature',
      'Good water quality management',
      'Reduce stress factors'
    ],
    severity: 'medium'
  },
  {
    id: 'disease-003',
    name: 'Columnaris Disease',
    symptoms: [
      'White or gray patches on skin',
      'Frayed fins',
      'Ulcers or sores',
      'Difficulty breathing'
    ],
    treatment: 'Antibiotic treatment with oxytetracycline or florfenicol. Salt bath (1%) for 5 minutes daily. Improve water quality.',
    preventiveMeasures: [
      'Maintain water temperature below 28°C',
      'Minimize handling stress',
      'Regular water quality checks',
      'Proper stocking density'
    ],
    severity: 'high'
  },
  {
    id: 'disease-004',
    name: 'Saprolegnia (Fungal Infection)',
    symptoms: [
      'Cotton-like growth on skin',
      'White or gray fuzzy patches',
      'Lethargy',
      'Loss of equilibrium'
    ],
    treatment: 'Salt treatment (10 ppt for 30 minutes). Potassium permanganate bath. Remove dead tissue if possible.',
    preventiveMeasures: [
      'Avoid physical injuries to fish',
      'Maintain good water quality',
      'Proper handling procedures',
      'Quarantine infected fish'
    ],
    severity: 'medium'
  },
  {
    id: 'disease-005',
    name: 'Ammonia Toxicity',
    symptoms: [
      'Gasping at surface',
      'Red or inflamed gills',
      'Lethargy',
      'Loss of appetite',
      'Erratic swimming'
    ],
    treatment: 'Immediate 50% water change. Stop feeding. Add zeolite to remove ammonia. Increase aeration. Monitor ammonia levels closely.',
    preventiveMeasures: [
      'Regular water quality testing',
      'Proper biofilter maintenance',
      'Avoid overfeeding',
      'Maintain proper stocking density',
      'Regular partial water changes'
    ],
    severity: 'critical'
  },
  {
    id: 'disease-006',
    name: 'Parasitic Anchor Worm',
    symptoms: [
      'Visible worm-like parasites',
      'Red inflamed areas on skin',
      'Flashing behavior',
      'Loss of scales'
    ],
    treatment: 'Manual removal with tweezers. Organophosphate treatment (trichlorfon). Salt bath treatment (3%).',
    preventiveMeasures: [
      'Quarantine all new fish',
      'Regular inspection',
      'Maintain good water quality',
      'Use parasite-free water sources'
    ],
    severity: 'low'
  }
];

export const mockHealthRecords: HealthRecord[] = [
  {
    id: 'health-001',
    tankId: 'tank-001',
    date: '2026-02-10',
    diseaseId: 'disease-001',
    affectedCount: 150,
    mortality: 12,
    treatmentApplied: 'Oxytetracycline 60mg/kg feed for 10 days + increased aeration',
    notes: 'Water quality improved after treatment. DO levels raised to 6.5 mg/L.',
    resolved: true
  },
  {
    id: 'health-002',
    tankId: 'tank-002',
    date: '2026-02-05',
    diseaseId: 'disease-002',
    affectedCount: 80,
    mortality: 5,
    treatmentApplied: 'Salt bath 4 ppt for 4 days + temperature raised to 30°C',
    notes: 'White spots significantly reduced after 3 days of treatment.',
    resolved: true
  },
  {
    id: 'health-003',
    tankId: 'tank-003',
    date: '2026-02-12',
    diseaseId: 'disease-005',
    affectedCount: 300,
    mortality: 45,
    treatmentApplied: '60% water change, feeding stopped for 48h, added zeolite',
    notes: 'Ammonia spike due to pump failure. Emergency measures taken immediately.',
    resolved: false
  },
  {
    id: 'health-004',
    tankId: 'tank-001',
    date: '2026-01-28',
    diseaseId: 'disease-004',
    affectedCount: 25,
    mortality: 3,
    treatmentApplied: 'Salt treatment 10 ppt for 30 minutes + quarantine',
    notes: 'Infection occurred after rough handling during sampling.',
    resolved: true
  }
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    userId: '1',
    templateName: 'WATER_QUALITY_ALERT',
    subject: 'Critical Water Quality Alert',
    body: 'Tank A-03: pH level has dropped to 6.2. Immediate action required.',
    data: { tankId: 'tank-003', parameter: 'pH', value: 6.2 },
    status: 'SENT',
    sentAt: new Date('2026-02-15T08:30:00'),
    createdAt: new Date('2026-02-15T08:30:00')
  },
  {
    id: 'notif-002',
    userId: '1',
    templateName: 'WATER_QUALITY_ALERT',
    subject: 'High Ammonia Alert',
    body: 'Tank B-01: Ammonia levels elevated to 0.08 mg/L. Check immediately.',
    data: { tankId: 'tank-003', parameter: 'ammonia', value: 0.08 },
    status: 'SENT',
    sentAt: new Date('2026-02-15T09:15:00'),
    createdAt: new Date('2026-02-15T09:15:00')
  },
  {
    id: 'notif-003',
    userId: '2',
    templateName: 'WATER_QUALITY_ALERT',
    subject: 'Low Dissolved Oxygen',
    body: 'Tank A-01: DO dropped to 3.5 mg/L. Increase aeration.',
    data: { tankId: 'tank-001', parameter: 'DO', value: 3.5 },
    status: 'READ',
    sentAt: new Date('2026-02-14T14:20:00'),
    readAt: new Date('2026-02-14T14:45:00'),
    createdAt: new Date('2026-02-14T14:20:00')
  },
  {
    id: 'notif-004',
    userId: '1',
    templateName: 'WATER_QUALITY_ALERT',
    subject: 'Feed Inventory Low',
    body: 'High Protein Feed 32% is running low. Only 250 kg remaining.',
    data: { foodType: 'High Protein Feed 32%', quantity: 250 },
    status: 'SENT',
    sentAt: new Date('2026-02-15T07:00:00'),
    createdAt: new Date('2026-02-15T07:00:00')
  },
  {
    id: 'notif-005',
    userId: '1',
    templateName: 'WATER_QUALITY_ALERT',
    subject: 'Harvest Due Soon',
    body: 'Tank A-02 batch is approaching target weight. Consider harvest planning.',
    data: { tankId: 'tank-002', batchId: 'batch-002' },
    status: 'PENDING',
    createdAt: new Date('2026-02-15T10:00:00')
  }
];


// mockData.ts

export interface InventoryItem {
  id: string;
  farmId: string;
  name: string;
  type: 'feed' | 'medicine' | 'tool' | 'fuel';
  quantity: number;
  unit: string;
  reorderLevel: number;
  costPerUnit: number;
  supplier: string;
  expiryDate?: string;
}

export const mockInventory: InventoryItem[] = [
  {
    id: '1',
    farmId: 'farm-1',
    name: 'Floating Fish Feed - 3mm',
    type: 'feed',
    quantity: 1200,
    unit: 'kg',
    reorderLevel: 500,
    costPerUnit: 0.8,
    supplier: 'AquaFeeds Co.',
    expiryDate: '2026-05-15'
  },
  {
    id: '2',
    farmId: 'farm-1',
    name: 'Tilapia Growth Booster',
    type: 'medicine',
    quantity: 40,
    unit: 'bottles',
    reorderLevel: 25,
    costPerUnit: 15,
    supplier: 'FishCare Pharma',
    expiryDate: '2026-03-10'
  },
  {
    id: '3',
    farmId: 'farm-1',
    name: 'Water Quality Test Kit',
    type: 'tool',
    quantity: 5,
    unit: 'units',
    reorderLevel: 3,
    costPerUnit: 120,
    supplier: 'AquaTools Ltd'
  },
  {
    id: '4',
    farmId: 'farm-2',
    name: 'Diesel Fuel',
    type: 'fuel',
    quantity: 300,
    unit: 'liters',
    reorderLevel: 200,
    costPerUnit: 1.2,
    supplier: 'Local Fuel Station'
  },
  {
    id: '5',
    farmId: 'farm-2',
    name: 'Sinking Fish Feed - 5mm',
    type: 'feed',
    quantity: 350,
    unit: 'kg',
    reorderLevel: 400,
    costPerUnit: 0.9,
    supplier: 'AquaFeeds Co.',
    expiryDate: '2026-02-20'
  },
  {
    id: '6',
    farmId: 'farm-1',
    name: 'Antibiotic Treatment A',
    type: 'medicine',
    quantity: 10,
    unit: 'boxes',
    reorderLevel: 20,
    costPerUnit: 45,
    supplier: 'FishCare Pharma',
    expiryDate: '2026-01-25'
  }
];

// Growth Measurements Mock Data
export const mockGrowthMeasurements = [
  {
    id: 'growth-001',
    batchId: 'batch-001',
    tankId: 'A-03',
    measuredAt: new Date('2026-02-12'),
    daysInCulture: 45,
    sampleSize: 30,
    totalSampleWeightGrams: 9750,
    averageWeightGrams: 325,
    minWeightGrams: 280,
    maxWeightGrams: 360,
    stdDeviationGrams: 18.5,
    coefficientOfVariation: 5.7,
    averageLengthCm: 22.5,
    estimatedFishCount: 920,
    estimatedBiomassKg: 299,
    sgr: 2.1,
    adg: 2.5,
    weightGainGrams: 75,
    weightGainPercentage: 30,
    fcr: 1.52,
    survivalRate: 92,
    conditionFactor: 1.89,
    fcrRating: 'GOOD',
    sgrRating: 'GOOD',
    overallRating: 'GOOD',
    recommendations: [
      'Growth rate is on target - continue current feeding',
      'FCR is within acceptable range',
      'Consider sorting fish to improve uniformity'
    ],
    measuredBy: 'Ahmed Mohamed',
    isEstimate: false,
    notes: 'Fish looking healthy, good color',
    createdAt: new Date('2026-02-12')
  },
  {
    id: 'growth-002',
    batchId: 'batch-001',
    tankId: 'A-03',
    measuredAt: new Date('2026-01-13'),
    daysInCulture: 15,
    sampleSize: 25,
    totalSampleWeightGrams: 6250,
    averageWeightGrams: 250,
    minWeightGrams: 220,
    maxWeightGrams: 280,
    estimatedFishCount: 950,
    estimatedBiomassKg: 237.5,
    sgr: 3.2,
    adg: 10,
    weightGainGrams: 150,
    weightGainPercentage: 150,
    fcr: 1.45,
    survivalRate: 95,
    fcrRating: 'EXCELLENT',
    sgrRating: 'EXCELLENT',
    overallRating: 'EXCELLENT',
    recommendations: [
      'Excellent growth rate - maintain current protocol',
      'FCR is excellent',
      'High survival rate - good water quality management'
    ],
    measuredBy: 'Fatima Hassan',
    isEstimate: false,
    createdAt: new Date('2026-01-13')
  },
  {
    id: 'growth-003',
    batchId: 'batch-002',
    tankId: 'B-12',
    measuredAt: new Date('2026-02-10'),
    daysInCulture: 60,
    sampleSize: 35,
    totalSampleWeightGrams: 15750,
    averageWeightGrams: 450,
    minWeightGrams: 380,
    maxWeightGrams: 520,
    estimatedFishCount: 780,
    estimatedBiomassKg: 351,
    sgr: 1.8,
    adg: 3.5,
    fcr: 1.65,
    survivalRate: 88,
    fcrRating: 'ACCEPTABLE',
    sgrRating: 'ACCEPTABLE',
    overallRating: 'ACCEPTABLE',
    recommendations: [
      'Growth rate slightly below target',
      'Consider increasing feeding frequency',
      'Monitor water quality closely'
    ],
    measuredBy: 'Omar Ibrahim',
    isEstimate: false,
    notes: 'Some fish showing signs of stress',
    createdAt: new Date('2026-02-10')
  }
];

// Fish Inventory Batches Mock Data
export const mockFishInventoryBatches: FishInventoryBatch[] = [
  {
    id: 'fish-inv-001',
    farmId: '1',
    purchaseOrderId: 'PO-2026-001',
    species: 'Nile Tilapia',
    quantity: 5000,
    initialQuantity: 5000,
    averageWeight: 15,
    status: 'READY_TO_STOCK',
    healthCheckStatus: 'PASSED',
    healthCheckDate: '2026-02-14',
    deliveryDate: '2026-02-10',
    quarantinePeriodDays: 5,
    notes: 'High quality fingerlings from certified hatchery'
  },
  {
    id: 'fish-inv-002',
    farmId: '1',
    purchaseOrderId: 'PO-2026-002',
    species: 'African Catfish',
    quantity: 3000,
    initialQuantity: 3000,
    averageWeight: 20,
    status: 'QUARANTINE',
    healthCheckStatus: 'PENDING',
    deliveryDate: '2026-02-16',
    quarantinePeriodDays: 7,
    notes: 'In quarantine tank Q-01, observing for 7 days'
  },
  {
    id: 'fish-inv-003',
    farmId: '2',
    purchaseOrderId: 'PO-2026-003',
    species: 'European Seabass',
    quantity: 2000,
    initialQuantity: 2000,
    averageWeight: 25,
    status: 'READY_TO_STOCK',
    healthCheckStatus: 'PASSED',
    healthCheckDate: '2026-02-13',
    deliveryDate: '2026-02-08',
    quarantinePeriodDays: 5,
    notes: 'Excellent condition, ready for stocking'
  },
  {
    id: 'fish-inv-004',
    farmId: '1',
    purchaseOrderId: 'PO-2026-004',
    species: 'Nile Tilapia',
    quantity: 0,
    initialQuantity: 4000,
    averageWeight: 18,
    status: 'DEPLETED',
    healthCheckStatus: 'PASSED',
    healthCheckDate: '2026-02-05',
    deliveryDate: '2026-02-01',
    quarantinePeriodDays: 5,
    notes: 'All fish allocated to Tank A-01 and A-02'
  }
];

// Fish Batches in Tanks Mock Data
export const mockFishBatches: FishBatch[] = [
  {
    id: 'batch-001',
    tankId: 'tank-001',
    farmId: '1',
    inventoryBatchId: 'fish-inv-004',
    species: 'Nile Tilapia',
    initialCount: 2500,
    currentCount: 2350,
    initialAverageWeight: 18,
    currentAverageWeight: 125,
    remainingProportion: 0.94,
    status: 'ACTIVE',
    stockedDate: '2026-02-06',
    expectedHarvestDate: '2026-05-15',
    notes: 'Batch showing excellent growth'
  },
  {
    id: 'batch-002',
    tankId: 'tank-002',
    farmId: '1',
    inventoryBatchId: 'fish-inv-004',
    species: 'Nile Tilapia',
    initialCount: 1500,
    currentCount: 1425,
    initialAverageWeight: 18,
    currentAverageWeight: 110,
    remainingProportion: 0.95,
    status: 'ACTIVE',
    stockedDate: '2026-02-06',
    expectedHarvestDate: '2026-05-15'
  }
];