'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth as firebaseAuth } from '@/lib/firebase';

export default function UserLoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !password.trim()) {
      toast({
        title: 'Login Failed',
        description: 'Please enter both team name and password.',
        variant: 'destructive',
      });
      return;
    }
    
    // Create a predictable email format from the team name
    const email = `${teamName.toLowerCase().replace(/\s+/g, '')}@example.com`;

    try {
      // Try to sign in
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const user = userCredential.user;
      login({ type: 'user', name: user.displayName || teamName, uid: user.uid });
    } catch (error: any) {
      // If user not found, create a new one
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
          const user = userCredential.user;
          await updateProfile(user, { displayName: teamName });
          login({ type: 'user', name: teamName, uid: user.uid });
        } catch (createError: any) {
          toast({
            title: 'Registration Failed',
            description: createError.message,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Login Failed',
          description: "An unexpected error occurred.",
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary rounded-full p-3 w-fit mb-4">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="font-headline text-3xl">Player Login or Sign Up</CardTitle>
          <CardDescription>Enter a team name and password. If the team doesn't exist, it will be created.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                placeholder="e.g., The Winners"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Choose a secure password"
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Login / Sign Up
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
