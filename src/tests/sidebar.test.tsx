import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Sidebar from '../components/Sidebar';
import type { User } from '../types';

const testUser: User = {
  id: 'user-1',
  name: 'System Admin',
  email: 'admin@fishfarm.local',
  phone: 'N/A',
  role: 'admin',
};

describe('Sidebar', () => {
  it('renders only allowed pages and uses module labels when provided', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <Sidebar
        currentPage="dashboard"
        onPageChange={onPageChange}
        onLogout={vi.fn()}
        user={testUser}
        notifications={[]}
        allowedPages={['dashboard', 'inventory', 'users']}
        moduleLabelMap={{ dashboard: 'Overview', inventory: 'Stock Control' }}
      />,
    );

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Stock Control')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();

    expect(screen.queryByText('Accounting')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /stock control/i }));
    expect(onPageChange).toHaveBeenCalledWith('inventory');
  });
});
