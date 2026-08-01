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



interface SellProductDialogProps {

  product: Product;

  onSale: (sale: Omit<Sale, 'id'>) => void;

  isOpen: boolean;

  onOpenChange: (open: boolean) => void;

}



export function SellProductDialog({ product, onSale, isOpen, onOpenChange }: SellProductDialogProps) {

  const [sellingPrice, setSellingPrice] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr' | undefined>(undefined);

  const { auth } = useAuth();

  const { toast } = useToast();



  useEffect(() => {

    if (isOpen) {

      setSellingPrice('');

      setPaymentMethod(undefined);

    }
  }, [isOpen]);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [pendingSale, setPendingSale] = useState<Omit<Sale, 'id'> | null>(null);

  const handleConfirm = (sale: Omit<Sale, 'id'>) => {
    // Called when QR payment confirmed
    onSale(sale);
    setPendingSale(null);
    setQrModalOpen(false);
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
    if (isNaN(price) || price < 0) {
      toast({ title: 'Invalid Price', description: 'Please enter a valid selling price.', variant: 'destructive' });
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
      setPendingSale(sale);
      setQrModalOpen(true);
    } else {
      onSale(sale);
      toast({
        title: 'Product Sold!',
        description: `You sold "${product.name}" for ₹${price.toFixed(2)}. Profit: ₹${profit.toFixed(2)}.`,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Sell "{product.name}"</DialogTitle>
          <DialogDescription>
            The actual price is ₹{product.actualPrice.toFixed(2)}. Enter the price you sold it for.
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
              placeholder="e.g., 120000.00"
              min="0"
              step="0.01"
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

      {pendingSale && (
        <QRPaymentModal
          open={qrModalOpen}
          onOpenChange={setQrModalOpen}
          sale={pendingSale}
          onConfirm={handleConfirm}
        />
      )}
    </Dialog>
  );
}
