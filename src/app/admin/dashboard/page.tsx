'use client';



import { useEffect, useState, useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/auth-context';
import Link from "next/link";

import type { Product, Sale, Player, OverallStatistics, TeamStatistics } from '@/lib/types';

import ProductTable from '@/components/product-table';

import Leaderboard from '@/components/leaderboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import ProductForm from '@/components/product-form';

import SalesFeed from '@/components/sales-feed';

import { ClearHistoryButton } from '@/components/clear-history-button';

import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { getFirebaseDb } from '@/lib/firebase';
import { ref, onValue, push, remove, set, update, query, orderByChild, equalTo, get } from 'firebase/database';
import { createPlayerAccount, getFriendlyAuthErrorMessage } from '@/lib/admin-player-service';
import PlayerManagement from '@/components/player-management';

import { DollarSign, TrendingUp, Package, Wallet, AlertCircle } from 'lucide-react';

import { calculateOverallStatistics, calculateAllTeamStatistics } from '@/lib/statistics';



export default function AdminDashboardPage() {

  const { auth, isLoading } = useAuth();

  const router = useRouter();

  const { toast } = useToast();

  const renderCount = useState(() => ({ count: 0 }))[0];
  renderCount.count++;
  console.log(
    `[ADMIN RENDER #${renderCount.count}] auth.uid:`,
    auth?.uid,
    'pathname:',
    typeof window !== 'undefined' ? window.location.pathname : '',
    'body.pointerEvents:',
    typeof document !== 'undefined' ? document.body.style.pointerEvents : ''
  );

  const [products, setProducts] = useState<Product[]>([]);

  const [sales, setSales] = useState<Sale[]>([]);

  const [players, setPlayers] = useState<Player[]>([]);
  const [guidelines, setGuidelines] = useState<Array<{ id: string; text: string }>>([]);



  useEffect(() => {
    // ── DIAG [EFFECT-AUTH] auth redirect check ────────────────────────────────
    console.log(
      '[DIAG][EFFECT-AUTH] ran — isLoading:', isLoading,
      'auth?.uid:', auth?.uid,
      'auth?.type:', auth?.type,
      'pathname:', typeof window !== 'undefined' ? window.location.pathname : ''
    );

    if (isLoading) {

      return;

    }

    if (!auth) {

      router.push('/admin/login');

    } else if (auth.type !== 'admin') {

      router.push('/dashboard');

    }

  }, [auth, isLoading, router]);



  useEffect(() => {

    if (!auth) return;
    console.log('[ADMIN DASHBOARD USEEFFECT] Subscribing Firebase listeners for auth:', auth.uid);

    const db = getFirebaseDb();

    

    const productsRef = ref(db, 'products');

    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      console.log(
        '[FIREBASE LISTENER - products] Fired — snapshot.exists():', snapshot.exists(),
        'numChildren:', snapshot.exists() ? Object.keys(snapshot.val() ?? {}).length : 0,
        'auth.uid:', auth?.uid,
        'body.pointerEvents:', document.body.style.pointerEvents
      );
      const data = snapshot.val();

      const loadedProducts: Product[] = data ? Object.entries(data).map(([key, value]) => ({ id: key, ...(value as Omit<Product, 'id'>) })) : [];

      setProducts(loadedProducts);

    });



    const salesRef = ref(db, 'sales');

    const unsubscribeSales = onValue(salesRef, (snapshot) => {
      console.log(
        '[FIREBASE LISTENER - sales] Fired — snapshot.exists():', snapshot.exists(),
        'numChildren:', snapshot.exists() ? Object.keys(snapshot.val() ?? {}).length : 0,
        'auth.uid:', auth?.uid,
        'body.pointerEvents:', document.body.style.pointerEvents
      );
      const data = snapshot.val();

      const loadedSales: Sale[] = data ? Object.entries(data).map(([key, value]) => ({ id: key, ...(value as Omit<Sale, 'id'>) })) : [];

      setSales(loadedSales);

    });



    const usersRef = ref(db, 'users');

    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      console.log(
        '[FIREBASE LISTENER - users] Fired — snapshot.exists():', snapshot.exists(),
        'numChildren:', snapshot.exists() ? Object.keys(snapshot.val() ?? {}).length : 0,
        'auth.uid:', auth?.uid,
        'body.pointerEvents:', document.body.style.pointerEvents
      );
      const data = snapshot.val();

      const loadedPlayers: Player[] = data
        ? Object.entries(data)
            .filter(([_, value]: [string, any]) => !value.deleted)
            .map(([uid, value]) => ({ uid, ...(value as Omit<Player, 'uid'>) }))
        : [];

      setPlayers(loadedPlayers);

    });



    const guidelinesRef = ref(db, 'guidelines');
    const unsubscribeGuidelines = onValue(guidelinesRef, (snapshot) => {
      console.log(
        '[FIREBASE LISTENER - guidelines] Fired — snapshot.exists():', snapshot.exists(),
        'auth.uid:', auth?.uid,
        'body.pointerEvents:', document.body.style.pointerEvents
      );
      const data = snapshot.val();
      if (!data) {
        const defaultGuidelines = [
          "Welcome participants! To ensure a fair, competitive, and smooth event, all teams must carefully read and strictly adhere to the following rules:",
          "1. ⏱️ Time Management\n• Strict Schedule: All sales activities must be completed within the allotted time.\n• No Extensions: No late sales or transactions will be accepted under any circumstances.",
          "2. 💸 Pricing & Scoring Policy\n• Border Price Limit: Selling any product below its specified base/border price will incur NEGATIVE POINTS.\n• Unsold Inventory: Remaining unsold items will NOT incur any negative marks or penalties.\n• Leaderboard Criteria: Real-time team rankings are calculated solely on total accumulated profit.",
          "3. 💳 Payment Methods\n• Transactions are strictly allowed through two modes only:\n  - Cash Payments\n  - Digital Payment via Official QR Code",
          "4. 🌐 Real-Time Portal Updates\n• Immediate Logging: Right after a sale, teams must immediately log the transaction on the official portal.\n• Live Updates: Leaderboard rankings will only update after the entry is successfully logged online.",
          "5. 🛡️ Integrity & Fair Play\n• Strict Reconciliation: Final cash in hand (and digital QR receipts) will be physically verified against your portal logs.\n• Zero Tolerance: Any deliberate misreporting or malpractice will lead to IMMEDIATE DISQUALIFICATION.",
          "📌 Quick Tips for Success\n• Double-Check Amounts: Always re-verify sale figures on the portal immediately after each sale to avoid reconciliation errors at the end."
        ];
        defaultGuidelines.forEach((text) => {
          push(guidelinesRef, { text });
        });
      } else {
        const loadedGuidelines: Array<{ id: string; text: string }> = Object.entries(data).map(([key, value]) => ({ id: key, ...(value as any) }));
        setGuidelines(loadedGuidelines);
      }
    });

    return () => {
      console.log('[ADMIN DASHBOARD USEEFFECT CLEANUP] Unsubscribing listeners');
      unsubscribeProducts();

      unsubscribeSales();

      unsubscribeUsers();
      unsubscribeGuidelines();

    };

  }, [auth]);



  const addProduct = (product: Omit<Product, 'id'>) => {

    const db = getFirebaseDb();

    const productsRef = ref(db, 'products');

    push(productsRef, product);

  };



  // Bug #6: Update product name and/or actual price
  const updateProduct = (productId: string, updatedFields: { name: string; actualPrice: number }) => {
    const db = getFirebaseDb();
    const productRef = ref(db, `products/${productId}`);
    update(productRef, updatedFields)
      .then(() => {
        toast({
          title: 'Product Updated',
          description: 'The product has been updated successfully.',
        });
      })
      .catch((error) => {
        toast({
          title: 'Update Failed',
          description: `An error occurred: ${error.message}`,
          variant: 'destructive',
        });
      });
  };



  // Bug #7: Cascade delete — removes master product, all related sales, and all team inventory entries
  const deleteProduct = async (productId: string) => {

    const db = getFirebaseDb();

    try {
      // 1. Remove master product record
      await remove(ref(db, `products/${productId}`));

      // 2. Remove all sales that reference this productId
      const salesSnap = await get(ref(db, 'sales'));
      if (salesSnap.exists()) {
        const salesData = salesSnap.val();
        const saleDeleteUpdates: Record<string, null> = {};
        Object.entries(salesData).forEach(([saleId, saleVal]) => {
          if ((saleVal as any).productId === productId) {
            saleDeleteUpdates[saleId] = null;
          }
        });
        if (Object.keys(saleDeleteUpdates).length > 0) {
          await update(ref(db, 'sales'), saleDeleteUpdates);
        }
      }

      // 3. Remove product from all teams' inventory
      const invSnap = await get(ref(db, 'teamInventory'));
      if (invSnap.exists()) {
        const invData = invSnap.val();
        const invDeleteUpdates: Record<string, null> = {};
        Object.keys(invData).forEach((teamId) => {
          if (invData[teamId]?.[productId] !== undefined) {
            invDeleteUpdates[`${teamId}/${productId}`] = null;
          }
        });
        if (Object.keys(invDeleteUpdates).length > 0) {
          await update(ref(db, 'teamInventory'), invDeleteUpdates);
        }
      }

      toast({
        title: 'Product Deleted',
        description: 'The product and all related records have been permanently removed.',
        variant: 'destructive',
      });
    } catch (error: any) {
      toast({
        title: 'Deletion Failed',
        description: `An error occurred: ${error.message}`,
        variant: 'destructive',
      });
    }

  };



  const updateSale = (saleId: string, newSellingPrice: number, newProfit: number, newPaymentMethod?: 'cash' | 'qr') => {
    if (isNaN(newSellingPrice) || newSellingPrice < 1 || newSellingPrice > 10000) {
      toast({
        title: 'Update Failed',
        description: 'Maximum selling price is ₹10,000.',
        variant: 'destructive',
      });
      return;
    }

    const db = getFirebaseDb();

    const saleRef = ref(db, `sales/${saleId}`);

    const updateData: any = { sellingPrice: newSellingPrice, profit: newProfit };

    if (newPaymentMethod) {

      updateData.paymentMethod = newPaymentMethod;

    }

    update(saleRef, updateData)

      .then(() => {

        toast({

          title: 'Sale Updated',

          description: 'The sale details have been successfully updated.',

        });

      })

      .catch((error) => {

        toast({

          title: 'Update Failed',

          description: `An error occurred: ${error.message}`,

          variant: 'destructive',

        });

      });

  };



  const removeProductFromTeam = (teamId: string, productId: string) => {
    const db = getFirebaseDb();
    const inventoryRef = ref(db, `teamInventory/${teamId}/${productId}`);
    get(inventoryRef).then((snapshot) => {
      const currentQty = snapshot.exists() ? (snapshot.val().quantity ?? 0) : 0;
      set(inventoryRef, { quantity: currentQty, removed: true })
        .then(() => {
          toast({
            title: 'Product Removed',
            description: 'The product has been removed from this team\'s inventory.',
          });
        })
        .catch((error) => {
          toast({
            title: 'Removal Failed',
            description: `An error occurred: ${error.message}`,
            variant: 'destructive',
          });
        });
    });
  };



  const updatePlayerTeamName = async (uid: string, newTeamName: string) => {
    const trimmed = newTeamName.trim();
    if (!trimmed) {
      toast({
        title: 'Invalid Team Name',
        description: 'Team name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    const targetPlayer = players.find((p) => p.uid === uid);
    const teamId = targetPlayer?.teamId || uid;
    const db = getFirebaseDb();

    try {
      const updates: Record<string, any> = {
        [`users/${uid}/name`]: trimmed,
      };

      // Also update teamName across any matching sales records in memory
      sales.forEach((sale) => {
        if (sale.userId === uid || (teamId && sale.teamId === teamId)) {
          updates[`sales/${sale.id}/teamName`] = trimmed;
        }
      });

      await update(ref(db), updates);

      toast({
        title: 'Player Updated',
        description: `Team name has been updated to "${trimmed}".`,
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: getFriendlyAuthErrorMessage(error),
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deletePlayer = async (uid: string) => {
    if (auth?.uid && uid === auth.uid) {
      toast({
        title: 'Action Denied',
        description: 'You cannot delete your own admin account.',
        variant: 'destructive',
      });
      return;
    }

    const db = getFirebaseDb();

    // Resolve user details directly from in-memory players state
    const targetPlayer = players.find((p) => p.uid === uid);
    const email = targetPlayer?.email || '';
    const teamName = targetPlayer?.name || '';
    const teamId = targetPlayer?.teamId || uid;

    const updates: Record<string, any> = {};

    // 1. Mark user as deleted in 'users' node
    updates[`users/${uid}`] = {
      deleted: true,
      email: email,
      name: teamName,
      teamId: teamId,
      deletedAt: Date.now(),
    };

    // 2. Persistent deletion marker in 'deletedUsers'
    updates[`deletedUsers/${uid}`] = {
      deleted: true,
      email: email.toLowerCase(),
      deletedAt: Date.now(),
    };

    // 3. Target matching sales for removal directly from in-memory sales state
    const matchingSales = sales.filter(
      (sale) =>
        sale.userId === uid ||
        (teamId && sale.teamId === teamId) ||
        (teamName && sale.teamName === teamName)
    );
    matchingSales.forEach((sale) => {
      updates[`sales/${sale.id}`] = null;
    });

    // 4. Remove team inventory
    if (teamId) {
      updates[`teamInventory/${teamId}`] = null;
    }
    updates[`teamInventory/${uid}`] = null;

    try {
      // Execute single atomic multi-path update
      await update(ref(db), updates);

      toast({
        title: 'Player Removed',
        description: 'The player and all their sales data have been permanently removed.',
        variant: 'destructive',
      });
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: getFriendlyAuthErrorMessage(error),
        variant: 'destructive',
      });
      throw error;
    }
  };

  const createPlayer = async (email: string, teamName: string, password: string) => {
    try {
      await createPlayerAccount(email, teamName, password);

      toast({
        title: 'Player Created',
        description: `Player "${teamName}" (${email}) has been created successfully.`,
      });
    } catch (error: any) {
      const friendlyMsg = getFriendlyAuthErrorMessage(error);
      toast({
        title: 'Creation Failed',
        description: friendlyMsg,
        variant: 'destructive',
      });
      throw error;
    }
  };





  const clearAllData = () => {

    const db = getFirebaseDb();

    set(ref(db, 'products'), null);

    set(ref(db, 'sales'), null);

    set(ref(db, 'users'), null);



    toast({

      title: 'Data Cleared',

      description: 'All products, sales, and user data have been permanently deleted.',

      variant: 'destructive'

    });

  };



  const overallStats = useMemo(() => calculateOverallStatistics(sales), [sales]);

  const teamStats = useMemo(() => calculateAllTeamStatistics(sales), [sales]);



  if (isLoading || !auth || auth.type !== 'admin') {

    return <div className="text-center p-8">Redirecting...</div>;

  }



  return (

    <div className="space-y-8">

      <div>

        <h1 className="font-headline text-4xl font-bold">Admin Dashboard</h1>

      </div>



      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        <Card>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

            <CardTitle className="text-sm font-medium">Total Products Sold</CardTitle>

            <Package className="h-4 w-4 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">{overallStats.totalProductsSold}</div>

            <p className="text-xs text-muted-foreground">

              {overallStats.totalTransactions} transactions

            </p>

          </CardContent>

        </Card>

        <Card>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

            <CardTitle className="text-sm font-medium">Total Turnover</CardTitle>

            <DollarSign className="h-4 w-4 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">₹{overallStats.totalTurnover.toFixed(2)}</div>

          </CardContent>

        </Card>

        <Card>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

            <CardTitle className="text-sm font-medium">Total Collection</CardTitle>

            <Wallet className="h-4 w-4 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">₹{overallStats.totalCollection.toFixed(2)}</div>

            <p className="text-xs text-muted-foreground">

              Cash: ₹{overallStats.totalCashCollection.toFixed(2)} | QR: ₹{overallStats.totalQrCollection.toFixed(2)}

            </p>

          </CardContent>

        </Card>

        <Card>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>

            <TrendingUp className="h-4 w-4 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className={`text-2xl font-bold ${overallStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>

              ₹{overallStats.totalProfit.toFixed(2)}

            </div>

            {overallStats.totalLoss > 0 && (

              <p className="text-xs text-muted-foreground text-red-500">

                Loss: ₹{overallStats.totalLoss.toFixed(2)}

              </p>

            )}

          </CardContent>

        </Card>

      </div>



      <Tabs defaultValue="dashboard">

        <TabsList className="grid w-full grid-cols-4">

            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>

            <TabsTrigger value="players">Players</TabsTrigger>

            <TabsTrigger value="sales">Sales Feed</TabsTrigger>

            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>

        </TabsList>

        <TabsContent value="dashboard" className="space-y-8 mt-8">

            <ProductForm addProduct={addProduct} />



            <div className="grid grid-cols-1">

                <div className="space-y-4">

                    <h2 className="font-headline text-2xl font-bold">Product Management</h2>

                    <ProductTable products={products} onDelete={deleteProduct} onEdit={updateProduct} isAdmin={true} />

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

              {/* Guidelines Management */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">Guidelines Manager</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {guidelines.map((g, index) => (
                      <div key={g.id} className="flex items-center justify-between p-2 border rounded-md bg-background">
                        <span className="text-sm font-semibold truncate flex-1 text-muted-foreground pr-2">
                          Guideline #{index + 1}
                        </span>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newText = prompt('Edit Guideline text:', g.text);
                              if (newText !== null && newText.trim()) {
                                update(ref(getFirebaseDb(), `guidelines/${g.id}`), { text: newText.trim() });
                              }
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm('Delete this guideline?')) {
                                remove(ref(getFirebaseDb(), `guidelines/${g.id}`));
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-2 pt-2 border-t">
                    <Button
                      onClick={() => {
                        const newText = prompt('Enter new guideline text:');
                        if (newText !== null && newText.trim()) {
                          push(ref(getFirebaseDb(), 'guidelines'), { text: newText.trim() });
                        }
                      }}
                      className="w-full"
                    >
                      Add New Guideline
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* QR Code Management */}

            <Card className="mt-4">

              <CardHeader>

                <CardTitle className="font-headline flex items-center gap-2">

                  QR Code Management

                </CardTitle>

              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">Upload or replace the QR code used for payments.</p>
                <Link href="/admin/qr-management">
                  <Button variant="outline">Manage QR Code</Button>
                </Link>
              </CardContent>
            </Card>

        </TabsContent>

        <TabsContent value="players" className="mt-8">

            <PlayerManagement

                players={players}

                onEdit={updatePlayerTeamName}

                onDelete={deletePlayer}

                onCreate={createPlayer}

            />

        </TabsContent>

        <TabsContent value="sales" className="mt-8">

            <SalesFeed sales={sales} />

        </TabsContent>

        <TabsContent value="leaderboard" className="mt-8">

            <Leaderboard
              sales={sales}
              isAdmin={true}
              onUpdateSale={updateSale}
              onRemoveProduct={removeProductFromTeam}
              totalProductsCount={products.length}
            />

        </TabsContent>

      </Tabs>

    </div>

  );

}

