import { beforeAll, describe, expect, it } from 'vitest';
import { login, preLogin } from '../services/authApi';
import {
  getHarvestEvents,
  getHarvestEventsByTank,
  getHarvestGradings,
  getHarvestPrediction,
  getHarvestTanks,
  getPricingByFishType,
  getTankBatches,
  getActiveHarvestTanks,
} from '../services/harvestApi';
import {
  getFeedingRate,
  getFishTypeById,
  getFishTypes,
  getMealFrequency,
  getProteinRequirement,
} from '../services/fishTypesApi';
import { getMetadata } from '../services/metaApi';

const API_BASE_URL = process.env.FISH_API_BASE_URL || 'https://yousseftallal-fishfarm-backend-api.hf.space/api/v1';
const TEST_EMAIL = process.env.FISH_TEST_EMAIL || 'e2e-lifecycle@test.com';
const TEST_PASSWORD = process.env.FISH_TEST_PASSWORD || 'Test1234!';
const TEST_FARM_ID = process.env.FISH_TEST_FARM_ID;

describe('Live read-only harvest + fish-types contracts', () => {
  beforeAll(async () => {
    process.env.FISH_API_BASE_URL = API_BASE_URL;

    const pre = await preLogin(
      {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
      {
        baseUrl: API_BASE_URL,
      },
    );

    let token = pre.loginResult?.token;
    if (!token) {
      const farmId = TEST_FARM_ID || pre.farms?.[0]?.id;
      expect(farmId, 'A farmId is required when pre-login does not return direct token').toBeTruthy();

      const logged = await login(
        {
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          farmId: farmId as string,
        },
        {
          baseUrl: API_BASE_URL,
        },
      );

      expect(logged.requiresOTP).toBe(false);
      token = logged.token;
    }

    expect(token).toBeTruthy();
    process.env.FISH_API_TOKEN = token as string;
  });

  it('metadata contract includes enums and modules', async () => {
    const metadata = await getMetadata(true);
    expect(metadata.enums).toBeTruthy();
    expect(metadata.modules).toBeInstanceOf(Array);
  });

  it('fish type GET endpoints return valid contract data', async () => {
    const fishTypes = await getFishTypes(false);
    expect(Array.isArray(fishTypes)).toBe(true);
    expect(fishTypes.length).toBeGreaterThan(0);

    const fishTypeId = fishTypes[0].id;
    const detail = await getFishTypeById(fishTypeId);
    expect(detail.id).toBe(fishTypeId);

    const feedingRate = await getFeedingRate(fishTypeId, 45, 27);
    const mealFrequency = await getMealFrequency(fishTypeId, 45);
    const proteinRequirement = await getProteinRequirement(fishTypeId, 45);

    expect(typeof feedingRate.feedingRatePercentage).toBe('number');
    expect(typeof mealFrequency.mealsPerDay).toBe('number');
    expect(typeof proteinRequirement.proteinPercentage).toBe('number');
  });

  it('harvest GET endpoints return contract-valid responses', async () => {
    const events = await getHarvestEvents();
    const activeTanks = await getActiveHarvestTanks();
    expect(Array.isArray(events)).toBe(true);
    expect(Array.isArray(activeTanks)).toBe(true);

    const tanks = await getHarvestTanks();
    expect(Array.isArray(tanks)).toBe(true);
    expect(tanks.length).toBeGreaterThan(0);

    const tankId = events[0]?.tankId || activeTanks[0]?.tankId || tanks[0]?.id;
    expect(tankId).toBeTruthy();

    const eventsByTank = await getHarvestEventsByTank(tankId as string);
    expect(Array.isArray(eventsByTank)).toBe(true);

    if (eventsByTank.length > 0) {
      const gradings = await getHarvestGradings(eventsByTank[0].id);
      expect(Array.isArray(gradings)).toBe(true);
    }

    const tankBatches = await getTankBatches(tankId as string);
    expect(Array.isArray(tankBatches.batches)).toBe(true);

    if (tankBatches.batches.length > 0) {
      const prediction = await getHarvestPrediction(tankBatches.batches[0].id);
      expect(typeof prediction.recommendation).toBe('string');
    }

    const fishTypes = await getFishTypes(false);
    expect(fishTypes.length).toBeGreaterThan(0);
    const pricing = await getPricingByFishType(fishTypes[0].id);
    expect(Array.isArray(pricing)).toBe(true);
  });
});
