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
    <div className="relative flex flex-col items-center justify-center min-h-full py-12 overflow-hidden">
       <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 grid grid-cols-2 -space-x-52 opacity-50 dark:opacity-40"
      >
        <div className="h-64 bg-gradient-to-br from-primary via-pink-500 to-purple-600 blur-3xl"></div>
        <div className="h-48 bg-gradient-to-r from-secondary to-cyan-400 blur-3xl"></div>
      </div>
      <div className="text-center mb-12">
        <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter">
          <span className="block text-3xl md:text-4xl font-medium text-muted-foreground mb-2">Welcome to</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
            Sell The Product
          </span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          The ultimate sales competition where legends are born. Ready to join the game?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card className="hover:shadow-primary/30 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-card/80 backdrop-blur-sm">
          <CardHeader className="items-center text-center">
            <User className="w-20 h-20 mb-4 text-secondary" />
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

        <Card className="hover:shadow-accent/20 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-card/80 backdrop-blur-sm">
          <CardHeader className="items-center text-center">
            <Shield className="w-20 h-20 mb-4 text-accent" />
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
