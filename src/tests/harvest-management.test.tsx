import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HarvestManagement } from '../components/HarvestManagement';
import * as harvestApi from '../services/harvestApi';
import * as fishTypesApi from '../services/fishTypesApi';
import * as metaApi from '../services/metaApi';

vi.mock('../services/harvestApi', async () => {
  const actual = await vi.importActual<typeof import('../services/harvestApi')>('../services/harvestApi');
  return {
    ...actual,
    addHarvestGradingRecord: vi.fn(),
    completeHarvestEvent: vi.fn(),
    createFishGradePricing: vi.fn(),
    getActiveHarvestTanks: vi.fn(),
    getHarvestEvents: vi.fn(),
    getHarvestEventsByTank: vi.fn(),
    getHarvestGradings: vi.fn(),
    getHarvestPrediction: vi.fn(),
    getHarvestTanks: vi.fn(),
    getPricingByFishType: vi.fn(),
    getTankBatches: vi.fn(),
    startHarvestEvent: vi.fn(),
    updateFishGradePricing: vi.fn(),
  };
});

vi.mock('../services/fishTypesApi', async () => {
  const actual = await vi.importActual<typeof import('../services/fishTypesApi')>('../services/fishTypesApi');
  return {
    ...actual,
    getFishTypes: vi.fn(),
  };
});

vi.mock('../services/metaApi', async () => {
  const actual = await vi.importActual<typeof import('../services/metaApi')>('../services/metaApi');
  return {
    ...actual,
    getMetadata: vi.fn(),
  };
});

const harvestEventsMock = vi.mocked(harvestApi.getHarvestEvents);
const activeTanksMock = vi.mocked(harvestApi.getActiveHarvestTanks);
const harvestTanksMock = vi.mocked(harvestApi.getHarvestTanks);
const fishTypesMock = vi.mocked(fishTypesApi.getFishTypes);
const metadataMock = vi.mocked(metaApi.getMetadata);
const tankBatchesMock = vi.mocked(harvestApi.getTankBatches);
const predictionMock = vi.mocked(harvestApi.getHarvestPrediction);
const startHarvestMock = vi.mocked(harvestApi.startHarvestEvent);
const pricingByFishTypeMock = vi.mocked(harvestApi.getPricingByFishType);
const addGradingMock = vi.mocked(harvestApi.addHarvestGradingRecord);
const gradingsMock = vi.mocked(harvestApi.getHarvestGradings);
const completeHarvestMock = vi.mocked(harvestApi.completeHarvestEvent);
const historyByTankMock = vi.mocked(harvestApi.getHarvestEventsByTank);
const createPricingMock = vi.mocked(harvestApi.createFishGradePricing);
const updatePricingMock = vi.mocked(harvestApi.updateFishGradePricing);

const setupBaseMocks = () => {
  harvestEventsMock.mockResolvedValue([]);
  activeTanksMock.mockResolvedValue([]);
  harvestTanksMock.mockResolvedValue([
    {
      id: 'tank-1',
      name: 'Tank A-01',
      status: 'ACTIVE',
      fishType: 'Nile Tilapia',
      biomassKg: 6500,
      capacityKg: 9000,
    },
  ]);
  fishTypesMock.mockResolvedValue([
    {
      id: 'fish-1',
      name: 'Nile Tilapia',
      scientificName: 'Oreochromis niloticus',
      tempMin: 18,
      tempOptimal: 28,
      tempMax: 32,
      doMin: 3,
      doSafe: 5,
      phMin: 6.5,
      phMax: 8.5,
      nh3Safe: 0.02,
      nh3Critical: 0.05,
      no2Max: 0.1,
      fcrMin: 1.2,
      fcrMax: 1.6,
      survivalRate: 90,
      feedingRateMatrix: { weight_ranges: [], temperatures: [], rates: [] },
      mealFrequencyRules: [],
      criticalParameters: [],
      proteinRequirements: [],
      allowedFoodTypeIds: [],
      allowedFoodTypes: [],
      isActive: true,
    },
  ]);
  metadataMock.mockResolvedValue({ enums: {}, modules: [] });
  historyByTankMock.mockResolvedValue([]);
  pricingByFishTypeMock.mockResolvedValue([]);
  tankBatchesMock.mockResolvedValue({ summary: null, batches: [] });
  predictionMock.mockResolvedValue({
    predictedWeightKg: 1200,
    predictedRevenue: 54000,
    daysToHarvest: 0,
    recommendation: 'HIGH_PROFIT',
    actions: [],
    revenueByGrade: {},
    raw: {},
  });
  startHarvestMock.mockResolvedValue({
    id: 'event-1',
    tankId: 'tank-1',
    harvestType: 'QUARTER',
    harvestTypeLabel: 'Selective',
    estimatedWeight: 1200,
    actualTotalWeight: 0,
    totalRevenue: 0,
    status: 'DRAFT',
    harvestDate: '2026-03-08T00:00:00.000Z',
  });
  addGradingMock.mockResolvedValue({
    id: 'grading-1',
    pricingId: 'pricing-1',
    sourceBatchId: 'batch-1',
    weightKg: 50,
    condition: 'GOOD',
    gradeName: 'Grade 1',
    gradeType: 'GRADE_1',
    pricePerKg: 42,
    totalValue: 2100,
  });
  gradingsMock.mockResolvedValue([
    {
      id: 'grading-1',
      pricingId: 'pricing-1',
      sourceBatchId: 'batch-1',
      weightKg: 50,
      condition: 'GOOD',
      gradeName: 'Grade 1',
      gradeType: 'GRADE_1',
      pricePerKg: 42,
      totalValue: 2100,
    },
  ]);
  completeHarvestMock.mockResolvedValue({
    id: 'event-1',
    tankId: 'tank-1',
    harvestType: 'QUARTER',
    harvestTypeLabel: 'Selective',
    estimatedWeight: 1200,
    actualTotalWeight: 50,
    totalRevenue: 2100,
    status: 'COMPLETED',
    harvestDate: '2026-03-08T00:00:00.000Z',
  });
  createPricingMock.mockResolvedValue({
    id: 'pricing-2',
    fishTypeId: 'fish-1',
    gradeName: 'Grade 2',
    minWeight: 100,
    maxWeight: 150,
    numOfFishInKilo: 7,
    pricePerKg: 30,
    isWaste: false,
    isActive: true,
  });
  updatePricingMock.mockResolvedValue({
    id: 'pricing-1',
    fishTypeId: 'fish-1',
    gradeName: 'Grade 1 Updated',
    minWeight: 150,
    maxWeight: 200,
    numOfFishInKilo: 5,
    pricePerKg: 42,
    isWaste: false,
    isActive: true,
  });
};

describe('HarvestManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupBaseMocks();
  });

  it('renders dashboard empty states from live API sources', async () => {
    render(<HarvestManagement farmId="farm-1" />);

    expect(await screen.findByText('Live Harvest Events')).toBeInTheDocument();
    expect(screen.getByText('No harvest events found for this farm context.')).toBeInTheDocument();
    expect(screen.getByText('No tanks currently in draft harvest state.')).toBeInTheDocument();
  });

  it('runs workflow success path: start -> grading -> complete', async () => {
    const user = userEvent.setup();

    tankBatchesMock.mockResolvedValue({
      summary: null,
      batches: [
        {
          id: 'batch-1',
          fishType: 'Nile Tilapia',
          status: 'active',
          currentCount: 12000,
          currentAvgWeightG: 520,
          biomassKg: 6240,
        },
      ],
    });
    pricingByFishTypeMock.mockResolvedValue([
      {
        id: 'pricing-1',
        fishTypeId: 'fish-1',
        gradeName: 'Grade 1',
        minWeight: 150,
        maxWeight: 200,
        numOfFishInKilo: 5,
        pricePerKg: 42,
        isWaste: false,
        isActive: true,
      },
    ]);

    render(<HarvestManagement farmId="farm-1" />);

    await screen.findByText('Live Harvest Events');
    await user.click(screen.getByRole('tab', { name: 'Workflow' }));
    await user.selectOptions(screen.getByLabelText('Tank'), 'tank-1');

    await waitFor(() => {
      expect(tankBatchesMock).toHaveBeenCalledWith('tank-1');
    });

    await user.click(screen.getByRole('button', { name: /Start Harvest Event/i }));

    expect(await screen.findByText('Workflow Step 2 / 4')).toBeInTheDocument();
    await waitFor(() => {
      expect(startHarvestMock).toHaveBeenCalledWith({
        tankId: 'tank-1',
        harvestType: 'QUARTER',
      });
    });

    await user.clear(screen.getByLabelText('Weight (kg)'));
    await user.type(screen.getByLabelText('Weight (kg)'), '50');
    await user.click(screen.getByRole('button', { name: /Add Grading/i }));

    await waitFor(() => {
      expect(addGradingMock).toHaveBeenCalledWith('event-1', {
        pricingId: 'pricing-1',
        sourceBatchId: 'batch-1',
        weightKg: 50,
        condition: 'GOOD',
      });
    });

    expect(await screen.findByText(/Grade 1 - 50 kg/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Continue to Completion/i }));
    expect(await screen.findByText('Workflow Step 3 / 4')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Complete Harvest/i }));

    expect(await screen.findByText('Harvest Completed')).toBeInTheDocument();
    expect(completeHarvestMock).toHaveBeenCalledWith('event-1', {
      laborCost: 0,
      transportCost: 0,
      packagingCost: 0,
    });
  });

  it('supports pricing create and edit actions with list refresh', async () => {
    const user = userEvent.setup();

    pricingByFishTypeMock
      .mockResolvedValueOnce([
        {
          id: 'pricing-1',
          fishTypeId: 'fish-1',
          gradeName: 'Grade 1',
          minWeight: 100,
          maxWeight: 150,
          numOfFishInKilo: 6,
          pricePerKg: 40,
          isWaste: false,
          isActive: true,
        },
      ])
      .mockResolvedValue([
        {
          id: 'pricing-1',
          fishTypeId: 'fish-1',
          gradeName: 'Grade 1',
          minWeight: 100,
          maxWeight: 150,
          numOfFishInKilo: 6,
          pricePerKg: 40,
          isWaste: false,
          isActive: true,
        },
      ]);

    render(<HarvestManagement farmId="farm-1" />);
    await screen.findByText('Live Harvest Events');

    await user.click(screen.getByRole('tab', { name: 'Pricing' }));
    expect(await screen.findByText('Fish Grade Pricing Manager')).toBeInTheDocument();
    expect(await screen.findByText('Grade 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Edit/i }));
    await user.clear(screen.getByLabelText('Grade Name'));
    await user.type(screen.getByLabelText('Grade Name'), 'Grade 1 Updated');
    await user.click(screen.getByRole('button', { name: /Update Pricing/i }));

    await waitFor(() => {
      expect(updatePricingMock).toHaveBeenCalledWith(
        'pricing-1',
        expect.objectContaining({
          fishTypeId: 'fish-1',
          gradeName: 'Grade 1 Updated',
        }),
      );
    });

    await user.clear(screen.getByLabelText('Grade Name'));
    await user.type(screen.getByLabelText('Grade Name'), 'Grade 2');
    await user.click(screen.getByRole('button', { name: /Create Pricing/i }));

    await waitFor(() => {
      expect(createPricingMock).toHaveBeenCalledWith(
        expect.objectContaining({
          fishTypeId: 'fish-1',
          gradeName: 'Grade 2',
        }),
      );
    });
    expect(pricingByFishTypeMock.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
});
