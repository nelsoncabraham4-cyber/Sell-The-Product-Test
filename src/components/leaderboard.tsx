'use client';

import { useState, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import type { Sale } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Crown, Trophy } from 'lucide-react';
import { calculateAllTeamStatistics } from '@/lib/statistics';

const TeamSalesDialog = dynamic(() => import('./team-sales-dialog').then((mod) => mod.TeamSalesDialog), {
  ssr: false,
});

interface LeaderboardProps {
  sales: Sale[];
  isAdmin?: boolean;
  userTeamName?: string;
  onUpdateSale?: (saleId: string, newSellingPrice: number, newProfit: number, newPaymentMethod?: 'cash' | 'qr') => void;
  onRemoveProduct?: (teamId: string, productId: string) => void;
  totalProductsCount?: number;
}

function LeaderboardComponent({ sales, isAdmin = false, userTeamName, onUpdateSale, onRemoveProduct, totalProductsCount }: LeaderboardProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const sortedTeams = useMemo(() => {
    const teamStatistics = calculateAllTeamStatistics(sales);
    const highestTurnover = Math.max(...teamStatistics.map(t => t.turnover), 0);

    const enrichedTeams = teamStatistics.map(team => {
      const teamSales = sales.filter(sale => sale.teamName === team.teamName);
      const uniqueProductsSold = new Set(teamSales.map(s => s.productId)).size;
      const salesScore = highestTurnover > 0 ? (team.turnover / highestTurnover) * 100 : 0;
      const coverageScore = totalProductsCount && totalProductsCount > 0 ? (uniqueProductsSold / totalProductsCount) * 100 : 0;
      const finalScore = salesScore * 0.8 + coverageScore * 0.2;
      return {
        ...team,
        uniqueProductsSold,
        salesScore,
        coverageScore,
        finalScore,
      };
    });

    return enrichedTeams.sort((a, b) => b.finalScore - a.finalScore);
  }, [sales, totalProductsCount]);

  const getRankColor = (rank: number) => {
    if (rank === 0) return 'text-amber-500';
    if (rank === 1) return 'text-slate-500';
    if (rank === 2) return 'text-amber-700';
    return 'text-muted-foreground';
  };

  const handleRowClick = (teamName: string) => {
    if (isAdmin || teamName === userTeamName) {
      setSelectedTeam(teamName);
    }
  };

  const teamSales = useMemo(() => {
    if (!selectedTeam) return [];
    return sales.filter(sale => sale.teamName === selectedTeam);
  }, [sales, selectedTeam]);


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
            {!isAdmin && userTeamName && " Click on your team to view your sales."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedTeams.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                   <TableHead className="w-[50px] text-center">Rank</TableHead>
                   <TableHead>Team</TableHead>
                   <TableHead className="text-right">Products Sold</TableHead>
                   <TableHead className="text-right">Turnover (₹)</TableHead>
                   <TableHead className="text-right">Sales Score</TableHead>
                   <TableHead className="text-right">Coverage</TableHead>
                   <TableHead className="text-right">Coverage Score</TableHead>
                   <TableHead className="text-right">Final Score</TableHead>
                   <TableHead className="text-right">Collection (₹)</TableHead>
                   <TableHead className="text-right">Profit (₹)</TableHead>
                   <TableHead className="text-right">Loss (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTeams.map((team, index) => (
                  <TableRow
                    key={team.teamName}
                    className={`${index === 0 ? 'bg-secondary' : ''} ${(isAdmin || team.teamName === userTeamName) ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                    onClick={() => handleRowClick(team.teamName)}
                  >
                    <TableCell className="font-medium text-center">
                      <div className={`flex justify-center items-center ${getRankColor(index)}`}>
                        {index === 0 && <Crown className="w-5 h-5 mr-1" />}
                        {index + 1}
                      </div>
                    </TableCell>
                     <TableCell className="font-medium">{team.teamName}</TableCell>
                     <TableCell className="text-right">{team.productsSold}</TableCell>
                     <TableCell className="text-right">₹{team.turnover.toFixed(2)}</TableCell>
                     <TableCell className="text-right">{team.salesScore.toFixed(1)}%</TableCell>
                     <TableCell className="text-right">{team.uniqueProductsSold}/{totalProductsCount}</TableCell>
                     <TableCell className="text-right">{team.coverageScore.toFixed(1)}%</TableCell>
                     <TableCell className="text-right font-bold">{team.finalScore.toFixed(1)}</TableCell>
                     <TableCell className="text-right">₹{team.totalCollection.toFixed(2)}</TableCell>
                     <TableCell className={`text-right font-semibold ${team.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                       ₹{team.profit.toFixed(2)}
                     </TableCell>
                     <TableCell className={`text-right ${team.loss > 0 ? 'text-red-600' : ''}`}>
                       ₹{team.loss.toFixed(2)}
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
      {selectedTeam && (isAdmin || selectedTeam === userTeamName) && (
        <TeamSalesDialog
          teamName={selectedTeam}
          sales={teamSales}
          isOpen={!!selectedTeam}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTeam(null);
            }
          }}
          onUpdateSale={isAdmin ? onUpdateSale : undefined}
          onRemoveProduct={isAdmin ? onRemoveProduct : undefined}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
}

const Leaderboard = memo(LeaderboardComponent);
export default Leaderboard;

