import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getFirebaseDb } from '@/lib/firebase';
import { ref as dbRef, onValue } from 'firebase/database';
import { Sale } from '@/lib/types';

interface QRPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Omit<Sale, 'id'> | null;
  onConfirm: (sale: Omit<Sale, 'id'>) => void;
}

export function QRPaymentModal({ open, onOpenChange, sale, onConfirm }: QRPaymentModalProps) {
  const { toast } = useToast();
  const [qrUrl, setQrUrl] = useState<string>('');

  // Real-time listener for QR code URL from Realtime Database
  useEffect(() => {
    if (!open) return;
    const db = getFirebaseDb();
    const urlRef = dbRef(db, 'qrCodeUrl');
    const unsubscribe = onValue(urlRef, (snap) => {
      if (snap.exists()) {
        setQrUrl(snap.val());
      }
    });
    return () => unsubscribe();
  }, [open]);

  const handleConfirm = () => {
    if (!sale) return;
    onConfirm(sale);
    onOpenChange(false);
    toast({
      title: 'Payment Recorded',
      description: 'QR payment confirmed and sale recorded.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">QR Payment</DialogTitle>
          <DialogDescription>
            Scan the QR code below to make the payment for "{sale?.productName || 'product'}".
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {qrUrl ? (
            <img src={qrUrl} alt="Payment QR Code" className="w-full max-w-xs mx-auto object-contain rounded border p-2 bg-white" />
          ) : (
            <p className="text-sm text-center text-muted-foreground">QR code is not available. Please contact the administrator.</p>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleConfirm} disabled={!qrUrl} className="w-full">
            Payment Completed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
