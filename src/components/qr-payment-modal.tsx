import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Sale } from '@/lib/types';
import { getCachedQrUrl, subscribeQrUrl, prefetchQrCode } from '@/lib/qr-service';
import { Loader2, AlertCircle } from 'lucide-react';

interface QRPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Omit<Sale, 'id'> | null;
  onConfirm: (sale: Omit<Sale, 'id'>) => void;
}

export function QRPaymentModal({ open, onOpenChange, sale, onConfirm }: QRPaymentModalProps) {
  const { toast } = useToast();
  const [qrUrl, setQrUrl] = useState<string>(() => getCachedQrUrl());
  const [loading, setLoading] = useState<boolean>(false);

  // Subscribe to QR code updates
  useEffect(() => {
    const unsub = subscribeQrUrl((url) => {
      if (url) {
        setQrUrl(url);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // When modal opens, make sure QR is fetched if not already cached
  useEffect(() => {
    if (open) {
      const current = getCachedQrUrl();
      if (current) {
        setQrUrl(current);
      } else {
        setLoading(true);
        prefetchQrCode()
          .then((url) => {
            if (url) setQrUrl(url);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [open]);

  // Safeguard: Ensure document.body.style.pointerEvents is restored whenever modal closes
  useEffect(() => {
    if (!open && typeof document !== 'undefined') {
      const timer = setTimeout(() => {
        if (document.body.style.pointerEvents === 'none') {
          document.body.style.pointerEvents = '';
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleConfirm = () => {
    if (!sale) return;
    onConfirm(sale);
    onOpenChange(false);
    toast({
      title: 'Payment Recorded',
      description: `QR payment confirmed for "${sale.productName}".`,
    });
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">QR / UPI Payment</DialogTitle>
          <DialogDescription>
            Scan the QR code below to complete the payment for{' '}
            <span className="font-semibold text-foreground">"{sale?.productName || 'Product'}"</span>.
          </DialogDescription>
        </DialogHeader>

        {sale && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm flex justify-between items-center border">
            <div>
              <span className="text-muted-foreground block text-xs">Selling Price</span>
              <span className="font-bold text-base">₹{sale.sellingPrice.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground block text-xs">Payment Type</span>
              <span className="font-medium text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">UPI / QR</span>
            </div>
          </div>
        )}

        <div className="py-2 flex flex-col items-center justify-center min-h-[220px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">Loading payment QR code...</p>
            </div>
          ) : qrUrl ? (
            <div className="flex flex-col items-center">
              <img
                src={qrUrl}
                alt="Payment QR Code"
                loading="eager"
                decoding="async"
                className="w-56 h-56 object-contain rounded-lg border p-2 bg-white shadow-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">Scan with any UPI app (GPay, PhonePe, Paytm)</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg gap-2">
              <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Payment QR Code Not Configured</p>
              <p className="text-xs text-muted-foreground max-w-[280px]">
                A payment QR code has not been uploaded by the administrator yet. Please ask the administrator to upload one in the Admin Dashboard.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button variant="outline" onClick={handleCancel} type="button">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!qrUrl || loading} type="button">
            Payment Completed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
