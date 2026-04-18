import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createFishType,
  getFeedingRate,
  getFishTypes,
  getMealFrequency,
  getProteinRequirement,
  updateFishType,
} from '../services/fishTypesApi';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const basePayload = {
  name: 'Nile Tilapia',
  scientificName: 'Oreochromis niloticus',
  tempMin: 18,
  tempOptimal: 28,
  tempMax: 32,
  doMin: 3,
  doSafe: 5,
  phMin: 6.5,
  phMax: 9,
  nh3Safe: 0.02,
  nh3Critical: 0.05,
  no2Max: 0.1,
  fcrMin: 1.2,
  fcrMax: 1.6,
  survivalRate: 90,
  targetSGR: 2,
  targetWeightForHarvest: 2.8,
  defaultMarketPrice: 95,
  feedingRateMatrix: {
    weight_ranges: [{ min: 0, max: 10 }],
    temperatures: [20, 24, 26],
    rates: [[20, 25, 30]],
  },
  mealFrequencyRules: [{ maxWeight: 10, mealsPerDay: 6 }],
  proteinRequirements: [{ minWeight: 0, maxWeight: 10, proteinPercentage: 40 }],
  expectedGradeDistribution: [{ gradePricingId: 'pricing-1', percentage: 100 }],
  allowedFoodTypeIds: ['food-1'],
};

describe('fishTypesApi', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes fish type list from wrapped responses', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: [
          {
            ...basePayload,
            id: 'fish-1',
            allowedFoodTypes: ['food-1'],
            criticalParameters: ['DO', 'NH3'],
            expectedGradeDistribution: [{ gradePricingId: 'pricing-1', percentage: 100 }],
            isActive: true,
          },
        ],
      }),
    );

    const result = await getFishTypes(false);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'fish-1',
      name: 'Nile Tilapia',
      allowedFoodTypeIds: ['food-1'],
      criticalParameters: ['DO', 'NH3'],
      targetWeightForHarvest: 2.8,
      defaultMarketPrice: 95,
      expectedGradeDistribution: [{ gradePricingId: 'pricing-1', percentage: 100 }],
    });
  });

  it('sends create and update payloads with backend field names', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(
          {
            success: true,
            data: {
              ...basePayload,
              id: 'fish-1',
              allowedFoodTypes: ['food-1'],
              criticalParameters: [],
              isActive: true,
            },
          },
          201,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: {
            ...basePayload,
            id: 'fish-1',
            allowedFoodTypes: ['food-1'],
            criticalParameters: ['DO'],
            isActive: true,
          },
        }),
      );

    await createFishType(basePayload);
    await updateFishType('fish-1', { ...basePayload, criticalParameters: ['DO'] });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/farm/fish-types'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(basePayload),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/farm/fish-types/fish-1'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ ...basePayload, criticalParameters: ['DO'] }),
      }),
    );
  });

  it('normalizes calculator endpoint responses', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: {
            fishTypeId: 'fish-1',
            weight: 45,
            temperature: 27,
            feedingRatePercentage: 12,
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: {
            fishTypeId: 'fish-1',
            weight: 45,
            mealsPerDay: 4,
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: {
            fishTypeId: 'fish-1',
            weight: 45,
            proteinPercentage: 32,
          },
        }),
      );

    const feedingRate = await getFeedingRate('fish-1', 45, 27);
    const mealFrequency = await getMealFrequency('fish-1', 45);
    const proteinRequirement = await getProteinRequirement('fish-1', 45);

    expect(feedingRate.feedingRatePercentage).toBe(12);
    expect(mealFrequency.mealsPerDay).toBe(4);
    expect(proteinRequirement.proteinPercentage).toBe(32);
  });
});
