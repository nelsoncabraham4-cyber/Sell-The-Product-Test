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
  const { auth } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setSellingPrice('');
      setPaymentMethod(undefined);
      // Pre-warm QR code in background so it's instant if the user selects QR
      prefetchQrCode();
    }
  }, [isOpen]);

  // Safeguard: Ensure document.body.style.pointerEvents is restored when dialog closes
  useEffect(() => {
    if (!isOpen && typeof document !== 'undefined') {
      const timer = setTimeout(() => {
        if (document.body.style.pointerEvents === 'none') {
          document.body.style.pointerEvents = '';
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Internal fallback state in case onQrSale is not provided by parent
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [pendingSale, setPendingSale] = useState<Omit<Sale, 'id'> | null>(null);

  const handleConfirmInternal = (sale: Omit<Sale, 'id'>) => {
    onSale(sale);
    setPendingSale(null);
    setQrModalOpen(false);
    onOpenChange(false);
    toast({
      title: 'Sale recorded',
      description: `QR payment for "${sale.productName}" completed.`,
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
        // Delegate QR modal flow to parent ProductTable so closing SellDialog doesn't destroy the QR modal
        onQrSale(sale);
        onOpenChange(false);
      } else {
        // Fallback standalone flow: keep SellDialog open or hidden behind QR modal
        setPendingSale(sale);
        setQrModalOpen(true);
      }
    } else {
      onSale(sale);
      toast({
        title: 'Product Sold!',
        description: `You sold "${product.name}" for ₹${price.toFixed(2)}. Profit: ₹${profit.toFixed(2)}.`,
      });
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
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
        </DialogContent>
      </Dialog>

      {/* Standalone fallback QR modal (outside Dialog to avoid nested dialog destruction) */}
      {!onQrSale && pendingSale && (
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
