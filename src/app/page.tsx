'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { User, Shield } from 'lucide-react';

export default function Home() {
  const { auth } = useAuth();
  const router = useRouter();

  const handleUserClick = () => {
    if (auth?.type === 'user') {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  const handleAdminClick = () => {
    if (auth?.type === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/admin/login');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-12">
      <div className="text-center mb-12">
        <h2 className="text-xl md:text-2xl text-muted-foreground font-light mb-2">Welcome to</h2>
        <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground whitespace-nowrap">
          Sell The Product
        </h1>
        <p className="mt-4 text-md md:text-lg text-muted-foreground max-w-2xl mx-auto">
          The ultimate sales competition where legends are born. Ready to join the game?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card className="transition-all duration-300">
          <CardHeader className="items-center text-center">
            <div className="p-4 bg-secondary rounded-full mb-4">
              <User className="w-12 h-12 text-secondary-foreground" />
            </div>
            <CardTitle className="font-headline text-3xl font-bold">For Players</CardTitle>
            <CardDescription>
              {auth?.type === 'user'
                ? `Welcome back, ${auth.name}! Go to your dashboard.`
                : 'Log in with your team to start selling!'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={handleUserClick} size="lg" className="font-bold">
              {auth?.type === 'user' ? 'Go to Dashboard' : 'Player Login'}
              <User className="ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300">
          <CardHeader className="items-center text-center">
             <div className="p-4 bg-secondary rounded-full mb-4">
                <Shield className="w-12 h-12 text-secondary-foreground" />
            </div>
            <CardTitle className="font-headline text-3xl font-bold">For Admins</CardTitle>
            <CardDescription>
              {auth?.type === 'admin'
                ? `Welcome back, ${auth.name}! Go to your dashboard.`
                : 'Log in to manage the competition.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={handleAdminClick} variant="secondary" size="lg" className="font-bold">
              {auth?.type === 'admin' ? 'Go to Dashboard' : 'Admin Login'}
              <Shield className="ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
