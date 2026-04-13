import { describe, expect, it } from 'vitest';
import { buildModuleLabelMap, isPageAllowed, MODULE_BACKED_PAGE_ORDER, resolveAllowedPages } from '../services/moduleAccess';
import type { User } from '../types';

const baseUser: User = {
  id: 'u-1',
  name: 'Admin User',
  email: 'admin@example.com',
  phone: 'N/A',
  role: 'admin',
};

describe('moduleAccess helpers', () => {
  it('allows all module pages when user modules are missing', () => {
    const allowed = resolveAllowedPages(baseUser);

    expect(allowed).toEqual([...MODULE_BACKED_PAGE_ORDER, 'users']);
  });

  it('filters to module list and keeps user-management page for manager', () => {
    const allowed = resolveAllowedPages({
      ...baseUser,
      role: 'manager',
      modules: ['dashboard', 'inventory', 'sales'],
    });

    expect(allowed).toEqual(['dashboard', 'inventory', 'sales', 'users']);
  });

  it('blocks user-management page for non-manager roles', () => {
    const allowed = resolveAllowedPages({
      ...baseUser,
      role: 'worker',
      modules: ['dashboard', 'inventory'],
    });

    expect(allowed).toEqual(['dashboard', 'inventory']);
    expect(isPageAllowed('users', allowed)).toBe(false);
  });

  it('builds module label map from metadata modules', () => {
    const labels = buildModuleLabelMap([
      { id: 'inventory', label: { en: 'Inventory' } },
      { id: 'sales', label: { ar: 'المبيعات' } },
      { id: 'unknown', label: {} },
    ]);

    expect(labels).toEqual({
      inventory: 'Inventory',
      sales: 'المبيعات',
    });
  });
});
