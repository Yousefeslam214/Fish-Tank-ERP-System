import { describe, expect, it, beforeAll } from 'vitest';
import { requestJson, unwrapApiData, asArray, asRecord, asString } from '../services/httpClient';
import { login, preLogin } from '../services/authApi';

const API_BASE_URL = process.env.FISH_API_BASE_URL || 'https://yousseftallal-fishfarm-backend-api.hf.space/api/v1';
const TEST_EMAIL = process.env.FISH_TEST_EMAIL || 'e2e-lifecycle@test.com';
const TEST_PASSWORD = process.env.FISH_TEST_PASSWORD || 'Test1234!';

describe('Hazem Yasser Tasks - Live Backend Route Tests', () => {
    let token: string;
    let farmId: string | undefined;

    beforeAll(async () => {
        // 1. Pre-login to get farmId
        const preLoginRes = await preLogin(
            { email: TEST_EMAIL, password: TEST_PASSWORD },
            { baseUrl: API_BASE_URL }
        );

        farmId = preLoginRes.requiresFarmSelection
            ? preLoginRes.farms?.[0]?.id
            : preLoginRes.loginResult?.user?.farmId;

        if (!farmId) {
            throw new Error('Could not determine farmId for testing');
        }

        // 2. Login to get token
        const loginRes = await login(
            { email: TEST_EMAIL, password: TEST_PASSWORD, farmId },
            { baseUrl: API_BASE_URL }
        );

        if (loginRes.requiresOTP || !loginRes.token) {
            throw new Error('Login failed or requires OTP - cannot proceed with live tests');
        }

        token = loginRes.token;
        process.env.FISH_API_TOKEN = token;
    });

    describe('Dashboard Route', () => {
        it('GET /api/v1/dashboard returns valid data', async () => {
            const response = await requestJson('/dashboard', {
                baseUrl: API_BASE_URL,
                authenticated: true,
            });

            const data = unwrapApiData<any>(response);

            expect(data).toBeDefined();
            expect(asRecord(data.fishSummary)).toBeDefined();
            expect(asRecord(data.feedStock)).toBeDefined();
            expect(asRecord(data.predictedRevenue)).toBeDefined();
            expect(asArray(data.upcomingHarvests)).toBeDefined();
            expect(asArray(data.waterQualityAlerts)).toBeDefined();
        });
    });

    describe('Tank Management Routes', () => {
        let firstTankId: string;

        it('GET /api/v1/tanks returns a list of tanks', async () => {
            const response = await requestJson('/tanks', {
                baseUrl: API_BASE_URL,
                authenticated: true,
            });

            const data = unwrapApiData<any[]>(response);
            expect(Array.isArray(data)).toBe(true);

            if (data.length > 0) {
                firstTankId = data[0].id;
                expect(asString(data[0].name)).toBeDefined();
                expect(asRecord(data[0].biomass)).toBeDefined();
            }
        });

        it('GET /api/v1/tanks/:id returns tank details', async () => {
            if (!firstTankId) return;

            const response = await requestJson(`/tanks/${firstTankId}`, {
                baseUrl: API_BASE_URL,
                authenticated: true,
            });

            const data = unwrapApiData<any>(response);
            expect(data.id).toBe(firstTankId);
            expect(asString(data.name)).toBeDefined();
        });

        it('GET /api/v1/tanks/:id/dashboard returns tank dashboard data', async () => {
            if (!firstTankId) return;

            const response = await requestJson(`/tanks/${firstTankId}/dashboard`, {
                baseUrl: API_BASE_URL,
                authenticated: true,
            });

            const data = unwrapApiData<any>(response);
            expect(data).toBeDefined();
        });

        let firstBatchId: string;

        it('GET /api/v1/tanks/:id/batches returns tank batches', async () => {
            if (!firstTankId) return;

            const response = await requestJson(`/tanks/${firstTankId}/batches`, {
                baseUrl: API_BASE_URL,
                authenticated: true,
            });

            const data = unwrapApiData<any>(response);
            expect(asArray(data.batches)).toBeDefined();
            if (data.batches && data.batches.length > 0) {
                firstBatchId = data.batches[0].id;
            }
        });

        it('GET /api/v1/tanks/:id/water-quality returns water quality history', async () => {
            if (!firstTankId) return;

            const response = await requestJson(`/tanks/${firstTankId}/water-quality`, {
                baseUrl: API_BASE_URL,
                authenticated: true,
            });

            const data = unwrapApiData<any>(response);
            expect(asArray(data.history)).toBeDefined();
        });

        it('GET /api/v1/tanks/:id/feeding-history returns feeding history', async () => {
            if (!firstTankId) return;

            const response = await requestJson(`/tanks/${firstTankId}/feeding-history`, {
                baseUrl: API_BASE_URL,
                authenticated: true,
            });

            const data = unwrapApiData<any>(response);
            expect(asArray(data.history)).toBeDefined();
        });

        it('GET /api/v1/tanks/:id/growth-metrics returns growth metrics', async () => {
            if (!firstTankId) return;

            const response = await requestJson(`/tanks/${firstTankId}/growth-metrics`, {
                baseUrl: API_BASE_URL,
                authenticated: true,
            });

            const data = unwrapApiData<any>(response);
            expect(asArray(data.batches)).toBeDefined();
        });

        it('GET /api/v1/tanks/growth/batch/:batchId returns growth history for batch', async () => {
            if (!firstBatchId) return;

            const response = await requestJson(`/tanks/growth/batch/${firstBatchId}`, {
                baseUrl: API_BASE_URL,
                authenticated: true,
            });

            const data = unwrapApiData<any>(response);
            expect(data).toBeDefined();
        });

        it('GET /api/v1/tanks/feeding-records/calculation/tank/:tankId returns calculated feeding', async () => {
            if (!firstTankId) return;

            const response = await requestJson(`/tanks/feeding-records/calculation/tank/${firstTankId}`, {
                baseUrl: API_BASE_URL,
                authenticated: true,
            });

            const data = unwrapApiData<any>(response);
            expect(data).toBeDefined();
        });
    });

    describe('Food Type Routes', () => {
        it('GET /api/v1/aquaculture/food-types returns a list of food types', async () => {
            const response = await requestJson('/aquaculture/food-types', {
                baseUrl: API_BASE_URL,
                authenticated: true,
            });

            const data = unwrapApiData<any[]>(response);
            expect(Array.isArray(data)).toBe(true);

            if (data.length > 0) {
                expect(asString(data[0].name)).toBeDefined();
                expect(data[0].proteinPercentage).toBeDefined();
            }
        });
    });
});
