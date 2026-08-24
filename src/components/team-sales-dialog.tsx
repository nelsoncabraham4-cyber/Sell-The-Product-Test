'use client';

import { useState } from 'react';
import type { Sale } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from './ui/button';
import { Edit, Check, X } from 'lucide-react';
import { EditSaleDialog } from './edit-sale-dialog';
import { Badge } from '@/components/ui/badge';

interface TeamSalesDialogProps {
  teamName: string;
  sales: Sale[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateSale?: (saleId: string, newSellingPrice: number, newProfit: number, newPaymentMethod?: 'cash' | 'qr') => void;
  onRemoveProduct?: (teamId: string, productId: string) => void;
  isAdmin?: boolean;
}

export function TeamSalesDialog({ teamName, sales, isOpen, onOpenChange, onUpdateSale, onRemoveProduct, isAdmin = false }: TeamSalesDialogProps) {
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const sortedSales = [...sales].sort((a, b) => b.timestamp - a.timestamp);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

  const handleUpdate = (saleId: string, newSellingPrice: number, newProfit: number, newPaymentMethod?: 'cash' | 'qr') => {
    if (onUpdateSale) {
      onUpdateSale(saleId, newSellingPrice, newProfit, newPaymentMethod);
    }
    setEditingSale(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-headline">Sales Details: "{teamName}"</DialogTitle>
            <DialogDescription>
              A list of all sales made by this team. Total profit: <span className="font-bold text-green-500">₹{totalProfit.toFixed(2)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Sale Price</TableHead>
                  <TableHead>Actual Price</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Profit</TableHead>
                  {isAdmin && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSales.length > 0 ? (
                  sortedSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.productName}</TableCell>
                      <TableCell>₹{sale.sellingPrice.toFixed(2)}</TableCell>
                      <TableCell>₹{sale.actualPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            sale.paymentMethod === 'cash'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {sale.paymentMethod === 'cash' ? 'Cash' : sale.paymentMethod === 'qr' ? 'QR' : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
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
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setEditingSale(sale)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center">
                      This team has not made any sales yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
      {editingSale && (
        <EditSaleDialog
          sale={editingSale}
          isOpen={!!editingSale}
          onOpenChange={(open) => !open && setEditingSale(null)}
          onUpdate={handleUpdate}
          onRemoveProduct={onRemoveProduct}
        />
      )}
    </>
  );
}
