'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Player } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Plus } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface PlayerManagementProps {
  players: Player[];
  onEdit: (uid: string, newTeamName: string) => Promise<void> | void;
  onDelete: (uid: string) => Promise<void> | void;
  onCreate?: (email: string, teamName: string, password: string) => Promise<void> | void;
}

export default function PlayerManagement({ players, onEdit, onDelete, onCreate }: PlayerManagementProps) {
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPlayerEmail, setNewPlayerEmail] = useState('');
  const [newPlayerTeamName, setNewPlayerTeamName] = useState('');
  const [newPlayerPassword, setNewPlayerPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Safeguard: Ensure body pointer-events is always clean when no dialogs are active
  useEffect(() => {
    if (!playerToDelete && !playerToEdit && !isCreateDialogOpen) {
      if (typeof document !== 'undefined' && document.body.style.pointerEvents === 'none') {
        document.body.style.pointerEvents = '';
      }
    }
  }, [playerToDelete, playerToEdit, isCreateDialogOpen]);

  const handleDeleteClick = (player: Player) => {
    setPlayerToDelete(player);
  };

  const handleConfirmDelete = async () => {
    if (!playerToDelete || isSubmitting) return;
    const targetUid = playerToDelete.uid;

    try {
      setIsSubmitting(true);
      await onDelete(targetUid);
      setPlayerToDelete(null);
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message || 'An error occurred while deleting.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setPlayerToDelete(null);
      if (typeof document !== 'undefined') {
        document.body.style.pointerEvents = '';
      }
    }
  };

  const handleEditClick = (player: Player) => {
    setPlayerToEdit(player);
    setNewTeamName(player.name || '');
  };

  const handleConfirmEdit = async () => {
    if (!playerToEdit || isSubmitting) return;
    const trimmedName = newTeamName.trim();

    if (!trimmedName) {
      toast({
        title: 'Invalid Team Name',
        description: 'Team name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await onEdit(playerToEdit.uid, trimmedName);
      setPlayerToEdit(null);
      setNewTeamName('');
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'An error occurred while updating team name.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      if (typeof document !== 'undefined') {
        document.body.style.pointerEvents = '';
      }
    }
  };

  const handleCreatePlayer = async () => {
    if (isSubmitting) return;

    const email = newPlayerEmail.trim();
    const teamName = newPlayerTeamName.trim();
    const password = newPlayerPassword;

    if (!email) {
      toast({
        title: 'Validation Error',
        description: 'Email address is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!teamName) {
      toast({
        title: 'Validation Error',
        description: 'Team name is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!password || password.length < 6) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (onCreate) {
      try {
        setIsSubmitting(true);
        await onCreate(email, teamName, password);
        setIsCreateDialogOpen(false);
        setNewPlayerEmail('');
        setNewPlayerTeamName('');
        setNewPlayerPassword('');
      } catch (error: any) {
        // Error toast is handled by parent/service
      } finally {
        setIsSubmitting(false);
        if (typeof document !== 'undefined') {
          document.body.style.pointerEvents = '';
        }
      }
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Player Management</CardTitle>
          <CardDescription>View, edit, or remove players from the game.</CardDescription>
          {onCreate && (
            <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Player
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card text-card-foreground">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.length > 0 ? (
                  players.map((player) => (
                    <TableRow key={player.uid}>
                      <TableCell className="font-medium">
                        {player.name || <span className="text-muted-foreground italic">Not Set</span>}
                      </TableCell>
                      <TableCell>{player.email}</TableCell>
                      <TableCell className="text-right">
                        {/* modal={false} prevents DropdownMenu from setting body.style.pointerEvents = 'none' */}
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleEditClick(player)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit Name</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() => handleDeleteClick(player)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Remove Player</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No players have registered yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!playerToDelete}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) {
            setPlayerToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{' '}
              <span className="font-bold">
                {playerToDelete?.name || playerToDelete?.email}
              </span>{' '}
              and all of their associated sales data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setPlayerToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isSubmitting}
              onClick={handleConfirmDelete}
            >
              {isSubmitting ? 'Deleting...' : 'Confirm'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Team Name Dialog */}
      <Dialog
        open={!!playerToEdit}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) {
            setPlayerToEdit(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Editing team name for <span className="font-bold text-foreground">{playerToEdit?.email}</span>.
            </p>
            <div className="space-y-2">
              <Label htmlFor="new-team-name">New Team Name</Label>
              <Input
                id="new-team-name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                disabled={isSubmitting}
                placeholder="Enter new team name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPlayerToEdit(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmEdit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Player Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) {
            setIsCreateDialogOpen(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-player-email">Email</Label>
              <Input
                id="new-player-email"
                type="email"
                value={newPlayerEmail}
                onChange={(e) => setNewPlayerEmail(e.target.value)}
                disabled={isSubmitting}
                placeholder="team01@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-player-team-name">Team Name</Label>
              <Input
                id="new-player-team-name"
                value={newPlayerTeamName}
                onChange={(e) => setNewPlayerTeamName(e.target.value)}
                disabled={isSubmitting}
                placeholder="Team Alpha"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-player-password">Password</Label>
              <Input
                id="new-player-password"
                type="password"
                value={newPlayerPassword}
                onChange={(e) => setNewPlayerPassword(e.target.value)}
                disabled={isSubmitting}
                placeholder="At least 6 characters"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePlayer} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Player'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
