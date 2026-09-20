'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { User, Eye, EyeOff, FileText, QrCode, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import { ref, get, set, onValue } from 'firebase/database';
import { useAuth } from '@/contexts/auth-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UserLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { auth, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Guidelines state (Change 1)
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [guidelines, setGuidelines] = useState<Array<{ id: string; text: string }>>([]);

  // QR Code management state
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [currentQrUrl, setCurrentQrUrl] = useState<string>('');
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  // Listen to guidelines in real time
  useEffect(() => {
    const db = getFirebaseDb();
    const guidelinesRef = ref(db, 'guidelines');
    const unsubscribe = onValue(guidelinesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        const defaultGuidelines = [
          "Welcome participants! To ensure a fair, competitive, and smooth event, all teams must carefully read and strictly adhere to the following rules:",
          "1. ⏱️ Time Management\n• Strict Schedule: All sales activities must be completed within the allotted time.\n• No Extensions: No late sales or transactions will be accepted under any circumstances.",
          "2. 💸 Pricing & Scoring Policy\n• Border Price Limit: Selling any product below its specified base/border price will incur NEGATIVE POINTS.\n• Unsold Inventory: Remaining unsold items will NOT incur any negative marks or penalties.\n• Leaderboard Criteria: Real-time team rankings are calculated solely on total accumulated profit.",
          "3. 💳 Payment Methods\n• Transactions are strictly allowed through two modes only:\n  - Cash Payments\n  - Digital Payment via Official QR Code",
          "4. 🌐 Real-Time Portal Updates\n• Immediate Logging: Right after a sale, teams must immediately log the transaction on the official portal.\n• Live Updates: Leaderboard rankings will only update after the entry is successfully logged online.",
          "5. 🤝 Fair Play & Integrity\n• Prohibited Behavior: Fraudulent entries, deceptive pricing, or system tampering will result in immediate disqualification.\n• Sportsman Spirit: Maintain professional conduct with buyers, competitors, and organizers throughout the event."
        ];
        setGuidelines(defaultGuidelines.map((text, idx) => ({ id: `default-${idx}`, text })));
      } else {
        const loadedGuidelines: Array<{ id: string; text: string }> = Object.entries(data).map(([key, value]) => ({ id: key, ...(value as any) }));
        setGuidelines(loadedGuidelines);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to active QR code in real time
  useEffect(() => {
    const db = getFirebaseDb();
    const urlRef = ref(db, 'qrCodeUrl');
    const unsubscribe = onValue(urlRef, (snap) => {
      if (snap.exists()) {
        setCurrentQrUrl(snap.val());
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (auth) {
      if (auth.type === 'admin') {
        // Admin trying to use Player Login - sign out and deny access
        const firebaseAuth = getFirebaseAuth();

        signOut(firebaseAuth).then(() => {
          toast({
            title: 'Access Denied',
            description:
              'This is an Admin account. Please use the Admin Login.',
            variant: 'destructive',
          });

          router.push('/admin/login');
        });
      } else {
        // Player accounts: navigate directly to dashboard (Change 6)
        router.push('/dashboard');
      }
    }
  }, [auth, isLoading, router, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password.trim()) {
      toast({
        title: 'Email and Password required',
        description: 'Please enter your credentials.',
        variant: 'destructive',
      });
      return;
    }

    const firebaseAuth = getFirebaseAuth();

    try {
      await signInWithEmailAndPassword(firebaseAuth, trimmedEmail, password);

      // After sign-in, verify user status & role from Realtime Database
      const user = firebaseAuth.currentUser;

      if (user) {
        const db = getFirebaseDb();

        const userRef = ref(db, `users/${user.uid}`);
        const deletedUserRef = ref(db, `deletedUsers/${user.uid}`);

        const [snapshot, deletedSnapshot] = await Promise.all([
          get(userRef),
          get(deletedUserRef),
        ]);

        const userData = snapshot.val();

        const isDeleted =
          (userData && userData.deleted === true) ||
          deletedSnapshot.exists();

        if (isDeleted) {
          // Account was deleted – block access
          await signOut(firebaseAuth);

          toast({
            title: 'Account Deleted',
            description:
              'This account has been permanently deleted by an administrator and cannot be accessed.',
            variant: 'destructive',
          });

          return;
        }

        if (userData?.isAdmin) {
          // Admin attempted player login – block access
          await signOut(firebaseAuth);

          toast({
            title: 'Access Denied',
            description: 'Admin accounts must use Admin Login.',
            variant: 'destructive',
          });

          router.push('/admin/login');
          return;
        }
      }
    } catch (error: any) {
      console.error('Login Error:', error.code, error.message);

      toast({
        title: 'Login Failed',
        description: 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleQrUpload = async () => {
    if (!qrFile) {
      toast({
        title: 'No file selected',
        description: 'Please select an image file to upload.',
        variant: 'destructive',
      });
      return;
    }
    const MAX_FILE_SIZE_BYTES = 1.5 * 1024 * 1024;
    if (qrFile.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: 'Image File Too Large',
        description: 'Selected image is too large. Please select a QR image under 1.5MB.',
        variant: 'destructive',
      });
      return;
    }

    const firebaseAuth = getFirebaseAuth();
    let currentUser = firebaseAuth.currentUser;

    if (!currentUser) {
      const trimmedEmail = email.trim();
      if (!trimmedEmail || !password.trim()) {
        toast({
          title: 'Player Credentials Required',
          description: 'Please enter your Player Email and Password in the login form to update your QR code.',
          variant: 'destructive',
        });
        return;
      }
      try {
        const cred = await signInWithEmailAndPassword(firebaseAuth, trimmedEmail, password);
        currentUser = cred.user;
      } catch (authErr: any) {
        toast({
          title: 'Authentication Failed',
          description: 'Invalid player credentials. Please check your email and password.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsUploadingQr(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error('Failed to read file.'));
        };
        reader.onerror = reject;
        reader.readAsDataURL(qrFile);
      });

      const { savePlayerQr } = await import('@/lib/qr-service');
      await savePlayerQr(currentUser.uid, dataUrl);

      setCurrentQrUrl(dataUrl);
      setQrFile(null);
      toast({
        title: 'QR Code Updated',
        description: 'Your payment QR code has been saved successfully.',
      });
      setIsQrDialogOpen(false);
    } catch (err: any) {
      toast({
        title: 'Upload Failed',
        description: err?.message || 'Failed to update QR code.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingQr(false);
    }
  };

  // Clear form fields on mount
  useEffect(() => {
    setEmail('');
    setPassword('');
  }, []);

  if (isLoading || auth) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary rounded-full p-3 w-fit mb-4">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>

            <CardTitle className="font-headline text-3xl">
              Player Login
            </CardTitle>

            <CardDescription>
              Enter the credentials provided to you.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
              <div className="space-y-2">
                <Label htmlFor="player-email">Email</Label>

                <Input
                  id="player-email"
                  name="player_login_email"
                  type="email"
                  placeholder="player@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="player-password">Password</Label>

                <div className="relative">
                  <Input
                    id="player-password"
                    name="player_login_password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Login as Player
              </Button>
            </form>

            <div className="pt-4 border-t mt-6 flex flex-col gap-2">

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
                onClick={() => setIsQrDialogOpen(true)}
              >
                <QrCode className="h-4 w-4" />
                Update Payment QR Code
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* QR Code Management Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Update Payment QR Code
            </DialogTitle>
            <DialogDescription>
              Upload or update the payment QR code used by teams for QR sales.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {currentQrUrl ? (
              <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground mb-2">Current Active QR Code</p>
                <img
                  src={currentQrUrl}
                  alt="Current Payment QR"
                  className="w-44 h-44 object-contain rounded border bg-white p-2"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active QR code currently set.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="qr-upload-input">Select New QR Image</Label>
              <Input
                id="qr-upload-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setQrFile(e.target.files[0]);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">Max file size: 1.5MB</p>
            </div>
            <Button
              type="button"
              className="w-full font-bold"
              disabled={!qrFile || isUploadingQr}
              onClick={handleQrUpload}
            >
              {isUploadingQr ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving QR Code...
                </>
              ) : (
                'Upload & Update QR Code'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}