'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface TeamNameDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (teamName: string) => void;
}

export function TeamNameDialog({ isOpen, onOpenChange, onSubmit }: TeamNameDialogProps) {
  const [teamName, setTeamName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setTeamName('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!teamName.trim()) {
      toast({
        title: 'Invalid Name',
        description: 'Please enter a valid team name.',
        variant: 'destructive',
      });
      return;
    }
    onSubmit(teamName);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-headline">Choose Your Team Name</DialogTitle>
          <DialogDescription>
            Welcome! To get started, please enter a name for your team.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="team-name" className="text-right">
              Team Name
            </Label>
            <Input
              id="team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., The Champions"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Confirm and Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
