'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Product, Sale } from '@/lib/types';
import ProductTable from '@/components/product-table';
import Leaderboard from '@/components/leaderboard';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { auth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [sales, setSales] = useLocalStorage<Sale[]>('sales', []);

  useEffect(() => {
    if (!auth) {
      router.push('/login');
    } else if (auth.type !== 'user') {
      router.push('/admin/dashboard');
    }
  }, [auth, router]);

  const handleSale = (sale: Sale, productId: string) => {
    setSales((prevSales) => [...prevSales, sale]);
    setProducts((prevProducts) =>
      prevProducts.map((p) => (p.id === productId ? { ...p, isSold: true } : p))
    );
  };
  
  if (!auth || auth.type !== 'user') {
    return <div className="text-center p-8">Redirecting...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-4xl font-bold text-primary">
          User Dashboard
        </h1>
        <p className="text-muted-foreground">Welcome, {auth.name}! Time to make some sales.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
            <h2 className="font-headline text-2xl font-bold">Products for Sale</h2>
            <ProductTable products={products} onSale={handleSale} isAdmin={false} />
        </div>
        <div className="space-y-4">
            <h2 className="font-headline text-2xl font-bold">Live Leaderboard</h2>
            <Leaderboard sales={sales} />
        </div>
      </div>
    </div>
  );
}
