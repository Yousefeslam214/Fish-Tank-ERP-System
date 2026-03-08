import { describe, expect, it, vi } from 'vitest';
import { AuthApiError, login, preLogin, resolveApiBaseUrl } from '../services/authApi';

const BASE_URL = 'https://example.test/api/v1';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('authApi', () => {
  it('normalizes pre-login response values into typed shape', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        requiresFarmSelection: false,
        loginResult: {
          token: 'token-1',
          refreshToken: 'refresh-1',
          expiresIn: '3600',
          refreshExpiresIn: '7200',
          user: {
            id: 'user-1',
            email: 'user@example.com',
            role: 'MANAGER',
          },
          requiresOTP: false,
        },
      }),
    );

    const result = await preLogin(
      {
        email: 'user@example.com',
        password: 'StrongPassword123!',
      },
      {
        baseUrl: BASE_URL,
        fetchFn: fetchMock as unknown as typeof fetch,
      },
    );

    expect(result.requiresFarmSelection).toBe(false);
    expect(result.loginResult?.expiresIn).toBe(3600);
    expect(result.loginResult?.refreshExpiresIn).toBe(7200);
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/auth/pre-login`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws a clear error when farm selection is required but farms are missing', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        requiresFarmSelection: true,
        farms: [],
      }),
    );

    await expect(
      preLogin(
        {
          email: 'user@example.com',
          password: 'StrongPassword123!',
        },
        {
          baseUrl: BASE_URL,
          fetchFn: fetchMock as unknown as typeof fetch,
        },
      ),
    ).rejects.toThrow(/No farms were returned/i);
  });

  it('maps backend error payloads to AuthApiError with status and message', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(
        {
          statusCode: 400,
          message: ['farmId must be a string', 'farmId should not be empty'],
        },
        400,
      ),
    );

    let error: unknown;
    try {
      await login(
        {
          email: 'user@example.com',
          password: 'StrongPassword123!',
          farmId: 'farm-1',
        },
        {
          baseUrl: BASE_URL,
          fetchFn: fetchMock as unknown as typeof fetch,
        },
      );
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AuthApiError);
    expect((error as AuthApiError).status).toBe(400);
    expect((error as Error).message).toContain('farmId must be a string');
  });

  it('rejects malformed login payloads when OTP is not required', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        requiresOTP: false,
        message: 'Login successful',
      }),
    );

    await expect(
      login(
        {
          email: 'user@example.com',
          password: 'StrongPassword123!',
          farmId: 'farm-1',
        },
        {
          baseUrl: BASE_URL,
          fetchFn: fetchMock as unknown as typeof fetch,
        },
      ),
    ).rejects.toThrow(/missing token or user data/i);
  });

  it('resolves API base URL from explicit input before env fallback', () => {
    expect(resolveApiBaseUrl('https://custom.example/api/v1/')).toBe('https://custom.example/api/v1');
  });
});
