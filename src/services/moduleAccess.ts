import { User } from "../types";

export const MODULE_BACKED_PAGE_ORDER = [
  "dashboard",
  "tanks",
  "procurement",
  "harvest",
  "inventory",
  "sales",
  "accounting",
  "analytics",
  "fish-types",
  "food-types",
  "users",
  "iot-management",
  "farms",
  "ai-assistant",
  "health",
  "notifications",
  "tasks",
] as const;

export type ModuleBackedPageId = (typeof MODULE_BACKED_PAGE_ORDER)[number];

export interface NavigationModule {
  id: string;
  label?: {
    en?: string;
    ar?: string;
  };
}

const normalizeModuleId = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

const MODULE_ID_ALIASES: Record<string, ModuleBackedPageId> = {
  task: "tasks",
  "user-management": "users",
};

const canonicalizeModuleId = (value: string): ModuleBackedPageId | "" => {
  const normalized = normalizeModuleId(value);
  if (!normalized) {
    return "";
  }

  const aliased = MODULE_ID_ALIASES[normalized] ?? normalized;
  return MODULE_BACKED_PAGE_ORDER.includes(aliased as ModuleBackedPageId)
    ? (aliased as ModuleBackedPageId)
    : "";
};

export const resolveAllowedPages = (user: User): string[] => {
  const fallbackPages = [...MODULE_BACKED_PAGE_ORDER];

  const userModules = user.modules?.map(canonicalizeModuleId).filter(Boolean);
  const effectiveModules = userModules ? [...userModules] : [];

  const allowedModulePages =
    effectiveModules.length > 0
      ? MODULE_BACKED_PAGE_ORDER.filter((pageId) =>
          effectiveModules.includes(pageId),
        )
      : fallbackPages;

  if (allowedModulePages.length === 0) {
    return ["dashboard"];
  }

  return allowedModulePages;
};

export const buildModuleLabelMap = (
  modules: NavigationModule[],
): Record<string, string> => {
  const mapping: Record<string, string> = {};

  modules.forEach((moduleEntry) => {
    const id = canonicalizeModuleId(moduleEntry.id);
    if (!id) {
      return;
    }

    const label = moduleEntry.label?.en || moduleEntry.label?.ar;
    if (label && label.trim()) {
      mapping[id] = label.trim();
    }
  });

  return mapping;
};

export const isPageAllowed = (
  pageId: string,
  allowedPages: string[],
): boolean => allowedPages.includes(pageId);
