# Fish Type Management - Enhanced Features

## Overview
Comprehensive fish type management system with feeding rate matrices, protein requirements, meal frequency rules, critical parameters, and allowed food types.

## New Features Added

### 1. ✅ Feeding Rate Matrix
**Purpose:** Define feeding rates (% of body weight) based on fish weight ranges and water temperature

**Structure:**
```typescript
{
  weight_ranges: [
    { min: 10, max: 15 },
    { min: 15, max: 20 },
    { min: 20, max: 30 }
  ],
  temperatures: [18, 23, 26, 30],
  rates: [
    [2.0, 3.0, 4.25, 4.5],    // Rates for 10-15g at each temp
    [2.0, 2.75, 4.0, 4.25],   // Rates for 15-20g
    [1.8, 2.5, 3.75, 4.0]     // Rates for 20-30g
  ]
}
```

**UI Features:**
- Dynamic table with weight ranges as rows and temperatures as columns
- Add/remove weight ranges
- Edit rates in real-time
- Visual instructions for usage

**Use Case:**
System automatically calculates daily feed amount based on:
- Current fish average weight
- Current water temperature
- Number of fish in batch

### 2. ✅ Meal Frequency Rules
**Purpose:** Define how many meals per day based on fish weight

**Structure:**
```typescript
[
  { maxWeight: 5, mealsPerDay: 6 },      // Fish up to 5g: 6 meals/day
  { maxWeight: 10, mealsPerDay: 5 },     // Fish 5-10g: 5 meals/day
  { maxWeight: 25, mealsPerDay: 4 },     // Fish 10-25g: 4 meals/day
  { maxWeight: 50, mealsPerDay: 3 },     // Fish 25-50g: 3 meals/day
  { maxWeight: null, mealsPerDay: 2 }    // Fish >50g: 2 meals/day
]
```

**UI Features:**
- List of rules with max weight and meals per day
- Add/remove rules dynamically
- Support for "null" (any weight above)
- Visual cards for each rule

**Use Case:**
System automatically determines feeding schedule based on current fish weight

### 3. ✅ Protein Requirements
**Purpose:** Define protein percentage requirements based on fish size/growth stage

**Structure:**
```typescript
[
  { minWeight: 0, maxWeight: 10, proteinPercentage: 35 },      // Fry stage
  { minWeight: 10, maxWeight: 50, proteinPercentage: 32 },     // Fingerling
  { minWeight: 50, maxWeight: 200, proteinPercentage: 30 },    // Grower
  { minWeight: 200, maxWeight: null, proteinPercentage: 28 }   // Finisher
]
```

**UI Features:**
- Grid layout with min/max weight ranges
- Protein percentage input
- Add/remove requirements
- Support for null (no upper limit)

**Use Case:**
- Filter food types by protein content
- Recommend appropriate feed based on fish size
- Quality control for feed selection

### 4. ✅ Critical Parameters
**Purpose:** Flag which water quality parameters are most critical for this species

**Options:**
- Temperature
- DO (Dissolved Oxygen)
- pH
- NH3 (Ammonia)
- NH4 (Ammonium)
- NO2 (Nitrite)
- NO3 (Nitrate)
- Salinity

**UI Features:**
- Grid of selectable cards
- Visual checkbox/selection state
- Multiple selection supported

**Use Case:**
- Prioritize monitoring and alerts
- Dashboard displays critical parameters first
- Automated alert threshold configuration

### 5. ✅ Allowed Food Types
**Purpose:** Define which food types are suitable for this fish species

**UI Features:**
- List of all available food types
- Visual selection cards
- Food icon and name display
- Checkmark for selected items

**Integration:**
- Connected to Food Type Management module
- Dynamic list from `mockFoodTypes`
- Multi-selection supported

**Use Case:**
- Filter feed options when creating feeding schedules
- Prevent unsuitable feed assignment
- Quality assurance for batch management

## UI/UX Improvements

### Tabbed Modal Interface
The create/edit modal now uses **5 tabs** for better organization:

1. **Basic Info**
   - Name, Scientific Name, Arabic Name
   - Target SGR
   - Description
   - Critical Parameters selection

2. **Water Quality**
   - Temperature ranges (min/optimal/max)
   - Dissolved Oxygen (min/safe)
   - pH Range (min/max)
   - NH3, NO2, NO3 levels
   - Performance Benchmarks (FCR, Survival Rate)

3. **Feeding Rates**
   - Interactive feeding rate matrix table
   - Weight ranges configuration
   - Temperature-based rates
   - Usage instructions

4. **Protein & Meals**
   - Protein requirements by weight
   - Meal frequency rules
   - Add/remove rules dynamically

5. **Food Types**
   - Allowed food types selection
   - Active/inactive status toggle
   - Additional notes

### Visual Enhancements
- ✅ Color-coded selection states
- ✅ Icons for visual clarity
- ✅ Responsive grid layouts
- ✅ Clear labels and instructions
- ✅ Info cards with usage tips
- ✅ Validation feedback

## Data Structure

### Complete Fish Type Schema
```typescript
interface FishType {
  // Basic Info
  id: string;
  name: string;
  scientificName: string;
  arabicName?: string;
  description?: string;
  
  // Water Quality Parameters
  tempMin: number;
  tempOptimal: number;
  tempMax: number;
  doMin: number;
  doSafe: number;
  phMin: number;
  phMax: number;
  nh3Safe: number;
  nh3Critical: number;
  no2Max: number;
  no3Max?: number;
  
  // Performance Benchmarks
  fcrMin: number;
  fcrMax: number;
  survivalRate: number;
  targetSGR: number;
  
  // NEW: Feeding Rate Matrix
  feedingRateMatrix: {
    weight_ranges: Array<{ min: number; max: number }>;
    temperatures: number[];
    rates: number[][];
  };
  
  // NEW: Meal Frequency Rules
  mealFrequencyRules: Array<{
    maxWeight: number | null;
    mealsPerDay: number;
  }>;
  
  // NEW: Protein Requirements
  proteinRequirements: Array<{
    minWeight: number | null;
    maxWeight: number | null;
    proteinPercentage: number;
  }>;
  
  // NEW: Critical Parameters
  criticalParameters?: string[];
  
  // NEW: Allowed Food Types
  allowedFoodTypes: string[];  // Food Type IDs
  
  // Metadata
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Example Usage

### Creating a Fish Type with All Features
```typescript
const nileTilapia = {
  name: 'Nile Tilapia',
  scientificName: 'Oreochromis niloticus',
  arabicName: 'البلطي النيلي',
  
  // Water quality
  tempMin: 20,
  tempOptimal: 28,
  tempMax: 32,
  doMin: 3,
  doSafe: 5,
  phMin: 6.5,
  phMax: 8.5,
  
  // Critical parameters
  criticalParameters: ['DO', 'NH3', 'Temperature'],
  
  // Feeding rate matrix
  feedingRateMatrix: {
    weight_ranges: [
      { min: 10, max: 20 },
      { min: 20, max: 50 },
      { min: 50, max: 100 }
    ],
    temperatures: [20, 25, 28, 30],
    rates: [
      [3.0, 4.0, 4.5, 4.0],
      [2.5, 3.5, 4.0, 3.5],
      [2.0, 3.0, 3.5, 3.0]
    ]
  },
  
  // Meal frequency
  mealFrequencyRules: [
    { maxWeight: 5, mealsPerDay: 6 },
    { maxWeight: 25, mealsPerDay: 4 },
    { maxWeight: 100, mealsPerDay: 3 },
    { maxWeight: null, mealsPerDay: 2 }
  ],
  
  // Protein requirements
  proteinRequirements: [
    { minWeight: 0, maxWeight: 10, proteinPercentage: 35 },
    { minWeight: 10, maxWeight: 50, proteinPercentage: 32 },
    { minWeight: 50, maxWeight: 200, proteinPercentage: 30 },
    { minWeight: 200, maxWeight: null, proteinPercentage: 28 }
  ],
  
  // Allowed food types
  allowedFoodTypes: ['1', '3', '4'],  // IDs of suitable feeds
  
  isActive: true
};
```

## Integration with Other Modules

### 1. Feeding Schedule Creation
```typescript
// System uses feeding rate matrix
const feedingRate = getFeedingRate(
  fishType.feedingRateMatrix,
  currentAvgWeight,  // e.g., 45g
  currentTemp        // e.g., 27°C
);

// Calculate daily feed
const dailyFeed = (biomass * feedingRate) / 100;

// Determine meal frequency
const mealsPerDay = getMealFrequency(
  fishType.mealFrequencyRules,
  currentAvgWeight
);

// Split daily feed across meals
const feedPerMeal = dailyFeed / mealsPerDay;
```

### 2. Feed Selection Filter
```typescript
// Only show allowed food types
const availableFeeds = allFoodTypes.filter(feed => 
  fishType.allowedFoodTypes.includes(feed.id) &&
  meetsPro teinRequirement(feed, currentAvgWeight, fishType)
);
```

### 3. Water Quality Monitoring
```typescript
// Prioritize critical parameters
const criticalAlerts = waterQualityReadings.filter(reading =>
  fishType.criticalParameters.includes(reading.parameter) &&
  reading.status === 'critical'
);
```

## Mock Data

Mock food types are defined in the component:
```typescript
const mockFoodTypes = [
  { id: '1', name: 'High Protein Tilapia Feed 32%' },
  { id: '2', name: 'Fingerling Starter 38%' },
  { id: '3', name: 'Grower Feed 28%' },
  { id: '4', name: 'Finisher Feed 25%' }
];
```

## API Endpoints (For Future Backend)

```typescript
// Create fish type
POST /fish-types
Body: FishType (complete schema)

// Update fish type
PUT /fish-types/:id
Body: Partial<FishType>

// Get fish type with all relations
GET /fish-types/:id?include=allowedFoodTypes

// Get feeding rate for specific conditions
GET /fish-types/:id/feeding-rate?weight=45&temperature=27

// Get meal frequency for weight
GET /fish-types/:id/meal-frequency?weight=45

// Get protein requirement for weight
GET /fish-types/:id/protein-requirement?weight=45
```

## Benefits

1. **Automation:**
   - Auto-calculate feeding amounts
   - Auto-determine meal schedules
   - Auto-filter appropriate feeds

2. **Quality Control:**
   - Prevent unsuitable feed selection
   - Ensure protein requirements met
   - Monitor critical parameters

3. **Efficiency:**
   - Reduce manual calculations
   - Standardize feeding practices
   - Improve feed conversion rates

4. **Scalability:**
   - Support multiple fish species
   - Easy to add new species
   - Flexible rules system

5. **Accuracy:**
   - Temperature-adjusted feeding
   - Weight-based protein requirements
   - Species-specific parameters

## Testing Instructions

1. Navigate to **Fish Type Management**
2. Click **"Add Fish Type"**
3. Fill in all 5 tabs:
   - Basic Info (add critical parameters)
   - Water Quality (set ranges)
   - Feeding Rates (configure matrix)
   - Protein & Meals (set requirements and rules)
   - Food Types (select allowed types)
4. Click **"Create Fish Type"**
5. Verify all data is saved correctly

## Future Enhancements

- [ ] Import feeding rate matrix from CSV
- [ ] Copy matrix from existing fish type
- [ ] Visual graph of feeding rates
- [ ] Batch update multiple fish types
- [ ] Export fish type configuration to JSON
- [ ] Protein requirement recommendations based on growth stage
- [ ] Integration with AI for optimal feeding rates
- [ ] Historical performance data visualization

---

Created: February 2026
Version: 2.0.0
