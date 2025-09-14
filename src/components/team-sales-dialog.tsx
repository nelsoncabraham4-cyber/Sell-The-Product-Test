'use client';

import type { Sale } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TeamSalesDialogProps {
  teamName: string;
  sales: Sale[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamSalesDialog({ teamName, sales, isOpen, onOpenChange }: TeamSalesDialogProps) {
  const sortedSales = [...sales].sort((a, b) => b.timestamp - a.timestamp);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
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
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSales.length > 0 ? (
                sortedSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.productName}</TableCell>
                    <TableCell>₹{sale.sellingPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      ₹{sale.profit.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    This team has not made any sales yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
