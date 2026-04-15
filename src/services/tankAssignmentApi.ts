import { apiDelete, apiGet, apiPost } from '../api';

export interface TankAssignableUser {
  id: string;
  name: string;
  role: string;
}

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const readPayload = (payload: unknown): unknown => {
  if (!payload || typeof payload !== 'object') return payload;
  const rec = payload as Record<string, unknown>;
  return rec.data ?? rec.users ?? rec.items ?? rec.assignedUsers ?? rec.userIds ?? rec.results ?? payload;
};

const normalizeUser = (entry: unknown): TankAssignableUser | null => {
  if (!entry || typeof entry !== 'object') return null;
  const rec = entry as Record<string, unknown>;
  const nestedUser = rec.user && typeof rec.user === 'object' ? (rec.user as Record<string, unknown>) : null;
  const id = String(
    rec.id ??
      rec._id ??
      rec.userId ??
      nestedUser?.id ??
      nestedUser?._id ??
      '',
  ).trim();
  if (!id) return null;
  const firstName = typeof rec.firstName === 'string' ? rec.firstName : '';
  const lastName = typeof rec.lastName === 'string' ? rec.lastName : '';
  const fallbackName = `${firstName} ${lastName}`.trim();
  return {
    id,
    name: String(rec.name ?? nestedUser?.name ?? fallbackName ?? rec.email ?? nestedUser?.email ?? id),
    role: String(rec.role ?? rec.userRole ?? nestedUser?.role ?? 'staff').toUpperCase(),
  };
};

const normalizeAssignedIds = (payload: unknown): string[] => {
  const data = readPayload(payload);
  const list = toArray(data);
  const ids = list
    .map((entry) => {
      if (typeof entry === 'string' || typeof entry === 'number') {
        return String(entry);
      }
      if (entry && typeof entry === 'object') {
        const rec = entry as Record<string, unknown>;
        const nestedUser = rec.user && typeof rec.user === 'object' ? (rec.user as Record<string, unknown>) : null;
        const nestedStaff = rec.staff && typeof rec.staff === 'object' ? (rec.staff as Record<string, unknown>) : null;
        return String(
          rec.id ??
            rec._id ??
            rec.userId ??
            rec.assignedUserId ??
            nestedUser?.id ??
            nestedUser?._id ??
            nestedStaff?.id ??
            nestedStaff?._id ??
            '',
        );
      }
      return '';
    })
    .filter(Boolean);
  return Array.from(new Set(ids));
};

export const getFarmUsers = async (farmId: string): Promise<TankAssignableUser[]> => {
  const payload = await apiGet<unknown>(`/users/farm/${farmId}`);
  const list = toArray(readPayload(payload));
  return list.map(normalizeUser).filter((user): user is TankAssignableUser => Boolean(user));
};

export const getTankAssignedUserIds = async (tankId: string): Promise<string[]> => {
  const payload = await apiGet<unknown>(`/tanks/${tankId}/users`);
  return normalizeAssignedIds(payload);
};

export const assignUserToTank = async (tankId: string, userId: string): Promise<void> => {
  await apiPost(`/tanks/${tankId}/assign/${userId}`, {});
};

export const unassignUserFromTank = async (tankId: string, userId: string): Promise<void> => {
  await apiDelete(`/tanks/${tankId}/unassign/${userId}`);
};
