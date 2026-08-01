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

import { getFirebaseDb, getFirebaseAuth } from '@/lib/firebase';

import { ref, onValue, push, remove, set, update, query, orderByChild, equalTo, get } from 'firebase/database';

import { createUserWithEmailAndPassword } from 'firebase/auth';

import PlayerManagement from '@/components/player-management';

import { DollarSign, TrendingUp, Package, Wallet, AlertCircle } from 'lucide-react';

import { calculateOverallStatistics, calculateAllTeamStatistics } from '@/lib/statistics';



export default function AdminDashboardPage() {

  const { auth, isLoading } = useAuth();

  const router = useRouter();

  const { toast } = useToast();



  const [products, setProducts] = useState<Product[]>([]);

  const [sales, setSales] = useState<Sale[]>([]);

  const [players, setPlayers] = useState<Player[]>([]);
  const [guidelines, setGuidelines] = useState<Array<{ id: string; text: string }>>([]);



  useEffect(() => {

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



    const usersRef = ref(db, 'users');

    const unsubscribeUsers = onValue(usersRef, (snapshot) => {

        const data = snapshot.val();

        const loadedPlayers: Player[] = data ? Object.entries(data).map(([uid, value]) => ({ uid, ...(value as Omit<Player, 'uid'>) })) : [];

        setPlayers(loadedPlayers);

    });



    const guidelinesRef = ref(db, 'guidelines');
    const unsubscribeGuidelines = onValue(guidelinesRef, (snapshot) => {
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



  const deleteProduct = (productId: string) => {

    const db = getFirebaseDb();

    const productRef = ref(db, `products/${productId}`);

    remove(productRef);

    toast({

        title: 'Product Deleted',

        description: 'The product has been removed from the list.',

    })

  };



  const updateSale = (saleId: string, newSellingPrice: number, newProfit: number, newPaymentMethod?: 'cash' | 'qr') => {

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



  const updatePlayerTeamName = async (uid: string, newTeamName: string) => {

    const db = getFirebaseDb();

    const userRef = ref(db, `users/${uid}`);

    const snapshot = await get(userRef);

    // Preserve existing teamId and isAdmin
    const existingData = snapshot.exists() ? snapshot.val() : {};

    update(userRef, {
      name: newTeamName,
      teamId: existingData.teamId || uid,
      isAdmin: existingData.isAdmin === true,
    })

      .then(() => {

        toast({

          title: 'Player Updated',

          description: "The player's team name has been successfully updated.",

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



  const deletePlayer = async (uid: string) => {

    const db = getFirebaseDb();



    // 1. Remove user from 'users' node

    const userRef = ref(db, `users/${uid}`);

    await remove(userRef);



    // 2. Find and remove all sales by that user

    const salesRef = ref(db, 'sales');

    const salesQuery = query(salesRef, orderByChild('userId'), equalTo(uid));

    const snapshot = await get(salesQuery);

    if (snapshot.exists()) {

        const updates: Record<string, null> = {};

        snapshot.forEach((childSnapshot) => {

            updates[childSnapshot.key!] = null;

        });

        await update(ref(db, 'sales'), updates);

    }



    toast({

        title: 'Player Removed',

        description: 'The player and all their sales data have been removed. They will need to set a new team name if they log in again.',

        variant: 'destructive',

    });

  };



  const createPlayer = async (email: string, teamName: string) => {

    try {

      const auth = getFirebaseAuth();

      const userCredential = await createUserWithEmailAndPassword(auth, email, 'tempPassword123');

      const uid = userCredential.user.uid;

      const db = getFirebaseDb();

      const userRef = ref(db, `users/${uid}`);

      await set(userRef, {

        name: teamName,

        email: email,

        teamId: uid, // Use UID as teamId for simplicity

        isAdmin: false, // Participants are not admins

      });

      toast({

        title: 'Player Created',

        description: `Player ${teamName} has been created. They can now log in with their email. Please tell them to reset their password.`,

      });

    } catch (error: any) {

      toast({

        title: 'Creation Failed',

        description: `An error occurred: ${error.message}`,

        variant: 'destructive',

      });

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

            <Leaderboard sales={sales} isAdmin={true} onUpdateSale={updateSale} />

        </TabsContent>

      </Tabs>

    </div>

  );

}

