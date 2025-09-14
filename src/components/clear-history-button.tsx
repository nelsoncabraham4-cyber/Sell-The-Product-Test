'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { useState } from 'react';
import { Input } from './ui/input';

interface ClearHistoryButtonProps {
  onClear: () => void;
}

export function ClearHistoryButton({ onClear }: ClearHistoryButtonProps) {
    const [open, setOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const CONFIRM_STRING = 'permanently delete';

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash className="mr-2" />
          Clear All Data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-headline">Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete all products and sales data. To confirm, please type "<b>{CONFIRM_STRING}</b>" below.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={`Type "${CONFIRM_STRING}" to confirm`}
        />
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText('')}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
                onClear();
                setConfirmText('');
            }}
            disabled={confirmText !== CONFIRM_STRING}
          >
            Confirm Deletion
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
