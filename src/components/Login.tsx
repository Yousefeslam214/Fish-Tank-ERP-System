import { useState } from 'react';
import { Fish, Lock, Mail, Phone } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock login - in production this would authenticate with backend
    const mockUser: User = {
      id: 'user-1',
      name: 'Mostafa Adel',
      email: 'mostafa@fishfarm360.com',
      phone: '+20 123 456 7890',
      role: 'admin'
    };
    
    onLogin(mockUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E0F4F5] via-[#05BFDB]/20 to-[#088395]/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-[#0A4D68] p-3 rounded-full">
              <Fish className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">FishFarm360</CardTitle>
          <CardDescription>
            Smart Aquaculture Management Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Login Method</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={loginMethod === 'email' ? 'default' : 'outline'}
                  className={loginMethod === 'email' ? 'flex-1 bg-[#088395] hover:bg-[#0A4D68]' : 'flex-1'}
                  onClick={() => setLoginMethod('email')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button
                  type="button"
                  variant={loginMethod === 'phone' ? 'default' : 'outline'}
                  className={loginMethod === 'phone' ? 'flex-1 bg-[#088395] hover:bg-[#0A4D68]' : 'flex-1'}
                  onClick={() => setLoginMethod('phone')}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Phone
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="identifier">
                {loginMethod === 'email' ? 'Email Address' : 'Phone Number'}
              </Label>
              <Input
                id="identifier"
                type={loginMethod === 'email' ? 'email' : 'tel'}
                placeholder={loginMethod === 'email' ? 'admin@fishfarm360.com' : '+20 123 456 7890'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-[#088395] hover:bg-[#0A4D68]">
              <Lock className="w-4 h-4 mr-2" />
              Sign In
            </Button>

            <div className="text-center text-sm text-gray-600">
              <p>Demo Credentials:</p>
              <p className="text-xs mt-1">Any email/phone + any password</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}