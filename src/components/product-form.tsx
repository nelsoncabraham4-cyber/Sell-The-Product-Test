'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

interface ProductFormProps {
  addProduct: (product: Product) => void;
}

export default function ProductForm({ addProduct }: ProductFormProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actualPrice = parseFloat(price);
    if (!name.trim() || isNaN(actualPrice) || actualPrice <= 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid product name and a positive price.',
        variant: 'destructive',
      });
      return;
    }

    const newProduct: Product = {
      id: new Date().toISOString(),
      name,
      actualPrice,
      isSold: false,
    };

    addProduct(newProduct);
    setName('');
    setPrice('');
    toast({
      title: 'Product Added',
      description: `"${name}" has been added to the list.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <PlusCircle />
          Add New Product
        </CardTitle>
        <CardDescription>Enter product details to add it to the sales table.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full space-y-2">
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              placeholder="e.g., Super Widget"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="w-full md:w-auto space-y-2">
            <Label htmlFor="actualPrice">Actual Price ($)</Label>
            <Input
              id="actualPrice"
              type="number"
              placeholder="e.g., 19.99"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0.01"
              step="0.01"
            />
          </div>
          <Button type="submit" className="w-full md:w-auto">
            Add Product
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
