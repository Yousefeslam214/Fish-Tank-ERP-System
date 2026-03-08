import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMetadata, resetMetadataCache, resolveHarvestTypeOptions } from '../services/metaApi';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('metaApi', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    resetMetadataCache();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetMetadataCache();
  });

  it('normalizes metadata payload and caches the response', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        enums: {
          tankStatuses: [
            {
              key: 'ACTIVE',
              value: 'ACTIVE',
              label: { en: 'Active' },
            },
          ],
        },
        modules: [{ id: 'harvest', label: { en: 'Harvest' } }],
      }),
    );

    const first = await getMetadata();
    const second = await getMetadata();

    expect(first.enums.tankStatuses?.[0]?.value).toBe('ACTIVE');
    expect(first.modules[0]?.id).toBe('harvest');
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to default harvest type options when enum is missing', () => {
    const options = resolveHarvestTypeOptions({
      enums: {},
      modules: [],
    });

    expect(options.map((option) => option.value)).toEqual(['QUARTER', 'HALF', 'FULL']);
  });

  it('uses metadata harvest enum labels when available', () => {
    const options = resolveHarvestTypeOptions({
      enums: {
        harvestTypes: [
          { key: 'FULL', value: 'FULL', label: { en: 'Full Harvest' } },
          { key: 'HALF', value: 'HALF', label: { en: 'Partial Harvest' } },
          { key: 'QUARTER', value: 'QUARTER', label: { en: 'Selective Harvest' } },
        ],
      },
      modules: [],
    });

    expect(options.find((option) => option.value === 'FULL')?.label).toBe('Full Harvest');
    expect(options.find((option) => option.value === 'HALF')?.label).toBe('Partial Harvest');
    expect(options.find((option) => option.value === 'QUARTER')?.label).toBe('Selective Harvest');
  });
});
