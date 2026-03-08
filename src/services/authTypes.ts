export interface PreLoginRequest {
  email: string;
  password: string;
}

export interface FarmInfo {
  id: string;
  name: string;
}

export interface BackendAuthUser {
  id: string;
  email: string;
  role?: string;
  farmId?: string;
  modules?: string[];
  name?: string;
  phone?: string;
}

export interface AuthLoginResult {
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
  user?: BackendAuthUser;
  requiresOTP: boolean;
  sessionToken?: string;
  message?: string;
  accountLocked?: boolean;
}

export interface PreLoginResponse {
  requiresFarmSelection: boolean;
  farms?: FarmInfo[];
  loginResult?: AuthLoginResult;
}

export interface LoginRequest extends PreLoginRequest {
  farmId: string;
}

export interface AuthApiErrorPayload {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
}
