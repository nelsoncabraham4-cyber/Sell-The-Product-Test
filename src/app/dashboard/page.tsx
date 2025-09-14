'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Product, Sale } from '@/lib/types';
import ProductTable from '@/components/product-table';
import Leaderboard from '@/components/leaderboard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const initialProducts: Product[] = [];
const initialSales: Sale[] = [];

export default function DashboardPage() {
  const { auth } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useLocalStorage<Product[]>('products', initialProducts);
  const [sales, setSales] = useLocalStorage<Sale[]>('sales', initialSales);

  useEffect(() => {
    if (!auth) {
      router.push('/login');
    } else if (auth.type !== 'user') {
      router.push('/admin/dashboard');
    }
  }, [auth, router]);

  const handleSale = (sale: Sale) => {
    setSales((prevSales) => [...prevSales, sale]);
  };
  
  const userSales = useMemo(() => {
    if (!auth) return [];
    return sales
      .filter((sale) => sale.teamName === auth.name)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [sales, auth]);

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

       <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="space-y-8 mt-8">
          <div>
            <h2 className="font-headline text-2xl font-bold">Products for Sale</h2>
            <ProductTable products={products} onSale={handleSale} isAdmin={false} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <ShoppingBag />
                Your Sales History
              </CardTitle>
              <CardDescription>A record of all the products you've sold.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Actual Price</TableHead>
                      <TableHead>Your Selling Price</TableHead>
                      <TableHead className="text-right">Your Profit</TableHead>
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
                          You haven't sold any products yet.
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
          <Leaderboard sales={sales} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
