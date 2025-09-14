'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { User, Shield, Target, Trophy, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const { auth } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-12 space-y-12">
      <div className="text-center">
        <h2 className="text-base sm:text-lg md:text-xl text-primary font-semibold mb-2">Welcome to</h2>
        <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground whitespace-nowrap">
          Sell The Product
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          A competitive event where your negotiation skills and business acumen are put to the test. Acquire products, sell them for a profit, and race to the top of the leaderboard.
        </p>
      </div>

      <div className="w-full max-w-4xl p-8 bg-card border rounded-lg shadow-lg">
        <h3 className="font-headline text-3xl font-bold text-center mb-6">How The Event Works</h3>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <DollarSign className="w-10 h-10 text-primary" />
            </div>
            <h4 className="text-xl font-semibold mb-2">Acquire & Sell</h4>
            <p className="text-muted-foreground">
              Products are available at a base price. Your job is to negotiate and sell them for the highest price possible.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <Target className="w-10 h-10 text-primary" />
            </div>
            <h4 className="text-xl font-semibold mb-2">Maximize Profit</h4>
            <p className="text-muted-foreground">
              Your score is your total profit. The difference between the base price and your selling price is what counts.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h4 className="text-xl font-semibold mb-2">Climb the Leaderboard</h4>
            <p className="text-muted-foreground">
              Compete against other teams in real-time. The team with the highest total profit at the end wins the event.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardHeader className="items-center text-center">
            <div className="p-4 bg-primary rounded-full mb-4">
              <User className="w-12 h-12 text-primary-foreground" />
            </div>
            <CardTitle className="font-headline text-3xl font-bold">Player Zone</CardTitle>
            <CardDescription>
              {isClient && auth?.type === 'user'
                ? `Welcome back, ${auth.name}!`
                : 'Ready to start selling? Log in now!'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={handleUserClick} size="lg" className="font-bold">
              {isClient && auth?.type === 'user' ? 'Go to Dashboard' : 'Player Login'}
            </Button>
          </CardContent>
        </Card>

         <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardHeader className="items-center text-center">
            <div className="p-4 bg-secondary rounded-full mb-4">
              <Shield className="w-12 h-12 text-secondary-foreground" />
            </div>
            <CardTitle className="font-headline text-3xl font-bold">Admin Hub</CardTitle>
            <CardDescription>
              {isClient && auth?.type === 'admin'
                ? 'Welcome, Administrator'
                : 'Manage products and oversee the event.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={handleAdminClick} variant="secondary" size="lg" className="font-bold">
               {isClient && auth?.type === 'admin' ? 'Go to Dashboard' : 'Admin Login'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
