import { User } from '../types';

export const MODULE_BACKED_PAGE_ORDER = [
  'dashboard',
  'tanks',
  'procurement',
  'harvest',
  'inventory',
  'sales',
  'accounting',
  'analytics',
  'fish-types',
  'food-types',
  'ai-assistant',
  'health',
  'notifications',
  'tasks',
] as const;

export type ModuleBackedPageId = (typeof MODULE_BACKED_PAGE_ORDER)[number];

export interface NavigationModule {
  id: string;
  label?: {
    en?: string;
    ar?: string;
  };
}

const normalizeModuleId = (value: string): string => value.trim().toLowerCase();

export const resolveAllowedPages = (user: User): string[] => {
  const fallbackPages = [...MODULE_BACKED_PAGE_ORDER];

  const userModules = user.modules?.map(normalizeModuleId).filter(Boolean);
  const effectiveModules = userModules ? [...userModules] : [];
  if (effectiveModules.includes('notifications') && !effectiveModules.includes('tasks')) {
    effectiveModules.push('tasks');
  }
  if (effectiveModules.includes('task') && !effectiveModules.includes('tasks')) {
    effectiveModules.push('tasks');
  }

  const allowedModulePages =
    effectiveModules.length > 0
      ? MODULE_BACKED_PAGE_ORDER.filter((pageId) => effectiveModules.includes(pageId))
      : fallbackPages;

  const role = user.role.toLowerCase();
  const canManageUsers = role === 'admin' || role === 'manager';

  const withUserPage = canManageUsers ? [...allowedModulePages, 'users'] : allowedModulePages;
  if (withUserPage.length === 0) {
    return ['dashboard'];
  }

  return withUserPage;
};

export const buildModuleLabelMap = (modules: NavigationModule[]): Record<string, string> => {
  const mapping: Record<string, string> = {};

  modules.forEach((moduleEntry) => {
    const id = normalizeModuleId(moduleEntry.id);
    if (!id) {
      return;
    }

    const label = moduleEntry.label?.en || moduleEntry.label?.ar;
    if (label && label.trim()) {
      mapping[id] = label.trim();
      if (id === 'task') {
        mapping.tasks = label.trim();
      }
    }
  });

  return mapping;
};

export const isPageAllowed = (pageId: string, allowedPages: string[]): boolean =>
  allowedPages.includes(pageId);
