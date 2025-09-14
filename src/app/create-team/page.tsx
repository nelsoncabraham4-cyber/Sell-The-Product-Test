'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';

export default function CreateTeamPage() {
  const { auth, setTeamName, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [teamName, setTeamNameState] = useState('');

  useEffect(() => {
    if (!isLoading && auth && !auth.needsTeamName) {
      router.push('/dashboard');
    }
     if (!isLoading && !auth) {
      router.push('/login');
    }
  }, [auth, isLoading, router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast({
        title: 'Invalid Name',
        description: 'Please enter a valid team name.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await setTeamName(teamName);
      toast({
        title: 'Welcome!',
        description: `Your team "${teamName}" has been created.`,
      });
      router.push('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create team. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading || !auth || !auth.needsTeamName) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-secondary rounded-full p-3 w-fit mb-4">
            <Users className="w-8 h-8 text-secondary-foreground" />
          </div>
          <CardTitle className="font-headline text-3xl">Choose Your Team Name</CardTitle>
          <CardDescription>
            Welcome! One last step: enter a name for your team. This will be displayed on the leaderboard and cannot be changed later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamNameState(e.target.value)}
                placeholder="e.g., The Champions"
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Confirm and Start Playing
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
