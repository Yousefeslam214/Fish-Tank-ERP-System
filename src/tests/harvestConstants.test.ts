import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HARVEST_TYPE_OPTIONS,
  getHarvestTypeLabel,
  normalizeHarvestTypeValue,
} from '../services/harvestConstants';

describe('harvestConstants', () => {
  it('maps backend harvest type values to friendly labels', () => {
    expect(getHarvestTypeLabel('QUARTER')).toBe('Selective');
    expect(getHarvestTypeLabel('HALF')).toBe('Partial');
    expect(getHarvestTypeLabel('FULL')).toBe('Full');
    expect(DEFAULT_HARVEST_TYPE_OPTIONS).toHaveLength(3);
  });

  it('normalizes legacy values to backend enum values', () => {
    expect(normalizeHarvestTypeValue('SELECTIVE')).toBe('QUARTER');
    expect(normalizeHarvestTypeValue('PARTIAL')).toBe('HALF');
    expect(normalizeHarvestTypeValue('FULL')).toBe('FULL');
    expect(normalizeHarvestTypeValue('unknown')).toBe('FULL');
  });
});
