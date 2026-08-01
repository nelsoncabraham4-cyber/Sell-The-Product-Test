'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getFirebaseDb, getFirebaseStorage } from '@/lib/firebase';
import { ref as dbRef, set, get } from 'firebase/database';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export default function QRManagementPage() {
  const { toast } = useToast();
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  // Load existing QR URL
  useEffect(() => {
    const fetchQr = async () => {
      const db = getFirebaseDb();
      const urlRef = dbRef(db, 'qrCodeUrl');
      const snap = await get(urlRef);
      if (snap.exists()) setCurrentUrl(snap.val());
    };
    fetchQr();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: 'No file selected', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const storage = getFirebaseStorage();
      const storageReference = storageRef(storage, `qr_codes/${file.name}`);
      const uploadTask = uploadBytesResumable(storageReference, file);
      uploadTask.on('state_changed', null, (error) => {
        console.error('Upload error', error);
        toast({ title: 'Upload failed', variant: 'destructive' });
        setUploading(false);
      }, async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const db = getFirebaseDb();
        await set(dbRef(db, 'qrCodeUrl'), downloadURL);
        setCurrentUrl(downloadURL);
        toast({ title: 'QR Code updated' });
        setUploading(false);
        setFile(null);
      });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error uploading QR code', variant: 'destructive' });
      setUploading(false);
    }
  };

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">QR Code Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentUrl ? (
            <img src={currentUrl} alt="Current QR" className="w-48 h-48 object-contain" />
          ) : (
            <p className="text-sm text-muted-foreground">No QR code uploaded yet.</p>
          )}
          <Input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
          <Button onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? 'Uploading...' : 'Upload / Replace QR Code'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
