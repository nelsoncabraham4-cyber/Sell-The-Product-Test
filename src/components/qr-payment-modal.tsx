import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getFirebaseDb, getFirebaseStorage } from '@/lib/firebase';
import { ref as dbRef, get, set } from 'firebase/database';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Sale } from '@/lib/types';

interface QRPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  onConfirm: (sale: Sale) => void;
}

export function QRPaymentModal({ open, onOpenChange, sale, onConfirm }: QRPaymentModalProps) {
  const { toast } = useToast();
  const [qrUrl, setQrUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);

  // Load current QR code URL from Realtime Database
  useEffect(() => {
    const fetchQr = async () => {
      const db = getFirebaseDb();
      const urlRef = dbRef(db, 'qrCodeUrl');
      const snap = await get(urlRef);
      if (snap.exists()) {
        setQrUrl(snap.val());
      }
    };
    fetchQr();
  }, []);

  const handleConfirm = () => {
    if (!sale) return;
    onConfirm(sale);
    onOpenChange(false);
    toast({
      title: 'Payment Recorded',
      description: 'QR payment confirmed and sale recorded.',
    });
  };

  // Optional: allow admin to change QR here (not required for player flow)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">QR Payment</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {qrUrl ? (
            <img src={qrUrl} alt="QR Code" className="w-full max-w-sm mx-auto" />
          ) : (
            <p className="text-sm text-muted-foreground">QR code is not available. Please contact the administrator.</p>
          )}
        </DialogDescription>
        <DialogFooter>
          <Button onClick={handleConfirm} disabled={!qrUrl}>
            Payment Completed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
