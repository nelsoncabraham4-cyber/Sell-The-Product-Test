'use client';



import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useToast } from '@/hooks/use-toast';

import { Shield, Eye, EyeOff } from 'lucide-react';

import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { auth, isLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (auth) {
      console.log('[AdminLogin] auth context:', auth);
      if (auth.type === 'admin') {
        router.push('/admin/dashboard');
      } else {
        // Player attempting to use Admin Login - sign out & deny access (do NOT redirect to player login)
        const firebaseAuth = getFirebaseAuth();
        signOut(firebaseAuth).then(() => {
          toast({
            title: 'Access Denied',
            description: 'You do not have admin privileges.',
            variant: 'destructive',
          });
        });
      }
    }
  }, [auth, isLoading, router, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({
        title: 'Credentials required',
        description: 'Please enter your email and password.',
        variant: 'destructive',
      });
      return;
    }

    const firebaseAuth = getFirebaseAuth();
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
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
        const isDeleted = (userData && userData.deleted === true) || deletedSnapshot.exists();

        if (isDeleted) {
          await signOut(firebaseAuth);
          toast({
            title: 'Account Deleted',
            description: 'This account has been permanently deleted by an administrator.',
            variant: 'destructive',
          });
          return;
        }

        const adminEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        const adminEmails = adminEnv
          ? adminEnv.split(',').map((e) => e.trim().toLowerCase()).filter((e) => e)
          : ['admin@example.com'];
        const isEmailAdmin = user.email ? adminEmails.includes(user.email.toLowerCase()) : false;
        const isAdmin = (userData && userData.isAdmin === true) || isEmailAdmin;

        if (!isAdmin) {
          await signOut(firebaseAuth);
          toast({
            title: 'Access Denied',
            description: 'You do not have admin privileges.',
            variant: 'destructive',
          });
          return;
        }

        router.push('/admin/dashboard');
      }
    } catch (error: any) {
      console.error('Admin Login Error:', error);
      toast({
        title: 'Login Failed',
        description: 'Incorrect email or password.',
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

    <div className="flex items-center justify-center py-12">

      <Card className="w-full max-w-sm">

        <CardHeader className="text-center">

          <div className="mx-auto bg-secondary rounded-full p-3 w-fit mb-4">

            <Shield className="w-8 h-8 text-secondary-foreground" />

          </div>

          <CardTitle className="font-headline text-3xl">Admin Login</CardTitle>

          <CardDescription>Use the account you created in the Firebase Console.</CardDescription>

        </CardHeader>

        <CardContent>

          <form onSubmit={handleLogin} className="space-y-6">

            <div className="space-y-2">

              <Label htmlFor="email">Email</Label>

              <Input

                id="email"

                type="email"

                placeholder="admin@example.com"

                value={email}

                onChange={(e) => setEmail(e.target.value)}

                required

              />

            </div>

            <div className="space-y-2">

              <Label htmlFor="password">Password</Label>

              <div className="relative">

                <Input

                  id="password"

                  type={showPassword ? 'text' : 'password'}

                  placeholder="••••••••"

                  value={password}

                  onChange={(e) => setPassword(e.target.value)}

                  required

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

              Login as Admin

            </Button>

          </form>

        </CardContent>

      </Card>

    </div>

  );

}