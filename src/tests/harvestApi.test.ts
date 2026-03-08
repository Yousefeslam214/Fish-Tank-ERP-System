import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addHarvestGradingRecord,
  completeHarvestEvent,
  getHarvestEvents,
  getHarvestTanks,
  getTankBatches,
  startHarvestEvent,
} from '../services/harvestApi';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('harvestApi', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes harvest event list for array and wrapped responses', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 'event-1',
            tankId: 'tank-1',
            harvestType: 'QUARTER',
            estimatedWeight: '120.5',
            actualTotalWeight: 0,
            totalRevenue: '0',
            status: 'DRAFT',
            harvestDate: '2026-03-08T10:00:00.000Z',
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: [
            {
              id: 'tank-1',
              name: 'Tank A-01',
              status: 'ACTIVE',
              fishType: 'Nile Tilapia',
              biomass: { actual: '6500', capacity: 9000 },
            },
          ],
        }),
      );

    const events = await getHarvestEvents();
    const tanks = await getHarvestTanks();

    expect(events[0]).toMatchObject({
      id: 'event-1',
      tankId: 'tank-1',
      harvestType: 'QUARTER',
      harvestTypeLabel: 'Selective',
      estimatedWeight: 120.5,
    });
    expect(tanks[0]).toMatchObject({
      id: 'tank-1',
      name: 'Tank A-01',
      biomassKg: 6500,
    });
  });

  it('normalizes tank batches response shape', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: {
          summary: { totalDailyRequired: '89 kg' },
          batches: [
            {
              id: 'batch-1',
              fishType: 'Nile Tilapia',
              status: 'active',
              counts: { current: 12500 },
              weights: { currentAvg: '522g' },
              biomass: '6525kg',
            },
          ],
        },
      }),
    );

    const response = await getTankBatches('tank-1');

    expect(response.batches[0]).toMatchObject({
      id: 'batch-1',
      fishType: 'Nile Tilapia',
      currentCount: 12500,
      currentAvgWeightG: 522,
      biomassKg: 6525,
    });
    expect(response.summary).toMatchObject({ totalDailyRequired: '89 kg' });
  });

  it('sends correct payloads for start, grading, and complete write paths', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'event-1',
          tankId: 'tank-1',
          harvestType: 'HALF',
          estimatedWeight: 100,
          actualTotalWeight: 0,
          totalRevenue: 0,
          status: 'DRAFT',
          harvestDate: '2026-03-08T10:00:00.000Z',
        }, 201),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'grading-1',
          pricingId: 'pricing-1',
          sourceBatchId: 'batch-1',
          weightKg: 50,
          condition: 'GOOD',
          pricePerKg: 42,
          totalValue: 2100,
        }, 201),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'event-1',
          tankId: 'tank-1',
          harvestType: 'HALF',
          estimatedWeight: 100,
          actualTotalWeight: 50,
          totalRevenue: 2100,
          status: 'COMPLETED',
          harvestDate: '2026-03-08T10:00:00.000Z',
        }),
      );

    await startHarvestEvent({
      tankId: 'tank-1',
      harvestType: 'HALF',
    });

    await addHarvestGradingRecord('event-1', {
      pricingId: 'pricing-1',
      sourceBatchId: 'batch-1',
      weightKg: 50,
      condition: 'GOOD',
    });

    await completeHarvestEvent('event-1', {
      laborCost: 200,
      transportCost: 150,
      packagingCost: 50,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/harvest/events/start'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          tankId: 'tank-1',
          harvestType: 'HALF',
        }),
      }),
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/harvest/events/event-1/grading'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          pricingId: 'pricing-1',
          sourceBatchId: 'batch-1',
          weightKg: 50,
          condition: 'GOOD',
        }),
      }),
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('/harvest/events/event-1/complete'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          laborCost: 200,
          transportCost: 150,
          packagingCost: 50,
        }),
      }),
    );
  });
});
