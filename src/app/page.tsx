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
        <h1 className="font-headline text-5xl md:text-6xl font-bold text-primary">
          Welcome to Sell The Product
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          The ultimate sales competition platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card className="hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="items-center text-center">
            <User className="w-12 h-12 mb-4 text-secondary" />
            <CardTitle className="font-headline text-2xl">For Users</CardTitle>
            <CardDescription>
              {auth?.type === 'user'
                ? `Welcome back, ${auth.name}! Go to your dashboard.`
                : 'Log in as a team to start selling.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={handleUserClick} size="lg">
              {auth?.type === 'user' ? 'Go to Dashboard' : 'User Login'}
              <User className="ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="items-center text-center">
            <Shield className="w-12 h-12 mb-4 text-accent" />
            <CardTitle className="font-headline text-2xl">For Admins</CardTitle>
            <CardDescription>
              {auth?.type === 'admin'
                ? `Welcome back, ${auth.name}! Go to your dashboard.`
                : 'Log in to manage products and sales.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={handleAdminClick} variant="outline" size="lg">
              {auth?.type === 'admin' ? 'Go to Dashboard' : 'Admin Login'}
              <Shield className="ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
