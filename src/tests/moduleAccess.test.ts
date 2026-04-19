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

    expect(allowed).toEqual([...MODULE_BACKED_PAGE_ORDER]);
  });

  it('filters to the explicit module list only', () => {
    const allowed = resolveAllowedPages({
      ...baseUser,
      role: 'manager',
      modules: ['dashboard', 'inventory', 'sales'],
    });

    expect(allowed).toEqual(['dashboard', 'inventory', 'sales']);
  });

  it('normalizes user-management module to users page', () => {
    const allowed = resolveAllowedPages({
      ...baseUser,
      role: 'worker',
      modules: ['dashboard', 'user-management'],
    });

    expect(allowed).toEqual(['dashboard', 'users']);
  });

  it('does not include tasks unless tasks module is explicitly granted', () => {
    const allowed = resolveAllowedPages({
      ...baseUser,
      role: 'worker',
      modules: ['dashboard', 'notifications'],
    });

    expect(allowed).toEqual(['dashboard', 'notifications']);
  });

  it('allows user-management page when users module is granted', () => {
    const allowed = resolveAllowedPages({
      ...baseUser,
      role: 'worker',
      modules: ['dashboard', 'users'],
    });

    expect(allowed).toEqual(['dashboard', 'users']);
    expect(isPageAllowed('users', allowed)).toBe(true);
  });

  it('builds module label map from metadata modules', () => {
    const labels = buildModuleLabelMap([
      { id: 'inventory', label: { en: 'Inventory' } },
      { id: 'sales', label: { en: 'Sales' } },
      { id: 'task', label: { en: 'Tasks' } },
      { id: 'user_management', label: { en: 'User Management' } },
      { id: 'unknown', label: {} },
    ]);

    expect(labels).toEqual({
      inventory: 'Inventory',
      sales: 'Sales',
      tasks: 'Tasks',
      users: 'User Management',
    });
  });
});
