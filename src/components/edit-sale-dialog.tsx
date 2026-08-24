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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EditSaleDialogProps {
  sale: Sale;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (saleId: string, newSellingPrice: number, newProfit: number, newPaymentMethod?: 'cash' | 'qr') => void;
  onRemoveProduct?: (teamId: string, productId: string) => void;
}

const MAX_SELLING_PRICE = 10000;

export function EditSaleDialog({ sale, isOpen, onOpenChange, onUpdate, onRemoveProduct }: EditSaleDialogProps) {
  const [sellingPrice, setSellingPrice] = useState(sale.sellingPrice.toString());
  const [profit, setProfit] = useState(sale.profit);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr' | undefined>(sale.paymentMethod);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
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
    if (isNaN(newSellingPrice) || newSellingPrice < 1 || newSellingPrice > MAX_SELLING_PRICE || sellingPrice.trim().length > 10) {
      toast({
        title: 'Invalid Price',
        description: 'Maximum selling price is ₹10,000.',
        variant: 'destructive',
      });
      return;
    }
    const newProfit = newSellingPrice - sale.actualPrice;
    onUpdate(sale.id, newSellingPrice, newProfit, paymentMethod);
    onOpenChange(false);
  };

  const handleConfirmRemove = () => {
    if (onRemoveProduct) {
      onRemoveProduct(sale.teamId, sale.productId);
    }
    setIsConfirmOpen(false);
    onOpenChange(false);
  };

  return (
    <>
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
              placeholder="e.g., 500"
              min="1"
              max={MAX_SELLING_PRICE}
              step="1"
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
        <DialogFooter className="sm:justify-between flex-row justify-between w-full">
          {onRemoveProduct && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setIsConfirmOpen(true)}
              className="w-auto"
            >
              Remove Product
            </Button>
          )}
          <div className="flex space-x-2 w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove this product from this team?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
