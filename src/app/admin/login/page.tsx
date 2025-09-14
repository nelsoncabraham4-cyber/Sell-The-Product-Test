'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';

const ADMIN_PREDEFINED_PASSWORD = '4321';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [predefinedPassword, setPredefinedPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (predefinedPassword !== ADMIN_PREDEFINED_PASSWORD) {
      toast({
        title: 'Login Failed',
        description: 'Incorrect predefined password.',
        variant: 'destructive',
      });
      return;
    }
    if (!adminName.trim() || !password.trim()) {
      toast({
        title: 'Login Failed',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }
    login({ type: 'admin', name: adminName });
  };

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-accent rounded-full p-3 w-fit mb-4">
            <Shield className="w-8 h-8 text-accent-foreground" />
          </div>
          <CardTitle className="font-headline text-3xl">Admin Login</CardTitle>
          <CardDescription>Enter your credentials for administrative access.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="predefinedPassword">Predefined Password</Label>
              <Input
                id="predefinedPassword"
                type="password"
                placeholder="••••"
                value={predefinedPassword}
                onChange={(e) => setPredefinedPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminName">Your Name</Label>
              <Input
                id="adminName"
                type="text"
                placeholder="e.g., Jane Doe"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Your Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your unique password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" size="lg">
              Login as Admin
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
