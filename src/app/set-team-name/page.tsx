'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SetTeamNamePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { auth, isLoading, setTeamName } = useAuth();
  const [name, setName] = useState('');

  useEffect(() => {
    if (isLoading) return;
    if (!auth) {
      router.push('/login');
    } else if (auth.name) {
      router.push('/dashboard');
    }
  }, [auth, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: 'Team name is required',
        description: 'Please enter a name for your team.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await setTeamName(name);
      toast({
        title: 'Team Name Set!',
        description: `Welcome, ${name}! Let the games begin.`,
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Failed to set team name',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading || !auth || auth.name) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary rounded-full p-3 w-fit mb-4">
            <Users className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="font-headline text-3xl">Choose Your Team Name</CardTitle>
          <CardDescription>This name will be displayed on the leaderboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
              Save and Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
