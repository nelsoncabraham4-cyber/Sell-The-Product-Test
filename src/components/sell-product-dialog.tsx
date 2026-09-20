'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Product, Sale } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { QRPaymentModal } from '@/components/qr-payment-modal';
import { prefetchQrCode } from '@/lib/qr-service';

const MAX_SELLING_PRICE = 10000;

interface SellProductDialogProps {
  product: Product;
  onSale: (sale: Omit<Sale, 'id'>) => void;
  onQrSale?: (sale: Omit<Sale, 'id'>) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SellProductDialog({
  product,
  onSale,
  onQrSale,
  isOpen,
  onOpenChange,
}: SellProductDialogProps) {
  const [sellingPrice, setSellingPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr' | undefined>(undefined);
  const [isConfirmingCash, setIsConfirmingCash] = useState(false);
  const [pendingCashSale, setPendingCashSale] = useState<Omit<Sale, 'id'> | null>(null);
  const { auth } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setSellingPrice('');
      setPaymentMethod(undefined);
      setIsConfirmingCash(false);
      setPendingCashSale(null);
      prefetchQrCode();
    } else {
      setIsConfirmingCash(false);
      setPendingCashSale(null);
    }
  }, [isOpen]);

  // Internal fallback state in case onQrSale is not provided by parent
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [pendingSale, setPendingSale] = useState<Omit<Sale, 'id'> | null>(null);

  const handleConfirmInternal = (sale: Omit<Sale, 'id'>) => {
    onOpenChange(false);
    onSale(sale);
    setPendingSale(null);
    setQrModalOpen(false);
    toast({
      title: 'Sale recorded',
      description: `QR payment for "${sale.productName}" completed.`,
    });
  };

  const handleConfirmCashSale = () => {
    if (!pendingCashSale) return;
    const saleToRecord = pendingCashSale;
    setIsConfirmingCash(false);
    setPendingCashSale(null);
    onOpenChange(false);
    onSale(saleToRecord);
    toast({
      title: 'Product Sold!',
      description: `You sold "${product.name}" for ₹${saleToRecord.sellingPrice.toFixed(2)}. Profit: ₹${saleToRecord.profit.toFixed(2)}.`,
    });
  };

  const handleSell = () => {
    if (!auth || auth.type !== 'user') {
      toast({ title: 'Error', description: 'You must be logged in as a user to sell.', variant: 'destructive' });
      return;
    }
    const price = parseFloat(sellingPrice);
    if (isNaN(price) || price < 1 || price > MAX_SELLING_PRICE || sellingPrice.trim().length > 10) {
      toast({
        title: 'Invalid Price',
        description: 'Maximum selling price is ₹10,000.',
        variant: 'destructive',
      });
      return;
    }
    if (!paymentMethod) {
      toast({ title: 'Payment Method Required', description: 'Please select a payment method (Cash or QR).', variant: 'destructive' });
      return;
    }
    const profit = price - product.actualPrice;
    const sale: Omit<Sale, 'id'> = {
      productId: product.id,
      productName: product.name,
      teamName: auth.name || 'Unknown',
      teamId: auth.teamId || auth.uid,
      sellingPrice: price,
      actualPrice: product.actualPrice,
      profit,
      timestamp: Date.now(),
      userId: auth.uid,
      paymentMethod,
    };

    if (paymentMethod === 'qr') {
      if (onQrSale) {
        onQrSale(sale);
        onOpenChange(false);
      } else {
        setPendingSale(sale);
        setQrModalOpen(true);
      }
    } else {
      setPendingCashSale(sale);
      setIsConfirmingCash(true);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          {!isConfirmingCash ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-headline">Sell "{product.name}"</DialogTitle>
                <DialogDescription>
                  The actual price is ₹{product.actualPrice.toFixed(2)}. Enter the price you sold it for (max ₹{MAX_SELLING_PRICE.toLocaleString('en-IN')}).
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="selling-price" className="text-right">
                    Selling Price (₹)
                  </Label>
                  <Input
                    id="selling-price"
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., 500"
                    min="1"
                    max={MAX_SELLING_PRICE}
                    step="1"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'cash' | 'qr')} className="col-span-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash">Cash</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="qr" id="qr" />
                      <Label htmlFor="qr">QR</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSell}>Confirm Sale</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-headline text-xl">Confirm Payment</DialogTitle>
                <DialogDescription>
                  Are you sure you want to complete this payment?
                </DialogDescription>
              </DialogHeader>
              {pendingCashSale && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm flex justify-between items-center border py-3 my-2">
                  <div>
                    <span className="text-muted-foreground block text-xs">Selling Price</span>
                    <span className="font-bold text-base">₹{pendingCashSale.sellingPrice.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground block text-xs">Payment Type</span>
                    <span className="font-medium text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 px-2 py-0.5 rounded">Cash</span>
                  </div>
                </div>
              )}
              <DialogFooter className="flex gap-2 sm:justify-between mt-4">
                <Button variant="outline" onClick={() => setIsConfirmingCash(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmCashSale}>
                  Confirm
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {!onQrSale && (
        <QRPaymentModal
          open={qrModalOpen}
          onOpenChange={(open) => {
            setQrModalOpen(open);
            if (!open) {
              setPendingSale(null);
              onOpenChange(false);
            }
          }}
          sale={pendingSale}
          onConfirm={handleConfirmInternal}
        />
      )}
    </>
  );
}
