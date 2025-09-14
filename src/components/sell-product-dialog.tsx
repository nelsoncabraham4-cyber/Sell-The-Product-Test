'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Product, Sale } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';

interface SellProductDialogProps {
  product: Product;
  onSale: (sale: Sale, productId: string) => void;
  children: React.ReactNode;
}

export function SellProductDialog({ product, onSale, children }: SellProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [sellingPrice, setSellingPrice] = useState('');
  const { auth } = useAuth();
  const { toast } = useToast();

  const handleSell = () => {
    if (!auth || auth.type !== 'user') {
      toast({ title: 'Error', description: 'You must be logged in as a user to sell.', variant: 'destructive' });
      return;
    }

    const price = parseFloat(sellingPrice);
    if (isNaN(price) || price < 0) {
      toast({
        title: 'Invalid Price',
        description: 'Please enter a valid selling price.',
        variant: 'destructive',
      });
      return;
    }

    const profit = price - product.actualPrice;
    const sale: Sale = {
      id: new Date().toISOString(),
      productId: product.id,
      productName: product.name,
      teamName: auth.name,
      sellingPrice: price,
      actualPrice: product.actualPrice,
      profit,
      timestamp: Date.now(),
    };

    onSale(sale, product.id);
    setOpen(false);
    setSellingPrice('');
    toast({
      title: 'Product Sold!',
      description: `You sold "${product.name}" for ₹${price.toFixed(2)}. Profit: ₹${profit.toFixed(2)}.`,
      className: 'bg-green-100 dark:bg-green-900 border-green-400',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
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
              Selling Price
            </Label>
            <Input
              id="selling-price"
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 2550.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSell}>Confirm Sale</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
