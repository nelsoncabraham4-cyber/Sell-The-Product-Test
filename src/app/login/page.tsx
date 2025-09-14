'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UserLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { auth, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isLoading) return;
    if (auth) {
      if (auth.type === 'user' && auth.name) {
        router.push('/dashboard');
      } else if (auth.type === 'user' && !auth.name) {
        router.push('/set-team-name');
      } else if (auth.type === 'admin') {
        router.push('/admin/dashboard');
      }
    }
  }, [auth, isLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({
        title: 'Email and Password required',
        description: 'Please enter your credentials.',
        variant: 'destructive',
      });
      return;
    }

    const firebaseAuth = getFirebaseAuth();
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      // The useEffect will handle redirection.
    } catch (error: any) {
      console.error('Login Error:', error.code, error.message);
      toast({
        title: 'Login Failed',
        description: 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading || auth) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary rounded-full p-3 w-fit mb-4">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="font-headline text-3xl">Player Login</CardTitle>
            <CardDescription>Enter the credentials provided to you.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="player@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" size="lg">
                Login as Player
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
