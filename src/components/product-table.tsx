'use client';

import { useState, useCallback, memo } from 'react';
import type { Product, Sale } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SellProductDialog } from './sell-product-dialog';
import { QRPaymentModal } from './qr-payment-modal';
import { Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

const MAX_SELLING_PRICE = 99999;

interface ProductTableProps {
  products: Product[];
  onSale?: (sale: Omit<Sale, 'id'>) => void;
  onDelete?: (productId: string) => void;
  onEdit?: (productId: string, updatedFields: { name: string; actualPrice: number }) => void;
  isAdmin: boolean;
}

function ProductTableComponent({ products, onSale, onDelete, onEdit, isAdmin }: ProductTableProps) {
  const { toast } = useToast();

  // Sell dialog
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Edit dialog (Bug #6)
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // Delete confirmation dialog (Bug #7)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // QR payment modal state managed at table level so closing SellProductDialog does not destroy it
  const [pendingQrSale, setPendingQrSale] = useState<Omit<Sale, 'id'> | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

  const handleSale = useCallback((sale: Omit<Sale, 'id'>) => {
    if (onSale) {
      onSale(sale);
    }
    setSelectedProduct(null);
  }, [onSale]);

  const handleQrSaleRequest = useCallback((sale: Omit<Sale, 'id'>) => {
    setPendingQrSale(sale);
    setIsQrModalOpen(true);
  }, []);

  const handleQrSaleConfirm = useCallback((confirmedSale: Omit<Sale, 'id'>) => {
    if (onSale) {
      onSale(confirmedSale);
    }
    setIsQrModalOpen(false);
    setPendingQrSale(null);
  }, [onSale]);


  // --- Bug #6: Edit handlers ---
  const handleEditClick = (product: Product) => {
    setProductToEdit(product);
    setEditName(product.name);
    setEditPrice(product.actualPrice.toString());
  };

  const handleConfirmEdit = () => {
    if (!productToEdit || !onEdit) return;
    const trimmedName = editName.trim();
    if (!trimmedName) {
      toast({ title: 'Invalid Name', description: 'Product name cannot be empty.', variant: 'destructive' });
      return;
    }
    const actualPrice = parseFloat(editPrice);
    if (isNaN(actualPrice) || actualPrice <= 0) {
      toast({ title: 'Invalid Price', description: 'Please enter a valid positive actual price.', variant: 'destructive' });
      return;
    }
    if (actualPrice > MAX_SELLING_PRICE) {
      toast({
        title: 'Price Too High',
        description: `Actual price cannot exceed ₹${MAX_SELLING_PRICE.toLocaleString('en-IN')}.`,
        variant: 'destructive',
      });
      return;
    }
    onEdit(productToEdit.id, { name: trimmedName, actualPrice });
    setProductToEdit(null);
    setEditName('');
    setEditPrice('');
  };

  // --- Bug #7: Delete confirmation handlers ---
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
  };

  const handleConfirmDelete = () => {
    if (productToDelete && onDelete) {
      onDelete(productToDelete.id);
    }
    setProductToDelete(null);
  };

  return (
    <>
      <div className="rounded-lg border bg-card text-card-foreground">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Actual Price (₹)</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product.id} className="transition-colors duration-500">
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>₹{product.actualPrice.toFixed(2)}</TableCell>
                  <TableCell>{product.quantity ?? 0}</TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Badge variant="outline">Available</Badge>
                    ) : (
                      (product.quantity ?? 0) > 0 ? (
                        <Badge variant="outline">Available</Badge>
                      ) : (
                        <Badge variant="destructive">Out of Stock</Badge>
                      )
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin ? (
                      <div className="flex items-center justify-end gap-1">
                        {/* Bug #6: Edit button */}
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(product)}
                            aria-label={`Edit ${product.name}`}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                        {/* Bug #7: Delete with confirmation */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(product)}
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setSelectedProduct(product)}
                        disabled={(product.quantity ?? 0) <= 0}
                      >
                        Sell
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No products have been added yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Sell dialog */}
      {selectedProduct && !isAdmin && onSale && (
        <SellProductDialog
          product={selectedProduct}
          onSale={handleSale}
          onQrSale={handleQrSaleRequest}
          isOpen={!!selectedProduct}
          onOpenChange={(open) => {
            if (!open) setSelectedProduct(null);
          }}
        />
      )}

      {/* QR Payment Modal */}
      {pendingQrSale && (
        <QRPaymentModal
          open={isQrModalOpen}
          onOpenChange={(open) => {
            setIsQrModalOpen(open);
            if (!open) {
              setPendingQrSale(null);
              if (typeof document !== 'undefined') {
                setTimeout(() => {
                  if (document.body.style.pointerEvents === 'none') {
                    document.body.style.pointerEvents = '';
                  }
                }, 100);
              }
            }
          }}
          sale={pendingQrSale}
          onConfirm={handleQrSaleConfirm}
        />
      )}

      {/* Bug #6: Edit Product dialog */}
      <Dialog open={!!productToEdit} onOpenChange={(open) => !open && setProductToEdit(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-headline">Edit Product</DialogTitle>
            <DialogDescription>
              Update the product name and/or actual (base) price. Team selling prices are not affected.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-product-name">Product Name</Label>
              <Input
                id="edit-product-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Product name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-actual-price">Actual Price (₹)</Label>
              <Input
                id="edit-actual-price"
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="e.g., 100"
                min="0.01"
                max={MAX_SELLING_PRICE}
                step="0.01"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductToEdit(null)}>Cancel</Button>
            <Button onClick={handleConfirmEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bug #7: Delete confirmation dialog */}
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{' '}
              <span className="font-bold">"{productToDelete?.name}"</span>? This will remove the product
              and all its related records from every team's inventory, sales history, leaderboards, and
              analytics. <strong>This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const ProductTable = memo(ProductTableComponent);
export default ProductTable;

