import { FormEvent, useMemo, useState } from 'react';
import { AlertCircle, Fish, Lock, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { User } from '../types';
import { AuthApiError, login, preLogin } from '../services/authApi';
import { mapBackendUserToAppUser, persistAuthSession } from '../services/authSession';
import { AuthLoginResult, FarmInfo } from '../services/authTypes';

interface LoginProps {
  onLogin: (user: User) => void;
}

type LoginStep = 'credentials' | 'farm-selection' | 'otp-required';

const DEFAULT_OTP_MESSAGE = 'OTP verification is required for this account. Complete OTP on the backend-supported channel.';

const normalizeErrorMessage = (error: unknown): string => {
  if (error instanceof AuthApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Unable to sign in right now. Please try again.';
};

const QUICK_LOGINS = [
  { label: 'Admin', role: 'admin' },
  { label: 'Manager', role: 'manager' },
  { label: 'Technican', role: 'technican' },
  { label: 'Sales', role: 'sales' },
  { label: 'Worker', role: 'worker' },
  { label: 'Delivery', role: 'delivery' },
];
const QUICK_LOGIN_PASSWORD = 'FishFarm360!2026';

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [farms, setFarms] = useState<FarmInfo[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [step, setStep] = useState<LoginStep>('credentials');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otpMessage, setOtpMessage] = useState(DEFAULT_OTP_MESSAGE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stepDescription = useMemo(() => {
    if (step === 'farm-selection') {
      return 'Select the farm to continue login.';
    }
    if (step === 'otp-required') {
      return 'OTP verification is required before the session can be finalized.';
    }
    return 'Sign in with your email and password.';
  }, [step]);

  const completeLogin = (result: AuthLoginResult): void => {
    if (result.requiresOTP) {
      setOtpMessage(result.message?.trim() || DEFAULT_OTP_MESSAGE);
      setStep('otp-required');
      return;
    }

    if (!result.user || !result.token) {
      throw new Error('Login response is incomplete. Please try again.');
    }

    const appUser = mapBackendUserToAppUser(result.user);
    persistAuthSession(result, appUser);
    onLogin(appUser);
  };

  const handleCredentialSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setErrorMessage('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await preLogin({
        email: normalizedEmail,
        password,
      });

      if (response.requiresFarmSelection) {
        if (!response.farms?.length) {
          throw new Error('No farms are available for this account.');
        }
        setFarms(response.farms);
        setSelectedFarmId(response.farms[0].id);
        setStep('farm-selection');
        return;
      }

      if (!response.loginResult) {
        throw new Error('Pre-login completed but did not return login data.');
      }

      completeLogin(response.loginResult);
    } catch (error) {
      setErrorMessage(normalizeErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFarmSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFarmId) {
      setErrorMessage('Please select a farm to continue.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await login({
        email: email.trim(),
        password,
        farmId: selectedFarmId,
      });

      completeLogin(result);
    } catch (error) {
      setErrorMessage(normalizeErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetToCredentials = () => {
    setStep('credentials');
    setErrorMessage(null);
    setOtpMessage(DEFAULT_OTP_MESSAGE);
  };

  const handleQuickLogin = (role: string) => {
    const loginEmail = `${role}.test@fishfarm360.local`;
    setEmail(loginEmail);
    setPassword(QUICK_LOGIN_PASSWORD);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E0F4F5] via-[#05BFDB]/20 to-[#088395]/30 p-4">
      <Card className="w-full max-w-md border-white/40 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-[#0A4D68] p-3 rounded-full">
              <Fish className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">FishFarm360</CardTitle>
          <CardDescription>Smart Aquaculture Management Platform</CardDescription>
          <p className="text-xs text-gray-600">{stepDescription}</p>
        </CardHeader>

        <CardContent>
          {errorMessage && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'credentials' && (
            <form onSubmit={handleCredentialSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-[#088395] hover:bg-[#0A4D68]" disabled={isSubmitting}>
                <Lock className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          )}

          {step === 'farm-selection' && (
            <form onSubmit={handleFarmSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="selected-email">Email</Label>
                <Input id="selected-email" value={email} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="farm">Select Farm</Label>
                <select
                  id="farm"
                  name="farm"
                  value={selectedFarmId}
                  onChange={(event) => setSelectedFarmId(event.target.value)}
                  disabled={isSubmitting}
                  className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                >
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={resetToCredentials} disabled={isSubmitting}>
                  Back
                </Button>
                <Button type="submit" className="flex-1 bg-[#088395] hover:bg-[#0A4D68]" disabled={isSubmitting}>
                  <Mail className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Finalizing...' : 'Sign In to Farm'}
                </Button>
              </div>
            </form>
          )}

          {step === 'otp-required' && (
            <div className="space-y-4">
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <p className="font-medium">OTP required</p>
                <p className="mt-1">{otpMessage}</p>
              </div>

              <Button type="button" className="w-full bg-[#088395] hover:bg-[#0A4D68]" onClick={resetToCredentials}>
                Back to Sign In
              </Button>
            </div>
          )}

          {step === 'credentials' && (
            <div className="mt-6">
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Quick Access</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_LOGINS.map((login) => (
                  <Button
                    key={login.role}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs border-[#088395]/30 hover:bg-[#088395]/10 text-[#088395]"
                    onClick={() => handleQuickLogin(login.role)}
                    disabled={isSubmitting}
                  >
                    {login.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
