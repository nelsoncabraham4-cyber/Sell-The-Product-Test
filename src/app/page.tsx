'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { User, Shield } from 'lucide-react';
import Link from 'next/link';
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

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-12">
      <div className="text-center mb-12">
        <h2 className="text-base sm:text-lg md:text-xl text-muted-foreground font-light mb-2">Welcome to</h2>
        <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground whitespace-nowrap">
          Sell The Product
        </h1>
        <p className="mt-4 text-sm text-muted-foreground max-w-2xl mx-auto">
          
        </p>
      </div>

      <div className="flex justify-center w-full max-w-md mb-8">
        <Card className="transition-all duration-300 w-full">
          <CardHeader className="items-center text-center">
            <div className="p-4 bg-secondary rounded-full mb-4">
              <User className="w-12 h-12 text-secondary-foreground" />
            </div>
            <CardTitle className="font-headline text-3xl font-bold">For Players</CardTitle>
            <CardDescription>
              {isClient && auth?.type === 'user'
                ? `Welcome back, ${auth.name}`
                : 'Log in with your team to start selling!'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={handleUserClick} size="lg" className="font-bold">
              {isClient && auth?.type === 'user' ? 'Go to Dashboard' : 'Player Login'}
              <User className="ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="text-center">
        <Link href="/admin/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Admin Login
        </Link>
      </div>
    </div>
  );
}
