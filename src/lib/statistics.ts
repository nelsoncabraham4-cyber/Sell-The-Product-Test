import type { Sale } from './types';

export interface TeamStatistics {
  teamName: string;
  productsSold: number;
  turnover: number;
  cashCollection: number;
  qrCollection: number;
  totalCollection: number;
  profit: number;
  loss: number;
}

export interface OverallStatistics {
  totalProductsSold: number;
  totalTransactions: number;
  totalTurnover: number;
  totalCashCollection: number;
  totalQrCollection: number;
  totalCollection: number;
  totalProfit: number;
  totalLoss: number;
}

/**
 * Calculate statistics for a specific team from their sales
 */
export function calculateTeamStatistics(teamName: string, sales: Sale[]): TeamStatistics {
  const teamSales = sales.filter(sale => sale.teamName === teamName);
  
  const productsSold = teamSales.length;
  const turnover = teamSales.reduce((sum, sale) => sum + sale.sellingPrice, 0);
  const cashCollection = teamSales
    .filter(sale => sale.paymentMethod === 'cash')
    .reduce((sum, sale) => sum + sale.sellingPrice, 0);
  const qrCollection = teamSales
    .filter(sale => sale.paymentMethod === 'qr')
    .reduce((sum, sale) => sum + sale.sellingPrice, 0);
  const totalCollection = cashCollection + qrCollection;
  const profit = teamSales.reduce((sum, sale) => sum + sale.profit, 0);
  const loss = teamSales
    .filter(sale => sale.profit < 0)
    .reduce((sum, sale) => sum + Math.abs(sale.profit), 0);

  return {
    teamName,
    productsSold,
    turnover,
    cashCollection,
    qrCollection,
    totalCollection,
    profit,
    loss,
  };
}

/**
 * Calculate overall statistics from all sales
 */
export function calculateOverallStatistics(sales: Sale[]): OverallStatistics {
  const totalProductsSold = sales.length;
  const totalTransactions = sales.length;
  const totalTurnover = sales.reduce((sum, sale) => sum + sale.sellingPrice, 0);
  const totalCashCollection = sales
    .filter(sale => sale.paymentMethod === 'cash')
    .reduce((sum, sale) => sum + sale.sellingPrice, 0);
  const totalQrCollection = sales
    .filter(sale => sale.paymentMethod === 'qr')
    .reduce((sum, sale) => sum + sale.sellingPrice, 0);
  const totalCollection = totalCashCollection + totalQrCollection;
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalLoss = sales
    .filter(sale => sale.profit < 0)
    .reduce((sum, sale) => sum + Math.abs(sale.profit), 0);

  return {
    totalProductsSold,
    totalTransactions,
    totalTurnover,
    totalCashCollection,
    totalQrCollection,
    totalCollection,
    totalProfit,
    totalLoss,
  };
}

/**
 * Calculate statistics for all teams
 */
export function calculateAllTeamStatistics(sales: Sale[]): TeamStatistics[] {
  const teamNames = [...new Set(sales.map(sale => sale.teamName))];
  return teamNames.map(teamName => calculateTeamStatistics(teamName, sales));
}
