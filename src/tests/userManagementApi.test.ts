import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getManagementFarms,
  getManagementUsers,
  signupStaffMember,
  updateUserModules,
  updateUserRoleAndFarms,
} from '../services/userManagementApi';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('userManagementApi', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes users and farms payloads', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: [
            {
              id: 'user-1',
              email: 'staff@fishfarm.com',
              firstName: 'John',
              lastName: 'Doe',
              role: 'manager',
              status: 'active',
              farms: [
                { id: 'farm-1', name: 'Main Farm' },
                { id: 'farm-2', name: 'Delta Farm' },
              ],
              modules: ['inventory', 'sales'],
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: [
            { id: 'farm-1', name: 'Main Farm' },
            { id: 'farm-2', name: 'Delta Farm' },
          ],
        }),
      );

    const users = await getManagementUsers();
    const farms = await getManagementFarms();

    expect(users).toEqual([
      {
        id: 'user-1',
        email: 'staff@fishfarm.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        role: 'MANAGER',
        status: 'ACTIVE',
        gender: undefined,
        farmIds: ['farm-1', 'farm-2'],
        farmNames: ['Main Farm', 'Delta Farm'],
        modules: ['inventory', 'sales'],
      },
    ]);

    expect(farms).toEqual([
      { id: 'farm-1', name: 'Main Farm' },
      { id: 'farm-2', name: 'Delta Farm' },
    ]);
  });

  it('sends signup payload with normalized role and farmIds', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true }, 201));

    await signupStaffMember({
      email: 'staff@fishfarm.com',
      password: 'SecurePassword123!',
      firstName: 'John',
      lastName: 'Doe',
      role: 'technican',
      farmIds: ['farm-1'],
      gender: 'MALE',
      dateOfBirth: '1990-05-15',
      address: 'Aqua Street',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/signup'),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String),
      }),
    );

    const signupBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(signupBody).toMatchObject({
      role: 'TECHNICAN',
      farmIds: ['farm-1'],
    });
  });

  it('sends update payloads for role/farms and module overrides', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ success: true }))
      .mockResolvedValueOnce(jsonResponse({ success: true }));

    await updateUserRoleAndFarms('user-1', {
      role: 'manager',
      farmIds: ['farm-1', 'farm-2'],
    });

    await updateUserModules('user-1', {
      action: 'REMOVE',
      moduleNames: ['inventory'],
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/users/user-1'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          role: 'MANAGER',
          farmIds: ['farm-1', 'farm-2'],
        }),
      }),
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/users/user-1/modules'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          action: 'REMOVE',
          moduleNames: ['inventory'],
        }),
      }),
    );
  });
});
