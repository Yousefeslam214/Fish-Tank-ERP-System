import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from '../components/Login';
import { User } from '../types';
import { AuthLoginResult, PreLoginResponse } from '../services/authTypes';
import * as authApi from '../services/authApi';
import * as authSession from '../services/authSession';

vi.mock('../services/authApi', async () => {
  const actual = await vi.importActual<typeof import('../services/authApi')>('../services/authApi');
  return {
    ...actual,
    preLogin: vi.fn(),
    login: vi.fn(),
  };
});

vi.mock('../services/authSession', async () => {
  const actual = await vi.importActual<typeof import('../services/authSession')>('../services/authSession');
  return {
    ...actual,
    mapBackendUserToAppUser: vi.fn(),
    persistAuthSession: vi.fn(),
  };
});

const preLoginMock = vi.mocked(authApi.preLogin);
const loginMock = vi.mocked(authApi.login);
const mapBackendUserToAppUserMock = vi.mocked(authSession.mapBackendUserToAppUser);
const persistAuthSessionMock = vi.mocked(authSession.persistAuthSession);

const mappedUser: User = {
  id: 'user-1',
  name: 'Farm Manager',
  email: 'user@example.com',
  phone: 'N/A',
  role: 'manager',
  farmId: 'farm-1',
};

const directLoginResult: AuthLoginResult = {
  token: 'token-1',
  refreshToken: 'refresh-1',
  expiresIn: 3600,
  refreshExpiresIn: 7200,
  user: {
    id: 'user-1',
    email: 'user@example.com',
    role: 'MANAGER',
    farmId: 'farm-1',
  },
  requiresOTP: false,
  accountLocked: false,
  message: 'Login successful',
};

const directPreLoginResponse: PreLoginResponse = {
  requiresFarmSelection: false,
  loginResult: directLoginResult,
};

describe('Login component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mapBackendUserToAppUserMock.mockReturnValue(mappedUser);
  });

  it('renders and validates required fields before calling pre-login', async () => {
    const user = userEvent.setup();
    render(<Login onLogin={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText('Email and password are required.')).toBeInTheDocument();
    expect(preLoginMock).not.toHaveBeenCalled();
  });

  it('completes direct login path from pre-login and persists session', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    preLoginMock.mockResolvedValueOnce(directPreLoginResponse);

    render(<Login onLogin={onLogin} />);

    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'StrongPassword123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(preLoginMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'StrongPassword123!',
      });
    });

    expect(loginMock).not.toHaveBeenCalled();
    expect(mapBackendUserToAppUserMock).toHaveBeenCalledWith(directLoginResult.user);
    expect(persistAuthSessionMock).toHaveBeenCalledWith(directLoginResult, mappedUser);
    expect(onLogin).toHaveBeenCalledWith(mappedUser);
  });

  it('supports farm selection flow then calls login endpoint with selected farm', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();

    preLoginMock.mockResolvedValueOnce({
      requiresFarmSelection: true,
      farms: [
        { id: 'farm-1', name: 'Main Farm' },
        { id: 'farm-2', name: 'Second Farm' },
      ],
    });
    loginMock.mockResolvedValueOnce(directLoginResult);

    render(<Login onLogin={onLogin} />);

    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'StrongPassword123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByLabelText(/select farm/i)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/select farm/i), 'farm-2');
    await user.click(screen.getByRole('button', { name: /sign in to farm/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'StrongPassword123!',
        farmId: 'farm-2',
      });
    });

    expect(onLogin).toHaveBeenCalledWith(mappedUser);
  });

  it('shows OTP required state without finalizing session', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();

    preLoginMock.mockResolvedValueOnce({
      requiresFarmSelection: false,
      loginResult: {
        requiresOTP: true,
        message: 'OTP sent to your registered channel',
      },
    });

    render(<Login onLogin={onLogin} />);

    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'StrongPassword123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/otp required/i)).toBeInTheDocument();
    expect(screen.getByText(/OTP sent to your registered channel/i)).toBeInTheDocument();
    expect(persistAuthSessionMock).not.toHaveBeenCalled();
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('surfaces backend errors and allows retry', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();

    preLoginMock.mockRejectedValueOnce(new Error('Invalid credentials'));
    preLoginMock.mockResolvedValueOnce(directPreLoginResponse);

    render(<Login onLogin={onLogin} />);

    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'WrongPassword!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/password/i));
    await user.type(screen.getByLabelText(/password/i), 'StrongPassword123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith(mappedUser);
    });
  });

  it('disables submit while pre-login request is in flight', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();

    let resolvePromise: ((value: PreLoginResponse) => void) | undefined;
    preLoginMock.mockImplementation(
      () =>
        new Promise<PreLoginResponse>((resolve) => {
          resolvePromise = resolve;
        }),
    );

    render(<Login onLogin={onLogin} />);

    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'StrongPassword123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const submitButton = screen.getByRole('button', { name: /signing in/i });
    expect(submitButton).toBeDisabled();

    resolvePromise?.(directPreLoginResponse);

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith(mappedUser);
    });
  });
});
