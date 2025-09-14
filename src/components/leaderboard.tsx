'use client';

import { useState } from 'react';
import type { Sale } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Crown, Trophy } from 'lucide-react';
import { TeamSalesDialog } from './team-sales-dialog';

interface LeaderboardProps {
  sales: Sale[];
  isAdmin?: boolean;
  onUpdateSale?: (saleId: string, newSellingPrice: number, newProfit: number) => void;
}

interface TeamStats {
  name: string;
  profit: number;
  lastSaleTimestamp: number;
}

export default function Leaderboard({ sales, isAdmin = false, onUpdateSale }: LeaderboardProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const teamStats = sales.reduce((acc, sale) => {
    if (!acc[sale.teamName]) {
      acc[sale.teamName] = { name: sale.teamName, profit: 0, lastSaleTimestamp: 0 };
    }
    acc[sale.teamName].profit += sale.profit;
    if (sale.timestamp > acc[sale.teamName].lastSaleTimestamp) {
      acc[sale.teamName].lastSaleTimestamp = sale.timestamp;
    }
    return acc;
  }, {} as Record<string, TeamStats>);

  const sortedTeams = Object.values(teamStats).sort((a, b) => {
    if (b.profit !== a.profit) {
      return b.profit - a.profit;
    }
    return a.lastSaleTimestamp - b.lastSaleTimestamp;
  });

  const getRankColor = (rank: number) => {
    if (rank === 0) return 'text-amber-500';
    if (rank === 1) return 'text-slate-500';
    if (rank === 2) return 'text-amber-700';
    return 'text-muted-foreground';
  };

  const handleRowClick = (teamName: string) => {
    if (isAdmin) {
      setSelectedTeam(teamName);
    }
  };

  const teamSales = sales.filter(sale => sale.teamName === selectedTeam);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Trophy />
            Leaderboard
          </CardTitle>
          <CardDescription>
            Teams ranked by total profit.
            {isAdmin && " Click on a team to view their sales."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedTeams.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">Rank</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Total Profit (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTeams.map((team, index) => (
                  <TableRow
                    key={team.name}
                    className={`${index === 0 ? 'bg-secondary' : ''} ${isAdmin ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                    onClick={() => handleRowClick(team.name)}
                  >
                    <TableCell className="font-medium text-center">
                      <div className={`flex justify-center items-center ${getRankColor(index)}`}>
                        {index === 0 && <Crown className="w-5 h-5 mr-1" />}
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      ₹{team.profit.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No sales data available to build the leaderboard.
            </div>
          )}
        </CardContent>
      </Card>
      {selectedTeam && isAdmin && onUpdateSale && (
        <TeamSalesDialog
          teamName={selectedTeam}
          sales={teamSales}
          isOpen={!!selectedTeam}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTeam(null);
            }
          }}
          onUpdateSale={onUpdateSale}
        />
      )}
    </>
  );
}
