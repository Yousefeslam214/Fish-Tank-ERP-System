import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  RefreshCw,
  ShieldUser,
  UserPlus,
  Users,
  Search,
  Loader2,
} from "lucide-react";
import Pagination from "@mui/material/Pagination";
import { User, Farm } from "../types";
import { apiGet } from "../api";
import { mockFarms } from "../mockData";
import {
  getMetadata,
  MetadataEnumEntry,
  MetadataModule,
} from "../services/metaApi";
import {
  deleteUser,
  getManagementFarms,
  getManagementUsers,
  ManagedFarmRecord,
  ManagedUserRecord,
  signupStaffMember,
  updateUserModules,
  updateUserRoleAndFarms,
  UserModuleAction,
} from "../services/userManagementApi";
import {
  assignUserToTank,
  getTankAssignedUserIds,
  unassignUserFromTank,
} from "../services/tankAssignmentApi";

interface UserManagementProps {
  user: User;
  selectedFarm: Farm | null;
}

interface StaffRegistrationForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  farmIds: string[];
  gender: string;
  dateOfBirth: string;
  address: string;
}

interface EditUserAccessState {
  open: boolean;
  user: ManagedUserRecord | null;
  role: string;
  farmIds: string[];
}

interface EditUserModulesState {
  open: boolean;
  user: ManagedUserRecord | null;
  action: UserModuleAction;
  moduleIds: string[];
}

interface DeleteConfirmState {
  open: boolean;
  user: ManagedUserRecord | null;
}

interface TankOption {
  id: string;
  name: string;
  farmId: string;
}

const DEFAULT_FORM: StaffRegistrationForm = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  role: "2",
  farmIds: [],
  gender: "",
  dateOfBirth: "",
  address: "",
};

const FALLBACK_ROLE_OPTIONS = [
  "MANAGER",
  "ACCOUNTANT",
  "TECNICAN",
  "SALES",
  "WORKER",
  "DELIVERY",
];
const FALLBACK_GENDER_OPTIONS = ["MALE", "FEMALE"];

const toShortId = (id: string): string => id.split("-")[0] || id;
const formatNameWithId = (name: string, id: string): string =>
  `${name} (${toShortId(id)})`;

interface RoleOption {
  value: string;
  label: string;
}

const resolveRoleOptions = (
  entries: MetadataEnumEntry[] | undefined,
): RoleOption[] => {
  if (!entries || entries.length === 0) {
    return FALLBACK_ROLE_OPTIONS.map((value) => ({ value, label: value }));
  }

  const options: RoleOption[] = entries
    .map((entry) => {
      const value = (entry.value || entry.key || "").trim().toUpperCase();
      const label = entry.label?.en || entry.label?.ar || entry.key || value;
      return { value, label };
    })
    .filter((opt) => opt.value.length > 0)
    .filter((opt) => opt.value !== "ADMIN");
  console.log(options);

  if (options.length === 0) {
    return FALLBACK_ROLE_OPTIONS.map((value) => ({ value, label: value }));
  }

  const seen = new Set<string>();
  return options.filter((opt) => {
    if (seen.has(opt.value)) return false;
    seen.add(opt.value);
    return true;
  });
};

const toStatusClassName = (status: string): string => {
  const normalized = status.trim().toUpperCase();
  if (normalized === "ACTIVE") {
    return "bg-green-600 text-white";
  }
  if (normalized === "DISABLED" || normalized === "LOCKED") {
    return "bg-red-600 text-white";
  }
  return "bg-gray-600 text-white";
};

const getEnumOptionValues = (
  entries: MetadataEnumEntry[] | undefined,
  fallback: string[],
): string[] => {
  if (!entries || entries.length === 0) {
    return fallback;
  }
  const values = entries
    .map((entry) => (entry.value || entry.key || "").trim())
    .filter((value) => value.length > 0)
    .map((value) => value.toUpperCase())
    .filter((value) => value !== "ADMIN");

  return values.length > 0 ? Array.from(new Set(values)) : fallback;
};

const isTechnicianRole = (role: string): boolean => {
  const normalized = String(role || "")
    .trim()
    .toUpperCase();
  return normalized === "TECHNICIAN" || normalized === "TECNICAN";
};

export default function UserManagement({
  user,
  selectedFarm,
}: UserManagementProps) {
  const currentFarm = selectedFarm || mockFarms[0];

  const [users, setUsers] = useState<ManagedUserRecord[]>([]);
  const [farms, setFarms] = useState<ManagedFarmRecord[]>([]);
  const [modules, setModules] = useState<MetadataModule[]>([]);
  const [metadataEnums, setMetadataEnums] = useState<
    Record<string, MetadataEnumEntry[]>
  >({});

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [registrationForm, setRegistrationForm] =
    useState<StaffRegistrationForm>(DEFAULT_FORM);
  const [editAccessState, setEditAccessState] = useState<EditUserAccessState>({
    open: false,
    user: null,
    role: "TECNICAN",
    farmIds: [],
  });
  const [editModulesState, setEditModulesState] =
    useState<EditUserModulesState>({
      open: false,
      user: null,
      action: "ADD",
      moduleIds: [],
    });
  const [deleteConfirmState, setDeleteConfirmState] =
    useState<DeleteConfirmState>({
      open: false,
      user: null,
    });
  const [tankOptions, setTankOptions] = useState<TankOption[]>([]);
  const [selectedTankId, setSelectedTankId] = useState("");
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [assignedTankUserIds, setAssignedTankUserIds] = useState<string[]>([]);
  const [loadingTankAssignments, setLoadingTankAssignments] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const USERS_PER_PAGE = 5;
  const roleOptions = useMemo(
    () => resolveRoleOptions(metadataEnums.userRoles),
    [metadataEnums],
  );

  const genderOptions = useMemo(
    () => getEnumOptionValues(metadataEnums.gender, FALLBACK_GENDER_OPTIONS),
    [metadataEnums],
  );

  const roleLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    roleOptions.forEach((opt) => {
      map[opt.value] = opt.label;
    });
    return map;
  }, [roleOptions]);

  const farmById = useMemo(() => {
    const map: Record<string, ManagedFarmRecord> = {};
    farms.forEach((farmEntry) => {
      map[farmEntry.id] = farmEntry;
    });
    return map;
  }, [farms]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return users;
    }

    return users.filter((userEntry) => {
      const haystack = [
        userEntry.id,
        userEntry.name,
        userEntry.email,
        userEntry.role,
        ...userEntry.farmIds,
        ...userEntry.modules,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [searchTerm, users]);
  const userPages = useMemo(() => {
    const pages = [];

    for (let i = 0; i < filteredUsers.length; i += USERS_PER_PAGE) {
      pages.push(filteredUsers.slice(i, i + USERS_PER_PAGE));
    }

    return pages;
  }, [filteredUsers]);

  const currentUsers = userPages[currentPage] || [];
  const canManageTechnicianAssignments =
    String(user.role || "")
      .trim()
      .toLowerCase() === "admin";

  const technicianUsers = useMemo(
    () => users.filter((entry) => isTechnicianRole(entry.role)),
    [users],
  );

  const selectedTankAssignedTechnicians = useMemo(
    () =>
      assignedTankUserIds
        .map((id) => technicianUsers.find((entry) => entry.id === id))
        .filter((entry): entry is ManagedUserRecord => Boolean(entry)),
    [assignedTankUserIds, technicianUsers],
  );

  const availableTechniciansForSelectedTank = useMemo(
    () =>
      technicianUsers.filter(
        (entry) => !assignedTankUserIds.includes(entry.id),
      ),
    [assignedTankUserIds, technicianUsers],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [metadata, usersPayload, farmsPayload] = await Promise.all([
        getMetadata(),
        getManagementUsers(),
        getManagementFarms(),
      ]);

      setMetadataEnums(metadata.enums);
      setModules(metadata.modules);
      setUsers(usersPayload);
      setFarms(farmsPayload);

      const nextRoleOptions = getEnumOptionValues(
        metadata.enums.userRoles,
        FALLBACK_ROLE_OPTIONS,
      ).filter((value) => value !== "ADMIN");
      setRegistrationForm((previous) => ({
        ...previous,
        role: previous.role || nextRoleOptions[0] || "TECNICAN",
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load user management data.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const loadTankOptions = useCallback(async () => {
    try {
      const payload = await apiGet<
        | { data?: Array<Record<string, unknown>> }
        | Array<Record<string, unknown>>
      >("/tanks");
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
      const normalized = list
        .map((entry) => {
          const id = String(entry?.id ?? entry?._id ?? "").trim();
          if (!id) return null;
          const farmId = String(
            entry?.farmId ?? entry?.farm ?? currentFarm.id ?? "",
          ).trim();
          return {
            id,
            name: String(entry?.name ?? `Tank ${id.slice(0, 8)}`),
            farmId,
          } as TankOption;
        })
        .filter((entry): entry is TankOption => Boolean(entry))
        .filter((entry) => !currentFarm?.id || entry.farmId === currentFarm.id);

      setTankOptions(normalized);
      if (normalized.length > 0) {
        setSelectedTankId((previous) =>
          previous && normalized.some((entry) => entry.id === previous)
            ? previous
            : normalized[0].id,
        );
      } else {
        setSelectedTankId("");
      }
    } catch {
      setTankOptions([]);
      setSelectedTankId("");
    }
  }, [currentFarm.id]);

  useEffect(() => {
    if (!canManageTechnicianAssignments) return;
    void loadTankOptions();
  }, [canManageTechnicianAssignments, loadTankOptions]);

  useEffect(() => {
    if (!canManageTechnicianAssignments || !selectedTankId) {
      setAssignedTankUserIds([]);
      return;
    }

    setLoadingTankAssignments(true);
    getTankAssignedUserIds(selectedTankId)
      .then((ids) => setAssignedTankUserIds(Array.from(new Set(ids))))
      .catch(() => setAssignedTankUserIds([]))
      .finally(() => setLoadingTankAssignments(false));
  }, [canManageTechnicianAssignments, selectedTankId]);

  const assignTechnicianToTank = async () => {
    if (!selectedTankId || !selectedTechnicianId) return;
    try {
      setSubmitting(true);
      await assignUserToTank(selectedTankId, selectedTechnicianId);
      const refreshedIds = await getTankAssignedUserIds(selectedTankId).catch(
        () => [...assignedTankUserIds, selectedTechnicianId],
      );
      setAssignedTankUserIds(Array.from(new Set(refreshedIds)));
      setSelectedTechnicianId("");
      setSuccessMessage("Technician assigned to tank successfully.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to assign technician to tank.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const unassignTechnicianFromTank = async (technicianId: string) => {
    if (!selectedTankId) return;
    try {
      setSubmitting(true);
      await unassignUserFromTank(selectedTankId, technicianId);
      const refreshedIds = await getTankAssignedUserIds(selectedTankId).catch(
        () => assignedTankUserIds.filter((id) => id !== technicianId),
      );
      setAssignedTankUserIds(Array.from(new Set(refreshedIds)));
      setSuccessMessage("Technician unassigned from tank successfully.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to unassign technician from tank.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetRegistrationForm = () => {
    setRegistrationForm({
      ...DEFAULT_FORM,
      role: roleOptions[0]?.value || DEFAULT_FORM.role,
      gender: genderOptions[0] || "",
    });
  };

  const toggleRegistrationFarm = (farmId: string) => {
    setRegistrationForm((previous) => ({
      ...previous,
      farmIds: previous.farmIds.includes(farmId)
        ? previous.farmIds.filter((entry) => entry !== farmId)
        : [...previous.farmIds, farmId],
    }));
  };

  const toggleEditFarm = (farmId: string) => {
    setEditAccessState((previous) => ({
      ...previous,
      farmIds: previous.farmIds.includes(farmId)
        ? previous.farmIds.filter((entry) => entry !== farmId)
        : [...previous.farmIds, farmId],
    }));
  };

  const toggleModuleSelection = (moduleId: string) => {
    setEditModulesState((previous) => ({
      ...previous,
      moduleIds: previous.moduleIds.includes(moduleId)
        ? previous.moduleIds.filter((entry) => entry !== moduleId)
        : [...previous.moduleIds, moduleId],
    }));
  };

  const submitRegistration = async () => {
    if (!registrationForm.email.trim() || !registrationForm.password.trim()) {
      setErrorMessage("Email and password are required.");
      return;
    }

    if (
      !registrationForm.firstName.trim() ||
      !registrationForm.lastName.trim()
    ) {
      setErrorMessage("First and last name are required.");
      return;
    }

    if (registrationForm.farmIds.length === 0) {
      setErrorMessage("Select at least one farm assignment.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const payload = {
        email: registrationForm.email.trim(),
        password: registrationForm.password,
        firstName: registrationForm.firstName.trim(),
        lastName: registrationForm.lastName.trim(),
        role: registrationForm.role,
        farmIds: registrationForm.farmIds,
        gender: registrationForm.gender || undefined,
        dateOfBirth: registrationForm.dateOfBirth || undefined,
        address: registrationForm.address.trim() || undefined,
      };

      console.log("STAFF REGISTRATION REQUEST:", payload);
      console.log("ROLE OPTIONS", roleOptions);
      await signupStaffMember({
        email: registrationForm.email.trim(),
        password: registrationForm.password,
        firstName: registrationForm.firstName.trim(),
        lastName: registrationForm.lastName.trim(),
        role:
          registrationForm.role === "TECNICAN" ? "2" : registrationForm.role,
        farmIds: registrationForm.farmIds,
        gender: registrationForm.gender || undefined,
        dateOfBirth: registrationForm.dateOfBirth || undefined,
        address: registrationForm.address.trim() || undefined,
      });

      resetRegistrationForm();
      await loadData();
      setSuccessMessage("Staff account created successfully.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create staff account.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditAccessDialog = (userEntry: ManagedUserRecord) => {
    setEditAccessState({
      open: true,
      user: userEntry,
      role: userEntry.role || roleOptions[0]?.value || "MANAGER",
      farmIds: userEntry.farmIds,
    });
  };

  const openEditModulesDialog = (userEntry: ManagedUserRecord) => {
    setEditModulesState({
      open: true,
      user: userEntry,
      action: "ADD",
      moduleIds: [],
    });
  };

  const submitEditAccess = async () => {
    if (!editAccessState.user) {
      return;
    }

    if (editAccessState.farmIds.length === 0) {
      setErrorMessage("A user must be assigned to at least one farm.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      await updateUserRoleAndFarms(editAccessState.user.id, {
        role: editAccessState.role,
        farmIds: editAccessState.farmIds,
      });

      setEditAccessState({
        open: false,
        user: null,
        role: "MANAGER",
        farmIds: [],
      });
      await loadData();
      setSuccessMessage("User role and farm assignments updated.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update user access.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitEditModules = async () => {
    if (!editModulesState.user) {
      return;
    }

    if (editModulesState.moduleIds.length === 0) {
      setErrorMessage("Select at least one module.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      await updateUserModules(editModulesState.user.id, {
        action: editModulesState.action,
        moduleIds: editModulesState.moduleIds,
      });

      setEditModulesState({
        open: false,
        user: null,
        action: "ADD",
        moduleIds: [],
      });
      await loadData();
      setSuccessMessage(
        `Module access ${editModulesState.action === "ADD" ? "added" : "removed"} successfully.`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update module access.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitDeleteUser = async () => {
    if (!deleteConfirmState.user) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      await deleteUser(deleteConfirmState.user.id);

      setDeleteConfirmState({ open: false, user: null });
      await loadData();
      setSuccessMessage("User deleted successfully.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete user.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-700">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading user management data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="bg-[#0A4D68] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldUser className="w-6 h-6" />
            <span className="text-xl font-semibold">User Management</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">{currentFarm.name}</span>
            <div className="w-10 h-10 rounded-full bg-[#088395] flex items-center justify-center font-semibold">
              {user.name
                .split(" ")
                .map((namePart) => namePart[0])
                .join("")
                .toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {errorMessage && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700 flex items-center justify-between gap-2">
              <span>{errorMessage}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setErrorMessage(null)}
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {successMessage && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-sm text-green-700 flex items-center justify-between gap-2">
              <span>{successMessage}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSuccessMessage(null)}
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Staff Registration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registrationForm.email}
                    onChange={(event) =>
                      setRegistrationForm((previous) => ({
                        ...previous,
                        email: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registrationForm.password}
                    onChange={(event) =>
                      setRegistrationForm((previous) => ({
                        ...previous,
                        password: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="register-first-name">First Name</Label>
                  <Input
                    id="register-first-name"
                    value={registrationForm.firstName}
                    onChange={(event) =>
                      setRegistrationForm((previous) => ({
                        ...previous,
                        firstName: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="register-last-name">Last Name</Label>
                  <Input
                    id="register-last-name"
                    value={registrationForm.lastName}
                    onChange={(event) =>
                      setRegistrationForm((previous) => ({
                        ...previous,
                        lastName: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="register-role">Role</Label>
                  <select
                    id="register-role"
                    className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm"
                    value={registrationForm.role}
                    onChange={(event) =>
                      setRegistrationForm((previous) => ({
                        ...previous,
                        role: event.target.value,
                      }))
                    }
                  >
                    {roleOptions
                      .filter((option) => {
                        return (
                          option.value.toUpperCase() !== "ADMIN" &&
                          option.label.toUpperCase() !== "ADMIN"
                        );
                      })
                      .map((option) => (
                        <option
                          key={`register-role-${option.value}`}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="register-gender">Gender</Label>
                  <select
                    id="register-gender"
                    className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm"
                    value={registrationForm.gender}
                    onChange={(event) =>
                      setRegistrationForm((previous) => ({
                        ...previous,
                        gender: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select gender</option>
                    {genderOptions.map((option) => (
                      <option key={`register-gender-${option}`} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="register-dob">Date of Birth</Label>
                  <Input
                    id="register-dob"
                    type="date"
                    value={registrationForm.dateOfBirth}
                    onChange={(event) =>
                      setRegistrationForm((previous) => ({
                        ...previous,
                        dateOfBirth: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="register-address">Address</Label>
                  <Input
                    id="register-address"
                    value={registrationForm.address}
                    onChange={(event) =>
                      setRegistrationForm((previous) => ({
                        ...previous,
                        address: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Farm Assignments</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-md border p-3">
                  {farms.map((farmEntry) => (
                    <label
                      key={farmEntry.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={registrationForm.farmIds.includes(
                          farmEntry.id,
                        )}
                        onChange={() => toggleRegistrationFarm(farmEntry.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span>{farmEntry.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={resetRegistrationForm}
                  disabled={submitting}
                >
                  Reset
                </Button>
                <Button
                  onClick={() => void submitRegistration()}
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create Staff Account"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-md border p-3">
                <p className="text-gray-500">Total Users</p>
                <p className="text-2xl font-semibold">{users.length}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-gray-500">Active Modules</p>
                <p className="text-2xl font-semibold">{modules.length}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-gray-500">Available Farms</p>
                <p className="text-2xl font-semibold">{farms.length}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => void loadData()}
                className="w-full"
                disabled={submitting}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Data
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Assign Technicians To Tanks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canManageTechnicianAssignments ? (
              <p className="text-sm text-gray-600">
                Only admin users can manage technician tank assignments.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="assign-tank">Tank</Label>
                    <select
                      id="assign-tank"
                      className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm"
                      value={selectedTankId}
                      onChange={(event) =>
                        setSelectedTankId(event.target.value)
                      }
                    >
                      {tankOptions.length === 0 && (
                        <option value="">No tanks available</option>
                      )}
                      {tankOptions.map((tankEntry) => (
                        <option
                          key={`assign-tank-${tankEntry.id}`}
                          value={tankEntry.id}
                        >
                          {formatNameWithId(tankEntry.name, tankEntry.id)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="assign-technician">Technician</Label>
                    <select
                      id="assign-technician"
                      className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm"
                      value={selectedTechnicianId}
                      onChange={(event) =>
                        setSelectedTechnicianId(event.target.value)
                      }
                    >
                      <option value="">Select technician</option>
                      {availableTechniciansForSelectedTank.map(
                        (technicianEntry) => (
                          <option
                            key={`assign-technician-${technicianEntry.id}`}
                            value={technicianEntry.id}
                          >
                            {formatNameWithId(
                              technicianEntry.name,
                              technicianEntry.id,
                            )}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => void assignTechnicianToTank()}
                    disabled={
                      submitting ||
                      !selectedTankId ||
                      !selectedTechnicianId ||
                      loadingTankAssignments
                    }
                  >
                    Assign Technician
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void loadTankOptions()}
                    disabled={submitting}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Tanks
                  </Button>
                </div>

                <div className="rounded-md border p-3 space-y-2">
                  <p className="text-sm font-medium">Assigned Technicians</p>
                  {loadingTankAssignments ? (
                    <p className="text-sm text-gray-500">
                      Loading assignments...
                    </p>
                  ) : selectedTankAssignedTechnicians.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No technicians assigned to this tank.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedTankAssignedTechnicians.map(
                        (technicianEntry) => (
                          <Badge
                            key={`assigned-technician-${technicianEntry.id}`}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <span>{technicianEntry.name}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-red-600 hover:text-red-700"
                              onClick={() =>
                                void unassignTechnicianFromTank(
                                  technicianEntry.id,
                                )
                              }
                              disabled={submitting}
                            >
                              Remove
                            </Button>
                          </Badge>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
              <CardTitle>User Administration</CardTitle>
              <div className="relative w-full sm:w-70">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  aria-label="Search users"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="      Search by user, role"
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Farms</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.map((userEntry) => (
                  <TableRow key={userEntry.id}>
                    <TableCell>
                      <div className="font-medium">
                        {formatNameWithId(userEntry.name, userEntry.id)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {userEntry.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {roleLabelMap[userEntry.role] || userEntry.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {userEntry.farmNames.length === 0 && (
                          <span className="text-xs text-gray-500">
                            No farms
                          </span>
                        )}
                        {userEntry.farmNames.map((farmId) => (
                          <Badge
                            key={`${userEntry.id}-farm-${farmId}`}
                            variant="outline"
                            className="text-xs"
                          >
                            {farmId}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {userEntry.modules.length === 0 && (
                          <span className="text-xs text-gray-500">
                            No module overrides
                          </span>
                        )}
                        {userEntry.modules.map((moduleName) => {
                          const moduleLabel =
                            modules.find(
                              (entry) => entry.id.toLowerCase() === moduleName,
                            )?.label?.en || moduleName;
                          return (
                            <Badge
                              key={`${userEntry.id}-module-${moduleName}`}
                              variant="secondary"
                              className="text-xs"
                            >
                              {moduleLabel}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModulesDialog(userEntry)}
                        >
                          Module Overrides
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() =>
                            setDeleteConfirmState({
                              open: true,
                              user: userEntry,
                            })
                          }
                          disabled={submitting}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-gray-600"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex justify-center py-4">
              <Pagination
                count={userPages.length}
                page={currentPage + 1}
                onChange={(_, page) => setCurrentPage(page - 1)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Overrides Dialog */}
      <Dialog
        open={editModulesState.open}
        onOpenChange={(open: boolean) =>
          setEditModulesState((previous) => ({
            ...previous,
            open,
            user: open ? previous.user : null,
          }))
        }
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Module Overrides</DialogTitle>
            <DialogDescription>
              {editModulesState.user
                ? `Adjust module access for ${formatNameWithId(editModulesState.user.name, editModulesState.user.id)}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="module-action">Action</Label>
              <select
                id="module-action"
                className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm"
                value={editModulesState.action}
                onChange={(event) =>
                  setEditModulesState((previous) => ({
                    ...previous,
                    action: event.target.value === "REMOVE" ? "REMOVE" : "ADD",
                  }))
                }
              >
                <option value="ADD">ADD</option>
                <option value="REMOVE">REMOVE</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Modules</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-md border p-3">
                {modules.map((moduleEntry) => (
                  <label
                    key={`module-${moduleEntry.id}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={editModulesState.moduleIds.includes(
                        moduleEntry.id,
                      )}
                      onChange={() => toggleModuleSelection(moduleEntry.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span>{moduleEntry.label.en}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() =>
                  setEditModulesState({
                    open: false,
                    user: null,
                    action: "ADD",
                    moduleIds: [],
                  })
                }
              >
                Cancel
              </Button>
              <Button
                onClick={() => void submitEditModules()}
                disabled={submitting}
              >
                {submitting ? "Applying..." : "Apply Modules"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmState.open}
        onOpenChange={(open: boolean) =>
          setDeleteConfirmState((previous) => ({
            ...previous,
            open,
            user: open ? previous.user : null,
          }))
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              {deleteConfirmState.user
                ? `Are you sure you want to permanently delete ${formatNameWithId(deleteConfirmState.user.name, deleteConfirmState.user.id)}? This action cannot be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmState({ open: false, user: null })}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void submitDeleteUser()}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Delete User"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
