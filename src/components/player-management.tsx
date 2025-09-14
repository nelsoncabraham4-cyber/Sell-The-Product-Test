'use client';

import { useState } from 'react';
import type { Player } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface PlayerManagementProps {
  players: Player[];
  onEdit: (uid: string, newTeamName: string) => void;
  onDelete: (uid: string) => void;
}

export default function PlayerManagement({ players, onEdit, onDelete }: PlayerManagementProps) {
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [newTeamName, setNewTeamName] = useState('');

  const handleDeleteClick = (player: Player) => {
    setPlayerToDelete(player);
  };

  const handleConfirmDelete = () => {
    if (playerToDelete) {
      onDelete(playerToDelete.uid);
      setPlayerToDelete(null);
    }
  };

  const handleEditClick = (player: Player) => {
    setPlayerToEdit(player);
    setNewTeamName(player.name);
  };

  const handleConfirmEdit = () => {
    if (playerToEdit) {
      onEdit(playerToEdit.uid, newTeamName);
      setPlayerToEdit(null);
      setNewTeamName('');
    }
  };


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Player Management</CardTitle>
          <CardDescription>View, edit, or remove players from the game.</CardDescription>
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
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell>{player.email}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(player)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit Name</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteClick(player)}>
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
                      No players have set a team name yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!playerToDelete} onOpenChange={(open) => !open && setPlayerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <span className="font-bold">{playerToDelete?.name} ({playerToDelete?.email})</span> and all of their associated sales data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Team Name Dialog */}
      <Dialog open={!!playerToEdit} onOpenChange={(open) => !open && setPlayerToEdit(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Team Name</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <p>Editing team name for <span className="font-bold">{playerToEdit?.email}</span>.</p>
                <div className="space-y-2">
                    <Label htmlFor="new-team-name">New Team Name</Label>
                    <Input id="new-team-name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setPlayerToEdit(null)}>Cancel</Button>
                <Button onClick={handleConfirmEdit}>Save Changes</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
