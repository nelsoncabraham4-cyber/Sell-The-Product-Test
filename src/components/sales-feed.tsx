'use client';

import { useState } from 'react';
import type { Sale } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, Check, X, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EditSaleDialog } from '@/components/edit-sale-dialog';

interface SalesFeedProps {
  sales: Sale[];
  onUpdateSale?: (saleId: string, newSellingPrice: number, newProfit: number, newPaymentMethod?: 'cash' | 'qr') => void;
}

export default function SalesFeed({ sales, onUpdateSale }: SalesFeedProps) {
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  const sortedSales = [...sales].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Activity />
            Sales Feed
          </CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card text-card-foreground">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Sale Price (₹)</TableHead>
                  <TableHead>Actual Price (₹)</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Profit (₹)</TableHead>
                  {onUpdateSale && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSales.length > 0 ? (
                  sortedSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.teamName}</TableCell>
                      <TableCell>{sale.productName}</TableCell>
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
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
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
                      {onUpdateSale && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSaleToEdit(sale)}
                            aria-label={`Edit sale for ${sale.productName}`}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={onUpdateSale ? 7 : 6} className="h-24 text-center">
                      No sales have been made yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {saleToEdit && onUpdateSale && (
        <EditSaleDialog
          sale={saleToEdit}
          isOpen={!!saleToEdit}
          onOpenChange={(open) => {
            if (!open) setSaleToEdit(null);
          }}
          onUpdate={onUpdateSale}
        />
      )}
    </>
  );
}
