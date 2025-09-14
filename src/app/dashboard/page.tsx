'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import type { Product, Sale } from '@/lib/types';
import ProductTable from '@/components/product-table';
import Leaderboard from '@/components/leaderboard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFirebaseDb } from '@/lib/firebase';
import { ref, onValue, push } from 'firebase/database';


export default function DashboardPage() {
  const { auth, isLoading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!auth) {
      router.push('/login');
    } else if (auth.type === 'admin') {
      router.push('/admin/dashboard');
    } else if (auth.type === 'user' && !auth.name) {
      router.push('/set-team-name');
    }
  }, [auth, isLoading, router]);

  useEffect(() => {
    if (!auth) return;
    const db = getFirebaseDb();
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

  const handleSale = (sale: Omit<Sale, 'id'>) => {
    const db = getFirebaseDb();
    const salesRef = ref(db, 'sales');
    push(salesRef, sale);
  };
  
  const userSales = useMemo(() => {
    if (!auth) return [];
    return sales
      .filter((sale) => sale.teamName === auth.name)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [sales, auth]);

  const availableProducts = useMemo(() => {
    const soldProductIds = new Set(userSales.map(sale => sale.productId));
    return products.filter(product => !soldProductIds.has(product.id));
  }, [products, userSales]);

  if (isLoading || !auth || auth.type !== 'user' || !auth.name) {
    return <div className="text-center p-8">Redirecting...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-4xl font-bold">
          User Dashboard
        </h1>
        <p className="text-muted-foreground">Welcome, {auth.name}</p>
      </div>

       <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="space-y-8 mt-8">
          <div>
            <h2 className="font-headline text-2xl font-bold">Products for Sale</h2>
            <ProductTable products={availableProducts} onSale={handleSale} isAdmin={false} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <ShoppingBag />
                Your Sales History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-card text-card-foreground">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Actual Price (₹)</TableHead>
                      <TableHead>Your Selling Price (₹)</TableHead>
                      <TableHead className="text-right">Your Profit (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userSales.length > 0 ? (
                      userSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">{sale.productName}</TableCell>
                          <TableCell>₹{sale.actualPrice.toFixed(2)}</TableCell>
                          <TableCell>₹{sale.sellingPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                            ₹{sale.profit.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No sales yet. Go make one!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="leaderboard" className="mt-8">
          <Leaderboard sales={sales} isAdmin={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
