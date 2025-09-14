'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { User, Chrome } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { getFirebaseAuth, GoogleAuthProvider } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { TeamNameDialog } from '@/components/team-name-dialog';

export default function UserLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { auth, setTeamName, isLoading } = useAuth();
  const [isTeamNameDialogOpen, setTeamNameDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && auth) {
      if (auth.needsTeamName) {
        setTeamNameDialogOpen(true);
      } else if (auth.type === 'user') {
        router.push('/dashboard');
      }
    }
  }, [auth, isLoading, router]);

  const handleGoogleLogin = async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Auth state will be handled by onAuthStateChanged in AuthProvider
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          title: 'Login Failed',
          description: error.message || "An unexpected error occurred with Google Sign-In.",
          variant: 'destructive',
        });
      }
    }
  };

  const handleTeamNameSubmit = async (teamName: string) => {
    if (!auth) {
        toast({ title: 'Error', description: 'Authentication not found.', variant: 'destructive' });
        return;
    }
    try {
      await setTeamName(teamName);
      setTeamNameDialogOpen(false);
      toast({
        title: 'Welcome!',
        description: `Your team "${teamName}" has been set up.`,
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to set team name.',
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
            <CardDescription>Sign in with your Google account to start playing.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Button onClick={handleGoogleLogin} className="w-full" size="lg">
                <Chrome className="mr-2" />
                Sign in with Google
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <TeamNameDialog
        isOpen={isTeamNameDialogOpen}
        onOpenChange={(open) => {
            // Prevent closing the dialog by clicking outside
            if (!open) return;
            setTeamNameDialogOpen(open);
        }}
        onSubmit={handleTeamNameSubmit}
      />
    </>
  );
}
