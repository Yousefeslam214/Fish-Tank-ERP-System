import {
  asArray,
  asRecord,
  asString,
  requestJson,
  unwrapApiData,
} from './httpClient';
import {
  DEFAULT_HARVEST_TYPE_OPTIONS,
  HarvestTypeOption,
  HarvestTypeValue,
} from './harvestConstants';

interface LocalizedLabel {
  en?: string;
  ar?: string;
}

export interface MetadataEnumEntry {
  key: string;
  value: string;
  label?: LocalizedLabel;
}

export interface MetadataModule {
  id: string;
  label: LocalizedLabel;
}

export interface MetadataResponse {
  enums: Record<string, MetadataEnumEntry[]>;
  modules: MetadataModule[];
}

let metadataCache: MetadataResponse | null = null;
let metadataPromise: Promise<MetadataResponse> | null = null;

const normalizeLocalizedLabel = (value: unknown): LocalizedLabel => {
  const record = asRecord(value);
  if (!record) {
    const fallback = asString(value);
    return fallback ? { en: fallback } : {};
  }

  return {
    en: asString(record.en),
    ar: asString(record.ar),
  };
};

const normalizeEnumEntries = (value: unknown): MetadataEnumEntry[] =>
  asArray(value)
    .map((entry) => {
      const record = asRecord(entry);
      if (!record) {
        return null;
      }

      const key = asString(record.key);
      const rawValue = asString(record.value) || key;
      if (!rawValue) {
        return null;
      }

      return {
        key: key || rawValue,
        value: rawValue,
        label: normalizeLocalizedLabel(record.label),
      };
    })
    .filter((entry): entry is MetadataEnumEntry => entry !== null);

const normalizeMetadata = (payload: unknown): MetadataResponse => {
  const data = unwrapApiData<unknown>(payload);
  const record = asRecord(data);
  if (!record) {
    return { enums: {}, modules: [] };
  }

  const enumsRecord = asRecord(record.enums);
  const enums: Record<string, MetadataEnumEntry[]> = {};

  if (enumsRecord) {
    Object.entries(enumsRecord).forEach(([key, value]) => {
      enums[key] = normalizeEnumEntries(value);
    });
  }

  const modules = asArray(record.modules)
    .map((moduleEntry) => {
      const moduleRecord = asRecord(moduleEntry);
      if (!moduleRecord) {
        return null;
      }

      const id = asString(moduleRecord.id);
      if (!id) {
        return null;
      }

      return {
        id,
        label: normalizeLocalizedLabel(moduleRecord.label),
      };
    })
    .filter((moduleEntry): moduleEntry is MetadataModule => moduleEntry !== null);

  return { enums, modules };
};

export const getMetadata = async (forceRefresh = false): Promise<MetadataResponse> => {
  if (!forceRefresh && metadataCache) {
    return metadataCache;
  }

  if (!forceRefresh && metadataPromise) {
    return metadataPromise;
  }

  metadataPromise = requestJson('/meta')
    .then(normalizeMetadata)
    .finally(() => {
      metadataPromise = null;
    });

  metadataCache = await metadataPromise;
  return metadataCache;
};

const HARVEST_ENUM_KEYS = ['harvestTypes', 'harvestType', 'HARVEST_TYPES', 'HARVEST_TYPE'];

const isHarvestType = (value: string): value is HarvestTypeValue =>
  value === 'QUARTER' || value === 'HALF' || value === 'FULL';

export const resolveHarvestTypeOptions = (metadata?: MetadataResponse | null): HarvestTypeOption[] => {
  if (!metadata) {
    return DEFAULT_HARVEST_TYPE_OPTIONS;
  }

  let entries: MetadataEnumEntry[] = [];
  for (const key of HARVEST_ENUM_KEYS) {
    if (metadata.enums[key]?.length) {
      entries = metadata.enums[key];
      break;
    }
  }

  if (!entries.length) {
    return DEFAULT_HARVEST_TYPE_OPTIONS;
  }

  const options = entries
    .map((entry): HarvestTypeOption | null => {
      const value = entry.value.trim().toUpperCase();
      if (!isHarvestType(value)) {
        return null;
      }

      return {
        value,
        label: entry.label?.en || entry.label?.ar || value,
      };
    })
    .filter((entry): entry is HarvestTypeOption => entry !== null);

  if (!options.length) {
    return DEFAULT_HARVEST_TYPE_OPTIONS;
  }

  const values = new Set(options.map((option) => option.value));
  DEFAULT_HARVEST_TYPE_OPTIONS.forEach((defaultOption) => {
    if (!values.has(defaultOption.value)) {
      options.push(defaultOption);
    }
  });

  return options;
};

export const resetMetadataCache = (): void => {
  metadataCache = null;
  metadataPromise = null;
};
