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
  let productsSold = 0;
  let turnover = 0;
  let cashCollection = 0;
  let qrCollection = 0;
  let profit = 0;
  let loss = 0;

  for (let i = 0; i < sales.length; i++) {
    const sale = sales[i];
    if (sale.teamName === teamName) {
      productsSold++;
      turnover += sale.sellingPrice;
      if (sale.paymentMethod === 'cash') {
        cashCollection += sale.sellingPrice;
      } else if (sale.paymentMethod === 'qr') {
        qrCollection += sale.sellingPrice;
      }
      profit += sale.profit;
      if (sale.profit < 0) {
        loss += Math.abs(sale.profit);
      }
    }
  }

  return {
    teamName,
    productsSold,
    turnover,
    cashCollection,
    qrCollection,
    totalCollection: cashCollection + qrCollection,
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
  let totalTurnover = 0;
  let totalCashCollection = 0;
  let totalQrCollection = 0;
  let totalProfit = 0;
  let totalLoss = 0;

  for (let i = 0; i < sales.length; i++) {
    const sale = sales[i];
    totalTurnover += sale.sellingPrice;
    if (sale.paymentMethod === 'cash') {
      totalCashCollection += sale.sellingPrice;
    } else if (sale.paymentMethod === 'qr') {
      totalQrCollection += sale.sellingPrice;
    }
    totalProfit += sale.profit;
    if (sale.profit < 0) {
      totalLoss += Math.abs(sale.profit);
    }
  }

  return {
    totalProductsSold,
    totalTransactions,
    totalTurnover,
    totalCashCollection,
    totalQrCollection,
    totalCollection: totalCashCollection + totalQrCollection,
    totalProfit,
    totalLoss,
  };
}

/**
 * Calculate statistics for all teams in a single pass O(N)
 */
export function calculateAllTeamStatistics(sales: Sale[]): TeamStatistics[] {
  const teamMap = new Map<string, TeamStatistics>();

  for (let i = 0; i < sales.length; i++) {
    const sale = sales[i];
    let stats = teamMap.get(sale.teamName);
    if (!stats) {
      stats = {
        teamName: sale.teamName,
        productsSold: 0,
        turnover: 0,
        cashCollection: 0,
        qrCollection: 0,
        totalCollection: 0,
        profit: 0,
        loss: 0,
      };
      teamMap.set(sale.teamName, stats);
    }

    stats.productsSold++;
    stats.turnover += sale.sellingPrice;
    if (sale.paymentMethod === 'cash') {
      stats.cashCollection += sale.sellingPrice;
    } else if (sale.paymentMethod === 'qr') {
      stats.qrCollection += sale.sellingPrice;
    }
    stats.profit += sale.profit;
    if (sale.profit < 0) {
      stats.loss += Math.abs(sale.profit);
    }
  }

  const result: TeamStatistics[] = [];
  teamMap.forEach((stats) => {
    stats.totalCollection = stats.cashCollection + stats.qrCollection;
    result.push(stats);
  });

  return result;
}
