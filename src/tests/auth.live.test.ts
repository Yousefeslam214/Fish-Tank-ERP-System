import { describe, expect, it } from 'vitest';
import { login, preLogin } from '../services/authApi';

const API_BASE_URL = process.env.FISH_API_BASE_URL || 'https://yousseftallal-fishfarm-backend-api.hf.space/api/v1';
const TEST_EMAIL = process.env.FISH_TEST_EMAIL || 'e2e-lifecycle@test.com';
const TEST_PASSWORD = process.env.FISH_TEST_PASSWORD || 'Test1234!';
const TEST_FARM_ID = process.env.FISH_TEST_FARM_ID;

describe('Live auth flow (Swagger backend)', () => {
  it('pre-login returns a valid contract shape', async () => {
    const response = await preLogin(
      {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
      {
        baseUrl: API_BASE_URL,
      },
    );

    expect(typeof response.requiresFarmSelection).toBe('boolean');

    if (response.requiresFarmSelection) {
      expect(Array.isArray(response.farms)).toBe(true);
      expect((response.farms?.length || 0) > 0).toBe(true);
      expect(response.farms?.[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
      });
    } else {
      expect(response.loginResult).toBeDefined();
      expect(typeof response.loginResult?.requiresOTP).toBe('boolean');
    }
  });

  it('login returns token+user payload or OTP-required payload', async () => {
    const preLoginResponse = await preLogin(
      {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
      {
        baseUrl: API_BASE_URL,
      },
    );

    const farmId =
      TEST_FARM_ID ||
      (preLoginResponse.requiresFarmSelection
        ? preLoginResponse.farms?.[0]?.id
        : preLoginResponse.loginResult?.user?.farmId);

    expect(farmId, 'No farm id available for login test').toBeTruthy();

    const loginResponse = await login(
      {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        farmId: farmId as string,
      },
      {
        baseUrl: API_BASE_URL,
      },
    );

    expect(typeof loginResponse.requiresOTP).toBe('boolean');

    if (loginResponse.requiresOTP) {
      expect(Boolean(loginResponse.sessionToken || loginResponse.message)).toBe(true);
      return;
    }

    expect(loginResponse.token).toEqual(expect.any(String));
    expect(loginResponse.refreshToken).toEqual(expect.any(String));
    expect(loginResponse.user).toMatchObject({
      id: expect.any(String),
      email: expect.any(String),
    });
  });
});
