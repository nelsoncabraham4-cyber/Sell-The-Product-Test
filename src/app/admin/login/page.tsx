'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';

const ADMIN_PREDEFINED_PASSWORD = '4321';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== ADMIN_PREDEFINED_PASSWORD) {
      toast({
        title: 'Login Failed',
        description: 'Incorrect admin password.',
        variant: 'destructive',
      });
      return;
    }
    login({ type: 'admin', name: 'Admin' });
  };

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto bg-secondary rounded-full p-3 w-fit mb-4">
            <Shield className="w-8 h-8 text-secondary-foreground" />
          </div>
          <CardTitle className="font-headline text-3xl">Admin Login</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Login as Admin
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
