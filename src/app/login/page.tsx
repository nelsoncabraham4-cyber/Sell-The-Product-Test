'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { User, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { useAuth } from '@/contexts/auth-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UserLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { auth, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (auth) {
      if (auth.type === 'admin') {
        // Admin trying to use Player Login - sign out and deny access
        const firebaseAuth = getFirebaseAuth();

        signOut(firebaseAuth).then(() => {
          toast({
            title: 'Access Denied',
            description:
              'This is an Admin account. Please use the Admin Login.',
            variant: 'destructive',
          });

          router.push('/admin/login');
        });
      } else {
        // Player accounts: if team name exists, navigate to dashboard, otherwise to select-team
        if (auth.name) {
          router.push('/dashboard');
        } else {
          router.push('/player/select-team');
        }
      }
    }
  }, [auth, isLoading, router, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password.trim()) {
      toast({
        title: 'Email and Password required',
        description: 'Please enter your credentials.',
        variant: 'destructive',
      });
      return;
    }

    const firebaseAuth = getFirebaseAuth();

    try {
      await signInWithEmailAndPassword(firebaseAuth, trimmedEmail, password);

      // After sign-in, verify user status & role from Realtime Database
      const user = firebaseAuth.currentUser;

      if (user) {
        const db = getFirebaseDb();

        const userRef = ref(db, `users/${user.uid}`);
        const deletedUserRef = ref(db, `deletedUsers/${user.uid}`);

        const [snapshot, deletedSnapshot] = await Promise.all([
          get(userRef),
          get(deletedUserRef),
        ]);

        const userData = snapshot.val();

        const isDeleted =
          (userData && userData.deleted === true) ||
          deletedSnapshot.exists();

        if (isDeleted) {
          // Account was deleted – block access
          await signOut(firebaseAuth);

          toast({
            title: 'Account Deleted',
            description:
              'This account has been permanently deleted by an administrator and cannot be accessed.',
            variant: 'destructive',
          });

          return;
        }

        if (userData?.isAdmin) {
          // Admin attempted player login – block access
          await signOut(firebaseAuth);

          toast({
            title: 'Access Denied',
            description: 'Admin accounts must use Admin Login.',
            variant: 'destructive',
          });

          router.push('/admin/login');
          return;
        }
      }
    } catch (error: any) {
      console.error('Login Error:', error.code, error.message);

      toast({
        title: 'Login Failed',
        description: 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Clear form fields on mount
  useEffect(() => {
    setEmail('');
    setPassword('');
  }, []);

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

            <CardTitle className="font-headline text-3xl">
              Player Login
            </CardTitle>

            <CardDescription>
              Enter the credentials provided to you.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
              <div className="space-y-2">
                <Label htmlFor="player-email">Email</Label>

                <Input
                  id="player-email"
                  name="player_login_email"
                  type="email"
                  placeholder="player@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="player-password">Password</Label>

                <div className="relative">
                  <Input
                    id="player-password"
                    name="player_login_password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
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