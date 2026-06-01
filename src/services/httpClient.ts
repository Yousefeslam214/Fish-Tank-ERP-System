import { getAccessToken } from './authSession';

const DEFAULT_API_BASE_URL = 'https://fouadkhaild-asd.hf.space/api/v1';

export class ApiClientError extends Error {
  readonly status: number;
  readonly payload?: unknown;
  readonly path: string;

  constructor(message: string, status: number, path: string, payload?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.path = path;
    this.payload = payload;
  }
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  authenticated?: boolean;
  headers?: HeadersInit;
  baseUrl?: string;
}

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getEnvValue = (key: string): string | undefined => {
  const importMetaEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const fromVite = importMetaEnv?.[key];
  if (typeof fromVite === 'string' && fromVite.trim()) {
    return fromVite.trim();
  }

  if (typeof process !== 'undefined' && typeof process.env?.[key] === 'string' && process.env[key]?.trim()) {
    return process.env[key]?.trim();
  }

  return undefined;
};

export const resolveApiBaseUrl = (baseUrl?: string): string => {
  const resolved =
    baseUrl?.trim() ||
    getEnvValue('VITE_FISH_API_BASE_URL') ||
    getEnvValue('FISH_API_BASE_URL') ||
    DEFAULT_API_BASE_URL;
  return resolved.replace(/\/+$/, '');
};

const parseJsonSafe = (value: string): unknown => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
};

const parseErrorMessage = (status: number, payload: unknown): string => {
  if (isRecord(payload)) {
    const message = payload.message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
    if (Array.isArray(message)) {
      const list = message.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
      if (list.length > 0) {
        return list.join(', ');
      }
    }
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error.trim();
    }
  }

  return `Request failed with status ${status}`;
};

const buildHeaders = (authenticated: boolean, extraHeaders?: HeadersInit): HeadersInit => {
  const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  const envToken = !isBrowser
    ? getEnvValue('FISH_API_TOKEN') || getEnvValue('VITE_FISH_API_TOKEN')
    : null;
  const token = authenticated ? getAccessToken() || envToken || null : null;
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extraHeaders ?? {}),
  };
};

export const requestJson = async <T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  const endpoint = `${resolveApiBaseUrl(options.baseUrl)}${path}`;
  const response = await fetch(endpoint, {
    method: options.method ?? 'GET',
    headers: {
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...buildHeaders(options.authenticated ?? true, options.headers) as any,
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    signal: options.signal,
  });

  const raw = await response.text();
  const parsed = parseJsonSafe(raw);

  if (!response.ok) {
    throw new ApiClientError(parseErrorMessage(response.status, parsed), response.status, path, parsed);
  }

  return parsed as T;
};

export const unwrapApiData = <T>(payload: unknown): T => {
  if (isRecord(payload) && 'success' in payload) {
    const success = Boolean(payload.success);
    if (!success) {
      const message = parseErrorMessage(400, payload);
      throw new ApiClientError(message, 400, 'wrapped-response', payload);
    }
    if ('data' in payload) {
      return payload.data as T;
    }
  }

  return payload as T;
};

export const asRecord = (value: unknown): JsonRecord | undefined => (isRecord(value) ? value : undefined);

export const asArray = <T = unknown>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

export const asString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
};

export const asNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,%\sA-Za-z]/g, '').trim();
    if (!cleaned) {
      return undefined;
    }
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

export const asBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') {
      return true;
    }
    if (value.toLowerCase() === 'false') {
      return false;
    }
  }
  return undefined;
};
