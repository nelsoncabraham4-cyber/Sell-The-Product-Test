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
import type { Sale } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface EditSaleDialogProps {
  sale: Sale;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (saleId: string, newSellingPrice: number, newProfit: number, newPaymentMethod?: 'cash' | 'qr') => void;
}

export function EditSaleDialog({ sale, isOpen, onOpenChange, onUpdate }: EditSaleDialogProps) {
  const [sellingPrice, setSellingPrice] = useState(sale.sellingPrice.toString());
  const [profit, setProfit] = useState(sale.profit);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr' | undefined>(sale.paymentMethod);
  const { toast } = useToast();

  useEffect(() => {
    setSellingPrice(sale.sellingPrice.toString());
    setProfit(sale.profit);
    setPaymentMethod(sale.paymentMethod);
  }, [sale]);

  useEffect(() => {
    const price = parseFloat(sellingPrice);
    if (!isNaN(price)) {
      setProfit(price - sale.actualPrice);
    } else {
      setProfit(0 - sale.actualPrice);
    }
  }, [sellingPrice, sale.actualPrice]);

  const handleUpdate = () => {
    const newSellingPrice = parseFloat(sellingPrice);
    if (isNaN(newSellingPrice) || newSellingPrice < 0) {
      toast({
        title: 'Invalid Price',
        description: 'Please enter a valid positive selling price.',
        variant: 'destructive',
      });
      return;
    }
    const newProfit = newSellingPrice - sale.actualPrice;
    onUpdate(sale.id, newSellingPrice, newProfit, paymentMethod);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Edit Sale: {sale.productName}</DialogTitle>
          <DialogDescription>
            Modify the selling price for this sale. The profit will be recalculated automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="product-name">Product Name</Label>
            <Input id="product-name" value={sale.productName} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="actual-price">Actual Price (₹)</Label>
            <Input id="actual-price" value={sale.actualPrice.toFixed(2)} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="selling-price">Selling Price (₹)</Label>
            <Input
              id="selling-price"
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="e.g., 120.50"
              min="0"
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profit">Calculated Profit (₹)</Label>
            <Input id="profit" value={profit.toFixed(2)} disabled className={profit >= 0 ? 'text-green-600' : 'text-red-600'}/>
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'cash' | 'qr')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="edit-cash" />
                <Label htmlFor="edit-cash">Cash</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="qr" id="edit-qr" />
                <Label htmlFor="edit-qr">QR</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleUpdate}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
