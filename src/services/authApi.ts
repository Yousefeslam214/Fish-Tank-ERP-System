import {
  AuthApiErrorPayload,
  AuthLoginResult,
  BackendAuthUser,
  FarmInfo,
  LoginRequest,
  PreLoginRequest,
  PreLoginResponse,
} from './authTypes';

const DEFAULT_API_BASE_URL = 'https://fouadkhaild-asd.hf.space/api/v1';

type JsonRecord = Record<string, unknown>;

export interface AuthApiOptions {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  signal?: AbortSignal;
}

export class AuthApiError extends Error {
  readonly status: number;
  readonly payload?: AuthApiErrorPayload;

  constructor(message: string, status: number, payload?: AuthApiErrorPayload) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
    this.payload = payload;
  }
}

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const parseErrorMessage = (payload: unknown): string | undefined => {
  if (!isRecord(payload)) {
    return undefined;
  }

  const message = payload.message;
  if (typeof message === 'string' && message.trim()) {
    return message.trim();
  }
  if (Array.isArray(message)) {
    const messages = message.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    if (messages.length > 0) {
      return messages.join(', ');
    }
  }
  return undefined;
};

const parseErrorPayload = (payload: unknown): AuthApiErrorPayload | undefined => {
  if (!isRecord(payload)) {
    return undefined;
  }

  const message = payload.message;
  return {
    statusCode: typeof payload.statusCode === 'number' ? payload.statusCode : undefined,
    message:
      typeof message === 'string' || Array.isArray(message)
        ? (message as string | string[])
        : undefined,
    error: asTrimmedString(payload.error),
    timestamp: asTrimmedString(payload.timestamp),
    path: asTrimmedString(payload.path),
  };
};

const parseJson = (raw: string): unknown => {
  if (!raw.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

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

export const resolveApiBaseUrl = (baseUrl?: string): string => {
  const resolved = baseUrl?.trim() || getEnvValue('VITE_FISH_API_BASE_URL') || getEnvValue('FISH_API_BASE_URL') || DEFAULT_API_BASE_URL;
  return resolved.replace(/\/+$/, '');
};

const requestJson = async (
  path: string,
  body: unknown,
  options: AuthApiOptions,
): Promise<unknown> => {
  const fetchFn = options.fetchFn ?? fetch;
  const endpoint = `${resolveApiBaseUrl(options.baseUrl)}${path}`;

  const response = await fetchFn(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: options.signal,
  });

  const raw = await response.text();
  const parsed = parseJson(raw);

  if (!response.ok) {
    const payload = parseErrorPayload(parsed);
    const message = parseErrorMessage(parsed) || `Request failed with status ${response.status}`;
    throw new AuthApiError(message, response.status, payload);
  }

  if (parsed === undefined) {
    throw new AuthApiError('Server returned an empty response.', response.status);
  }

  return parsed;
};

const normalizeUser = (value: unknown): BackendAuthUser | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = asTrimmedString(value.id);
  const email = asTrimmedString(value.email);
  if (!id || !email) {
    return undefined;
  }

  const modules = Array.isArray(value.modules)
    ? value.modules.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : undefined;

  return {
    id,
    email,
    role: asTrimmedString(value.role),
    farmId: asTrimmedString(value.farmId),
    modules,
    name: asTrimmedString(value.name),
    phone: asTrimmedString(value.phone),
  };
};

const normalizeLoginResult = (value: unknown): AuthLoginResult => {
  if (!isRecord(value)) {
    throw new Error('Malformed login response from server.');
  }

  const requiresOTP = typeof value.requiresOTP === 'boolean' ? value.requiresOTP : false;
  const loginResult: AuthLoginResult = {
    token: asTrimmedString(value.token),
    refreshToken: asTrimmedString(value.refreshToken),
    expiresIn: asNumber(value.expiresIn),
    refreshExpiresIn: asNumber(value.refreshExpiresIn),
    user: normalizeUser(value.user),
    requiresOTP,
    sessionToken: asTrimmedString(value.sessionToken),
    message: asTrimmedString(value.message),
    accountLocked: typeof value.accountLocked === 'boolean' ? value.accountLocked : false,
  };

  if (!loginResult.requiresOTP) {
    if (!loginResult.token || !loginResult.user) {
      throw new Error('Login response is missing token or user data.');
    }
  }

  return loginResult;
};

const normalizeFarms = (value: unknown): FarmInfo[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((farm): FarmInfo | null => {
      if (!isRecord(farm)) {
        return null;
      }
      const id = asTrimmedString(farm.id);
      const name = asTrimmedString(farm.name);
      if (!id || !name) {
        return null;
      }
      return { id, name };
    })
    .filter((farm): farm is FarmInfo => farm !== null);
};

const validateCredentials = (request: PreLoginRequest): PreLoginRequest => {
  const email = request.email.trim();
  const password = request.password;

  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  return { email, password };
};

export const preLogin = async (
  request: PreLoginRequest,
  options: AuthApiOptions = {},
): Promise<PreLoginResponse> => {
  const safeRequest = validateCredentials(request);
  const response = await requestJson('/auth/pre-login', safeRequest, options);

  if (!isRecord(response) || typeof response.requiresFarmSelection !== 'boolean') {
    throw new Error('Malformed pre-login response from server.');
  }

  const requiresFarmSelection = response.requiresFarmSelection;
  const farms = normalizeFarms(response.farms);
  const loginResult = response.loginResult === undefined ? undefined : normalizeLoginResult(response.loginResult);

  if (requiresFarmSelection && farms.length === 0) {
    throw new Error('No farms were returned for this account. Please contact support.');
  }

  if (!requiresFarmSelection && !loginResult) {
    throw new Error('Pre-login response did not include a login result.');
  }

  return {
    requiresFarmSelection,
    farms,
    loginResult,
  };
};

export const login = async (
  request: LoginRequest,
  options: AuthApiOptions = {},
): Promise<AuthLoginResult> => {
  const { email, password } = validateCredentials(request);
  const farmId = request.farmId.trim();

  if (!farmId) {
    throw new Error('Farm selection is required.');
  }

  const response = await requestJson('/auth/login', { email, password, farmId }, options);
  return normalizeLoginResult(response);
};
