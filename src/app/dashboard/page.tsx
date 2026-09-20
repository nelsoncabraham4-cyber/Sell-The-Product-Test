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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingBag, TrendingUp, DollarSign, Wallet, Package, Check, X, FileText, QrCode, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFirebaseDb } from '@/lib/firebase';
import { ref, onValue, push, runTransaction, get, set } from 'firebase/database';
import { calculateTeamStatistics } from '@/lib/statistics';
import { prefetchQrCode, savePlayerQr, subscribePlayerQrUrl } from '@/lib/qr-service';

const Leaderboard = dynamic(() => import('@/components/leaderboard'), {
  ssr: false,
});

export default function DashboardPage() {
  const { auth, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [masterProductsCount, setMasterProductsCount] = useState<number>(0);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState<boolean>(false);
  const [guidelines, setGuidelines] = useState<Array<{ id: string; text: string }>>([]);

  // Payment QR Code state
  const [isQrDialogOpen, setIsQrDialogOpen] = useState<boolean>(false);
  const [currentQrUrl, setCurrentQrUrl] = useState<string>('');
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [isUploadingQr, setIsUploadingQr] = useState<boolean>(false);

  // Listen to the player's own QR code in real time
  useEffect(() => {
    if (!auth?.uid) return;
    const unsub = subscribePlayerQrUrl(auth.uid, (url) => {
      setCurrentQrUrl(url);
    });
    return () => unsub();
  }, [auth?.uid]);

  const handleQrUpload = async () => {
    if (!auth?.uid) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in as a player to update your QR code.',
        variant: 'destructive',
      });
      return;
    }
    if (!qrFile) {
      toast({
        title: 'No file selected',
        description: 'Please select an image file to upload.',
        variant: 'destructive',
      });
      return;
    }
    const MAX_FILE_SIZE_BYTES = 1.5 * 1024 * 1024;
    if (qrFile.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: 'Image File Too Large',
        description: 'Selected image is too large. Please select a QR image under 1.5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingQr(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error('Failed to read file.'));
        };
        reader.onerror = reject;
        reader.readAsDataURL(qrFile);
      });

      await savePlayerQr(auth.uid, dataUrl);
      setCurrentQrUrl(dataUrl);
      setQrFile(null);
      toast({
        title: 'QR Code Updated',
        description: 'Your payment QR code has been saved successfully.',
      });
      setIsQrDialogOpen(false);
    } catch (err: any) {
      toast({
        title: 'Upload Failed',
        description: err?.message || 'Failed to update QR code.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingQr(false);
    }
  };

  // Listen to guidelines in real time (Change 2)
  useEffect(() => {
    const db = getFirebaseDb();
    const guidelinesRef = ref(db, 'guidelines');
    const unsub = onValue(guidelinesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data || Object.keys(data).length === 0) {
        const defaultGuidelines = [
          "Welcome participants! To ensure a fair, competitive, and smooth event, all teams must carefully read and strictly adhere to the following rules:",
          "1. ⏱️ Time Management\n• Strict Schedule: All sales activities must be completed within the allotted time.\n• No Extensions: No late sales or transactions will be accepted under any circumstances.",
          "2. 💸 Pricing & Scoring Policy\n• Border Price Limit: Selling any product below its specified base/border price will incur NEGATIVE POINTS.\n• Unsold Inventory: Remaining unsold items will NOT incur any negative marks or penalties.\n• Leaderboard Criteria: Real-time team rankings are calculated solely on total accumulated profit.",
          "3. 💳 Payment Methods\n• Transactions are strictly allowed through two modes only:\n  - Cash Payments\n  - Digital Payment via Official QR Code",
          "4. 🌐 Real-Time Portal Updates\n• Immediate Logging: Right after a sale, teams must immediately log the transaction on the official portal.\n• Live Updates: Leaderboard rankings will only update after the entry is successfully logged online.",
          "5. 🛡️ Integrity & Fair Play\n• Strict Reconciliation: Final cash in hand (and digital QR receipts) will be physically verified against your portal logs.\n• Zero Tolerance: Any deliberate misreporting or malpractice will lead to IMMEDIATE DISQUALIFICATION.",
          "📌 Quick Tips for Success\n• Double-Check Amounts: Always re-verify sale figures on the portal immediately after each sale to avoid reconciliation errors at the end."
        ];
        setGuidelines(defaultGuidelines.map((text, idx) => ({ id: `default-${idx}`, text })));
      } else {
        const loaded: Array<{ id: string; text: string }> = Object.entries(data).map(([key, value]) => ({ id: key, ...(value as any) }));
        setGuidelines(loaded);
      }
    });
    return () => unsub();
  }, []);

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
    }
  }, [auth, isLoading, router]);

  // Listen to master products in real time (Quantity removed completely)
  useEffect(() => {
    if (!auth) return;
    const db = getFirebaseDb();
    const productsRef = ref(db, 'products');

    const unsubProd = onValue(productsRef, (pSnap) => {
      const prodData = pSnap.val();
      const loaded: Product[] = prodData
        ? Object.entries(prodData).map(([key, value]) => ({
            id: key,
            ...(value as Omit<Product, 'id'>),
          }))
        : [];
      setProducts(loaded);
      setMasterProductsCount(loaded.length);
    });

    return () => unsubProd();
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
    // Record the sale directly without quantity constraints (Change 4)
    const salesRef = ref(db, 'sales');
    try {
      await push(salesRef, sale);
      console.log('[handleSale] sale recorded', sale);
      toast({
        title: 'Sale Recorded',
        description: `Sale for "${sale.productName}" recorded successfully.`,
      });
    } catch (e) {
      console.error('[handleSale] failed to push sale', e);
      toast({
        title: 'Sale Failed',
        description: 'Failed to record sale. Please check your connection.',
        variant: 'destructive',
      });
    }
  }, [auth, toast]);

  
  const userSales = useMemo(() => {
    if (!auth) return [];
    return sales
      .filter((sale) => sale.teamName === (auth.name || ''))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [sales, auth]);

  const availableProducts = useMemo(() => {
    return products;
  }, [products]);

  const teamStats = useMemo(() => {
    if (!auth || !auth.name) return null;
    return calculateTeamStatistics(auth.name, sales);
  }, [sales, auth]);

  if (isLoading || !auth || auth.type !== 'user') {
    return <div className="text-center p-8">Redirecting...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold">
            User Dashboard
          </h1>
          <p className="text-muted-foreground">Welcome{auth.name ? `, ${auth.name}` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsQrDialogOpen(true)}
          >
            <QrCode className="h-4 w-4" />
            Update Payment QR Code
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsGuidelinesOpen(true)}
          >
            <FileText className="h-4 w-4" />
            Guidelines
          </Button>
        </div>
      </div>

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
          <Leaderboard sales={sales} isAdmin={false} userTeamName={auth.name || undefined} totalProductsCount={masterProductsCount} />
        </TabsContent>
      </Tabs>

      {/* Guidelines Modal (Change 2) */}
      <Dialog open={isGuidelinesOpen} onOpenChange={setIsGuidelinesOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline text-lg font-bold flex items-center gap-2">
              📋 Event Guidelines & Rules
            </DialogTitle>
            <DialogDescription>
              Please read and adhere to the guidelines below for a fair and smooth event.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {guidelines.map((g, index) => (
              <div
                key={g.id}
                className="whitespace-pre-line text-sm text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border/50 space-y-1"
              >
                <span className="font-bold text-primary block text-xs uppercase tracking-wide">
                  Guideline #{index + 1}
                </span>
                {g.text}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Management Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Update Payment QR Code
            </DialogTitle>
            <DialogDescription>
              Upload or update the payment QR code used for your team's QR sales.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {currentQrUrl ? (
              <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground mb-2">Current Active QR Code</p>
                <img
                  src={currentQrUrl}
                  alt="Current Payment QR"
                  className="w-44 h-44 object-contain rounded border bg-white p-2"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active QR code currently set.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="dashboard-qr-upload-input">Select New QR Image</Label>
              <Input
                id="dashboard-qr-upload-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setQrFile(e.target.files[0]);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">Supported formats: PNG, JPG, WebP (Max 1.5MB)</p>
            </div>
            <Button
              type="button"
              className="w-full font-bold"
              disabled={!qrFile || isUploadingQr}
              onClick={handleQrUpload}
            >
              {isUploadingQr ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving QR Code...
                </>
              ) : (
                'Upload and Update QR Code'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
