'use client';

import type { Product, Sale } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SellProductDialog } from './sell-product-dialog';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

interface ProductTableProps {
  products: Product[];
  onSale?: (sale: Omit<Sale, 'id'>) => void;
  onDelete?: (productId: string) => void;
  isAdmin: boolean;
}

export default function ProductTable({ products, onSale, onDelete, isAdmin }: ProductTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleSale = (sale: Omit<Sale, 'id'>) => {
    if (onSale) {
        onSale(sale);
    }
    setSelectedProduct(null);
  };

  return (
    <>
      <div className="rounded-lg border bg-card text-card-foreground">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Actual Price (₹)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length > 0 ? (
              products.map((product) => (
                <TableRow
                  key={product.id}
                  className="transition-colors duration-500"
                >
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>₹{product.actualPrice.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">Available</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin ? (
                       <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete && onDelete(product.id)}
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    ) : (
                      <Button size="sm" onClick={() => setSelectedProduct(product)}>
                        Sell
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {selectedProduct && !isAdmin && onSale && (
        <SellProductDialog
          product={selectedProduct}
          onSale={handleSale}
          isOpen={!!selectedProduct}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedProduct(null);
            }
          }}
        />
      )}
    </>
  );
}
