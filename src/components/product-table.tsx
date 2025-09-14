'use client';

import type { Product, Sale } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SellProductDialog } from './sell-product-dialog';
import { Trash2 } from 'lucide-react';

interface ProductTableProps {
  products: Product[];
  onSale?: (sale: Sale, productId: string) => void;
  onDelete?: (productId: string) => void;
  isAdmin: boolean;
}

export default function ProductTable({ products, onSale, onDelete, isAdmin }: ProductTableProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead>Actual Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length > 0 ? (
            products.map((product) => (
              <TableRow
                key={product.id}
                data-sold={product.isSold}
                className="transition-colors duration-500 data-[sold=true]:bg-green-100/50 dark:data-[sold=true]:bg-green-900/30"
              >
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>${product.actualPrice.toFixed(2)}</TableCell>
                <TableCell>
                  {product.isSold ? (
                    <Badge variant="destructive">Sold</Badge>
                  ) : (
                    <Badge variant="secondary">Available</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {isAdmin ? (
                     <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete && onDelete(product.id)}
                        disabled={product.isSold}
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                  ) : (
                    <SellProductDialog product={product} onSale={onSale!}>
                      <Button size="sm" disabled={product.isSold}>
                        Sell
                      </Button>
                    </SellProductDialog>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No products available. Admins can add products from their dashboard.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
