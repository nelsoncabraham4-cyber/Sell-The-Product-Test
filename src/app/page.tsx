'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { User, Shield } from 'lucide-react';
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
    <div className="flex flex-col items-center justify-center min-h-full py-12 space-y-8">
      <div className="w-full max-w-md">
        <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardHeader className="items-center text-center p-8">
            <div className="p-4 bg-primary rounded-full mb-4">
              <User className="w-16 h-16 text-primary-foreground" />
            </div>
            <CardTitle className="font-headline text-4xl font-bold">Player Zone</CardTitle>
            <CardDescription className="text-base">
              {isClient && auth?.type === 'user'
                ? `Welcome back, ${auth.name}!`
                : 'Ready to start selling? Log in now!'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button onClick={handleUserClick} size="lg" className="font-bold text-lg px-10 py-6">
              {isClient && auth?.type === 'user' ? 'Go to Dashboard' : 'Player Login'}
            </Button>
          </CardContent>
        </Card>
      </div>

       <Card className="w-full max-w-md bg-transparent border-none shadow-none">
        <CardContent className="flex flex-col items-center justify-center p-4">
          <p className="text-sm text-muted-foreground mb-2">
            {isClient && auth?.type === 'admin'
              ? 'Welcome, Administrator.'
              : 'Need to manage the event?'}
          </p>
          <Button onClick={handleAdminClick} variant="secondary" size="sm" className="font-bold">
             <Shield className="mr-2 h-4 w-4" />
             {isClient && auth?.type === 'admin' ? 'Go to Dashboard' : 'Admin Login'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
