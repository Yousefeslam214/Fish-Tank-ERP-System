// ============================================================
// FishFarm360 - Centralized API Utility
// ============================================================
// WHY THIS FILE EXISTS:
// Instead of hard-coding the base URL and JWT token in every
// component, we centralise them here. This means:
//  1. One place to update the token when it rotates
//  2. All components get the same fetch behaviour (auth headers,
//     error handling, JSON parsing) for free
//  3. Easy to swap base URL between local dev and production
// ============================================================

export const API_BASE = 'https://yousseftallal-fishfarm-backend-api.hf.space/api/v1';

// Long-lived demo token from BACKEND_INFO.md
// In production this would come from localStorage after login
const getToken = (): string => {
    // Try a freshly-stored token first (set by Login component after /auth/login)
    const stored = localStorage.getItem('fishfarm_token');
    if (stored) return stored;

    // Fallback to the seeded demo token from BACKEND_INFO.md
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjNmMzMzZGU4LTAzOTQtNDA5ZS05YWIyLTY1YjBhZjVkNjcyMiIsImVtYWlsIjoiZTJlLWxpZmVjeWNsZUB0ZXN0LmNvbSIsInJvbGUiOiJNQU5BR0VSIiwiZmFybUlkIjoiYTEwZWExYzYtOGQ2MS00NzhkLWIwYjAtZGY4NjgzNjU0M2UwIiwibW9kdWxlcyI6WyJub3RpZmljYXRpb25zIiwiaGVhbHRoIiwiYWktYXNzaXN0YW50IiwiZm9vZC10eXBlcyIsImZpc2gtdHlwZXMiLCJhbmFseXRpY3MiLCJhY2NvdW50aW5nIiwic2FsZXMiLCJpbnZlbnRvcnkiLCJoYXJ2ZXN0IiwicHJvY3VyZW1lbnQiLCJ0YW5rcyIsImRhc2hib2FyZCJdLCJpYXQiOjE3NzI2OTI1NTMsImV4cCI6MjEzMjY5MjU1M30.B17o9vVP8e5agC5Uge0OeTp__cY02EqqtLeu0tx8svM';
};

// WHY authHeaders?
// The backend requires a Bearer JWT on almost every endpoint.
// Centralising it here means no component needs to know how auth works.
const authHeaders = (): HeadersInit => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
});

// Generic GET helper
// WHY: Reduces repetitive fetch + JSON boilerplate in every component
export async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'GET',
        headers: authHeaders(),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`GET ${path} failed [${res.status}]: ${text}`);
    }
    return res.json() as Promise<T>;
}

// Generic POST helper
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`POST ${path} failed [${res.status}]: ${text}`);
    }
    return res.json() as Promise<T>;
}

// Generic PUT helper
export async function apiPut<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PUT ${path} failed [${res.status}]: ${text}`);
    }
    return res.json() as Promise<T>;
}

// Generic PATCH helper
export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PATCH ${path} failed [${res.status}]: ${text}`);
    }
    return res.json() as Promise<T>;
}

// Generic DELETE helper
export async function apiDelete<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`DELETE ${path} failed [${res.status}]: ${text}`);
    }
    return res.json() as Promise<T>;
}
