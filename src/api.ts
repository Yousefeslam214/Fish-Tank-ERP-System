import { getAccessToken } from './services/authSession';

export const DEFAULT_API_BASE = 'https://fouadkhaild-asd.hf.space/api/v1';

const getEnvValue = (key: string): string | undefined => {
  const importMetaEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const fromVite = importMetaEnv?.[key];
  if (fromVite?.trim()) {
    return fromVite.trim();
  }

  if (typeof process !== 'undefined' && process.env?.[key]?.trim()) {
    return process.env[key]?.trim();
  }

  return undefined;
};

export const API_BASE = (getEnvValue('VITE_FISH_API_BASE_URL') || getEnvValue('FISH_API_BASE_URL') || DEFAULT_API_BASE).replace(/\/+$/, '');

const buildHeaders = (): HeadersInit => {
  const token = getAccessToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const request = async <T>(path: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...buildHeaders(),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${path} failed [${response.status}]: ${text || response.statusText}`);
  }

  if (!text.trim()) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
};

export const apiGet = <T>(path: string): Promise<T> => request<T>(path, 'GET');
export const apiPost = <T>(path: string, body: unknown): Promise<T> => request<T>(path, 'POST', body);
export const apiPut = <T>(path: string, body: unknown): Promise<T> => request<T>(path, 'PUT', body);
export const apiPatch = <T>(path: string, body: unknown): Promise<T> => request<T>(path, 'PATCH', body);
export const apiDelete = <T>(path: string): Promise<T> => request<T>(path, 'DELETE');
