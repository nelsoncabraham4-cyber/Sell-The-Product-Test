'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getFirebaseDb } from '@/lib/firebase';
import { ref as dbRef, set, onValue } from 'firebase/database';
import { Loader2 } from 'lucide-react';

const MAX_FILE_SIZE_MB = 1.5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function QRManagementPage() {
  const { toast } = useToast();
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  // Load existing QR URL from Realtime Database in real-time
  useEffect(() => {
    const db = getFirebaseDb();
    const urlRef = dbRef(db, 'qrCodeUrl');
    const unsubscribe = onValue(urlRef, (snap) => {
      if (snap.exists()) {
        setCurrentUrl(snap.val());
      }
    });
    return () => unsubscribe();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as Data URL string.'));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select an image file to upload.',
        variant: 'destructive',
      });
      return;
    }

    // Image size validation before processing
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);
      toast({
        title: 'Image File Too Large',
        description: `Selected image is ${fileSizeMb}MB. Please select a compressed QR code image under ${MAX_FILE_SIZE_MB}MB.`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // 1. Convert file to Data URL using FileReader
      console.log('[QR Upload] Reading file via FileReader as Data URL...');
      const dataUrl = await readFileAsDataUrl(file);

      // 2. Save Data URL directly to Realtime Database at /qrCodeUrl
      const db = getFirebaseDb();
      await set(dbRef(db, 'qrCodeUrl'), dataUrl);
      setCurrentUrl(dataUrl);

      toast({
        title: 'QR Code Updated',
        description: 'The payment QR code has been saved to Realtime Database and updated successfully.',
      });
      setFile(null);
    } catch (err: any) {
      console.error('[QR Upload RTDB Error]:', err);
      toast({
        title: 'Upload Failed',
        description: err?.message || 'Failed to save QR code to database. Please try again.',
        variant: 'destructive',
      });
    } finally {
      // CRITICAL: Always reset uploading state so button never stays stuck
      setUploading(false);
    }
  };

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">QR Code Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentUrl ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Current Payment QR Code:</p>
              <img src={currentUrl} alt="Current QR" className="w-48 h-48 object-contain rounded border p-2 bg-white" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No QR code uploaded yet.</p>
          )}
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground">Supported formats: PNG, JPG, WebP (Max 1.5MB)</p>
          <Button onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload / Replace QR Code'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
