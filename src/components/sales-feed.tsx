'use client';

import type { Sale } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity } from 'lucide-react';

interface SalesFeedProps {
  sales: Sale[];
}

export default function SalesFeed({ sales }: SalesFeedProps) {
  const sortedSales = [...sales].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Activity />
          Sales Feed
        </CardTitle>
        <CardDescription>A live feed of all sales transactions.</CardDescription>
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
                    <TableHead className="text-right">Profit (₹)</TableHead>
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
                            <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                                ₹{sale.profit.toFixed(2)}
                            </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                        No sales have been made yet.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
