# Growth Tracking System - FishFarm360

## Overview
Comprehensive growth measurement recording and tracking system with multi-language support (English & Arabic).

## Components Created

### 1. RecordGrowthMeasurement.tsx
**Location:** `/components/tanks/RecordGrowthMeasurement.tsx`

**Features:**
- ✅ Record sampling measurements for fish batches
- ✅ Support for detailed individual weight entry or bulk input
- ✅ Real-time calculations (Average Weight, SGR, Weight Gain, Biomass)
- ✅ Statistical analysis (Std Deviation, CV%)
- ✅ Performance ratings (EXCELLENT, GOOD, ACCEPTABLE, POOR)
- ✅ Success modal with recommendations
- ✅ Multi-language support (EN/AR)
- ✅ RTL support for Arabic
- ✅ Responsive design

**Key Calculations:**
```javascript
// Average Weight
averageWeight = totalSampleWeight / sampleSize

// Specific Growth Rate (SGR)
SGR = [(ln(currentWeight) - ln(lastWeight)) / days] × 100

// Weight Gain
weightGain = currentWeight - lastWeight
weightGainPercentage = (weightGain / lastWeight) × 100

// Estimated Biomass
estimatedBiomass = (currentCount × averageWeight) / 1000
```

**Usage:**
```tsx
<RecordGrowthMeasurement
  open={showModal}
  onClose={() => setShowModal(false)}
  batch={{
    id: 'batch-001',
    batchNumber: 'BATCH-2026-001',
    tankName: 'Tank A-01',
    fishType: 'Nile Tilapia',
    daysInCulture: 45,
    lastWeight: 250,
    currentCount: 920
  }}
  language="en" // or "ar"
  onSuccess={(data) => console.log('Saved:', data)}
/>
```

### 2. GrowthHistory.tsx
**Location:** `/components/tanks/GrowthHistory.tsx`

**Features:**
- ✅ Timeline view of all growth measurements
- ✅ Interactive growth chart (Weight & SGR over time)
- ✅ Performance badges and ratings
- ✅ Quick access to record new measurements
- ✅ Multi-language support
- ✅ Responsive layout

**Usage:**
```tsx
<GrowthHistory
  batch={batchInfo}
  measurements={[...measurements]}
  language="en"
  onMeasurementAdded={() => {
    // Refresh data
  }}
/>
```

### 3. Translation System
**Location:** `/i18n/translations.ts`

**Supported Languages:**
- English (en)
- Arabic (ar) with RTL support

**Usage:**
```tsx
import { getTranslation, Language } from '../../i18n/translations';

const t = (key: string) => getTranslation('en', key);
t('growthMeasurement.title') // "Record Growth Sampling"
```

## Demo Page
**Location:** `/components/GrowthTrackingDemo.tsx`

Access via sidebar: **"Growth Tracking Demo"**

Features:
- Test record growth measurement modal
- View growth history timeline
- See multi-language support
- Test all features with mock data

## Data Schema

### GrowthMeasurement Interface
```typescript
interface GrowthMeasurement {
  id: string;
  batchId: string;
  tankId: string;
  
  // Measurement Details
  measuredAt: Date;
  daysInCulture: number;
  
  // Sampling
  sampleSize: number;
  totalSampleWeightGrams: number;
  averageWeightGrams: number;
  minWeightGrams: number;
  maxWeightGrams: number;
  stdDeviationGrams?: number;
  coefficientOfVariation?: number;
  
  // Optional Length
  averageLengthCm?: number;
  conditionFactor?: number;
  
  // Estimated Totals
  estimatedFishCount: number;
  estimatedBiomassKg: number;
  
  // Growth Metrics
  sgr?: number; // Specific Growth Rate (%/day)
  adg?: number; // Average Daily Gain (g/day)
  weightGainGrams?: number;
  weightGainPercentage?: number;
  
  // Feed Conversion
  fcr?: number; // Feed Conversion Ratio
  survivalRate?: number;
  
  // Performance Ratings
  fcrRating?: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR';
  sgrRating?: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR';
  overallRating?: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR';
  recommendations?: string[];
  
  // Metadata
  measuredBy?: string;
  isEstimate: boolean;
  notes?: string;
  createdAt: Date;
}
```

## Mock Data
**Location:** `/mockData.ts`

Three sample measurements available:
- `mockGrowthMeasurements[0]` - Day 45 (GOOD rating)
- `mockGrowthMeasurements[1]` - Day 15 (EXCELLENT rating)
- `mockGrowthMeasurements[2]` - Day 60 (ACCEPTABLE rating)

## Integration Points

### In Tank Management
Add to batch detail view:
```tsx
import RecordGrowthMeasurement from './tanks/RecordGrowthMeasurement';

// In batch row
<Button onClick={() => setShowGrowthModal(true)}>
  Sample Growth
</Button>
```

### In Dashboard
Quick action shortcut:
```tsx
<Button onClick={() => openGrowthTracking()}>
  <Scale className="w-4 h-4 mr-2" />
  Record Growth
</Button>
```

## Key Features

### 1. Detailed Weight Entry
- Individual fish weights input
- Bulk paste support (comma/newline separated)
- Automatic statistics calculation
- Weight distribution analysis

### 2. Real-time Calculations
- Instant feedback as user types
- SGR rating with color coding
- Weight gain percentage
- Estimated total biomass

### 3. Validation
- Sample size: 10-100 fish (recommended 20-50)
- Required fields checking
- Date validation (not future)
- Logical weight ranges

### 4. Performance Ratings
SGR Ratings:
- 🟢 EXCELLENT: > 2.5%/day
- 🟡 GOOD: 2.0-2.5%/day
- 🟠 ACCEPTABLE: 1.5-2.0%/day
- 🔴 POOR: < 1.5%/day

### 5. Multi-language
All UI text translatable:
- Form labels
- Button text
- Validation messages
- Success messages
- Recommendations

## API Endpoints (For Future Backend)

```typescript
// Record new measurement
POST /tanks/:tankId/batches/:batchId/growth-measurements
Body: {
  measuredAt: Date,
  sampleSize: number,
  totalSampleWeightGrams: number,
  individualWeights?: number[],
  notes?: string
}

// Get growth history
GET /tanks/:tankId/batches/:batchId/growth-measurements

// Get single measurement
GET /growth-measurements/:id

// Update measurement
PUT /growth-measurements/:id

// Delete measurement
DELETE /growth-measurements/:id
```

## Testing Instructions

1. **Login** to the system
2. Navigate to **"Growth Tracking Demo"** in sidebar
3. Click **"Record Growth Measurement"** button
4. Fill in the form:
   - Sample size: 30
   - Total weight: 9750g
   - Optional: Enable detailed entry and paste weights
5. Review real-time calculations
6. Click **"Save Measurement"**
7. See success modal with performance summary
8. Click **"Show Growth History"** to view timeline and chart

## Language Switching

To test Arabic:
```tsx
<RecordGrowthMeasurement
  language="ar"
  // ... other props
/>
```

The UI will automatically:
- Switch to RTL layout
- Display Arabic text
- Mirror component alignment

## Dependencies
- React
- Recharts (for growth charts)
- Lucide React (icons)
- UI Components (shadcn/ui based)

## Future Enhancements
- [ ] Weight distribution histogram
- [ ] Export to PDF/Excel
- [ ] Photo upload for sampling
- [ ] Multiple fish type comparison
- [ ] Predictive growth modeling
- [ ] Push notifications for sampling reminders
- [ ] Batch comparison analytics
- [ ] Mobile app integration

## Support
For questions or issues, contact the development team.

---
Created: February 2026
Version: 1.0.0
