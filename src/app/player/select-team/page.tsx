'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Users, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SelectTeamPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { auth, isLoading, setTeamName } = useAuth();
  const [teamNameInput, setTeamNameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!auth) {
      router.push('/login');
    } else if (auth.type === 'admin') {
      router.push('/admin/dashboard');
    } else if (auth.name && !teamNameInput) {
      setTeamNameInput(auth.name);
    }
  }, [auth, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = teamNameInput.trim();
    if (!trimmed) {
      toast({
        title: 'Team Name Required',
        description: 'Please enter a name for your team.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await setTeamName(trimmed);
      toast({
        title: 'Team Name Set!',
        description: `Welcome, ${trimmed}! Redirecting to dashboard...`,
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('[SelectTeamPage] error:', error);
      toast({
        title: 'Failed to set team name',
        description: error?.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !auth || auth.type === 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary rounded-full p-3 w-fit mb-4">
            <Users className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="font-headline text-3xl">Enter Your Team Name</CardTitle>
          <CardDescription>
            {auth.email ? `Logged in as ${auth.email}` : 'Enter your team name to continue.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                type="text"
                placeholder="e.g., Team Alpha"
                value={teamNameInput}
                onChange={(e) => setTeamNameInput(e.target.value)}
                disabled={isSubmitting}
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full font-bold" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
