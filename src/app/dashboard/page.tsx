'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Product, Sale } from '@/lib/types';
import ProductTable from '@/components/product-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, TrendingUp, DollarSign, Wallet, Package, Check, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFirebaseDb } from '@/lib/firebase';
import { ref, onValue, push, runTransaction, get, set } from 'firebase/database';
import { calculateTeamStatistics } from '@/lib/statistics';
import { prefetchQrCode } from '@/lib/qr-service';

const Leaderboard = dynamic(() => import('@/components/leaderboard'), {
  ssr: false,
});

export default function DashboardPage() {
  const { auth, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [guidelines, setGuidelines] = useState<Array<{ id: string; text: string }>>([]);
  const [masterProductsCount, setMasterProductsCount] = useState<number>(0);

  // Pre-warm QR code in background as soon as dashboard loads
  useEffect(() => {
    if (auth?.type === 'user') {
      prefetchQrCode();
    }
  }, [auth]);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!auth) {
      router.push('/login');
    } else if (auth.type === 'admin') {
      router.push('/admin/dashboard');
    } else if (auth.type === 'user' && !auth.name) {
      router.push('/player/select-team');
    }
  }, [auth, isLoading, router]);

  // Efficient dual-listener merge for master products and per-team inventory
  useEffect(() => {
    if (!auth) return;
    const db = getFirebaseDb();
    const teamId = auth.teamId;
    if (!teamId) return;

    let prodData: any = null;
    let invData: any = null;
    let hasProd = false;

    const combineData = () => {
      if (!hasProd) return;
      const combined: Product[] = prodData
        ? Object.entries(prodData)
            .map(([key, value]) => {
              const master = value as any;
              const teamQty = invData?.[key]?.quantity;
              const isRemoved = invData?.[key]?.removed === true;
              return {
                id: key,
                name: master.name,
                actualPrice: master.actualPrice,
                quantity: typeof teamQty === 'number' ? teamQty : (master.quantity ?? 0),
                removed: isRemoved,
              } as any;
            })
            .filter((p) => !p.removed)
        : [];
      setProducts(combined);

      const masterCount = prodData ? Object.keys(prodData).length : 0;
      setMasterProductsCount(masterCount);

      if (prodData && invData !== null) {
        Object.entries(prodData).forEach(([key, val]) => {
          if (!invData?.[key]) {
            const initQty = (val as any).quantity ?? 0;
            set(ref(db, `teamInventory/${teamId}/${key}`), { quantity: initQty });
          }
        });
      }
    };

    const productsRef = ref(db, 'products');
    const teamInvRef = ref(db, `teamInventory/${teamId}`);

    const unsubProd = onValue(productsRef, (pSnap) => {
      prodData = pSnap.val();
      hasProd = true;
      combineData();
    });

    const unsubInv = onValue(teamInvRef, (iSnap) => {
      invData = iSnap.val() || {};
      combineData();
    });

    return () => {
      unsubProd();
      unsubInv();
    };
  }, [auth]);

  // Listen to sales in real time
  useEffect(() => {
    if (!auth) return;
    const db = getFirebaseDb();
    const salesRef = ref(db, 'sales');
    const unsub = onValue(salesRef, (snapshot) => {
      const data = snapshot.val();
      const loaded: Sale[] = data
        ? Object.entries(data).map(([key, value]) => ({ id: key, ...(value as Omit<Sale, 'id'>) }))
        : [];
      setSales(loaded);
    });
    return () => unsub();
  }, [auth]);

  // Listen to guidelines in real time
  useEffect(() => {
    if (!auth) return;
    const db = getFirebaseDb();
    const guidelinesRef = ref(db, 'guidelines');
    const unsub = onValue(guidelinesRef, (snapshot) => {
      const data = snapshot.val();
      const loaded: Array<{ id: string; text: string }> = data
        ? Object.entries(data).map(([key, value]) => ({ id: key, ...(value as any) }))
        : [];
      setGuidelines(loaded);
    });
    return () => unsub();
  }, [auth]);

  const handleSale = useCallback(async (sale: Omit<Sale, 'id'>) => {
    console.log('[handleSale] invoked', sale);
    if (!auth) {
      console.warn('[handleSale] no auth, abort');
      return;
    }
    if (isNaN(sale.sellingPrice) || sale.sellingPrice < 1 || sale.sellingPrice > 10000) {
      toast({
        title: 'Sale Failed',
        description: 'Maximum selling price is ₹10,000.',
        variant: 'destructive',
      });
      return;
    }
    const db = getFirebaseDb();
    const teamId = auth.teamId;
    const inventoryRef = ref(db, `teamInventory/${teamId}/${sale.productId}`);
    const masterRef = ref(db, `products/${sale.productId}`);
    // Get master product quantity for possible initialization
    const masterSnap = await get(masterRef);
    const masterQty = masterSnap.exists() ? (masterSnap.val() as any).quantity ?? 0 : 0;
    console.log('[handleSale] masterQty', masterQty);
    const result = await runTransaction(inventoryRef, (product) => {
      console.log('[transaction] current product data', product);

      const currentQuantity = product ? (product.quantity ?? 0) : masterQty;
      if (currentQuantity <= 0) {
        // Out of stock – abort transaction
        console.log('[transaction] out of stock, aborting');
        return;
      }
      console.log('[transaction] decrementing, new qty', currentQuantity - 1);
      return { quantity: currentQuantity - 1 };
    });
    console.log('[handleSale] transaction result', result);
    if (!result.committed) {
      toast({
        title: 'Out of Stock',
        description: 'Product is out of stock. Sale not recorded.',
        variant: 'destructive',
      });
      return;
    }
    const updatedQty = result.snapshot?.val()?.quantity;
    // If transaction failed to obtain a quantity (e.g., permission error) or went negative
    if (updatedQty === undefined) {
      console.error('[handleSale] transaction returned undefined quantity');
      toast({
        title: 'Error',
        description: 'Unable to process sale. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    // Only treat as out‑of‑stock when quantity would become negative (should not happen)
    if (updatedQty < 0) {
      console.warn('[handleSale] quantity negative after transaction');
      toast({
        title: 'Out of Stock',
        description: 'Product is out of stock. Sale not recorded.',
        variant: 'destructive',
      });
      return;
    }
    // Record the sale – wrap in try/catch to surface errors
    const salesRef = ref(db, 'sales');
    try {
      await push(salesRef, sale);
      console.log('[handleSale] sale recorded', sale);
    } catch (e) {
      console.error('[handleSale] failed to push sale', e);
      alert('Failed to record sale. Please check your connection.');
    }
  }, [auth, toast]);

  
  const userSales = useMemo(() => {
    if (!auth) return [];
    return sales
      .filter((sale) => sale.teamName === auth.name)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [sales, auth]);

  const availableProducts = useMemo(() => {
    return products;
  }, [products]);

  const teamStats = useMemo(() => {
    if (!auth || !auth.name) return null;
    return calculateTeamStatistics(auth.name, sales);
  }, [sales, auth]);

  if (isLoading || !auth || auth.type !== 'user' || !auth.name) {
    return <div className="text-center p-8">Redirecting...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-4xl font-bold">
          User Dashboard
        </h1>
        <p className="text-muted-foreground">Welcome{auth.name ? `, ${auth.name}` : ''}</p>
      </div>

      {guidelines.length > 0 && (
        <Card className="border-l-4 border-l-primary bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-headline text-lg font-bold flex items-center gap-2">
              📋 Event Guidelines & Rules
            </CardTitle>
            <CardDescription>
              Please read and adhere to the guidelines below for a fair and smooth event.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {guidelines.map((g) => (
              <div key={g.id} className="whitespace-pre-line text-sm text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border/50">
                {g.text}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

       <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="space-y-8 mt-8">
          {teamStats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{teamStats.productsSold}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Turnover</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{teamStats.turnover.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Collection</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{teamStats.totalCollection.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    Cash: ₹{teamStats.cashCollection.toFixed(2)} | QR: ₹{teamStats.qrCollection.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${teamStats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{teamStats.profit.toFixed(2)}
                  </div>
                  {teamStats.loss > 0 && (
                    <p className="text-xs text-muted-foreground text-red-500">
                      Loss: ₹{teamStats.loss.toFixed(2)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
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
                      <TableHead>Payment</TableHead>
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
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              sale.paymentMethod === 'cash'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {sale.paymentMethod === 'cash' ? 'Cash' : sale.paymentMethod === 'qr' ? 'QR' : 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {sale.profit >= 0 ? (
                                <>
                                  <Check className="h-4 w-4 text-green-600" />
                                  <span className="font-semibold text-green-600">
                                    +₹{sale.profit.toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <X className="h-4 w-4 text-red-600" />
                                  <span className="font-semibold text-red-600">
                                    -₹{Math.abs(sale.profit).toFixed(2)}
                                  </span>
                                  <Badge variant="destructive" className="text-xs">LOSS</Badge>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
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
          <Leaderboard sales={sales} isAdmin={false} userTeamName={auth.name} totalProductsCount={masterProductsCount} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
