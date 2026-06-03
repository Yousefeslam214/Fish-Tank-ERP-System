import {
  asArray,
  asRecord,
  asString,
  requestJson,
  unwrapApiData,
} from "./httpClient";

export type UserModuleAction = "ADD" | "REMOVE";

export interface ManagedFarmRecord {
  id: string;
  name: string;
}

export interface ManagedUserRecord {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name: string;
  role: string;
  gender?: string;
  farmIds: string[];
  farmNames: string[];
  modules: string[];
}

export interface StaffSignupPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  farmIds: string[];
  gender?: string;
  dateOfBirth?: string;
  address?: string;
}

export interface UpdateUserRoleAndFarmsPayload {
  role: string;
  farmIds: string[];
}

export interface UpdateUserModulesPayload {
  action: UserModuleAction;
  moduleIds: string[];
}

const normalizeArrayPayload = (payload: unknown, keys: string[]): unknown[] => {
  const data = unwrapApiData<unknown>(payload);

  if (Array.isArray(data)) {
    return data;
  }

  const record = asRecord(data);
  if (!record) {
    return [];
  }

  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
};

const normalizeName = (
  record: Record<string, unknown>,
  email: string,
): string => {
  const directName = asString(record.name);
  if (directName) {
    return directName;
  }

  const firstName = asString(record.firstName) || "";
  const lastName = asString(record.lastName) || "";
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) {
    return fullName;
  }

  return email;
};

const normalizeModules = (record: Record<string, unknown>): string[] => {
  const modules = asArray(record.modules)
    .map((entry) => asString(entry))
    .filter((entry): entry is string => Boolean(entry));

  if (modules.length > 0) {
    return modules.map((entry) => entry.toLowerCase());
  }

  const moduleIds = asArray(record.moduleIds)
    .map((entry) => asString(entry))
    .filter((entry): entry is string => Boolean(entry));
  if (moduleIds.length > 0) {
    return moduleIds.map((entry) => entry.toLowerCase());
  }

  return asArray(record.moduleNames)
    .map((entry) => asString(entry))
    .filter((entry): entry is string => Boolean(entry))
    .map((entry) => entry.toLowerCase());
};

const normalizeFarmInfo = (
  record: Record<string, unknown>,
): { ids: string[]; names: string[] } => {
  const farmsArray = asArray(record.farms);

  if (farmsArray.length > 0) {
    const farms = farmsArray
      .map((entry) => asRecord(entry))
      .filter((entry): entry is Record<string, unknown> => Boolean(entry));

    return {
      ids: farms
        .map((farm) => asString(farm.id))
        .filter((id): id is string => Boolean(id)),
      names: farms
        .map((farm) => asString(farm.name))
        .filter((name): name is string => Boolean(name)),
    };
  }

  return {
    ids: asArray(record.farmIds)
      .map((entry) => asString(entry))
      .filter((entry): entry is string => Boolean(entry)),
    names: asArray(record.farmNames)
      .map((entry) => asString(entry))
      .filter((entry): entry is string => Boolean(entry)),
  };
};

const normalizeUser = (entry: unknown): ManagedUserRecord | null => {
  const record = asRecord(entry);
  if (!record) {
    return null;
  }

  const id = asString(record.id);
  const email = asString(record.email);
  if (!id || !email) {
    return null;
  }

  const role = asString(record.role) || asString(record.userRole) || "UNKNOWN";
  const status = asString(record.status) || asString(record.state) || "UNKNOWN";
  const farmInfo = normalizeFarmInfo(record);

  return {
    id,
    email,
    firstName: asString(record.firstName),
    lastName: asString(record.lastName),
    name: normalizeName(record, email),
    role: role.toUpperCase(),
    gender: asString(record.gender),
    farmIds: farmInfo.ids,
    farmNames: farmInfo.names,
    modules: normalizeModules(record),
  };
};

const normalizeFarm = (entry: unknown): ManagedFarmRecord | null => {
  const record = asRecord(entry);
  if (!record) {
    return null;
  }

  const id = asString(record.id);
  const name = asString(record.name);
  if (!id || !name) {
    return null;
  }

  return { id, name };
};

export const getManagementUsers = async (): Promise<ManagedUserRecord[]> => {
  const payload = await requestJson("/users?offset=0&limit=1000");

  return normalizeArrayPayload(payload, ["users", "items", "rows", "data"])
    .map((entry) => normalizeUser(entry))
    .filter((entry): entry is ManagedUserRecord => entry !== null);
};

export const getManagementFarms = async (): Promise<ManagedFarmRecord[]> => {
  const payload = await requestJson("/farms");
  return normalizeArrayPayload(payload, ["farms", "items", "rows", "data"])
    .map((entry) => normalizeFarm(entry))
    .filter((entry): entry is ManagedFarmRecord => entry !== null);
};

export const signupStaffMember = async (
  payload: StaffSignupPayload,
): Promise<void> => {
  await requestJson("/auth/signup", {
    method: "POST",
    body: {
      ...payload,
      role: isNaN(Number(payload.role))
        ? payload.role.toUpperCase()
        : Number(payload.role),
      farmIds: payload.farmIds,
    },
  });
};

export const updateUserRoleAndFarms = async (
  userId: string,
  payload: UpdateUserRoleAndFarmsPayload,
): Promise<void> => {
  await requestJson(`/users/${userId}`, {
    method: "PATCH",
    body: {
      role: payload.role.toUpperCase(),
      farmIds: payload.farmIds,
    },
  });
};

export const updateUserModules = async (
  userId: string,
  payload: UpdateUserModulesPayload,
): Promise<void> => {
  await requestJson(`/users/${userId}/modules`, {
    method: "PATCH",
    body: {
      action: payload.action.toUpperCase(),
      moduleIds: payload.moduleIds
        .map((moduleId) => moduleId.trim())
        .filter((moduleId) => moduleId.length > 0),
    },
  });
};
export const deleteUser = async (userId: string): Promise<void> => {
  await requestJson("/auth/delete", {
    method: "DELETE",
    body: { userId },
  });
};
