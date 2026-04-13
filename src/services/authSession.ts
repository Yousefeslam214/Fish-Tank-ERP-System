import { User, UserRole } from '../types';
import { AuthLoginResult, BackendAuthUser } from './authTypes';

const AUTH_SESSION_KEY = 'fishfarm_auth_session';
const TOKEN_KEY = 'fishfarm_token';
const REFRESH_TOKEN_KEY = 'fishfarm_refresh_token';
const USER_KEY = 'fishfarm_user';

interface StoredAuthSession {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
  user: BackendAuthUser;
  savedAt: number;
}

const isBrowser = (): boolean => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeNumber = (value: unknown): number | undefined => {
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

const deriveNameFromEmail = (email: string): string => {
  const localPart = email.split('@')[0] ?? 'User';
  const words = localPart
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1));

  return words.length > 0 ? words.join(' ') : 'Farm Manager';
};

const normalizeRole = (role?: string): UserRole => {
  const value = role?.toLowerCase();
  if (
    value === 'admin' ||
    value === 'manager' ||
    value === 'worker' ||
    value === 'technician' ||
    value === 'technican' ||
    value === 'accountant' ||
    value === 'sales' ||
    value === 'delivery'
  ) {
    return value;
  }
  return 'manager';
};

const normalizeModules = (modules: unknown): string[] | undefined => {
  if (!Array.isArray(modules)) {
    return undefined;
  }

  const normalized = modules
    .filter((moduleName): moduleName is string => typeof moduleName === 'string' && moduleName.trim().length > 0)
    .map((moduleName) => moduleName.trim().toLowerCase());

  return normalized.length > 0 ? normalized : undefined;
};

export const mapBackendUserToAppUser = (backendUser: BackendAuthUser): User => ({
  id: backendUser.id,
  name: backendUser.name?.trim() || deriveNameFromEmail(backendUser.email),
  email: backendUser.email,
  phone: backendUser.phone?.trim() || 'N/A',
  role: normalizeRole(backendUser.role),
  farmId: backendUser.farmId,
  modules: normalizeModules(backendUser.modules),
});

const parseStoredSession = (raw: string | null): StoredAuthSession | null => {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return null;
    }

    const token = typeof parsed.token === 'string' ? parsed.token : undefined;
    const savedAt = normalizeNumber(parsed.savedAt);
    const user = isRecord(parsed.user) ? (parsed.user as BackendAuthUser) : undefined;

    if (!token || savedAt === undefined || !user?.id || !user.email) {
      return null;
    }

    return {
      token,
      refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken : undefined,
      expiresIn: normalizeNumber(parsed.expiresIn),
      refreshExpiresIn: normalizeNumber(parsed.refreshExpiresIn),
      user,
      savedAt,
    };
  } catch {
    return null;
  }
};

export const persistAuthSession = (loginResult: AuthLoginResult, appUser: User): void => {
  if (!isBrowser() || !loginResult.token || !loginResult.user) {
    return;
  }

  const session: StoredAuthSession = {
    token: loginResult.token,
    refreshToken: loginResult.refreshToken,
    expiresIn: normalizeNumber(loginResult.expiresIn),
    refreshExpiresIn: normalizeNumber(loginResult.refreshExpiresIn),
    user: loginResult.user,
    savedAt: Date.now(),
  };

  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(TOKEN_KEY, session.token);

  if (session.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  localStorage.setItem(USER_KEY, JSON.stringify(appUser));
};

export const getStoredAppUser = (): User | null => {
  if (!isBrowser()) {
    return null;
  }

  const getUserFromSession = (): User | null => {
    const fallbackSession = parseStoredSession(localStorage.getItem(AUTH_SESSION_KEY));
    if (!fallbackSession) {
      return null;
    }

    const mappedUser = mapBackendUserToAppUser(fallbackSession.user);
    localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
    return mappedUser;
  };

  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return getUserFromSession();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<User>;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const id = typeof parsed.id === 'string' ? parsed.id : '';
    const email = typeof parsed.email === 'string' ? parsed.email : '';
    if (!id || !email) {
      return null;
    }

    return {
      id,
      name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name : deriveNameFromEmail(email),
      email,
      phone: typeof parsed.phone === 'string' && parsed.phone.trim() ? parsed.phone : 'N/A',
      role: normalizeRole(typeof parsed.role === 'string' ? parsed.role : undefined),
      farmId: typeof parsed.farmId === 'string' ? parsed.farmId : undefined,
      modules: normalizeModules(parsed.modules),
    };
  } catch {
    return getUserFromSession();
  }
};

export const getAccessToken = (): string | null => {
  if (!isBrowser()) {
    return null;
  }

  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    return token;
  }

  return parseStoredSession(localStorage.getItem(AUTH_SESSION_KEY))?.token ?? null;
};

export const clearAuthSession = (): void => {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
