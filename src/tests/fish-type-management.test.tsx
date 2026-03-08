import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FishTypeManagementEnhanced from '../components/FishTypeManagementEnhanced';
import * as fishTypesApi from '../services/fishTypesApi';
import { User } from '../types';

vi.mock('../services/fishTypesApi', async () => {
  const actual = await vi.importActual<typeof import('../services/fishTypesApi')>('../services/fishTypesApi');
  return {
    ...actual,
    createFishType: vi.fn(),
    getFeedingRate: vi.fn(),
    getFishTypeById: vi.fn(),
    getFishTypes: vi.fn(),
    getFoodTypes: vi.fn(),
    getMealFrequency: vi.fn(),
    getProteinRequirement: vi.fn(),
    updateFishType: vi.fn(),
  };
});

const getFishTypesMock = vi.mocked(fishTypesApi.getFishTypes);
const getFoodTypesMock = vi.mocked(fishTypesApi.getFoodTypes);
const getFishTypeByIdMock = vi.mocked(fishTypesApi.getFishTypeById);
const updateFishTypeMock = vi.mocked(fishTypesApi.updateFishType);
const createFishTypeMock = vi.mocked(fishTypesApi.createFishType);
const feedingRateMock = vi.mocked(fishTypesApi.getFeedingRate);
const mealFrequencyMock = vi.mocked(fishTypesApi.getMealFrequency);
const proteinRequirementMock = vi.mocked(fishTypesApi.getProteinRequirement);

const testUser: User = {
  id: 'user-1',
  name: 'Farm Manager',
  email: 'manager@example.com',
  phone: 'N/A',
  role: 'manager',
  farmId: 'farm-1',
};

const sampleFishType = {
  id: 'fish-1',
  name: 'Nile Tilapia',
  scientificName: 'Oreochromis niloticus',
  arabicName: 'البلطي',
  description: 'Sample type',
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
  no3Max: 40,
  salinityMin: 0,
  salinityMax: 12,
  alkalinityMin: 50,
  alkalinityMax: 300,
  fcrMin: 1.2,
  fcrMax: 1.6,
  survivalRate: 90,
  targetSGR: 2,
  feedingRateMatrix: {
    weight_ranges: [{ min: 0, max: 10 }],
    temperatures: [20, 24, 26],
    rates: [[20, 25, 30]],
  },
  mealFrequencyRules: [{ maxWeight: 10, mealsPerDay: 6 }],
  criticalParameters: ['DO', 'NH3'],
  proteinRequirements: [{ minWeight: 0, maxWeight: 10, proteinPercentage: 40 }],
  allowedFoodTypeIds: ['food-1'],
  allowedFoodTypes: [],
  notes: 'Notes',
  isActive: true,
};

describe('FishTypeManagementEnhanced', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getFishTypesMock.mockResolvedValue([sampleFishType]);
    getFoodTypesMock.mockResolvedValue([
      {
        id: 'food-1',
        name: 'High Protein Feed',
        arabicName: 'علف عالي البروتين',
        proteinPercentage: 40,
        isActive: true,
      },
    ]);
    getFishTypeByIdMock.mockResolvedValue(sampleFishType);
    updateFishTypeMock.mockResolvedValue(sampleFishType);
    createFishTypeMock.mockResolvedValue(sampleFishType);
    feedingRateMock.mockResolvedValue({
      fishTypeId: 'fish-1',
      weight: 45,
      temperature: 27,
      feedingRatePercentage: 12,
    });
    mealFrequencyMock.mockResolvedValue({
      fishTypeId: 'fish-1',
      weight: 45,
      mealsPerDay: 4,
    });
    proteinRequirementMock.mockResolvedValue({
      fishTypeId: 'fish-1',
      weight: 45,
      proteinPercentage: 32,
    });
  });

  it('loads fish type list from API and runs calculators', async () => {
    const user = userEvent.setup();
    render(<FishTypeManagementEnhanced user={testUser} selectedFarm={null} />);

    const fishTypeLabels = await screen.findAllByText('Nile Tilapia');
    expect(fishTypeLabels.length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /Run Calculators/i }));

    await waitFor(() => {
      expect(feedingRateMock).toHaveBeenCalledWith('fish-1', 45, 27);
      expect(mealFrequencyMock).toHaveBeenCalledWith('fish-1', 45);
      expect(proteinRequirementMock).toHaveBeenCalledWith('fish-1', 45);
    });

    expect(await screen.findByText('12% body weight/day')).toBeInTheDocument();
    expect(screen.getByText('4 meals/day')).toBeInTheDocument();
    expect(screen.getByText('32% protein')).toBeInTheDocument();
  });

  it('supports edit flow (by-id load + update) and create flow', async () => {
    const user = userEvent.setup();
    render(<FishTypeManagementEnhanced user={testUser} selectedFarm={null} />);

    const fishTypeLabels = await screen.findAllByText('Nile Tilapia');
    expect(fishTypeLabels.length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /Edit/i }));

    await waitFor(() => {
      expect(getFishTypeByIdMock).toHaveBeenCalledWith('fish-1');
    });

    const nameInputs = await screen.findAllByLabelText('Name *');
    await user.clear(nameInputs[0]);
    await user.type(nameInputs[0], 'Nile Tilapia Updated');
    await user.click(screen.getByRole('button', { name: /Update Fish Type/i }));

    await waitFor(() => {
      expect(updateFishTypeMock).toHaveBeenCalledWith(
        'fish-1',
        expect.objectContaining({ name: 'Nile Tilapia Updated' }),
      );
    });

    await user.click(screen.getByRole('button', { name: /Add Fish Type/i }));
    const createNameInputs = await screen.findAllByLabelText('Name *');
    const createScientificInputs = await screen.findAllByLabelText('Scientific Name *');

    await user.clear(createNameInputs[0]);
    await user.type(createNameInputs[0], 'African Catfish');
    await user.clear(createScientificInputs[0]);
    await user.type(createScientificInputs[0], 'Clarias gariepinus');
    await user.click(screen.getByRole('button', { name: /Create Fish Type/i }));

    await waitFor(() => {
      expect(createFishTypeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'African Catfish',
          scientificName: 'Clarias gariepinus',
        }),
      );
    });
  });
});
