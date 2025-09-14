'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { User, Chrome } from 'lucide-react';
import { signInAnonymously } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UserLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { auth, isLoading, setTeamName } = useAuth();
  const [name, setName] = useState('');

  useEffect(() => {
    if (!isLoading && auth && auth.type === 'user') {
      router.push('/dashboard');
    }
  }, [auth, isLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
        toast({
            title: 'Team name is required',
            description: 'Please enter a team name to continue.',
            variant: 'destructive'
        });
        return;
    }

    const firebaseAuth = getFirebaseAuth();
    try {
      const userCredential = await signInAnonymously(firebaseAuth);
      await setTeamName(name);
      router.push('/dashboard');
    } catch (error: any) {
        toast({
          title: 'Login Failed',
          description: error.message || "An unexpected error occurred during sign-in.",
          variant: 'destructive',
        });
    }
  };
  
  return (
    <>
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary rounded-full p-3 w-fit mb-4">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="font-headline text-3xl">Player Login</CardTitle>
            <CardDescription>Enter your team name to start playing.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
               <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                    id="teamName"
                    type="text"
                    placeholder="e.g., The Winners"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                </div>
              <Button type="submit" className="w-full" size="lg">
                Enter as Player
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
