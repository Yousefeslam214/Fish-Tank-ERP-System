import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserManagement from '../components/UserManagement';
import type { User } from '../types';
import * as metaApi from '../services/metaApi';
import * as userManagementApi from '../services/userManagementApi';

vi.mock('../services/metaApi', async () => {
  const actual = await vi.importActual<typeof import('../services/metaApi')>('../services/metaApi');
  return {
    ...actual,
    getMetadata: vi.fn(),
  };
});

vi.mock('../services/userManagementApi', async () => {
  const actual = await vi.importActual<typeof import('../services/userManagementApi')>('../services/userManagementApi');
  return {
    ...actual,
    getManagementUsers: vi.fn(),
    getManagementFarms: vi.fn(),
    signupStaffMember: vi.fn(),
    updateUserRoleAndFarms: vi.fn(),
    updateUserModules: vi.fn(),
  };
});

const getMetadataMock = vi.mocked(metaApi.getMetadata);
const getManagementUsersMock = vi.mocked(userManagementApi.getManagementUsers);
const getManagementFarmsMock = vi.mocked(userManagementApi.getManagementFarms);
const signupStaffMemberMock = vi.mocked(userManagementApi.signupStaffMember);
const updateUserRoleAndFarmsMock = vi.mocked(userManagementApi.updateUserRoleAndFarms);
const updateUserModulesMock = vi.mocked(userManagementApi.updateUserModules);

const testUser: User = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@example.com',
  phone: 'N/A',
  role: 'admin',
  modules: ['dashboard', 'users'],
};

const setupBaseMocks = () => {
  getMetadataMock.mockResolvedValue({
    enums: {
      userRoles: [
        { key: 'ADMIN', value: 'ADMIN', label: { en: 'Admin' } },
        { key: 'MANAGER', value: 'MANAGER', label: { en: 'Manager' } },
        { key: 'ACCOUNTANT', value: 'ACCOUNTANT', label: { en: 'Accountant' } },
      ],
      gender: [
        { key: 'MALE', value: 'MALE', label: { en: 'Male' } },
        { key: 'FEMALE', value: 'FEMALE', label: { en: 'Female' } },
      ],
    },
    modules: [
      { id: 'dashboard', label: { en: 'Dashboard' } },
      { id: 'inventory', label: { en: 'Inventory' } },
      { id: 'sales', label: { en: 'Sales' } },
    ],
  });

  getManagementFarmsMock.mockResolvedValue([
    { id: 'farm-1', name: 'Main Farm' },
    { id: 'farm-2', name: 'Delta Farm' },
  ]);

  getManagementUsersMock.mockResolvedValue([
    {
      id: 'user-1',
      email: 'john@fishfarm.com',
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
      role: 'MANAGER',
      status: 'ACTIVE',
      gender: 'MALE',
      farmIds: ['farm-1'],
      farmNames: ['Main Farm'],
      modules: ['inventory'],
    },
  ]);

  signupStaffMemberMock.mockResolvedValue(undefined);
  updateUserRoleAndFarmsMock.mockResolvedValue(undefined);
  updateUserModulesMock.mockResolvedValue(undefined);
};

describe('UserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupBaseMocks();
  });

  it('renders user list with searchable id/name formatting', async () => {
    const user = userEvent.setup();

    render(<UserManagement user={testUser} selectedFarm={null} />);

    expect(await screen.findByText('User Administration')).toBeInTheDocument();
    expect(screen.getByText('John Doe (user)')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search users'), 'inventory');

    expect(screen.getByText('John Doe (user)')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Search users'));
    await user.type(screen.getByLabelText('Search users'), 'unknown-person');

    expect(screen.getByText('No users found.')).toBeInTheDocument();
  });

  it('submits staff registration payload', async () => {
    const user = userEvent.setup();

    render(<UserManagement user={testUser} selectedFarm={null} />);

    await screen.findByText('Staff Registration');

    await user.type(screen.getByLabelText('Email'), 'staff@fishfarm.com');
    await user.type(screen.getByLabelText('Password'), 'SecurePassword123!');
    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.type(screen.getByLabelText('Last Name'), 'Doe');
    await user.selectOptions(screen.getByLabelText('Role'), 'ACCOUNTANT');
    await user.selectOptions(screen.getByLabelText('Gender'), 'MALE');
    await user.type(screen.getByLabelText('Date of Birth'), '1990-05-15');
    await user.type(screen.getByLabelText('Address'), 'Aqua Street 10');

    const farmCheckbox = screen.getByRole('checkbox', { name: 'Main Farm (farm)' });
    await user.click(farmCheckbox);

    await user.click(screen.getByRole('button', { name: 'Create Staff Account' }));

    await waitFor(() => {
      expect(signupStaffMemberMock).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'staff@fishfarm.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'ACCOUNTANT',
          farmIds: ['farm-1'],
        }),
      );
    });
  });

  it('updates user role/farms and module overrides', async () => {
    const user = userEvent.setup();

    render(<UserManagement user={testUser} selectedFarm={null} />);

    await screen.findByText('User Administration');

    await user.click(screen.getByRole('button', { name: 'Edit Role/Farms' }));
    const editDialog = screen.getByRole('dialog', { name: /edit role & farm assignments/i });

    await user.selectOptions(within(editDialog).getByLabelText('Role'), 'ACCOUNTANT');
    await user.click(within(editDialog).getByRole('checkbox', { name: 'Delta Farm (farm)' }));
    await user.click(within(editDialog).getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(updateUserRoleAndFarmsMock).toHaveBeenCalledWith('user-1', {
        role: 'ACCOUNTANT',
        farmIds: ['farm-1', 'farm-2'],
      });
    });

    await user.click(screen.getByRole('button', { name: 'Module Overrides' }));
    const moduleDialog = screen.getByRole('dialog', { name: /module overrides/i });
    await user.selectOptions(within(moduleDialog).getByLabelText('Action'), 'REMOVE');
    await user.click(within(moduleDialog).getByRole('checkbox', { name: 'Inventory (inventory)' }));
    await user.click(within(moduleDialog).getByRole('button', { name: 'Apply Modules' }));

    await waitFor(() => {
      expect(updateUserModulesMock).toHaveBeenCalledWith('user-1', {
        action: 'REMOVE',
        moduleNames: ['inventory'],
      });
    });
  });
});
