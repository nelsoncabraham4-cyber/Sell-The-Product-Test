'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import type { Product, Sale } from '@/lib/types';
import ProductTable from '@/components/product-table';
import Leaderboard from '@/components/leaderboard';
import ProductForm from '@/components/product-form';
import SalesFeed from '@/components/sales-feed';
import { ClearHistoryButton } from '@/components/clear-history-button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db } from '@/lib/firebase';
import { ref, onValue, push, remove, set } from 'firebase/database';

export default function AdminDashboardPage() {
  const { auth, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    if (isLoading) return;
    if (!auth) {
      router.push('/admin/login');
    } else if (auth.type !== 'admin') {
      router.push('/dashboard');
    }
  }, [auth, isLoading, router]);

  useEffect(() => {
    if (!auth) return;
    const productsRef = ref(db, 'products');
    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedProducts: Product[] = data ? Object.entries(data).map(([key, value]) => ({ id: key, ...(value as Omit<Product, 'id'>) })) : [];
      setProducts(loadedProducts);
    });

    const salesRef = ref(db, 'sales');
    const unsubscribeSales = onValue(salesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedSales: Sale[] = data ? Object.entries(data).map(([key, value]) => ({ id: key, ...(value as Omit<Sale, 'id'>) })) : [];
      setSales(loadedSales);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeSales();
    };
  }, [auth]);

  const addProduct = (product: Omit<Product, 'id'>) => {
    const productsRef = ref(db, 'products');
    push(productsRef, product);
  };

  const deleteProduct = (productId: string) => {
    const productRef = ref(db, `products/${productId}`);
    remove(productRef);
    toast({
        title: 'Product Deleted',
        description: 'The product has been removed from the list.',
    })
  };

  const clearAllData = () => {
    const productsRef = ref(db, 'products');
    set(productsRef, null);
    const salesRef = ref(db, 'sales');
    set(salesRef, null);
    
    toast({
      title: 'Data Cleared',
      description: 'All products and sales data have been permanently deleted.',
      variant: 'destructive'
    });
  };

  if (isLoading || !auth || auth.type !== 'admin') {
    return <div className="text-center p-8">Redirecting...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-4xl font-bold">Admin Dashboard</h1>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="sales">Sales Feed</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="space-y-8 mt-8">
            <ProductForm addProduct={addProduct} />

            <div className="grid grid-cols-1">
                <div className="space-y-4">
                    <h2 className="font-headline text-2xl font-bold">Product Management</h2>
                    <ProductTable products={products} onDelete={deleteProduct} isAdmin={true} />
                </div>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                    <ClearHistoryButton onClear={clearAllData} />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="sales" className="mt-8">
            <SalesFeed sales={sales} />
        </TabsContent>
        <TabsContent value="leaderboard" className="mt-8">
            <Leaderboard sales={sales} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
