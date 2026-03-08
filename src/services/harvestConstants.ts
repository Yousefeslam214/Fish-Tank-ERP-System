export type HarvestTypeValue = 'QUARTER' | 'HALF' | 'FULL';

export interface HarvestTypeOption {
  value: HarvestTypeValue;
  label: string;
}

export const HARVEST_TYPE_LABELS: Record<HarvestTypeValue, string> = {
  QUARTER: 'Selective',
  HALF: 'Partial',
  FULL: 'Full',
};

export const DEFAULT_HARVEST_TYPE_OPTIONS: HarvestTypeOption[] = [
  { value: 'QUARTER', label: HARVEST_TYPE_LABELS.QUARTER },
  { value: 'HALF', label: HARVEST_TYPE_LABELS.HALF },
  { value: 'FULL', label: HARVEST_TYPE_LABELS.FULL },
];

export const normalizeHarvestTypeValue = (value: unknown): HarvestTypeValue => {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';

  if (normalized === 'QUARTER' || normalized === 'SELECTIVE') {
    return 'QUARTER';
  }
  if (normalized === 'HALF' || normalized === 'PARTIAL') {
    return 'HALF';
  }
  return 'FULL';
};

export const getHarvestTypeLabel = (type: HarvestTypeValue): string => HARVEST_TYPE_LABELS[type] || type;
